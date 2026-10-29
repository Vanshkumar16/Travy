/**
 * Role 1: JD Analytics types. Mirror of server/jd/models.py.
 */
import { CategoryCode, ConfidenceLevel } from "./contract";

export type JdImportance = "must_have" | "nice_to_have";
export type JdSectionName =
  | "overview"
  | "responsibilities"
  | "requirements"
  | "preferred"
  | "company"
  | "benefits"
  | "other";
export type JdEngine = "auto" | "llm" | "rules";

export interface JdSkill {
  skill_name: string;
  category_code: CategoryCode;
  evidence: string;
  confidence: ConfidenceLevel;
  importance: JdImportance;
  source_section: JdSectionName;
  implied_by: string | null;
  grounded: boolean;
  sources: Array<"llm" | "rules">;
}

export interface JdSection {
  name: JdSectionName;
  heading: string;
  text: string;
  start: number;
  end: number;
}

export interface JdMetadata {
  company: string;
  role: string;
  location: string | null;
  work_mode: string | null;
  experience: string | null;
  min_years: number | null;
  education: string | null;
  seniority: "entry" | "mid" | "senior";
}

export interface CategoryDemand {
  category_code: Exclude<CategoryCode, "OTHER">;
  required_level: number;
  must_have_count: number;
  nice_to_have_count: number;
  company_bar: number | null;
}

export interface JdInsight {
  kind: "focus" | "warning" | "info";
  title: string;
  detail: string;
}

export interface JdAnalysis {
  id: string;
  source_type: "jd";
  source_file: string;
  company: string;
  role: string;
  created_at: string;
  engine_used: "llm+rules" | "rules";
  engine_note: string | null;
  processing_ms: number;
  metadata: JdMetadata;
  skills: JdSkill[];
  sections: JdSection[];
  category_demand: CategoryDemand[];
  insights: JdInsight[];
  raw_text: string;
  company_bar_source: string | null;
}

/** Strict shared-format handoff (brief p. 10). */
export interface JdSkillListContract {
  source_type: "jd";
  source_file: string;
  company: string;
  role: string;
  skills: Array<{
    skill_name: string;
    category_code: CategoryCode;
    evidence: string;
    confidence: ConfidenceLevel;
  }>;
}

export interface JdEngineStatus {
  llm_available: boolean;
  llm_model: string | null;
  rules_available: boolean;
  default_engine: "llm+rules" | "rules";
  supported_formats: string[];
}

export interface JdSample {
  id: string;
  file: string;
  format: string;
  company: string;
  role: string;
  location: string;
}
