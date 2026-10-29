"""
RADIX Talent Match Hackathon — Shared Data Contract Validator
Enforces the 12-skillset framework and field constraints from the brief.
"""

from typing import List, Dict, Any
from .models import CandidateProfile, ValidationResult

VALID_CATEGORIES = {
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"
}

VALID_CONFIDENCE = {"high", "medium", "low"}

def validate_candidate_profile(profile: CandidateProfile) -> ValidationResult:
    errors: List[str] = []
    warnings: List[str] = []
    coverage: Dict[str, int] = {cat: 0 for cat in VALID_CATEGORIES}

    # 1. Basic Fields validation
    if not profile.name or not profile.name.strip():
        errors.append("Field 'name' is required and cannot be empty.")
    if not profile.email or "@" not in profile.email:
        errors.append("Field 'email' must be a valid email address.")
    if not profile.education or not profile.education.strip():
        errors.append("Field 'education' is required.")

    # 2. Preferred roles
    if not profile.preferred_roles:
        warnings.append("No preferred_roles specified. Downstream Skill Matching works best with at least 1 preferred role.")

    # 3. Skills validation
    if not profile.skills:
        errors.append("At least 1 skill is required for Role 4 and Role 5 handoff.")
    else:
        for idx, skill in enumerate(profile.skills):
            s_name = (skill.skill_name or "").strip()
            if not s_name:
                errors.append(f"Skill at index {idx} has an empty 'skill_name'.")
            
            c_code = skill.category_code
            if c_code not in VALID_CATEGORIES:
                errors.append(
                    f"Skill '{s_name or f'at #{idx}'}' has invalid category_code '{c_code}'. "
                    f"Must be one of {list(VALID_CATEGORIES)}."
                )
            else:
                coverage[c_code] = coverage.get(c_code, 0) + 1

            if skill.confidence not in VALID_CONFIDENCE:
                errors.append(
                    f"Skill '{s_name}' has invalid confidence '{skill.confidence}'. Must be high, medium, or low."
                )

            if not skill.evidence or len(skill.evidence.strip()) < 3:
                warnings.append(
                    f"Skill '{s_name}' has very short or missing evidence. Providing a clear quote or reason improves Talent Check accuracy."
                )

    # 4. Beyond the resume fields check
    if not profile.hackathons and not profile.internships:
        warnings.append("Profile Builder's mission is to capture signals beyond the resume (hackathons or internships recommended).")

    is_valid = len(errors) == 0

    return ValidationResult(
        valid=is_valid,
        errors=errors,
        warnings=warnings,
        category_coverage=coverage,
        total_skills=len(profile.skills)
    )
