import { CategoryCode, CandidateProfile, RADIX_SKILL_CATEGORIES } from "../types/contract";

/**
 * RADIX Hackathon — Talent Check Company Skillset Expectations
 * Loaded from talent_check_company_skillsets.json (generated from Supabase staging_company_skill_levels)
 * Covers all 116 tech companies with the 3 canonical hackathon targets:
 *  - Google LLC (Subsidiary of Alphabet Inc.) [ID 4]
 *  - Microsoft Corporation [ID 78]
 *  - Oracle Financial Services Software Limited [ID 24]
 */

export interface CompanySkillsetExpectation {
  id?: number;
  company_id: string;
  name: string;
  locations: string[];
  roles: string[];
  description: string;
  skill_thresholds: Record<Exclude<CategoryCode, "OTHER">, number>;
  skill_levels?: Record<Exclude<CategoryCode, "OTHER">, string>;
}

export interface TalentCheckCompanyDataset {
  source?: string;
  total_companies?: number;
  companies: Record<string, CompanySkillsetExpectation> & {
    google: CompanySkillsetExpectation;
    microsoft: CompanySkillsetExpectation;
    oracle: CompanySkillsetExpectation;
  };
}

export const ALL_12_SKILLSET_CODES: Array<Exclude<CategoryCode, "OTHER">> = [
  "COD",
  "DSA",
  "OOD",
  "APTI",
  "COMM",
  "AI",
  "CLOUD",
  "SQL",
  "SWE",
  "SYSD",
  "NETW",
  "OS"
];

export function parseCompanySkillsetDataset(value: unknown): TalentCheckCompanyDataset {
  if (!value || typeof value !== "object") {
    throw new Error("Benchmark service returned an invalid dataset.");
  }

  const dataset = value as Partial<TalentCheckCompanyDataset>;
  const companies = dataset.companies;
  if (!companies || typeof companies !== "object" || Array.isArray(companies)) {
    throw new Error("Benchmark dataset is missing its company records.");
  }

  const companyEntries = Object.entries(companies);
  if (companyEntries.length === 0) {
    throw new Error("Benchmark dataset contains no company records.");
  }

  if (dataset.source !== undefined && typeof dataset.source !== "string") {
    throw new Error("Benchmark dataset has an invalid source label.");
  }

  if (
    dataset.total_companies !== undefined &&
    (!Number.isInteger(dataset.total_companies) || dataset.total_companies < 0)
  ) {
    throw new Error("Benchmark dataset has an invalid company count.");
  }

  if (dataset.total_companies !== undefined && dataset.total_companies !== companyEntries.length) {
    throw new Error(
      `Benchmark dataset declares ${dataset.total_companies} companies but contains ${companyEntries.length}.`
    );
  }

  for (const requiredKey of ["google", "microsoft", "oracle"]) {
    if (!(requiredKey in companies)) {
      throw new Error(`Benchmark dataset is missing the required ${requiredKey} company record.`);
    }
  }

  for (const [key, company] of companyEntries) {
    if (!company || typeof company !== "object") {
      throw new Error(`Benchmark record '${key}' is invalid.`);
    }
    if (
      typeof company.company_id !== "string" ||
      company.company_id !== key ||
      typeof company.name !== "string" ||
      !company.name.trim() ||
      (company.id !== undefined && (!Number.isInteger(company.id) || company.id < 0)) ||
      typeof company.description !== "string" ||
      !Array.isArray(company.roles) ||
      company.roles.some((role) => typeof role !== "string") ||
      !Array.isArray(company.locations) ||
      company.locations.some((location) => typeof location !== "string")
    ) {
      throw new Error(`Benchmark record '${key}' has invalid company metadata.`);
    }

    const thresholds = company.skill_thresholds;
    if (!thresholds || typeof thresholds !== "object") {
      throw new Error(`Benchmark record '${company.name}' is missing skill thresholds.`);
    }

    for (const category of ALL_12_SKILLSET_CODES) {
      const threshold = thresholds[category];
      if (typeof threshold !== "number" || !Number.isFinite(threshold) || threshold < 1 || threshold > 10) {
        throw new Error(
          `Benchmark record '${company.name}' has an invalid ${category} threshold; expected a number from 1 to 10.`
        );
      }
    }

    if (company.skill_levels !== undefined) {
      if (!company.skill_levels || typeof company.skill_levels !== "object" || Array.isArray(company.skill_levels)) {
        throw new Error(`Benchmark record '${company.name}' has invalid source level labels.`);
      }
      for (const category of ALL_12_SKILLSET_CODES) {
        const label = company.skill_levels[category];
        if (label !== undefined && typeof label !== "string") {
          throw new Error(`Benchmark record '${company.name}' has an invalid ${category} source level label.`);
        }
      }
    }
  }

  return dataset as TalentCheckCompanyDataset;
}

export function listCompanies(dataset: TalentCheckCompanyDataset): CompanySkillsetExpectation[] {
  return Object.values(dataset.companies);
}

type SkillCategory = Exclude<CategoryCode, "OTHER">;

export interface CompetencyEvidence {
  source: "Profile skill" | "Hackathon" | "Internship" | "Certification";
  title: string;
  details: string;
  points: number;
  confidence?: "high" | "medium" | "low";
}

export interface CompetencyAssessment {
  score: number;
  evidence: CompetencyEvidence[];
}

const CATEGORY_EVIDENCE_PATTERNS: Record<SkillCategory, RegExp[]> = {
  COD: [/\b(c\+\+|c#|java|python|golang|go|rust|javascript|typescript|kotlin|swift|ruby|php)\b/i],
  DSA: [/\b(data structures?|algorithms?|leetcode|graph traversal|dynamic programming|complexity analysis)\b/i],
  OOD: [/\b(object[- ]oriented|solid|design patterns|modular design|class architecture)\b/i],
  APTI: [/\b(aptitude|quantitative|logical reasoning|probability|statistics|hypothesis testing|a\/b testing)\b/i],
  COMM: [/\b(communication|presentation|stakeholder|technical writing|documentation|tableau|streamlit)\b/i],
  AI: [/\b(machine learning|deep learning|artificial intelligence|ai\/ml|xgboost|pytorch|tensorflow|llm|nlp)\b/i],
  CLOUD: [/\b(cloud|aws|azure|gcp|docker|kubernetes|bigquery|ci\/cd|terraform)\b/i],
  SQL: [/\b(sql|postgres(?:ql)?|mysql|snowflake|database|bigquery|oracle sql)\b/i],
  SWE: [/\b(software engineering|testing|unit tests?|integration tests?|git|github actions|code review|sdlc|fastapi|react)\b/i],
  SYSD: [/\b(system design|distributed systems?|microservices|raft|paxos|kafka|redis|caching|scalability)\b/i],
  NETW: [/\b(network(?:ing)?|tcp\/ip|grpc|http|rest api|websocket|socket|load balanc(?:er|ing))\b/i],
  OS: [/\b(operating systems?|linux|kernel|concurrency|threads?|epoll|posix|linux perf)\b/i],
};

const EXPERIENCE_POINTS = 1;
const CERTIFICATION_POINTS = 0.5;

function categoriesInText(text: string): SkillCategory[] {
  return ALL_12_SKILLSET_CODES.filter((category) =>
    CATEGORY_EVIDENCE_PATTERNS[category].some((pattern) => pattern.test(text))
  );
}

function matchedTerms(text: string, category: SkillCategory): string[] {
  return Array.from(new Set(
    CATEGORY_EVIDENCE_PATTERNS[category]
      .flatMap((pattern) => text.match(pattern) ?? [])
      .map((term) => term.trim())
      .filter(Boolean)
  ));
}

/**
 * Builds transparent 1-10 estimates from profile evidence. Categories with no
 * supporting evidence stay at level 1; each contributing signal is returned
 * so the UI can show exactly what affected the estimate.
 */
export function computeCandidateCompetencyAssessments(
  profile: CandidateProfile
): Record<SkillCategory, CompetencyAssessment> {
  const assessments = {} as Record<SkillCategory, CompetencyAssessment>;
  ALL_12_SKILLSET_CODES.forEach((category) => {
    assessments[category] = { score: 1, evidence: [] };
  });

  const addEvidence = (category: SkillCategory, item: CompetencyEvidence) => {
    assessments[category].evidence.push(item);
  };

  (profile.skills || []).forEach((skill) => {
    const details = skill.evidence?.trim();
    if (!details || skill.category_code === "OTHER") return;

    const points = skill.confidence === "high" ? 3.2 : skill.confidence === "medium" ? 2 : 1;
    addEvidence(skill.category_code, {
      source: "Profile skill",
      title: skill.skill_name,
      details,
      points,
      confidence: skill.confidence,
    });
  });

  (profile.hackathons || []).forEach((hackathon) => {
    const listedSkills = (hackathon.skills_used || []).filter(Boolean);
    const skillText = listedSkills.join(", ");
    categoriesInText(skillText).forEach((category) => {
      addEvidence(category, {
        source: "Hackathon",
        title: hackathon.title,
        details: `Skills used: ${listedSkills.filter((skill) => categoriesInText(skill).includes(category)).join(", ")}`,
        points: EXPERIENCE_POINTS,
      });
    });
  });

  (profile.internships || []).forEach((internship) => {
    const listedSkills = (internship.skills_used || []).filter(Boolean);
    const skillText = listedSkills.join(", ");
    const description = internship.description?.trim() || "";
    const categories = new Set([
      ...categoriesInText(skillText),
      ...categoriesInText(description),
    ]);

    categories.forEach((category) => {
      const evidenceTerms = [
        ...listedSkills.filter((skill) => categoriesInText(skill).includes(category)),
        ...matchedTerms(description, category),
      ];
      addEvidence(category, {
        source: "Internship",
        title: `${internship.role} at ${internship.company}`,
        details: evidenceTerms.length > 0
          ? `Profile lists: ${Array.from(new Set(evidenceTerms)).join(", ")}`
          : description,
        points: EXPERIENCE_POINTS,
      });
    });
  });

  (profile.certifications || []).forEach((certification) => {
    categoriesInText(certification.name).forEach((category) => {
      addEvidence(category, {
        source: "Certification",
        title: certification.name,
        details: certification.issuer ? `Issued by ${certification.issuer}` : certification.name,
        points: CERTIFICATION_POINTS,
      });
    });
  });

  ALL_12_SKILLSET_CODES.forEach((category) => {
    const points = assessments[category].evidence.reduce((total, item) => total + item.points, 0);
    assessments[category].score = Math.min(10, Math.round(1 + points));
  });

  return assessments;
}

/** Keeps the existing score-only API available to other screens. */
export function computeCandidateCompetencyScores(
  profile: CandidateProfile
): Record<SkillCategory, number> {
  const assessments = computeCandidateCompetencyAssessments(profile);
  return ALL_12_SKILLSET_CODES.reduce((scores, category) => {
    scores[category] = assessments[category].score;
    return scores;
  }, {} as Record<SkillCategory, number>);
}

export interface SkillGapItem {
  category: Exclude<CategoryCode, "OTHER">;
  req: number;
  rawLevel?: string;
  cand: number;
  gap: number;
  name: string;
  recommendation: string;
}

export interface SkillStrengthItem {
  category: Exclude<CategoryCode, "OTHER">;
  req: number;
  rawLevel?: string;
  cand: number;
  name: string;
}

export interface CategoryComparisonRow {
  category: Exclude<CategoryCode, "OTHER">;
  name: string;
  req: number;
  rawLevel?: string;
  cand: number;
  status: "met" | "gap" | "exceeds";
  gap: number;
  recommendation: string;
  evidence: CompetencyEvidence[];
}

export interface TalentCheckEvaluationResult {
  readinessScore: number;
  strengths: SkillStrengthItem[];
  gaps: SkillGapItem[];
  comparison: CategoryComparisonRow[];
  totalRequired: number;
  totalMet: number;
  barStatus: "Meets Bar" | "Competitive" | "Gaps to Bridge";
  fitSummaryByRole: Array<{
    role: string;
    isPrimaryFit: boolean;
    fitNote: string;
  }>;
}

/**
 * Evaluates candidate scores against a company's 12-skillset thresholds
 */
export function evaluateCandidateAgainstCompany(
  candidateScores: Record<Exclude<CategoryCode, "OTHER">, number>,
  company: CompanySkillsetExpectation,
  candidateEvidence: Record<SkillCategory, CompetencyEvidence[]> = ALL_12_SKILLSET_CODES.reduce(
    (evidence, category) => {
      evidence[category] = [];
      return evidence;
    },
    {} as Record<SkillCategory, CompetencyEvidence[]>
  )
): TalentCheckEvaluationResult {
  let totalRequired = 0;
  let totalMet = 0;

  const gaps: SkillGapItem[] = [];
  const strengths: SkillStrengthItem[] = [];
  const comparison: CategoryComparisonRow[] = [];

  ALL_12_SKILLSET_CODES.forEach((cat) => {
    const req = company.skill_thresholds[cat];
    const rawLevel = company.skill_levels?.[cat];
    const cand = candidateScores[cat] || 1;
    const meta = RADIX_SKILL_CATEGORIES[cat];
    const name = meta?.name || cat;

    totalRequired += req;
    totalMet += Math.min(req, cand);

    const isGap = cand < req;
    const gapAmount = isGap ? req - cand : 0;
    const status: "met" | "gap" | "exceeds" = cand > req ? "exceeds" : cand === req ? "met" : "gap";
    const recommendation = getTargetedRecommendation(cat, cand, req, company.name);

    if (isGap) {
      gaps.push({
        category: cat,
        req,
        rawLevel,
        cand,
        gap: gapAmount,
        name,
        recommendation
      });
    } else {
      strengths.push({
        category: cat,
        req,
        rawLevel,
        cand,
        name
      });
    }

    comparison.push({
      category: cat,
      name,
      req,
      rawLevel,
      cand,
      status,
      gap: gapAmount,
      recommendation,
      evidence: candidateEvidence[cat]
    });
  });

  // Sort gaps by severity (largest gap first)
  gaps.sort((a, b) => b.gap - a.gap);

  const readinessScore = totalRequired > 0 ? Math.round((totalMet / totalRequired) * 100) : 0;

  const barStatus: "Meets Bar" | "Competitive" | "Gaps to Bridge" =
    readinessScore >= 80 ? "Meets Bar" : readinessScore >= 65 ? "Competitive" : "Gaps to Bridge";

  // Compute fit for company roles
  const roles = company.roles && company.roles.length > 0 ? company.roles : ["Software Engineer", "Backend Developer"];
  const fitSummaryByRole = roles.map((role) => {
    let roleFit = false;
    let note = "";

    const lowerRole = role.toLowerCase();
    if (lowerRole.includes("data scientist") || lowerRole.includes("data analyst")) {
      const dataScore = (candidateScores.SQL + candidateScores.AI + candidateScores.APTI) / 3;
      const targetReq = (company.skill_thresholds.SQL + company.skill_thresholds.AI + company.skill_thresholds.APTI) / 3;
      roleFit = dataScore >= targetReq - 0.5;
      note = roleFit
        ? `Strong candidate alignment in SQL (${candidateScores.SQL}/10), AI/ML (${candidateScores.AI}/10), and Quantitative Analytics (${candidateScores.APTI}/10).`
        : `Requires elevating AI/ML (currently ${candidateScores.AI}/10, bar is ${company.skill_thresholds.AI}/10) and SQL pipelines.`;
    } else if (lowerRole.includes("software engineer") || lowerRole.includes("sde") || lowerRole.includes("swe") || lowerRole.includes("developer")) {
      const sweScore = (candidateScores.COD + candidateScores.DSA + candidateScores.SWE) / 3;
      const targetReq = (company.skill_thresholds.COD + company.skill_thresholds.DSA + company.skill_thresholds.SWE) / 3;
      roleFit = sweScore >= targetReq - 0.5;
      note = roleFit
        ? `Exceeds core SWE thresholds in Coding (${candidateScores.COD}/10) and Algorithmic Problem Solving (${candidateScores.DSA}/10).`
        : `Bridge algorithmic problem solving (${candidateScores.DSA}/10) and system architecture.`;
    } else if (lowerRole.includes("support")) {
      const supportScore = (candidateScores.SQL + candidateScores.COMM + candidateScores.APTI) / 3;
      roleFit = supportScore >= 6.0;
      note = roleFit
        ? `High competence in SQL relational queries (${candidateScores.SQL}/10), incident triage (${candidateScores.APTI}/10), and technical communication (${candidateScores.COMM}/10).`
        : `Focus on database query optimization and enterprise incident communication.`;
    } else {
      roleFit = readinessScore >= 70;
      note = roleFit ? "Balanced competencies meeting typical hiring bar." : "Specific technical competencies need augmentation.";
    }

    return {
      role,
      isPrimaryFit: roleFit,
      fitNote: note
    };
  });

  return {
    readinessScore,
    strengths,
    gaps,
    comparison,
    totalRequired,
    totalMet,
    barStatus,
    fitSummaryByRole
  };
}

function getTargetedRecommendation(
  cat: Exclude<CategoryCode, "OTHER">,
  cand: number,
  req: number,
  companyName: string
): string {
  switch (cat) {
    case "DSA":
      return `Practice advanced tree algorithms, graph traversal (DFS/BFS), and dynamic programming to lift from ${cand}/10 to ${req}/10 standard.`;
    case "COD":
      return `Build production-quality implementations in C++, Go, Java, or Python demonstrating clean memory and concurrency handling.`;
    case "SYSD":
      return `Study distributed consensus protocols (Raft, Paxos), partitioned storage sharding, and caching strategies required at ${companyName}.`;
    case "OS":
      return `Deepen understanding of Linux epoll I/O multiplexing, POSIX threads, memory paging, and process scheduling.`;
    case "NETW":
      return `Build a custom binary TCP socket protocol with framed packets, checksums, and backpressure handling.`;
    case "SQL":
      return `Master advanced relational SQL: CTEs, window functions, query execution plan analysis, and index tuning.`;
    case "CLOUD":
      return `Containerize microservices with multi-stage Dockerfiles and deploy with automated CI/CD pipelines to AWS, Azure, or GCP.`;
    case "AI":
      return `Implement machine learning pipelines with Scikit-Learn or PyTorch, emphasizing hyperparameter tuning and model evaluation.`;
    case "SWE":
      return `Add unit testing suites with >85% coverage, automated linting, and GitHub Actions continuous integration.`;
    case "OOD":
      return `Refactor application architectures strictly following SOLID principles, factory, and observer design patterns.`;
    case "COMM":
      return `Draft architectural decision records (ADRs) and technical walkthroughs demonstrating structured engineering communication.`;
    case "APTI":
      return `Practice competitive quantitative reasoning, probability distributions, and algorithmic complexity estimation.`;
    default:
      return `Review technical documentation and build a reference project demonstrating ${cat} competency.`;
  }
}
