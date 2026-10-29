# LLM setup (free)

JD Analytics works without any LLM (rule engine). Adding an LLM improves extraction from prose-heavy JDs. All options below are free. Configure them in `tgl/.env` (copy `.env.example` first). Restart the backend after changing `.env`.

## Option A: Groq (recommended, free, works on any laptop)

1. Sign up at https://console.groq.com (Google/GitHub login works).
2. Open **API Keys** → https://console.groq.com/keys → **Create API Key** → copy it (starts with `gsk_`).
3. In `tgl/.env`:
   ```
   GROQ_API_KEY=gsk_...
   ```
Default model: `openai/gpt-oss-120b`. If Groq retires it, pick a current one from https://console.groq.com/docs/models and set `LLM_MODEL=...`.
Free tier has per-minute and per-day request limits. Fine for development and a demo; if you hit them the app falls back to the rule engine.

## Option B: Google Gemini (free tier)

1. Go to https://aistudio.google.com/apikey and sign in with a Google account.
2. **Create API key** → copy it (starts with `AIza`).
3. In `tgl/.env`:
   ```
   GEMINI_API_KEY=AIza...
   ```
Default model: `gemini-2.5-flash` (change with `LLM_MODEL`).

## Option C: Ollama (local, no key, works offline)

Needs ~2 GB disk and 8 GB+ RAM. Slower than the cloud options (a JD takes 30–90 s on a laptop).

- macOS: `brew install ollama` · Windows/Linux: https://ollama.com/download
- ```
  OLLAMA_CONTEXT_LENGTH=8192 ollama serve      # leave running
  ollama pull qwen2.5:3b                        # one-time, ~1.9 GB
  ```
- No `.env` change needed: the backend detects a running Ollama automatically. For better quality on a 16 GB machine: `ollama pull qwen2.5:7b` and `LLM_MODEL=qwen2.5:7b`.

## Which one is used?

`LLM_PROVIDER=groq|gemini|ollama|anthropic` forces one. Left empty, the backend uses the first key it finds (Groq → Gemini → Anthropic), otherwise a running Ollama, otherwise rules only. The Job Analysis page shows the active provider in the top-right badge, and `GET /api/jd/engine` returns it.

## Check it works

```
cd tgl
.venv/bin/python -m server.jd.evaluate --engine llm
```
Every row should show `llm+rules`. If the LLM is unreachable or the key is wrong, it fails with a clear message.

Never commit `.env`. It's already in `.gitignore`.
