"""JD Analytics pipeline: text → sections → (rules ‖ Claude) → grounding → demand → insights."""

import hashlib
import time
from datetime import datetime, timezone
from typing import Optional

from .demand import build_insights, category_demand
from .ensemble import ground, merge
from .llm_extractor import LlmUnavailable, extract_with_llm, llm_available, llm_label, to_jd_skills
from .models import EngineName, JdAnalysis, JdSkillListContract
from .rule_extractor import extract_with_rules
from .sections import extract_metadata, split_sections

_IMPORTANCE_ORDER = {"must_have": 0, "nice_to_have": 1}
_CONF_ORDER = {"high": 0, "medium": 1, "low": 2}


def analyze_jd(
    text: str,
    source_file: str,
    engine: EngineName = "auto",
    company: Optional[str] = None,
    role: Optional[str] = None,
) -> JdAnalysis:
    started = time.perf_counter()
    sections = split_sections(text)
    meta = extract_metadata(text, company, role)

    rule_skills, mentions = extract_with_rules(text, sections)

    engine_used = "rules"
    engine_note: Optional[str] = None
    dropped = 0
    skills = rule_skills

    if engine in ("auto", "llm"):
        if not llm_available():
            engine_note = "Rule engine only. Set GROQ_API_KEY (free) in tgl/.env, or run Ollama, to add LLM extraction."
            if engine == "llm":
                raise LlmUnavailable("LLM engine requested but no LLM provider is configured")
        else:
            try:
                extraction = extract_with_llm(text, sections)
                llm_skills, dropped = ground(to_jd_skills(extraction), text)
                skills = merge(llm_skills, rule_skills)
                engine_used = "llm+rules"
                engine_note = f"LLM: {llm_label()}"
                if meta.company == "Unknown Company" and extraction.company:
                    meta.company = extraction.company
                if meta.role == "Unknown Role" and extraction.role:
                    meta.role = extraction.role
            except LlmUnavailable as exc:
                if engine == "llm":
                    raise
                engine_note = f"LLM unavailable ({exc}); used rule engine."

    skills.sort(key=lambda s: (
        s.implied_by is not None, _IMPORTANCE_ORDER[s.importance],
        _CONF_ORDER[s.confidence], s.category_code, s.skill_name,
    ))

    demand, bar_source = category_demand(skills, mentions, meta)
    insights = build_insights(skills, demand, meta, bar_source, dropped, engine_note)

    created = datetime.now(timezone.utc)
    digest = hashlib.sha1(f"{source_file}|{text}|{engine_used}".encode()).hexdigest()[:10]
    return JdAnalysis(
        id=f"jd_{digest}",
        source_file=source_file,
        company=meta.company,
        role=meta.role,
        created_at=created.isoformat(),
        engine_used=engine_used,
        engine_note=engine_note,
        processing_ms=int((time.perf_counter() - started) * 1000),
        metadata=meta,
        skills=skills,
        sections=sections,
        category_demand=demand,
        insights=insights,
        raw_text=text,
        company_bar_source=bar_source,
    )


def to_contract(analysis: JdAnalysis) -> JdSkillListContract:
    """Strict shared-format skill list (brief p. 10) for Skill Matching."""
    return JdSkillListContract(
        source_file=analysis.source_file,
        company=analysis.company,
        role=analysis.role,
        skills=[
            {
                "skill_name": s.skill_name,
                "category_code": s.category_code,
                "evidence": s.evidence,
                "confidence": s.confidence,
            }
            for s in analysis.skills
        ],
    )
