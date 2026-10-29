"""
Split a JD into sections and pull out metadata.

The brief (p. 7) notes the skill signal is concentrated in "Key
Responsibilities" and "What We're Looking For"; the extractor weights skills by
the section they come from, so getting sections right matters more than
getting every metadata field.
"""

import re
from typing import List, Optional, Tuple

from .models import JdMetadata, JdSection, SectionName

# Order matters: the first matching pattern wins, so "about the role" is
# claimed by overview before the generic "about ..." company rule.
_HEADING_RULES: List[Tuple[SectionName, re.Pattern]] = [
    ("preferred", re.compile(
        r"preferred|nice[- ]to[- ]have|good[- ]to[- ]have|bonus|desir(?:ed|able)|"
        r"additional (?:skills|qualifications)|plus points", re.I)),
    ("responsibilities", re.compile(
        r"responsibilit|what you'?ll do|what you will do|your role|day[- ]to[- ]day|"
        r"key duties|duties|the work|what you'?ll be doing|in this role", re.I)),
    ("requirements", re.compile(
        r"requirement|qualification|what we'?re looking for|what we are looking for|"
        r"who you are|must[- ]have|skills (?:required|needed)|required skills|"
        r"you (?:have|bring|should have)|eligibility|what you'?ll need|"
        r"what you bring|key skills|technical skills|competenc", re.I)),
    ("overview", re.compile(
        r"about the (?:role|job|position|opportunity)|overview|summary|"
        r"job description|role description|the role|the opportunity|position", re.I)),
    ("benefits", re.compile(
        r"benefit|perks|what we offer|why join|compensation|we offer", re.I)),
    ("company", re.compile(
        r"^about\b|who we are|our (?:team|company|mission|culture)|"
        r"about (?:us|the (?:company|team))|equal opportunity|diversity", re.I)),
]

_META_LINE = re.compile(
    r"^(?:company|organi[sz]ation|employer|role|title|job title|position|"
    r"location|work ?mode|workplace(?: type)?|employment type|experience|team|department)\s*:",
    re.I,
)


def _classify_heading(line: str) -> Optional[SectionName]:
    stripped = line.strip().strip("#*").strip()
    if not stripped or stripped.startswith("•"):
        return None
    if _META_LINE.match(stripped):
        return None
    words = stripped.rstrip(":").split()
    # Headings are short and don't read like sentences.
    if len(words) > 9 or len(stripped) > 70:
        return None
    if stripped.endswith(".") and not stripped.endswith("..."):
        return None
    looks_like_heading = (
        stripped.endswith(":")
        or stripped.isupper()
        or sum(w[:1].isupper() for w in words) >= max(1, len(words) - 2)
    )
    if not looks_like_heading:
        return None
    for name, pattern in _HEADING_RULES:
        if pattern.search(stripped.rstrip(":")):
            return name
    return None


def split_sections(text: str) -> List[JdSection]:
    sections: List[JdSection] = []
    current_name: SectionName = "overview"
    current_heading = "Header"
    current_start = 0

    offset = 0
    for line in text.split("\n"):
        line_start = offset
        offset += len(line) + 1
        name = _classify_heading(line)
        if name is None:
            continue
        if line_start > current_start:
            body = text[current_start:line_start].strip()
            if body:
                sections.append(JdSection(
                    name=current_name, heading=current_heading, text=body,
                    start=current_start, end=line_start,
                ))
        current_name = name
        current_heading = line.strip().rstrip(":")
        current_start = line_start

    body = text[current_start:].strip()
    if body:
        sections.append(JdSection(
            name=current_name, heading=current_heading, text=body,
            start=current_start, end=len(text),
        ))
    return sections


def section_at(sections: List[JdSection], position: int) -> SectionName:
    for section in sections:
        if section.start <= position < section.end:
            return section.name
    return "other"


def _field(text: str, labels: str) -> Optional[str]:
    match = re.search(rf"^(?:{labels})\s*:\s*(.+)$", text, re.I | re.M)
    return match.group(1).strip() if match else None


_KNOWN_COMPANIES = [
    "Google LLC", "Google", "Microsoft Corporation", "Microsoft",
    "Oracle Financial Services Software", "Oracle", "Amazon", "Meta",
    "Infosys", "TCS", "Wipro", "Accenture", "Flipkart", "Adobe",
]

_ROLE_HINT = re.compile(
    r"\b((?:Senior |Junior |Associate |Lead |Staff |Principal )?"
    r"(?:Software (?:Development )?Engineer(?: \(SWE\))?|Data Scientist|Data Analyst|"
    r"Data Engineer|Application Support Analyst|ML Engineer|Machine Learning Engineer|"
    r"Backend (?:Developer|Engineer)|Frontend (?:Developer|Engineer)|"
    r"Full[- ]Stack (?:Developer|Engineer)|DevOps Engineer|Cloud Engineer|"
    r"Business Analyst|QA Engineer|Test Engineer|SDE(?:[- ]?I{1,3})?))\b"
)


def extract_metadata(
    text: str, company_hint: Optional[str] = None, role_hint: Optional[str] = None
) -> JdMetadata:
    company = company_hint or _field(text, "company|organi[sz]ation|employer")
    if not company:
        for name in _KNOWN_COMPANIES:
            if re.search(rf"\b{re.escape(name)}\b", text):
                company = name
                break

    role = role_hint or _field(text, "job title|title|role|position")
    if not role:
        match = _ROLE_HINT.search(text[:600]) or _ROLE_HINT.search(text)
        role = match.group(1) if match else None

    location = _field(text, "location|locations|based in")
    work_mode = _field(text, "work ?mode|workplace(?: type)?")
    if not work_mode:
        lowered = text.lower()
        if "hybrid" in lowered:
            work_mode = "Hybrid"
        elif re.search(r"\bremote\b", lowered):
            work_mode = "Remote"
        elif re.search(r"\bon[- ]?site\b|work from office", lowered):
            work_mode = "Onsite"

    experience, min_years = _experience(text)
    education = _education(text)
    seniority = _seniority(role or "", min_years, text)

    return JdMetadata(
        company=company or "Unknown Company",
        role=role or "Unknown Role",
        location=location,
        work_mode=work_mode,
        experience=experience,
        min_years=min_years,
        education=education,
        seniority=seniority,
    )


_EXP_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*)?"
    r"(?:years?|yrs?)(?:\s+of)?(?:\s+\w+){0,4}?\s+experience",
    re.I,
)


def _experience(text: str) -> Tuple[Optional[str], Optional[float]]:
    match = _EXP_RE.search(text)
    if match:
        low = float(match.group(1))
        high = match.group(2)
        label = f"{match.group(1)}–{high} years" if high else f"{match.group(1)}+ years"
        return label, low
    if re.search(r"\b(fresh(?:er|ers)|new grad(?:uate)?s?|entry[- ]level|0\s*(?:-|–|to)\s*\d+\s*years?|recent graduates?)\b", text, re.I):
        return "0–2 years (entry level)", 0.0
    return None, None


_EDU_RE = re.compile(
    r"((?:B\.?\s?Tech|B\.?E\.?|M\.?\s?Tech|B\.?Sc|M\.?Sc|MCA|BCA|Bachelor'?s?|Master'?s?|Ph\.?D)"
    r"[^.\n]{0,120})",
    re.I,
)


def _education(text: str) -> Optional[str]:
    match = _EDU_RE.search(text)
    if not match:
        return None
    return match.group(1).strip().rstrip(",;")


def _seniority(role: str, min_years: Optional[float], text: str) -> str:
    if re.search(r"\b(senior|lead|staff|principal|architect|manager)\b", role, re.I):
        return "senior"
    if min_years is not None:
        if min_years >= 5:
            return "senior"
        if min_years >= 2:
            return "mid"
        return "entry"
    if re.search(r"\b(associate|junior|intern|graduate|entry|fresher|analyst)\b", role, re.I):
        return "entry"
    if re.search(r"\bnew grad|campus|recent graduate", text, re.I):
        return "entry"
    return "entry"
