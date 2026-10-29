"""
Role 5 — Skill Matching on the shared JD taxonomy.

Both sides are mapped onto canonical taxonomy skills before comparing, so the
same skill described differently still matches ("Core Java & OOP" ↔ "Java")
and different skills that share letters don't ("Java" ≠ "JavaScript").

Match types, in priority order:
  direct      — the candidate lists the skill (credit 1.0)
  evidence    — named in the evidence of another candidate skill (0.9)
  implied     — follows from a candidate skill, e.g. React ⇒ HTML/CSS (0.75)
  alternative — the JD offers alternatives ("C++, Java or Go") and the
                candidate has one of them; not required separately (excluded
                from the score)
  category    — no specific technology asked, candidate has related skills in
                the same RADIX category (0.5)
"""

import re
from typing import Dict, List, Literal, Optional, Set, Tuple

from fastapi import APIRouter
from pydantic import BaseModel, Field

from .models import Skill
from .jd.taxonomy import TECH, TECH_BY_NAME, TechSkill

MatchType = Literal["direct", "evidence", "implied", "alternative", "category"]

CREDIT: Dict[str, float] = {"direct": 1.0, "evidence": 0.9, "implied": 0.75, "category": 0.5}
REQ_WEIGHT = {"high": 1.0, "medium": 0.7, "low": 0.4}
_ALTERNATIVES = re.compile(r"\bor\b|\bone of\b|\bany of\b|\beither\b", re.I)
# Competencies rather than tools: a related skill in the same category earns
# partial credit. Specific technologies (Kubernetes, Power BI…) don't.
BROAD_CATEGORIES = {"DSA", "OOD", "APTI", "COMM", "SYSD"}
BROAD_SKILLS = {"debugging", "code review & code quality", "sdlc", "agile / scrum", "production-quality engineering"}

_STOP = {"and", "or", "the", "of", "for", "with", "in", "to", "a", "an", "skills", "skill", "basic", "advanced", "core", "strong"}


class MatchRequest(BaseModel):
    candidate_skills: List[Skill]
    jd_skills: List[Skill]
    jd_source_file: Optional[str] = None


class MatchedSkill(BaseModel):
    req_skill: str
    category: str
    cand_skill: str
    evidence: str
    confidence: Literal["high", "medium", "low"]
    match_type: MatchType
    note: str
    credit: float
    source: Optional[str] = None


class MissingSkill(BaseModel):
    req_skill: str
    category: str
    reason: str
    related: Optional[str] = None


class MatchResult(BaseModel):
    jd_source_file: Optional[str] = None
    match_score: int = Field(..., ge=0, le=100)
    matched_skills: List[MatchedSkill]
    missing_skills: List[MissingSkill]


def techs_in(text: str) -> List[TechSkill]:
    found = [t for t in TECH if t.pattern.search(text)]
    # Bare names like "Go" or "R" need context for the text patterns; as a
    # skill name on their own they are unambiguous.
    exact = TECH_BY_NAME.get(text.strip().lower())
    if exact and exact not in found:
        found.append(exact)
    return found


def implied_closure(names: Set[str]) -> Dict[str, str]:
    """canonical skill (lowercase) → the candidate skill it was inferred from."""
    inferred: Dict[str, str] = {}
    frontier = [(n, n) for n in names]
    while frontier:
        name, origin = frontier.pop()
        tech = TECH_BY_NAME.get(name)
        if not tech:
            continue
        for child, _ in tech.implies:
            key = child.lower()
            if key in names or key in inferred:
                continue
            inferred[key] = origin
            frontier.append((key, origin))
    return inferred


def _tokens(name: str) -> Set[str]:
    return {t for t in re.findall(r"[a-z0-9+#]+", name.lower()) if t not in _STOP}


def _similar(a: str, b: str) -> bool:
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return False
    return len(ta & tb) / len(ta | tb) >= 0.5


def match_skills(candidate: List[Skill], jd: List[Skill], source_file: Optional[str] = None) -> MatchResult:
    # Candidate coverage: canonical skill → (candidate skill it came from, how).
    by_name: Dict[str, Skill] = {}
    by_evidence: Dict[str, Skill] = {}
    for skill in candidate:
        for tech in techs_in(skill.skill_name):
            by_name.setdefault(tech.name.lower(), skill)
        for tech in techs_in(skill.evidence or ""):
            by_evidence.setdefault(tech.name.lower(), skill)
    inferred = implied_closure(set(by_name) | set(by_evidence))
    origin_skill = {**by_evidence, **by_name}

    def satisfy(req: Skill) -> Optional[MatchedSkill]:
        req_techs = techs_in(req.skill_name)
        keys = [t.name.lower() for t in req_techs]

        for key in keys:
            if key in by_name:
                cand = by_name[key]
                source = cand.source
                is_profile_skill = source is None
                return MatchedSkill(req_skill=req.skill_name, category=req.category_code, cand_skill=cand.skill_name,
                                    evidence=cand.evidence, confidence=cand.confidence,
                                    match_type="direct" if is_profile_skill else "evidence",
                                    note="Direct match" if is_profile_skill else f"Verified in {source}",
                                    credit=CREDIT["direct"] if is_profile_skill else CREDIT["evidence"],
                                    source=source)
        if not keys:
            for cand in candidate:
                if _similar(req.skill_name, cand.skill_name):
                    source = cand.source
                    is_profile_skill = source is None
                    return MatchedSkill(req_skill=req.skill_name, category=req.category_code, cand_skill=cand.skill_name,
                                        evidence=cand.evidence, confidence=cand.confidence,
                                        match_type="direct" if is_profile_skill else "evidence",
                                        note="Direct match" if is_profile_skill else f"Verified in {source}",
                                        credit=CREDIT["direct"] if is_profile_skill else CREDIT["evidence"],
                                        source=source)
        for key in keys:
            if key in by_evidence:
                cand = by_evidence[key]
                return MatchedSkill(req_skill=req.skill_name, category=req.category_code, cand_skill=cand.skill_name,
                                    evidence=cand.evidence, confidence="medium", match_type="evidence",
                                    note=f"Mentioned in evidence for {cand.skill_name}", credit=CREDIT["evidence"],
                                    source=cand.source)
        for key in keys:
            if key in inferred:
                cand = origin_skill[inferred[key]]
                parent = TECH_BY_NAME[inferred[key]].name
                return MatchedSkill(req_skill=req.skill_name, category=req.category_code, cand_skill=cand.skill_name,
                                    evidence=f"{parent} work implies {TECH_BY_NAME[key].name}: {cand.evidence}",
                                    confidence="medium", match_type="implied", note=f"Inferred via {parent}",
                                    credit=CREDIT["implied"], source=cand.source)
        broad = not keys or req.category_code in BROAD_CATEGORIES or any(k in BROAD_SKILLS for k in keys)
        if broad:
            related = [c for c in candidate if c.category_code == req.category_code]
            if related:
                cand = related[0]
                return MatchedSkill(req_skill=req.skill_name, category=req.category_code, cand_skill=cand.skill_name,
                                    evidence=cand.evidence, confidence="low", match_type="category",
                                    note=f"Related {req.category_code} skill, partial credit", credit=CREDIT["category"],
                                    source=cand.source)
        return None

    results: List[Tuple[Skill, Optional[MatchedSkill]]] = [(req, satisfy(req)) for req in jd]

    # Requirements quoted from the same "X, Y or Z" sentence are alternatives:
    # one satisfied member satisfies the group.
    groups: Dict[Tuple[str, str], List[int]] = {}
    for i, (req, _) in enumerate(results):
        if _ALTERNATIVES.search(req.evidence or ""):
            groups.setdefault((req.category_code, req.evidence), []).append(i)

    matched: List[MatchedSkill] = []
    missing: List[MissingSkill] = []
    weight_total = 0.0
    weight_got = 0.0
    for i, (req, hit) in enumerate(results):
        if hit is None or hit.match_type == "category":
            group = groups.get((req.category_code, req.evidence), [])
            winner = next((results[j][1] for j in group if j != i and results[j][1] and results[j][1].match_type != "category"), None)
            if winner is not None and len(group) > 1:
                matched.append(MatchedSkill(req_skill=req.skill_name, category=req.category_code, cand_skill=winner.cand_skill,
                                            evidence=req.evidence, confidence=winner.confidence, match_type="alternative",
                                            note=f"JD accepts alternatives; you have {winner.req_skill}", credit=0.0,
                                            source=winner.source))
                continue
        weight = REQ_WEIGHT.get(req.confidence, 0.7)
        weight_total += weight
        if hit is not None:
            matched.append(hit)
            weight_got += weight * hit.credit
        else:
            related = next((c.skill_name for c in candidate if c.category_code == req.category_code), None)
            missing.append(MissingSkill(req_skill=req.skill_name, category=req.category_code,
                                        reason=req.evidence, related=related))

    score = round(100 * weight_got / weight_total) if weight_total else 0
    return MatchResult(jd_source_file=source_file, match_score=score, matched_skills=matched, missing_skills=missing)


router = APIRouter(prefix="/api", tags=["Role 5: Skill Matching"])


@router.post("/match", response_model=MatchResult)
def match_endpoint(body: MatchRequest):
    return match_skills(body.candidate_skills, body.jd_skills, body.jd_source_file)
