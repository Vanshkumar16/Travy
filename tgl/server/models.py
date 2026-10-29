"""
RADIX Talent Match Hackathon — Role 3: Profile Builder
Shared Data Contract Models (Pydantic v2)
Participant Brief October 2026, Pages 9-10
"""

from typing import Literal, List, Optional, Any, Dict
from pydantic import BaseModel, Field

CategoryCode = Literal[
    "COD",   # Coding
    "DSA",   # Data Structures & Algorithms
    "OOD",   # Object-Oriented Design
    "APTI",  # Aptitude
    "COMM",  # Communication
    "AI",    # AI
    "CLOUD", # Cloud
    "SQL",   # SQL
    "SWE",   # Software Engineering
    "SYSD",  # System Design
    "NETW",  # Networking
    "OS",    # Operating Systems
    "OTHER"  # Outside the 12
]

Confidence = Literal["high", "medium", "low"]
EvidenceSource = Literal["hackathon", "internship", "certification", "achievement"]

class Skill(BaseModel):
    skill_name: str = Field(..., description="The skill or technology name")
    category_code: CategoryCode = Field(..., description="One of the 12 RADIX codes or OTHER")
    evidence: str = Field(..., description="A short quote, project mention or reason")
    confidence: Confidence = Field("high", description="High, medium or low")
    source: Optional[EvidenceSource] = None

class Hackathon(BaseModel):
    id: Optional[str] = None
    title: str
    role_or_project: str
    achievement: str
    skills_used: List[str] = Field(default_factory=list)
    year: str
    link: Optional[str] = None

class Internship(BaseModel):
    id: Optional[str] = None
    company: str
    role: str
    duration: str
    description: str
    skills_used: List[str] = Field(default_factory=list)

class Certification(BaseModel):
    id: Optional[str] = None
    name: str
    issuer: str
    issue_date: str
    credential_id_or_url: Optional[str] = None

class Achievement(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    date: str = ""

class CandidateProfile(BaseModel):
    """Canonical Candidate Profile (Role 3 Output, handed off to Role 4 & Role 5)"""
    id: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = None
    education: str
    institution: Optional[str] = None
    cgpa: Optional[str] = None
    graduation_year: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    summary: Optional[str] = None
    skills: List[Skill] = Field(default_factory=list)
    hackathons: List[Hackathon] = Field(default_factory=list)
    internships: List[Internship] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)
    achievements: List[Achievement] = Field(default_factory=list)
    preferred_roles: List[str] = Field(default_factory=list)
    preferred_companies: Optional[List[str]] = Field(default_factory=list)
    preferred_mode: Optional[str] = "Hybrid"
    cv_file: Optional[str] = None
    cv_uploaded_at: Optional[str] = None
    last_updated: Optional[str] = None

class ExtractedSkillListInput(BaseModel):
    """Input payload handed off from Role 2 Resume Parsing or Role 1 JD Analytics"""
    source_type: Literal["resume", "jd"]
    source_file: str
    company: Optional[str] = None
    role: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    education: Optional[str] = None
    skills: List[Skill] = Field(default_factory=list)
    projects: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    experience: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    hackathons: Optional[List[Hackathon]] = Field(default_factory=list)
    certifications: Optional[List[Certification]] = Field(default_factory=list)

class ValidationResult(BaseModel):
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    category_coverage: Dict[str, int] = Field(default_factory=dict)
    total_skills: int = 0
