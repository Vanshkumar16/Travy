"""
12-category demand profile and candidate-facing insights.

required_level uses the same 1–10 scale as the company `skill_thresholds` in
talent_check_company_skillsets.json, so Talent Check / Skill Matching can read
it directly and the UI can show the role next to the company's general bar.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from .models import CATEGORY_CODES, CategoryDemand, JdInsight, JdMetadata, JdSkill

_SKILLSETS_PATH = Path(__file__).resolve().parents[2] / "data" / "talent_check_company_skillsets.json"

_CONF_WEIGHT = {"high": 1.0, "medium": 0.7, "low": 0.35}
_IMPORTANCE_WEIGHT = {"must_have": 1.0, "nice_to_have": 0.4}
_SENIORITY_BONUS = {"entry": 0, "mid": 1, "senior": 2}
_EMPHASIS = re.compile(r"\b(deep|expert|mastery|advanced|strong|extensive|in[- ]depth)\b", re.I)

CATEGORY_NAMES = {
    "COD": "Coding", "DSA": "Data Structures & Algorithms", "OOD": "Object-Oriented Design",
    "APTI": "Aptitude", "COMM": "Communication", "AI": "AI / ML", "CLOUD": "Cloud",
    "SQL": "SQL & Databases", "SWE": "Software Engineering", "SYSD": "System Design",
    "NETW": "Networking", "OS": "Operating Systems",
}


def _corp_tokens(name: str) -> set:
    name = re.sub(r"\(.*?\)", " ", name.lower())
    stop = {"llc", "inc", "ltd", "limited", "private", "pvt", "corporation", "corp", "plc", "co", "the", "software", "india"}
    return {t for t in re.findall(r"[a-z0-9]+", name) if t not in stop}


def find_company_bar(company: str) -> Tuple[Optional[Dict[str, int]], Optional[str]]:
    try:
        data = json.loads(_SKILLSETS_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None, None
    wanted = _corp_tokens(company)
    if not wanted:
        return None, None
    best, best_score = None, 0.0
    for entry in data.get("companies", {}).values():
        have = _corp_tokens(entry.get("name", ""))
        if not have:
            continue
        overlap = len(wanted & have)
        if overlap == 0:
            continue
        score = overlap / len(wanted | have)
        if score > best_score:
            best, best_score = entry, score
    if best is None:
        return None, None
    return best.get("skill_thresholds"), best.get("name")


def category_demand(skills: List[JdSkill], mentions: Dict[str, int], meta: JdMetadata) -> Tuple[List[CategoryDemand], Optional[str]]:
    bar, bar_source = find_company_bar(meta.company)
    scores = {code: 0.0 for code in CATEGORY_CODES}
    must = {code: 0 for code in CATEGORY_CODES}
    nice = {code: 0 for code in CATEGORY_CODES}

    # "C++, Java, Go or Python" lists alternatives, not four separate demands:
    # skills of one category quoted from the same sentence share their weight.
    shared: Dict[Tuple[str, str], int] = {}
    for skill in skills:
        shared[(skill.category_code, skill.evidence)] = shared.get((skill.category_code, skill.evidence), 0) + 1

    for skill in skills:
        code = skill.category_code
        if code not in scores:
            continue
        weight = _IMPORTANCE_WEIGHT[skill.importance] * _CONF_WEIGHT[skill.confidence]
        weight /= shared[(code, skill.evidence)] ** 0.5
        if _EMPHASIS.search(skill.evidence or ""):
            weight *= 1.3
        repeat = mentions.get(skill.skill_name.lower(), 1)
        weight *= 1 + 0.15 * min(3, max(0, repeat - 1))
        if skill.implied_by:
            weight *= 0.5
        scores[code] += weight
        if skill.importance == "must_have" and not skill.implied_by:
            must[code] += 1
        elif not skill.implied_by:
            nice[code] += 1

    bonus = _SENIORITY_BONUS[meta.seniority]
    result = []
    for code in CATEGORY_CODES:
        score = scores[code]
        level = 0 if score == 0 else max(1, min(10, round(2 + 2.0 * score) + bonus))
        result.append(CategoryDemand(
            category_code=code,
            required_level=level,
            must_have_count=must[code],
            nice_to_have_count=nice[code],
            company_bar=(bar or {}).get(code),
        ))
    return result, bar_source


def build_insights(skills: List[JdSkill], demand: List[CategoryDemand], meta: JdMetadata,
                   bar_source: Optional[str], dropped: int, engine_note: Optional[str]) -> List[JdInsight]:
    insights: List[JdInsight] = []
    ranked = sorted((d for d in demand if d.required_level > 0), key=lambda d: (-d.required_level, -d.must_have_count))

    if ranked:
        top = ", ".join(f"{CATEGORY_NAMES[d.category_code]} ({d.required_level}/10)" for d in ranked[:3])
        insights.append(JdInsight(kind="focus", title="Where to focus your preparation",
                                  detail=f"This role leans hardest on {top}."))

    must = [s for s in skills if s.importance == "must_have" and not s.implied_by]
    if len(must) > 18:
        insights.append(JdInsight(kind="warning", title="Wishlist-style JD",
                                  detail=f"{len(must)} must-haves listed. Few candidates meet all of them; prioritise the high-confidence ones from the requirements section."))

    absent = [CATEGORY_NAMES[d.category_code] for d in demand if d.required_level == 0]
    if absent and len(absent) <= 8:
        insights.append(JdInsight(kind="info", title="Not assessed by this JD",
                                  detail=f"No signal for {', '.join(absent)}. Don't over-invest there for this role."))

    if bar_source:
        above = [d for d in demand if d.company_bar and d.required_level > d.company_bar]
        if above:
            names = ", ".join(f"{d.category_code} ({d.required_level} vs {d.company_bar})" for d in above)
            insights.append(JdInsight(kind="info", title=f"Harder than {bar_source}'s usual bar",
                                      detail=f"This posting asks more than the company-wide bar in {names}."))
        else:
            insights.append(JdInsight(kind="info", title=f"Within {bar_source}'s usual bar",
                                      detail="Every category this role asks for is at or below the company-wide hiring bar from RADIX data."))

    if meta.seniority == "entry":
        insights.append(JdInsight(kind="info", title="Entry-level friendly",
                                  detail=f"Experience: {meta.experience or 'not specified'}. Projects, internships and hackathons count as evidence."))
    elif meta.experience:
        insights.append(JdInsight(kind="warning", title="Experience required",
                                  detail=f"The JD asks for {meta.experience}. Show equivalent depth through projects if you're short."))

    implied = sum(1 for s in skills if s.implied_by)
    if implied:
        insights.append(JdInsight(kind="info", title="Implied prerequisites",
                                  detail=f"{implied} foundation skills are implied by named technologies (e.g. Kubernetes → Linux). They're marked low confidence."))

    if dropped:
        insights.append(JdInsight(kind="warning", title="Hallucination guard",
                                  detail=f"{dropped} LLM-suggested skill(s) had no supporting text in the JD and were removed."))
    if engine_note:
        insights.append(JdInsight(kind="info", title="Engine", detail=engine_note))
    return insights
