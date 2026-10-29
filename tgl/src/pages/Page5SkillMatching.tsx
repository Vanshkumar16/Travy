import React, { useState, useMemo, useEffect } from "react";
import { useProfile } from "../context/ProfileContext";
import { SAMPLE_JOB_DESCRIPTIONS } from "../data/sampleJobDescriptions";
import { CategoryBadge } from "../components/CategoryBadge";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Download,
  BookOpen,
  ExternalLink
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  buildCandidateMatchSkills,
  localMatch,
  matchSkillsRemote,
  MatchView,
} from "../lib/skillMatch";

interface Page5SkillMatchingProps {
  onBack: () => void;
  onRestart: () => void;
  onOpenContractModal: () => void;
  onNavigateToJdExtractor?: () => void;
}

export const Page5SkillMatching: React.FC<Page5SkillMatchingProps> = ({
  onBack,
  onRestart,
  onOpenContractModal,
  onNavigateToJdExtractor,
}) => {
  const { profile, downloadProfileJSON, activeJdResult } = useProfile();
  const [selectedJdSource, setSelectedJdSource] = useState<"extracted" | "preset">(
    activeJdResult ? "extracted" : "preset"
  );
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("google-swe");

  // Determine current active JD requirements
  const targetJob = useMemo(() => {
    if (selectedJdSource === "extracted" && activeJdResult) {
      return {
        id: "extracted-active",
        company: activeJdResult.company,
        role: activeJdResult.title,
        location: activeJdResult.location,
        work_mode: activeJdResult.workMode,
        overview: activeJdResult.overview,
        skills_required: activeJdResult.allSkills.map((s) => ({
          skill_name: s.skill_name,
          category_code: s.category_code,
          evidence: s.evidence,
          confidence: s.confidence,
          is_implied: s.isImplied,
          implied_by: s.impliedBy,
        })),
        isExtracted: true,
      };
    }

    const preset = SAMPLE_JOB_DESCRIPTIONS[selectedPresetKey] || SAMPLE_JOB_DESCRIPTIONS["google-swe"];
    return {
      id: preset.id,
      company: preset.company,
      role: preset.role,
      location: preset.location,
      work_mode: preset.work_mode,
      overview: preset.overview,
      skills_required: preset.skills_required.map((s) => ({
        ...s,
        is_implied: false,
        implied_by: undefined,
      })),
      isExtracted: false,
    };
  }, [selectedJdSource, activeJdResult, selectedPresetKey]);

  const candidateMatchSkills = useMemo(
    () => buildCandidateMatchSkills(profile),
    [profile],
  );

  // Match profile skills and documented experience evidence on the shared taxonomy.
  const localResult = useMemo(
    () => localMatch(candidateMatchSkills, targetJob.skills_required),
    [candidateMatchSkills, targetJob]
  );
  const [remoteResult, setRemoteResult] = useState<MatchView | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRemoteResult(null);
    matchSkillsRemote(candidateMatchSkills, targetJob.skills_required)
      .then((result) => !cancelled && setRemoteResult(result))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [candidateMatchSkills, targetJob]);

  const { matchScore, matchedSkills, missingSkills: rawMissing } = remoteResult ?? localResult;
  const missingSkills = rawMissing.map((gap) => ({
    ...gap,
    recommendation:
      getRecommendation(gap.reqSkill, gap.category) +
      (gap.related ? ` You already have ${gap.related} in ${gap.category}; build on it.` : ""),
  }));

  function getRecommendation(skillName: string, category: string): string {
    switch (category) {
      case "DSA":
        return "Practice trees, graphs, and dynamic programming patterns on LeetCode.";
      case "COD":
        return `Build a small production-grade service in ${skillName} with unit tests and Docker.`;
      case "AI":
        return "Complete a hands-on project with Scikit-Learn or PyTorch, deploy model on cloud.";
      case "CLOUD":
        return "Containerize an application with Docker, set up CI/CD pipeline on GitHub Actions.";
      case "SQL":
        return "Practice complex SQL joins, window functions, and indexing on PostgreSQL.";
      case "SYSD":
        return "Study distributed caching, Raft consensus, and microservice communication.";
      case "OS":
        return "Explore Linux process scheduling, thread pools, and asynchronous epoll I/O.";
      default:
        return `Review documentation and build a sample demo showcasing ${skillName}.`;
    }
  }

  const handleCelebrate = () => {
    if (matchScore >= 70) {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }
    toast.info(`Match Score: ${matchScore}% for ${targetJob.company} - ${targetJob.role}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Target Job Match
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Matches your profile skills and relevant evidence from work experience, competitions, certifications, and achievements against this role.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <button
            onClick={onOpenContractModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Target Job Source Selection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Target Role
            </h3>
            <p className="text-xs text-slate-500">
              Match against the analyzed job description or choose a benchmark role
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            {activeJdResult && (
              <button
                onClick={() => setSelectedJdSource("extracted")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedJdSource === "extracted"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Analyzed Role ({activeJdResult.company})
              </button>
            )}
            <button
              onClick={() => setSelectedJdSource("preset")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedJdSource === "preset"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Preset Roles ({Object.keys(SAMPLE_JOB_DESCRIPTIONS).length})
            </button>
          </div>
        </div>

        {selectedJdSource === "preset" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Object.keys(SAMPLE_JOB_DESCRIPTIONS).map((key) => {
              const item = SAMPLE_JOB_DESCRIPTIONS[key];
              const isSelected = selectedPresetKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPresetKey(key)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{item.company}</span>
                      <span className="text-[10px] text-slate-500">{item.work_mode}</span>
                    </div>
                    <p className="text-slate-700 font-semibold line-clamp-1">{item.role}</p>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{item.skills_required.length} required skills</span>
                    {isSelected && <span className="text-blue-600 font-bold">Selected ✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-200/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-slate-900">{targetJob.company}</span>
                <span className="text-xs text-blue-700 font-semibold px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200">
                  {targetJob.role}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl">
                {targetJob.overview}
              </p>
            </div>
            {onNavigateToJdExtractor && (
              <button
                onClick={onNavigateToJdExtractor}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
              >
                <span>Change JD</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Match Score Hero Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Role Match Score
            </span>
            <div className="flex items-center gap-4">
              <span
                className={`font-heading text-5xl sm:text-6xl font-black ${
                  matchScore >= 80
                    ? "text-emerald-600"
                    : matchScore >= 60
                    ? "text-blue-600"
                    : "text-amber-600"
                }`}
              >
                {matchScore}%
              </span>
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                  {matchScore >= 80
                    ? "Strong Role Alignment"
                    : matchScore >= 60
                    ? "Solid Foundation with Minor Gaps"
                    : "Notable Gaps to Bridge"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Matches {matchedSkills.length} of {targetJob.skills_required.length} required competencies for {targetJob.role}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <button
              onClick={handleCelebrate}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Celebrate Fit</span>
            </button>
            <button
              onClick={downloadProfileJSON}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Download Profile</span>
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[11px] leading-relaxed text-slate-600">
          <strong className="text-slate-800">How this score works:</strong>{" "}
          high-, medium-, and low-confidence JD requirements are weighted 1.0, 0.7, and 0.4.
          Each is then credited by match quality: direct profile skill 100%, documented profile or experience evidence 90%,
          inferred skill 75%, and related-category match 50%. Unmatched alternatives in an accepted JD alternative group
          do not add extra weight. The “matched of total” count and weighted percentage are different measures.
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                matchScore >= 80
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : matchScore >= 60
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Matched vs Missing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Matched Skills */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Matched Skills ({matchedSkills.length})
              </h3>
            </div>
          </div>

          {matchedSkills.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No overlapping skills found yet.</p>
          ) : (
            <div className="space-y-3">
              {matchedSkills.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">{m.reqSkill}</span>
                    <CategoryBadge code={m.category} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {m.matchType === "implied" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200/60">
                        <Sparkles className="h-3 w-3" />
                        <span>{m.matchNote}</span>
                      </span>
                    ) : m.matchType === "direct" ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Direct match
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {m.matchNote}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-slate-500">
                      {Math.round(m.credit * 100)}% credit
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {m.confidence} confidence
                    </span>
                  </div>

                  <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 leading-snug">
                    "{m.evidence}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing Skills / Prioritized Gaps */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Skill Gaps ({missingSkills.length})
              </h3>
            </div>
          </div>

          {missingSkills.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-900">Zero Critical Skill Gaps!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Candidate satisfies all required competencies for this role.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {missingSkills.map((gap, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">{gap.reqSkill}</span>
                    <CategoryBadge code={gap.category} size="sm" />
                  </div>

                  <p className="text-slate-600 text-[11px] mb-2 leading-snug">
                    <strong className="text-slate-800">Required:</strong> {gap.reason}
                  </p>

                  <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-2.5 text-[11px] text-amber-900 flex items-start gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Recommendation: </span>
                      <span>{gap.recommendation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 active:scale-95 transition-all"
        >
          <span>Start Over</span>
        </button>
      </div>
    </div>
  );
};
