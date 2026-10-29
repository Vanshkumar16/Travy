"""
Deterministic extractor: taxonomy + intent cues, scored by section.

Runs with no network or API key, so the tool always works in a live demo. When
Claude is available its output is merged with this one (see ensemble.py).
"""

import re
from typing import Dict, List, Tuple

from .models import JdSection, JdSkill
from .sections import section_at
from .taxonomy import INTENT, TECH, TECH_BY_NAME

_NICE_CUE = re.compile(
    r"nice[- ]to[- ]have|good[- ]to[- ]have|preferred(?!\))|a plus|is a plus|\bbonus\b|desirable|"
    r"ideally|not required|optional|would be great|helpful",
    re.I,
)
_STRONG_CUE = re.compile(
    r"\bmust\b|required|requirement|strong|solid|deep|expert|mastery|proficien|advanced|"
    r"hands[- ]on|in[- ]depth|extensive|excellent",
    re.I,
)
_WEAK_CUE = re.compile(
    r"familiar(?:ity)?|exposure|basic|introductory|awareness|some experience|"
    r"working knowledge|understanding of|willingness to learn|eager to learn",
    re.I,
)

# Matches inside these sections describe the company, not the candidate.
_NOISE_SECTIONS = {"company", "benefits"}

_CONF_ORDER = ["low", "medium", "high"]


def sentence_around(text: str, start: int, end: int) -> Tuple[str, int, int]:
    """The bullet/sentence containing [start, end), as it appears in the JD."""
    left = max(text.rfind("\n", 0, start), text.rfind(". ", 0, start) + 1, text.rfind("; ", 0, start) + 1)
    left = max(left, 0)
    right_candidates = [i for i in (text.find("\n", end), text.find(". ", end), text.find("; ", end)) if i != -1]
    right = min(right_candidates) if right_candidates else len(text)
    snippet = text[left:right].strip().lstrip("•").strip()
    if len(snippet) > 220:
        mid = (start + end) // 2
        snippet = text[max(left, mid - 110):min(right, mid + 110)].strip()
    return snippet, left, right


def _confidence(section: str, sentence: str, is_intent: bool) -> str:
    if section in ("requirements", "responsibilities"):
        level = 2
    elif section in ("preferred", "overview"):
        level = 1
    else:
        level = 1
    if _STRONG_CUE.search(sentence) and level < 2:
        level += 1
    if _WEAK_CUE.search(sentence):
        level -= 1
    if is_intent:
        level = min(level, 1)
    return _CONF_ORDER[max(0, min(2, level))]


def _importance(section: str, sentence: str) -> str:
    if section == "preferred" or _NICE_CUE.search(sentence):
        return "nice_to_have"
    return "must_have"


def _better(a: JdSkill, b: JdSkill) -> bool:
    """Is a a stronger observation than b?"""
    rank = lambda s: (s.importance == "must_have", _CONF_ORDER.index(s.confidence),
                      s.source_section in ("requirements", "responsibilities"))
    return rank(a) > rank(b)


def extract_with_rules(text: str, sections: List[JdSection]) -> Tuple[List[JdSkill], Dict[str, int]]:
    """Returns (skills, mention_counts keyed by lowercased skill name)."""
    found: Dict[str, JdSkill] = {}
    mentions: Dict[str, int] = {}
    noise_only: Dict[str, JdSkill] = {}

    def record(name: str, category: str, start: int, end: int, is_intent: bool):
        section = section_at(sections, start)
        sentence, _, _ = sentence_around(text, start, end)
        skill = JdSkill(
            skill_name=name,
            category_code=category,
            evidence=sentence,
            confidence=_confidence(section, sentence, is_intent),
            importance=_importance(section, sentence),
            source_section=section,
            grounded=True,
            sources=["rules"],
        )
        key = name.lower()
        if section in _NOISE_SECTIONS:
            noise_only.setdefault(key, skill)
            return
        mentions[key] = mentions.get(key, 0) + 1
        if key not in found or _better(skill, found[key]):
            found[key] = skill

    for tech in TECH:
        for match in tech.pattern.finditer(text):
            record(tech.name, tech.category, match.start(), match.end(), False)

    for cue in INTENT:
        for match in cue.pattern.finditer(text):
            record(cue.name, cue.category, match.start(), match.end(), True)

    # Drop intent cues whose category is already well covered by named
    # skills from the same sentence — they'd just be duplicates.
    named_evidence = {(s.category_code, s.evidence) for k, s in found.items() if k in TECH_BY_NAME}
    for cue in INTENT:
        key = cue.name.lower()
        if key in found and (found[key].category_code, found[key].evidence) in named_evidence:
            del found[key]
            mentions.pop(key, None)

    skills = list(found.values())
    skills.extend(_implied(skills))
    return skills, mentions


def _implied(explicit: List[JdSkill]) -> List[JdSkill]:
    have = {s.skill_name.lower() for s in explicit}
    implied: Dict[str, JdSkill] = {}
    for skill in explicit:
        tech = TECH_BY_NAME.get(skill.skill_name.lower())
        if not tech:
            continue
        for name, category in tech.implies:
            key = name.lower()
            if key in have or key in implied:
                continue
            implied[key] = JdSkill(
                skill_name=name,
                category_code=category,
                evidence=f"Implied prerequisite of {skill.skill_name}: \"{skill.evidence[:120]}\"",
                confidence="low",
                importance="nice_to_have",
                source_section=skill.source_section,
                implied_by=skill.skill_name,
                grounded=True,
                sources=["rules"],
            )
    return list(implied.values())
