"""
LLM provider layer shared by JD Analytics (and Resume Parsing, if Role 2 wants it).

Groq, Google Gemini and Ollama all expose an OpenAI-compatible API, so one
client covers them; only the base URL, key and model differ. Claude keeps its
own SDK path in jd/llm_extractor.py.

Pick a provider with LLM_PROVIDER=groq|gemini|ollama|anthropic in tgl/.env.
Unset = auto: the first provider with a key (groq → gemini → anthropic),
otherwise a local Ollama server if one is running.
"""

import json
import os
from dataclasses import dataclass
from typing import Optional, Type, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

try:
    from pathlib import Path

    from dotenv import load_dotenv

    # Loaded here (not just in main.py) so CLI tools like server.jd.evaluate
    # see the same configuration as the web server.
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

T = TypeVar("T", bound=BaseModel)


@dataclass(frozen=True)
class Provider:
    name: str
    base_url: str
    key_env: Optional[str]
    default_model: str
    free: bool
    key_url: Optional[str]


PROVIDERS = {
    "groq": Provider(
        "groq", "https://api.groq.com/openai/v1", "GROQ_API_KEY",
        "openai/gpt-oss-120b", True, "https://console.groq.com/keys",
    ),
    "gemini": Provider(
        "gemini", "https://generativelanguage.googleapis.com/v1beta/openai/", "GEMINI_API_KEY",
        "gemini-2.5-flash", True, "https://aistudio.google.com/apikey",
    ),
    "ollama": Provider(
        "ollama", os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434") + "/v1", None,
        "qwen2.5:3b", True, None,
    ),
    "anthropic": Provider(
        "anthropic", "", "ANTHROPIC_API_KEY", "claude-opus-5-5", False,
        "https://console.anthropic.com/settings/keys",
    ),
}


class LlmUnavailable(RuntimeError):
    pass


def _ollama_running() -> bool:
    """Ollama is up *and* has the configured model pulled."""
    base = PROVIDERS["ollama"].base_url.removesuffix("/v1")
    try:
        tags = httpx.get(f"{base}/api/tags", timeout=0.5).json().get("models", [])
    except (httpx.HTTPError, ValueError):
        return False
    wanted = active_model(PROVIDERS["ollama"])
    names = {m.get("name", "") for m in tags}
    return wanted in names or f"{wanted}:latest" in names


def active_provider() -> Optional[Provider]:
    chosen = os.getenv("LLM_PROVIDER", "").strip().lower()
    if chosen:
        provider = PROVIDERS.get(chosen)
        if provider is None:
            return None
        if provider.key_env and not os.getenv(provider.key_env):
            return None
        if provider.name == "ollama" and not _ollama_running():
            return None
        return provider
    for name in ("groq", "gemini", "anthropic"):
        provider = PROVIDERS[name]
        if os.getenv(provider.key_env or ""):
            return provider
    if _ollama_running():
        return PROVIDERS["ollama"]
    return None


def active_model(provider: Provider) -> str:
    if provider.name == "anthropic":
        return os.getenv("RADIX_JD_MODEL") or provider.default_model
    return os.getenv("LLM_MODEL") or provider.default_model


def chat_json(system: str, user: str, schema: Type[T], normalize=None, max_tokens: int = 8000) -> T:
    """
    One JSON-mode chat call on an OpenAI-compatible provider, validated against
    `schema`. Free/small models occasionally return slightly-off JSON, so
    `normalize(dict) -> dict` can repair it, and one retry feeds the validation
    error back to the model.
    """
    provider = active_provider()
    if provider is None or provider.name == "anthropic":
        raise LlmUnavailable("No OpenAI-compatible LLM provider is configured")

    import openai

    client = openai.OpenAI(
        base_url=provider.base_url,
        api_key=os.getenv(provider.key_env) if provider.key_env else "ollama",
        timeout=180.0,
        # The SDK honours retry-after on 429s; free tiers hit per-minute token
        # limits after ~2 JDs, and the wait is usually a few seconds.
        max_retries=4,
    )
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    last_error = ""
    for attempt in range(2):
        if attempt:
            messages.append({"role": "user", "content": f"That JSON was invalid: {last_error}. Reply again with valid JSON only."})
        try:
            response = client.chat.completions.create(
                model=active_model(provider),
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0,
                max_tokens=max_tokens,
            )
        except openai.AuthenticationError as exc:
            raise LlmUnavailable(f"{provider.name}: invalid API key") from exc
        except openai.RateLimitError as exc:
            raise LlmUnavailable(f"{provider.name}: free-tier rate limit hit, retry in a minute") from exc
        except openai.NotFoundError as exc:
            raise LlmUnavailable(f"{provider.name}: model '{active_model(provider)}' not found. Set LLM_MODEL (for Ollama: `ollama pull {active_model(provider)}`)") from exc
        except openai.APIConnectionError as exc:
            raise LlmUnavailable(f"{provider.name}: could not connect") from exc
        except openai.APIStatusError as exc:
            # Gemini reports a bad key as a 400 rather than a 401.
            detail = f"{exc} {exc.body}".lower()
            if "api key" in detail or "api_key" in detail:
                raise LlmUnavailable(f"{provider.name}: invalid API key") from exc
            raise LlmUnavailable(f"{provider.name}: API error {exc.status_code}") from exc

        content = response.choices[0].message.content or ""
        messages.append({"role": "assistant", "content": content})
        try:
            data = json.loads(content)
            if normalize:
                data = normalize(data)
            return schema.model_validate(data)
        except (json.JSONDecodeError, ValidationError, TypeError, AttributeError) as exc:
            last_error = str(exc)[:500]
    raise LlmUnavailable(f"{provider.name}: model returned invalid JSON twice")
