import { CategoryCode } from "../types/contract";
import {
  JdAnalysis,
  JdEngine,
  JdEngineStatus,
  JdSample,
  JdSkillListContract,
} from "../types/jd";
import { ExtractedJdResult, InferredSkillItem } from "./skillInferenceEngine";
import { API_BASE } from "./apiBase";

const JD_API_BASE = `${API_BASE}/jd`;

async function request<T>(path: string, init?: RequestInit, timeoutMs = 90000): Promise<T> {
  const res = await fetch(`${JD_API_BASE}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export const fetchJdEngine = () => request<JdEngineStatus>("/engine", undefined, 2000);

export const fetchJdSamples = () =>
  request<{ samples: JdSample[] }>("/samples", undefined, 3000).then((r) => r.samples);

export const analyzeJdSample = (sampleId: string, engine: JdEngine) =>
  request<JdAnalysis>(`/samples/${encodeURIComponent(sampleId)}/analyze?engine=${engine}`, { method: "POST" });

export function analyzeJdFile(file: File, engine: JdEngine): Promise<JdAnalysis> {
  const form = new FormData();
  form.append("file", file);
  form.append("engine", engine);
  return request<JdAnalysis>("/analyze", { method: "POST", body: form });
}

export const analyzeJdText = (text: string, engine: JdEngine, company?: string, role?: string) =>
  request<JdAnalysis>("/analyze-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, engine, company: company || null, role: role || null }),
  });

/** Strict shared-format skill list (brief p. 10) — what Skill Matching consumes. */
export function toContract(analysis: JdAnalysis): JdSkillListContract {
  return {
    source_type: "jd",
    source_file: analysis.source_file,
    company: analysis.company,
    role: analysis.role,
    skills: analysis.skills.map((s) => ({
      skill_name: s.skill_name,
      category_code: s.category_code,
      evidence: s.evidence,
      confidence: s.confidence,
    })),
  };
}

/**
 * Adapt a backend analysis to the ExtractedJdResult shape the rest of the app
 * (Skill Matching, ProfileContext) already consumes.
 */
export function toExtractedJdResult(analysis: JdAnalysis): ExtractedJdResult {
  const items: InferredSkillItem[] = analysis.skills.map((s, i) => ({
    id: `${analysis.id}_${i}`,
    skill_name: s.skill_name,
    category_code: s.category_code,
    evidence: s.evidence,
    confidence: s.confidence,
    isImplied: Boolean(s.implied_by),
    impliedBy: s.implied_by || undefined,
  }));

  const coverage = Object.fromEntries(
    ["COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"].map((c) => [c, 0])
  ) as Record<CategoryCode, number>;
  items.forEach((s) => (coverage[s.category_code] += 1));

  const graph = new Map<string, Array<{ name: string; category: CategoryCode; reason: string }>>();
  analysis.skills
    .filter((s) => s.implied_by)
    .forEach((s) => {
      const list = graph.get(s.implied_by!) || [];
      list.push({ name: s.skill_name, category: s.category_code, reason: s.evidence });
      graph.set(s.implied_by!, list);
    });

  const sectionLines = (name: string) =>
    analysis.sections
      .filter((sec) => sec.name === name)
      .flatMap((sec) => sec.text.split("\n").slice(1))
      .map((l) => l.replace(/^•\s*/, "").trim())
      .filter(Boolean);

  return {
    title: analysis.role,
    role: analysis.role,
    company: analysis.company,
    location: analysis.metadata.location || "",
    workMode: analysis.metadata.work_mode || "",
    minExperience: analysis.metadata.experience || "",
    overview: analysis.sections.find((s) => s.name === "overview" && s.heading !== "Header")?.text.split("\n").slice(1).join(" ") || "",
    keyResponsibilities: sectionLines("responsibilities"),
    qualifications: sectionLines("requirements"),
    explicitSkills: items.filter((s) => !s.isImplied),
    impliedSkills: items.filter((s) => s.isImplied),
    allSkills: items,
    skillDependencyGraph: Array.from(graph, ([parent, implied]) => ({ parent, implied })),
    categoryCoverage: coverage,
    rawJsonExport: toContract(analysis),
    analysis,
  };
}
