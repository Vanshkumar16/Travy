/**
 * Skill Matching client. The backend (server/skill_match.py) matches on the
 * shared JD taxonomy; `localMatch` is a smaller offline fallback with the same
 * output shape and the same rules for what counts as a match.
 */
import { CandidateProfile, CategoryCode, Skill, SkillEvidenceSource } from "../types/contract";

export type MatchType = "direct" | "evidence" | "implied" | "alternative" | "category";

export interface MatchedSkillView {
  reqSkill: string;
  category: CategoryCode;
  candSkillName: string;
  evidence: string;
  confidence: string;
  matchType: MatchType;
  matchNote?: string;
  credit: number;
  source?: SkillEvidenceSource;
}

export interface MissingSkillView {
  reqSkill: string;
  category: CategoryCode;
  reason: string;
  related?: string | null;
}

export interface MatchView {
  matchScore: number;
  matchedSkills: MatchedSkillView[];
  missingSkills: MissingSkillView[];
  engine: "taxonomy" | "offline";
}

type ReqSkill = Pick<Skill, "skill_name" | "category_code" | "evidence" | "confidence" | "source">;

const API_BASE = "http://127.0.0.1:8000/api";
const SOURCE_LABEL: Record<SkillEvidenceSource, string> = {
  hackathon: "Hackathon / competition",
  internship: "Work experience",
  certification: "Certification",
  achievement: "Achievement",
};

function categoryForEvidence(skillName: string, profile: CandidateProfile): CategoryCode {
  const existing = profile.skills.find(
    (skill) => skill.skill_name.toLowerCase() === skillName.toLowerCase()
  );
  if (existing) return existing.category_code;
  if (/\b(python|java|c\+\+|javascript|typescript|golang|rust|kotlin|swift)\b/i.test(skillName)) return "COD";
  if (/\b(react|node\.?js|fastapi|django|rest api|testing|git)\b/i.test(skillName)) return "SWE";
  if (/\b(sql|postgres|mysql|database|snowflake|oracle)\b/i.test(skillName)) return "SQL";
  if (/\b(machine learning|deep learning|pytorch|tensorflow|llm|nlp)\b/i.test(skillName)) return "AI";
  if (/\b(aws|azure|gcp|docker|kubernetes|terraform|devops|ci\/cd)\b/i.test(skillName)) return "CLOUD";
  if (/\b(algorithm|data structure|leetcode|codeforces)\b/i.test(skillName)) return "DSA";
  if (/\b(system design|distributed|microservice|kafka|redis)\b/i.test(skillName)) return "SYSD";
  if (/\b(linux|kernel|concurrency|operating system)\b/i.test(skillName)) return "OS";
  if (/\b(tcp|network|http|grpc|websocket)\b/i.test(skillName)) return "NETW";
  return "OTHER";
}

/** Adds profile-section evidence as supporting signals without changing the saved skill list. */
export function buildCandidateMatchSkills(profile: CandidateProfile): Skill[] {
  const evidenceSkills: Skill[] = [];
  const addRecord = (
    source: SkillEvidenceSource,
    title: string,
    details: string,
    listedSkills: string[] = [],
  ) => {
    const evidence = `${SOURCE_LABEL[source]}: ${title}. ${details}`.trim();
    const names = listedSkills.filter(Boolean);
    if (names.length === 0) names.push(title);
    names.forEach((skillName) => {
      evidenceSkills.push({
        skill_name: skillName,
        category_code: categoryForEvidence(skillName, profile),
        evidence,
        confidence: "medium",
        source,
      });
    });
  };

  (profile.internships || []).forEach((item) =>
    addRecord("internship", `${item.role} at ${item.company}`, item.description, item.skills_used)
  );
  (profile.hackathons || []).forEach((item) =>
    addRecord(
      "hackathon",
      `${item.title}: ${item.role_or_project}`,
      `${item.achievement} (${item.year})`,
      item.skills_used,
    )
  );
  (profile.certifications || []).forEach((item) =>
    addRecord(
      "certification",
      item.name,
      `${item.issuer} ${item.issue_date} ${item.credential_id_or_url || ""}`,
    )
  );
  (profile.achievements || []).forEach((item) =>
    addRecord("achievement", item.title, `${item.description} ${item.date}`)
  );

  return [...profile.skills, ...evidenceSkills];
}

export async function matchSkillsRemote(candidate: Skill[], jd: ReqSkill[]): Promise<MatchView> {
  const strip = (s: ReqSkill) => ({
    skill_name: s.skill_name,
    category_code: s.category_code,
    evidence: s.evidence || s.skill_name,
    confidence: s.confidence,
    source: s.source,
  });
  const res = await fetch(`${API_BASE}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_skills: candidate.map(strip), jd_skills: jd.map(strip) }),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`match failed: ${res.status}`);
  const data = await res.json();
  return {
    matchScore: data.match_score,
    matchedSkills: data.matched_skills.map((m: any) => ({
      reqSkill: m.req_skill,
      category: m.category,
      candSkillName: m.cand_skill,
      evidence: m.evidence,
      confidence: m.confidence,
      matchType: m.match_type,
      matchNote: m.note,
      credit: m.credit,
      source: m.source,
    })),
    missingSkills: data.missing_skills.map((m: any) => ({
      reqSkill: m.req_skill,
      category: m.category,
      reason: m.reason,
      related: m.related,
    })),
    engine: "taxonomy",
  };
}

// ---- Offline fallback ------------------------------------------------------

const CREDIT: Record<Exclude<MatchType, "alternative">, number> = { direct: 1, evidence: 0.9, implied: 0.75, category: 0.5 };
const REQ_WEIGHT: Record<string, number> = { high: 1, medium: 0.7, low: 0.4 };
const BROAD = new Set<CategoryCode>(["DSA", "OOD", "APTI", "COMM", "SYSD"]);

// Words too generic to identify a skill on their own ("Data Structures" and
// "Data Visualization" must not match on "data").
const GENERIC = new Set([
  "and", "or", "the", "of", "for", "with", "in", "to", "a", "an", "skills", "skill", "basic", "advanced", "core",
  "strong", "data", "systems", "system", "engineering", "design", "development", "programming", "management",
  "analysis", "technical", "applied", "modern", "understanding", "knowledge", "experience", "fundamentals",
]);

/** Framework → foundations it implies. Mirrors `implies` in server/jd/taxonomy.py. */
const IMPLIES: Array<{ parent: RegExp; label: string; implies: RegExp }> = [
  { parent: /\b(react|next\.?js|vue|angular|svelte|tailwind)\b/i, label: "frontend framework", implies: /\b(html|css|javascript|dom)\b/i },
  { parent: /\b(django|flask|fastapi|pandas|numpy|pytorch|scikit)\b/i, label: "Python framework", implies: /^python\b/i },
  { parent: /\bspring\b/i, label: "Spring", implies: /^(core )?java\b(?!script)/i },
  { parent: /\b(docker|kubernetes|k8s)\b/i, label: "containers", implies: /\blinux\b/i },
  { parent: /\b(postgres|mysql|oracle db|sql server)/i, label: "relational DB", implies: /^sql\b/i },
];

const tokens = (name: string) =>
  new Set((name.toLowerCase().match(/[a-z0-9+#.]+/g) || []).map((t) => t.replace(/\.$/, "")).filter((t) => !GENERIC.has(t)));

export function localMatch(candidate: Skill[], jd: ReqSkill[]): MatchView {
  const results = jd.map((req) => {
    const reqTokens = tokens(req.skill_name);
    let hit: MatchedSkillView | null = null;

    const direct = candidate.find((c) => {
      const ct = tokens(c.skill_name);
      return [...reqTokens].some((t) => ct.has(t));
    });
    if (direct) {
      const source = direct.source;
      hit = {
        reqSkill: req.skill_name,
        category: req.category_code,
        candSkillName: direct.skill_name,
        evidence: direct.evidence,
        confidence: direct.confidence,
        matchType: source ? "evidence" : "direct",
        matchNote: source ? `Verified in ${SOURCE_LABEL[source]}` : "Direct match",
        credit: source ? CREDIT.evidence : CREDIT.direct,
        source,
      };
    }

    if (!hit) {
      const evidenceMatch = candidate.find((item) => {
        if (!item.evidence) return false;
        const evidenceTokens = tokens(item.evidence);
        return reqTokens.size > 0 && [...reqTokens].every((token) => evidenceTokens.has(token));
      });
      if (evidenceMatch) {
        const source = evidenceMatch.source;
        hit = {
          reqSkill: req.skill_name,
          category: req.category_code,
          candSkillName: evidenceMatch.skill_name,
          evidence: evidenceMatch.evidence,
          confidence: "medium",
          matchType: "evidence",
          matchNote: source ? `Found in ${SOURCE_LABEL[source]}` : "Found in profile evidence",
          credit: CREDIT.evidence,
          source,
        };
      }
    }

    if (!hit) {
      for (const rule of IMPLIES) {
        const parent = candidate.find((c) => rule.parent.test(c.skill_name));
        if (parent && rule.implies.test(req.skill_name)) {
          hit = {
            reqSkill: req.skill_name,
            category: req.category_code,
            candSkillName: parent.skill_name,
            evidence: `${parent.skill_name} implies ${req.skill_name}: ${parent.evidence}`,
            confidence: "medium",
            matchType: "implied",
            matchNote: `Inferred via ${parent.skill_name}`,
            credit: CREDIT.implied,
          };
          break;
        }
      }
    }

    if (!hit && BROAD.has(req.category_code)) {
      const related = candidate.find((c) => c.category_code === req.category_code);
      if (related) {
        hit = {
          reqSkill: req.skill_name,
          category: req.category_code,
          candSkillName: related.skill_name,
          evidence: related.evidence,
          confidence: "low",
          matchType: "category",
          matchNote: `Related ${req.category_code} skill, partial credit`,
          credit: CREDIT.category,
        };
      }
    }

    return { req, hit };
  });

  const alternativeGroups = new Map<string, number[]>();
  results.forEach(({ req }, index) => {
    if (!/\bor\b|\bone of\b|\bany of\b|\beither\b/i.test(req.evidence || "")) return;
    const key = `${req.category_code}:${req.evidence}`;
    alternativeGroups.set(key, [...(alternativeGroups.get(key) || []), index]);
  });

  const matched: MatchedSkillView[] = [];
  const missing: MissingSkillView[] = [];
  let total = 0;
  let got = 0;

  results.forEach(({ req, hit }, index) => {
    const weight = REQ_WEIGHT[req.confidence] ?? 0.7;
    if (!hit || hit.matchType === "category") {
      const group = alternativeGroups.get(`${req.category_code}:${req.evidence}`) || [];
      const winner = group
        .filter((otherIndex) => otherIndex !== index)
        .map((otherIndex) => results[otherIndex].hit)
        .find((candidateHit) => candidateHit && candidateHit.matchType !== "category");
      if (winner && group.length > 1) {
        matched.push({
          ...winner,
          reqSkill: req.skill_name,
          category: req.category_code,
          matchType: "alternative",
          matchNote: `JD accepts alternatives; you have ${winner.reqSkill}`,
          credit: 0,
        });
        return;
      }
    }

    total += weight;
    if (hit) {
      matched.push(hit);
      got += weight * hit.credit;
      return;
    }

    missing.push({
      reqSkill: req.skill_name,
      category: req.category_code,
      reason: req.evidence,
      related: candidate.find((item) => item.category_code === req.category_code && !item.source)?.skill_name ?? null,
    });
  });

  return { matchScore: total ? Math.round((100 * got) / total) : 0, matchedSkills: matched, missingSkills: missing, engine: "offline" };
}
