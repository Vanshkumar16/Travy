"""
Evidence grounding and LLM + rules merge.

Every LLM skill must quote the JD. We check the quote really is in the text; if
it isn't, we look for the closest real sentence. Skills with no support in the
text at all are dropped as hallucinations. When both engines find a skill,
confidence goes up one step.
"""

import re
from difflib import SequenceMatcher
from typing import Dict, List, Tuple

from .models import JdSkill
from .taxonomy import TECH, TECH_BY_NAME, canonicalize

_CONF = ["low", "medium", "high"]


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9+#/ ]", "", re.sub(r"\s+", " ", s.lower())).strip()


def _sentences(text: str) -> List[str]:
    parts = re.split(r"(?<=[.;!?])\s+|\n", text)
    return [p.strip().lstrip("•").strip() for p in parts if len(p.strip()) > 8]


def ground(skills: List[JdSkill], text: str) -> Tuple[List[JdSkill], int]:
    """Verify LLM evidence against the JD. Returns (kept skills, dropped count)."""
    norm_text = _norm(text)
    sentences = _sentences(text)
    kept: List[JdSkill] = []
    dropped = 0

    for skill in skills:
        quote = _norm(skill.evidence)
        if quote and quote in norm_text:
            skill.grounded = True
            kept.append(skill)
            continue

        # How much of the quote is covered by a real sentence. Coverage (not
        # symmetric ratio) so a quote trimmed from a long bullet still counts.
        best_ratio, best_sentence = 0.0, None
        for sentence in sentences:
            matcher = SequenceMatcher(None, quote, _norm(sentence), autojunk=False)
            covered = sum(block.size for block in matcher.get_matching_blocks())
            ratio = covered / max(1, len(quote))
            if ratio > best_ratio:
                best_ratio, best_sentence = ratio, sentence
        if best_ratio >= 0.85 and best_sentence:
            skill.evidence = best_sentence
            skill.grounded = True
            kept.append(skill)
            continue

        # Quote not found. Keep only if the skill itself is named in the JD.
        name_hit = _norm(skill.skill_name) in norm_text
        tech = canonicalize(skill.skill_name)
        if not name_hit and tech and tech.pattern.search(text):
            name_hit = True
        if name_hit:
            skill.grounded = False
            skill.confidence = "low"
            kept.append(skill)
        else:
            dropped += 1
    return kept, dropped


def _key(skill: JdSkill) -> str:
    tech = canonicalize(skill.skill_name)
    return tech.name.lower() if tech else _norm(skill.skill_name)


def merge(llm_skills: List[JdSkill], rule_skills: List[JdSkill]) -> List[JdSkill]:
    merged: Dict[str, JdSkill] = {}

    for skill in rule_skills:
        merged[_key(skill)] = skill

    for skill in llm_skills:
        key = _key(skill)
        tech = canonicalize(skill.skill_name)
        if key not in merged:
            # LLMs phrase skills freely ("Deep learning frameworks (PyTorch,
            # TensorFlow)", "Presentation of findings"). Fold them into a rule
            # skill they name, or one quoting the same sentence in the same
            # category, instead of listing the same skill twice.
            named = [t for t in TECH if t.pattern.search(skill.skill_name) and t.name.lower() in merged]
            same_quote = [k for k, s in merged.items()
                          if s.category_code == skill.category_code and not s.implied_by
                          and _norm(s.evidence) == _norm(skill.evidence)]
            if named:
                # Several hits ("Deep learning frameworks (PyTorch, TensorFlow)")
                # → the most specific, i.e. the longest matched alias.
                tech = max(named, key=lambda t: max(len(m.group(0)) for m in t.pattern.finditer(skill.skill_name)))
                key = tech.name.lower()
            elif len(same_quote) == 1:
                key = same_quote[0]
                tech = TECH_BY_NAME.get(key)
        if tech:
            # Keep categories consistent with the taxonomy, so Skill Matching
            # sees the same code whichever engine found the skill.
            skill.skill_name = tech.name
            skill.category_code = tech.category
        existing = merged.get(key)
        if existing is None:
            merged[key] = skill
            continue
        if existing.implied_by:
            # The LLM saw it stated explicitly; prefer that over an inference.
            skill.sources = ["llm", "rules"]
            merged[key] = skill
            continue
        both = existing.model_copy()
        both.sources = ["llm", "rules"]
        both.confidence = _CONF[min(2, max(_CONF.index(existing.confidence), _CONF.index(skill.confidence)) + 1)]
        if skill.importance == "must_have":
            both.importance = "must_have"
        merged[key] = both

    return list(merged.values())
