/**
 * RADIX Talent Match Hackathon — Shared Data Contract
 * Role 3: Profile Builder Data Types
 * Reference: Participant Brief (October 2026, Pages 9-10)
 */

export type CategoryCode =
  | "COD"   // Coding
  | "DSA"   // Data Structures & Algorithms
  | "OOD"   // Object-Oriented Design
  | "APTI"  // Aptitude
  | "COMM"  // Communication
  | "AI"    // AI & Machine Learning
  | "CLOUD" // Cloud & DevOps
  | "SQL"   // SQL & Databases
  | "SWE"   // Software Engineering
  | "SYSD"  // System Design
  | "NETW"  // Networking
  | "OS"    // Operating Systems
  | "OTHER";

export type ConfidenceLevel = "high" | "medium" | "low";
export type SkillEvidenceSource = "hackathon" | "internship" | "certification" | "achievement";

export interface Skill {
  id?: string;
  skill_name: string;
  category_code: CategoryCode;
  evidence: string;
  confidence: ConfidenceLevel;
  source?: SkillEvidenceSource;
}

export interface HackathonEntry {
  id: string;
  title: string;
  role_or_project: string;
  achievement: string;
  skills_used: string[];
  year: string;
  link?: string;
}

export interface InternshipEntry {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
  skills_used: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  credential_id_or_url?: string;
}

export interface AchievementEntry {
  id: string;
  title: string;
  description: string;
  date: string;
}

/**
 * Role 3 Candidate Profile (Handoff to Role 4 Talent Check & Role 5 Skill Matching)
 */
export interface CandidateProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  education: string;
  institution?: string;
  cgpa?: string;
  graduation_year?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary?: string;
  skills: Skill[];
  hackathons: HackathonEntry[];
  internships: InternshipEntry[];
  certifications: CertificationEntry[];
  achievements?: AchievementEntry[];
  preferred_roles: string[];
  preferred_companies?: string[];
  preferred_mode?: "Remote" | "Hybrid" | "Onsite" | "Flexible";
  cv_file?: string;
  cv_uploaded_at?: string;
  last_updated?: string;
}

/**
 * Input format handed off from Role 2 Resume Parsing / Role 1 JD Analytics
 */
export interface ExtractedSkillListInput {
  source_type: "resume" | "jd";
  source_file: string;
  company?: string;
  role?: string;
  name?: string;
  email?: string;
  education?: string;
  skills: Skill[];
  projects?: Array<{
    title: string;
    description: string;
    technologies?: string[];
  }>;
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  hackathons?: HackathonEntry[];
  certifications?: CertificationEntry[];
}

export interface SkillCategoryMeta {
  code: CategoryCode;
  name: string;
  shortDesc: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentHex: string;
}

export const RADIX_SKILL_CATEGORIES: Record<CategoryCode, SkillCategoryMeta> = {
  COD: {
    code: "COD",
    name: "Coding",
    shortDesc: "Syntax, language mastery, clean readable implementation",
    badgeBg: "bg-blue-50 text-blue-700",
    badgeText: "text-blue-700",
    borderColor: "border-blue-200",
    accentHex: "#2563EB",
  },
  DSA: {
    code: "DSA",
    name: "Data Structures & Algorithms",
    shortDesc: "Complexity, trees, graphs, dynamic programming, sorting",
    badgeBg: "bg-purple-50 text-purple-700",
    badgeText: "text-purple-700",
    borderColor: "border-purple-200",
    accentHex: "#7C3AED",
  },
  OOD: {
    code: "OOD",
    name: "Object-Oriented Design",
    shortDesc: "SOLID principles, patterns, modular class architecture",
    badgeBg: "bg-cyan-50 text-cyan-700",
    badgeText: "text-cyan-700",
    borderColor: "border-cyan-200",
    accentHex: "#06B6D4",
  },
  APTI: {
    code: "APTI",
    name: "Aptitude",
    shortDesc: "Quantitative analysis, logical reasoning, mental agility",
    badgeBg: "bg-amber-50 text-amber-700",
    badgeText: "text-amber-700",
    borderColor: "border-amber-200",
    accentHex: "#D97706",
  },
  COMM: {
    code: "COMM",
    name: "Communication",
    shortDesc: "Technical articulacy, active listening, presentation",
    badgeBg: "bg-emerald-50 text-emerald-700",
    badgeText: "text-emerald-700",
    borderColor: "border-emerald-200",
    accentHex: "#059669",
  },
  AI: {
    code: "AI",
    name: "Artificial Intelligence",
    shortDesc: "Machine learning, LLMs, NLP, predictive modeling",
    badgeBg: "bg-rose-50 text-rose-700",
    badgeText: "text-rose-700",
    borderColor: "border-rose-200",
    accentHex: "#E11D48",
  },
  CLOUD: {
    code: "CLOUD",
    name: "Cloud & DevOps",
    shortDesc: "AWS/GCP, Docker, containers, CI/CD, serverless",
    badgeBg: "bg-sky-50 text-sky-700",
    badgeText: "text-sky-700",
    borderColor: "border-sky-200",
    accentHex: "#0284C7",
  },
  SQL: {
    code: "SQL",
    name: "SQL & Databases",
    shortDesc: "Relational queries, indexing, schema design, ACID",
    badgeBg: "bg-teal-50 text-teal-700",
    badgeText: "text-teal-700",
    borderColor: "border-teal-200",
    accentHex: "#0D9488",
  },
  SWE: {
    code: "SWE",
    name: "Software Engineering",
    shortDesc: "Unit testing, version control, CI/CD, code reviews",
    badgeBg: "bg-indigo-50 text-indigo-700",
    badgeText: "text-indigo-700",
    borderColor: "border-indigo-200",
    accentHex: "#4F46E5",
  },
  SYSD: {
    code: "SYSD",
    name: "System Design",
    shortDesc: "Scalability, microservices, load balancing, caching",
    badgeBg: "bg-fuchsia-50 text-fuchsia-700",
    badgeText: "text-fuchsia-700",
    borderColor: "border-fuchsia-200",
    accentHex: "#C026D3",
  },
  NETW: {
    code: "NETW",
    name: "Networking",
    shortDesc: "TCP/IP, HTTP/3, DNS, REST APIs, WebSockets",
    badgeBg: "bg-orange-50 text-orange-700",
    badgeText: "text-orange-700",
    borderColor: "border-orange-200",
    accentHex: "#EA580C",
  },
  OS: {
    code: "OS",
    name: "Operating Systems",
    shortDesc: "Processes, threads, concurrency, memory, POSIX/Linux",
    badgeBg: "bg-slate-100 text-slate-700",
    badgeText: "text-slate-700",
    borderColor: "border-slate-300",
    accentHex: "#475569",
  },
  OTHER: {
    code: "OTHER",
    name: "Other Skills",
    shortDesc: "Domain specific, cross-functional or complementary skills",
    badgeBg: "bg-gray-100 text-gray-700",
    badgeText: "text-gray-700",
    borderColor: "border-gray-300",
    accentHex: "#6B7280",
  },
};
