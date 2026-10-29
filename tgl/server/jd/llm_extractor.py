"""
LLM-based JD skill extraction (brief p. 7: "a strong LangChain/LLM use case").

Works with any provider from server/llm_client.py: free ones (Groq, Gemini,
local Ollama) via JSON mode, or Claude via structured outputs. The JD is sent
with its detected sections labelled so the model knows where the
"Key Responsibilities" / "What We're Looking For" signal lives.
"""

import os
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from ..llm_client import LlmUnavailable, active_model, active_provider, chat_json
from .models import JdSection, JdSkill

CATEGORY_CODES = {"COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"}
SECTIONS = {"overview", "responsibilities", "requirements", "preferred", "other"}


class LlmSkill(BaseModel):
    skill_name: str = Field(description="Concise canonical name, e.g. 'Python', 'System Design', 'Stakeholder Communication'")
    category_code: Literal["COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"]
    evidence: str = Field(description="Verbatim quote (max ~25 words) copied exactly from the JD that shows this requirement")
    confidence: Literal["high", "medium", "low"]
    importance: Literal["must_have", "nice_to_have"]
    source_section: Literal["overview", "responsibilities", "requirements", "preferred", "other"]


class LlmJdExtraction(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    skills: List[LlmSkill]


SYSTEM_PROMPT = """You extract the skills a job description requires of a candidate, for RADIX Talent Match.

Tag every skill with exactly one RADIX category code:
- COD: Coding — programming languages, frameworks, libraries (Python, Java, C++, React, Pandas).
- DSA: Data Structures & Algorithms, complexity, algorithmic problem solving.
- OOD: Object-Oriented Design — OOP, SOLID, design patterns, class/low-level design.
- APTI: Aptitude — quantitative/logical reasoning, statistics, experimentation, analytical troubleshooting.
- COMM: Communication — written/verbal, presenting, stakeholder/client handling, documentation, dashboards & data storytelling (Power BI, Tableau), teamwork.
- AI: AI/ML — machine learning, deep learning, NLP/LLMs, ML frameworks.
- CLOUD: Cloud & DevOps — AWS/Azure/GCP, Docker, Kubernetes, IaC, monitoring.
- SQL: SQL & databases — SQL, relational/NoSQL databases, data modeling, warehousing, ETL.
- SWE: Software Engineering practice — testing, Git, CI/CD, code review, agile, debugging, production support/ITIL.
- SYSD: System Design — distributed systems, scalability, microservices, caching, messaging.
- NETW: Networking — TCP/IP, HTTP, REST/gRPC APIs, web services, protocols.
- OS: Operating Systems — Linux, shell, concurrency/threads, memory, processes, log triage on servers.
- OTHER: anything outside the twelve (domain knowledge such as banking, Excel, languages spoken).

Rules:
1. Only skills the candidate is expected to have or use. Ignore the company's products, mission, perks and EEO text.
2. JDs are written in prose on purpose: also capture competencies stated without a tool name (e.g. "explain findings to leadership" → COMM "Stakeholder Communication"; "services used by millions of users" → SYSD "Scalable System Design").
3. Split lists into individual skills ("C++, Java or Go" → three skills). Don't emit near-duplicates.
4. evidence MUST be copied verbatim from the JD text, one sentence or bullet fragment. Never paraphrase.
5. importance: nice_to_have if the JD says preferred / plus / bonus / nice to have or it sits in a preferred section; otherwise must_have.
6. confidence: high = explicitly required; medium = clearly implied by responsibilities or softly worded; low = weak inference.
7. skill_name is a short noun phrase of 1–4 words naming the skill ("SQL", "Code Review", "Stakeholder Communication"), never a sentence or a task description. Put the sentence in evidence.
8. Most JDs yield 10–30 skills."""

JSON_FORMAT = """

Reply with a single JSON object and nothing else, in exactly this shape:
{"company": "<string or null>", "role": "<string or null>", "skills": [
  {"skill_name": "...", "category_code": "COD|DSA|OOD|APTI|COMM|AI|CLOUD|SQL|SWE|SYSD|NETW|OS|OTHER",
   "evidence": "<verbatim quote from the JD>", "confidence": "high|medium|low",
   "importance": "must_have|nice_to_have",
   "source_section": "overview|responsibilities|requirements|preferred|other"}
]}"""


def llm_available() -> bool:
    return active_provider() is not None


def llm_label() -> Optional[str]:
    provider = active_provider()
    return f"{provider.name}:{active_model(provider)}" if provider else None


def _sectioned_text(text: str, sections: List[JdSection]) -> str:
    if not sections:
        return text
    return "\n\n".join(f"<section name=\"{s.name}\" heading=\"{s.heading}\">\n{s.text}\n</section>" for s in sections)


def _normalize(data: dict) -> dict:
    """Repair the usual small-model slips before validation."""
    skills = []
    for raw in data.get("skills") or []:
        if not isinstance(raw, dict) or not str(raw.get("skill_name", "")).strip():
            continue
        code = str(raw.get("category_code", "OTHER")).strip().upper()
        confidence = str(raw.get("confidence", "medium")).strip().lower()
        importance = str(raw.get("importance", "must_have")).strip().lower().replace("-", "_").replace(" ", "_")
        section = str(raw.get("source_section", "other")).strip().lower()
        skills.append({
            "skill_name": str(raw["skill_name"]).strip(),
            "category_code": code if code in CATEGORY_CODES else "OTHER",
            "evidence": str(raw.get("evidence") or raw["skill_name"]).strip(),
            "confidence": confidence if confidence in ("high", "medium", "low") else "medium",
            "importance": importance if importance in ("must_have", "nice_to_have") else "must_have",
            "source_section": section if section in SECTIONS else "other",
        })
    return {"company": data.get("company"), "role": data.get("role"), "skills": skills}


def extract_with_llm(text: str, sections: List[JdSection]) -> LlmJdExtraction:
    provider = active_provider()
    if provider is None:
        raise LlmUnavailable("No LLM configured (set GROQ_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, or run Ollama)")
    user = f"Extract the required skills from this job description.\n\n<jd>\n{_sectioned_text(text, sections)}\n</jd>"
    if provider.name == "anthropic":
        return _extract_with_claude(user)
    return chat_json(SYSTEM_PROMPT + JSON_FORMAT, user, LlmJdExtraction, normalize=_normalize)


def _extract_with_claude(user: str) -> LlmJdExtraction:
    import anthropic

    client = anthropic.Anthropic()
    try:
        response = client.beta.messages.parse(
            model=active_model(active_provider()),
            max_tokens=16000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "medium"},
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user}],
            output_format=LlmJdExtraction,
        )
    except anthropic.AuthenticationError as exc:
        raise LlmUnavailable(f"Anthropic authentication failed: {exc.message}") from exc
    except anthropic.RateLimitError as exc:
        raise LlmUnavailable("Anthropic rate limit hit; retry shortly") from exc
    except anthropic.APIStatusError as exc:
        raise LlmUnavailable(f"Anthropic API error {exc.status_code}: {exc.message}") from exc
    except anthropic.APIConnectionError as exc:
        raise LlmUnavailable("Could not reach the Anthropic API") from exc

    if response.stop_reason == "refusal":
        raise LlmUnavailable("Claude declined to process this document")
    if response.stop_reason == "max_tokens" or response.parsed_output is None:
        raise LlmUnavailable("Claude's response was incomplete")
    return response.parsed_output


def to_jd_skills(extraction: LlmJdExtraction) -> List[JdSkill]:
    return [
        JdSkill(
            skill_name=s.skill_name.strip(),
            category_code=s.category_code,
            evidence=s.evidence.strip(),
            confidence=s.confidence,
            importance=s.importance,
            source_section=s.source_section,
            grounded=False,  # set by ensemble.ground()
            sources=["llm"],
        )
        for s in extraction.skills
        if s.skill_name.strip()
    ]
