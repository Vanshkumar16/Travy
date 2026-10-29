"""
RADIX Talent Match — Role 1: JD Analytics models.

The strict handoff (`JdSkillListContract`) is exactly the brief's extracted
skill list (p. 10). `JdAnalysis` is the extended record the UI works with; its
extra fields sit alongside the contract fields and never replace them.
"""

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

from ..models import CategoryCode, Confidence, Skill

Importance = Literal["must_have", "nice_to_have"]
SectionName = Literal[
    "overview", "responsibilities", "requirements", "preferred",
    "company", "benefits", "other",
]
EngineName = Literal["auto", "llm", "rules"]

CATEGORY_CODES: List[str] = [
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS",
]


class JdSkill(Skill):
    """A <skill> plus JD-specific annotations."""
    importance: Importance = "must_have"
    source_section: SectionName = "other"
    implied_by: Optional[str] = None
    grounded: bool = True
    sources: List[Literal["llm", "rules"]] = Field(default_factory=list)


class JdSection(BaseModel):
    name: SectionName
    heading: str
    text: str
    start: int
    end: int


class JdMetadata(BaseModel):
    company: str = "Unknown Company"
    role: str = "Unknown Role"
    location: Optional[str] = None
    work_mode: Optional[str] = None
    experience: Optional[str] = None
    min_years: Optional[float] = None
    education: Optional[str] = None
    seniority: Literal["entry", "mid", "senior"] = "entry"


class CategoryDemand(BaseModel):
    category_code: str
    required_level: int = Field(..., ge=0, le=10)
    must_have_count: int = 0
    nice_to_have_count: int = 0
    company_bar: Optional[int] = None


class JdInsight(BaseModel):
    kind: Literal["focus", "warning", "info"]
    title: str
    detail: str


class JdAnalysis(BaseModel):
    id: str
    source_type: Literal["jd"] = "jd"
    source_file: str
    company: str
    role: str
    created_at: str
    engine_used: Literal["llm+rules", "rules"]
    engine_note: Optional[str] = None
    processing_ms: int = 0
    metadata: JdMetadata
    skills: List[JdSkill]
    sections: List[JdSection]
    category_demand: List[CategoryDemand]
    insights: List[JdInsight]
    raw_text: str
    company_bar_source: Optional[str] = None


class JdSkillListContract(BaseModel):
    """Strict shared-format handoff to Role 5 (brief p. 10)."""
    source_type: Literal["jd"] = "jd"
    source_file: str
    company: str
    role: str
    skills: List[Skill]


class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=40)
    source_file: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    engine: EngineName = "auto"


__all__ = [
    "AnalyzeTextRequest", "CATEGORY_CODES", "CategoryCode", "CategoryDemand",
    "Confidence", "EngineName", "JdAnalysis", "JdInsight", "JdMetadata",
    "JdSection", "JdSkill", "JdSkillListContract", "SectionName",
]
