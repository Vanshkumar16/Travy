import { CandidateProfile, ExtractedSkillListInput } from "../types/contract";
import { SAMPLE_CANDIDATES } from "../data/sampleCandidates";
import type { OpportunityListResponse } from "../types/opportunity";
import {
  parseCompanySkillsetDataset,
  TalentCheckCompanyDataset,
} from "../data/talentCheckCompanySkillsets";

const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchOpportunities(): Promise<OpportunityListResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/opportunities`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error("Cannot reach the opportunities API. Start the FastAPI backend and retry.");
  }

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // Keep the HTTP status as the surfaced error.
    }
    throw new Error(`Could not load opportunities: ${detail}`);
  }

  return response.json() as Promise<OpportunityListResponse>;
}

export async function fetchCurrentProfile(): Promise<CandidateProfile> {
  try {
    const res = await fetch(`${API_BASE}/profile`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback to local storage or sample
  }
  const saved = localStorage.getItem("radix_active_profile");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return SAMPLE_CANDIDATES.ananya;
}

export async function saveProfileToBackend(profile: CandidateProfile): Promise<CandidateProfile> {
  // Always update local storage for instant offline resilience
  localStorage.setItem("radix_active_profile", JSON.stringify(profile));
  
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.profile || profile;
    }
  } catch {
    // backend offline, local storage already updated
  }
  return profile;
}

export async function selectCandidate(candidateId: string): Promise<CandidateProfile> {
  try {
    const res = await fetch(`${API_BASE}/profiles/${candidateId}/select`, {
      method: "POST",
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const profile = await res.json();
      localStorage.setItem("radix_active_profile", JSON.stringify(profile));
      return profile;
    }
  } catch {}

  const sample = SAMPLE_CANDIDATES[candidateId] || SAMPLE_CANDIDATES.ananya;
  localStorage.setItem("radix_active_profile", JSON.stringify(sample));
  return sample;
}

export async function ingestAnalyticsData(payload: ExtractedSkillListInput): Promise<CandidateProfile> {
  try {
    const res = await fetch(`${API_BASE}/profile/ingest-analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.profile) {
        localStorage.setItem("radix_active_profile", JSON.stringify(data.profile));
        return data.profile;
      }
    }
  } catch {}

  // Fallback client-side ingestion logic
  const currentSaved = localStorage.getItem("radix_active_profile");
  const base: CandidateProfile = currentSaved ? JSON.parse(currentSaved) : SAMPLE_CANDIDATES.ananya;

  const updated: CandidateProfile = {
    ...base,
    name: payload.name || base.name,
    email: payload.email || base.email,
    education: payload.education || base.education,
    cv_file: payload.source_file || base.cv_file,
    skills: payload.skills && payload.skills.length > 0 ? payload.skills : base.skills,
    last_updated: new Date().toISOString(),
  };

  localStorage.setItem("radix_active_profile", JSON.stringify(updated));
  return updated;
}

// ---------------------------------------------------------------------------
// Groq LLM Resume Skill Extraction
// ---------------------------------------------------------------------------

export interface GroqExtractedSkill {
  skill_name: string;
  category_code: string;
  mention_type: "explicit" | "implied";
  confidence: "high" | "medium" | "low";
  evidence: string;
}

export interface GroqExtractionResult {
  filename: string;
  skills_extracted: number;
  profile: {
    name: string | null;
    email: string | null;
    phone: string | null;
    education: string | null;
    institution: string | null;
    cgpa: string | null;
    graduation_year: string | null;
    linkedin: string | null;
    github: string | null;
    portfolio: string | null;
    summary: string | null;
  };
  skills: GroqExtractedSkill[];
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
    skills_used: string[];
  }>;
  hackathons: Array<{
    title: string;
    role_or_project: string;
    achievement: string;
    skills_used: string[];
    year: string;
    link: string | null;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    date: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issue_date: string;
    credential_id_or_url: string | null;
  }>;
}

/**
 * Upload a resume file to the backend and extract skills via Groq LLM.
 * The API key is kept server-side and is never exposed to the browser.
 */
export async function extractSkillsFromResumeFile(
  file: File
): Promise<GroqExtractionResult> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/resume/extract-skills`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(90_000), // 90s — LLM calls can be slow
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Resume extraction timed out. Retry with a smaller or text-based resume.");
    }
    throw new Error("Cannot reach the resume extraction backend at 127.0.0.1:8000. Start the FastAPI server and retry.");
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string"
        ? body.detail
        : body.detail
          ? JSON.stringify(body.detail)
          : detail;
    } catch {}
    throw new Error(`Resume extraction failed (${res.status}): ${detail}`);
  }

  return res.json() as Promise<GroqExtractionResult>;
}

export async function fetchCompanySkillsets(): Promise<TalentCheckCompanyDataset> {
  const res = await fetch(`${API_BASE}/talent-check-bars`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {}
    throw new Error(`Could not load company benchmarks: ${detail}`);
  }

  return parseCompanySkillsetDataset(await res.json());
}
