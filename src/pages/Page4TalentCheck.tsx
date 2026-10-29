import React, { useState, useMemo, useEffect } from "react";
import { useProfile } from "../context/ProfileContext";
import { CategoryBadge } from "../components/CategoryBadge";
import {
  ALL_12_SKILLSET_CODES,
  listCompanies,
  computeCandidateCompetencyAssessments,
  evaluateCandidateAgainstCompany,
  CompanySkillsetExpectation,
  CompetencyEvidence,
  TalentCheckEvaluationResult,
  TalentCheckCompanyDataset
} from "../data/talentCheckCompanySkillsets";
import { fetchCompanySkillsets } from "../lib/api";
import type { CategoryCode } from "../types/contract";
import {
  Building2,
  Target,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BarChart2,
  RefreshCw,
  MapPin,
  Briefcase,
  Sparkles,
  Search,
  Download
} from "lucide-react";
import confetti from "canvas-confetti";

interface Page4TalentCheckProps {
  onNext: () => void;
  onBack: () => void;
}

export const Page4TalentCheck: React.FC<Page4TalentCheckProps> = ({ onNext, onBack }) => {
  const { profile } = useProfile();
  const [selectedCompanyKey, setSelectedCompanyKey] = useState<string>("google");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [companyDataset, setCompanyDataset] = useState<TalentCheckCompanyDataset | null>(null);
  const [datasetLoading, setDatasetLoading] = useState(true);
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [datasetRetry, setDatasetRetry] = useState(0);
  const [evaluation, setEvaluation] = useState<TalentCheckEvaluationResult | null>(null);

  useEffect(() => {
    let active = true;
    setDatasetLoading(true);
    setDatasetError(null);
    fetchCompanySkillsets()
      .then((dataset) => {
        if (active) setCompanyDataset(dataset);
      })
      .catch((error: unknown) => {
        if (active) {
          setCompanyDataset(null);
          setDatasetError(error instanceof Error ? error.message : "Could not load company benchmarks.");
        }
      })
      .finally(() => {
        if (active) setDatasetLoading(false);
      });

    return () => {
      active = false;
    };
  }, [datasetRetry]);

  const companies = companyDataset?.companies;
  const companyList = useMemo(
    () => companyDataset ? listCompanies(companyDataset) : [],
    [companyDataset]
  );
  const currentCompany: CompanySkillsetExpectation | undefined = companies?.[selectedCompanyKey];

  const candidateAssessments = useMemo(
    () => computeCandidateCompetencyAssessments(profile),
    [profile]
  );
  const candidateScores = useMemo(() => ALL_12_SKILLSET_CODES.reduce((scores, category) => {
    scores[category] = candidateAssessments[category].score;
    return scores;
  }, {} as Record<Exclude<CategoryCode, "OTHER">, number>), [candidateAssessments]);
  const candidateEvidence = useMemo(() => ALL_12_SKILLSET_CODES.reduce((evidence, category) => {
    evidence[category] = candidateAssessments[category].evidence;
    return evidence;
  }, {} as Record<Exclude<CategoryCode, "OTHER">, CompetencyEvidence[]>), [candidateAssessments]);

  const evidenceSummary = useMemo(() => {
    const records = new Set<string>();
    let categories = 0;
    ALL_12_SKILLSET_CODES.forEach((category) => {
      const evidence = candidateAssessments[category].evidence;
      if (evidence.length > 0) categories += 1;
      evidence.forEach((item) => records.add(`${item.source}:${item.title}`));
    });
    return { records: records.size, categories };
  }, [candidateAssessments]);
  const profileHasEnoughEvidence = evidenceSummary.records >= 3 && evidenceSummary.categories >= 2;

  const filteredCompanyList = useMemo(() => {
    if (!searchFilter.trim()) return companyList;
    const q = searchFilter.toLowerCase();
    return companyList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company_id.toLowerCase().includes(q) ||
        (c.id && c.id.toString().includes(q))
    );
  }, [companyList, searchFilter]);

  const selectCompany = (companyKey: string) => {
    setSelectedCompanyKey(companyKey);
    setExpandedCategory(null);
    setEvaluation(null);
  };

  useEffect(() => {
    setEvaluation(null);
  }, [profile]);

  const handleRunCheck = () => {
    if (!currentCompany || !profileHasEnoughEvidence) return;
    const result = evaluateCandidateAgainstCompany(candidateScores, currentCompany, candidateEvidence);
    setEvaluation(result);
    setExpandedCategory(null);
    if (result.readinessScore >= 80) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.65 } });
    }
  };

  const downloadReport = () => {
    if (!evaluation || !currentCompany) return;
    const report = {
      generated_at: new Date().toISOString(),
      candidate: profile.name || "Unnamed candidate",
      company: currentCompany.name,
      readiness_score: evaluation.readinessScore,
      readiness_status: evaluation.barStatus,
      score_formula: "sum(min(candidate category score, company category threshold)) / sum(company category thresholds) * 100",
      evidence_summary: evidenceSummary,
      strengths: evaluation.strengths,
      priority_gaps: evaluation.gaps,
      role_fit: evaluation.fitSummaryByRole,
      category_comparison: evaluation.comparison,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `talent-check-${(profile.name || "candidate").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (datasetLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center" role="status" aria-live="polite">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600" />
        <p className="mt-3 text-sm font-semibold text-slate-700">Loading verified company benchmarks…</p>
      </div>
    );
  }

  if (datasetError || !currentCompany) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-xs" role="alert">
          <AlertCircle className="mx-auto h-7 w-7 text-rose-600" />
          <h1 className="mt-3 font-heading text-xl font-bold text-slate-900">Company benchmarks unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">
            {datasetError || "The selected company is not present in the validated benchmark dataset."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setDatasetRetry((attempt) => attempt + 1)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
              <Sparkles className="h-3 w-3" />
              <span>12-Skillset Benchmark Engine</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Backend benchmark dataset ({companyList.length} companies)
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Company Benchmarks & Talent Check
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Evaluate candidate proficiency levels (1–10) across all 12 competency skillsets against verified company hiring expectations.
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
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Target Company Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Hackathon Scope Targets:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {companyList.length} Company Records Available
              </span>
            </div>
            <fieldset>
              <legend className="sr-only">Select a featured benchmark company</legend>
              <div className="flex flex-wrap gap-2">
                {(["google", "microsoft", "oracle"] as const).map((key) => {
                  const company = companies?.[key];
                  if (!company) return null;
                  const isSelected = selectedCompanyKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        selectCompany(key);
                        setSearchFilter("");
                      }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{company.name}</span>
                      {company.id !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? "bg-slate-800 text-slate-300" : "bg-slate-200/70 text-slate-500"}`}>
                          #{company.id}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* Searchable dropdown across all companies from dataset */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  id="company-filter"
                  aria-label="Filter companies by name or record ID"
                  type="text"
                  placeholder={`Filter ${companyList.length} companies (e.g. Apple, Amazon, Swiggy)...`}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <select
                id="company-select"
                aria-label="Select benchmark company"
                value={selectedCompanyKey}
                onChange={(e) => {
                  selectCompany(e.target.value);
                  setSearchFilter("");
                }}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs max-w-xs"
              >
                {(filteredCompanyList.some((company) => company.company_id === selectedCompanyKey)
                  ? filteredCompanyList
                  : [currentCompany, ...filteredCompanyList]
                ).map((c) => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.id ? `[#${c.id}] ` : ""}{c.name}
                  </option>
                ))}
              </select>
              {searchFilter && filteredCompanyList.length === 0 && (
                <span className="text-[11px] text-slate-500" role="status">No companies match this filter.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunCheck}
              disabled={!profileHasEnoughEvidence}
              title={!profileHasEnoughEvidence ? "Add evidence from at least 3 profile records across 2 skill categories." : undefined}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{evaluation ? "Re-run Benchmark" : "Run Benchmark"}</span>
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600" aria-live="polite">
            Profile evidence: {evidenceSummary.records} records across {evidenceSummary.categories} categories.
            {!profileHasEnoughEvidence && (
              <span className="ml-1 font-semibold text-amber-800">
                Add evidence covering at least 3 profile records and 2 categories before running a benchmark.
              </span>
            )}
            {!profileHasEnoughEvidence && (
              <button
                type="button"
                onClick={onBack}
                className="ml-2 font-semibold text-blue-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                Return to Profile Builder
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mb-5 text-[11px] leading-relaxed text-slate-500">
        Company thresholds are validated numeric levels from 1 to 10 for all 12 categories.
        Any source level label shown beside a threshold is informational; the numeric threshold is
        what the comparison uses. Benchmark values are loaded from the backend and are not replaced
        with a frontend copy if the service is unavailable.
      </p>

      {evaluation ? (
      <>
      {/* Score and Gap Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {/* Company Overview Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>Target Standard</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {currentCompany.id ? `RECORD #${currentCompany.id}` : "12 SKILLSETS"}
              </span>
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900">{currentCompany.name}</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{currentCompany.description}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Roles in Scope:
              </span>
              <div className="flex flex-wrap gap-1">
                {(currentCompany.roles || ["Software Engineer"]).map((r) => (
                  <span key={r} className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium border border-blue-100">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {currentCompany.locations && currentCompany.locations.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{currentCompany.locations.join(" • ")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Readiness Meter Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-purple-600" />
                <span>Readiness Score</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {evaluation.totalMet} / {evaluation.totalRequired} pts
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-heading text-4xl sm:text-5xl font-black text-slate-900">
                {evaluation.readinessScore}%
              </span>
              <span
                className={`text-xs font-bold ${
                  evaluation.readinessScore >= 80
                    ? "text-emerald-600"
                    : evaluation.readinessScore >= 65
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {evaluation.barStatus}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  evaluation.readinessScore >= 80
                    ? "bg-emerald-500"
                    : evaluation.readinessScore >= 65
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${evaluation.readinessScore}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Meets or exceeds bar in <strong className="text-emerald-700 font-bold">{evaluation.strengths.length} of 12</strong> competency areas.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Top strengths</span>
          </div>
          <div className="space-y-3">
            {[...evaluation.strengths]
              .sort((a, b) => (b.cand - b.req) - (a.cand - a.req))
              .slice(0, 3)
              .map((strength) => {
                const evidence = candidateAssessments[strength.category].evidence[0];
                return (
                  <div key={strength.category} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{strength.name}</span>
                      <span className="shrink-0 font-mono text-emerald-700">
                        {strength.cand}/10 · bar {strength.req}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {evidence ? `${evidence.source}: ${evidence.title}` : "No supporting evidence"}
                    </p>
                  </div>
                );
              })}
            {evaluation.strengths.length === 0 && (
              <p className="text-xs text-slate-500">No categories currently meet the selected company bar.</p>
            )}
          </div>
        </div>

        {/* Gaps List Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Identified Skill Gaps</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-rose-600">
                {evaluation.gaps.length} areas
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
              {evaluation.gaps.map((g) => (
                <div
                  key={g.category}
                  className="flex flex-col gap-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <CategoryBadge code={g.category} size="sm" />
                      <span className="font-medium text-slate-700 truncate">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                      {g.rawLevel && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {g.rawLevel}
                        </span>
                      )}
                      <span className="font-bold text-rose-600">
                        L{g.cand} (Bar: {g.req})
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 w-full text-[11px] leading-relaxed text-slate-500">
                    {g.recommendation}
                  </p>
                </div>
              ))}

              {evaluation.gaps.length === 0 && (
                <div className="p-3 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl font-medium">
                  Candidate meets or exceeds all 12 competency thresholds!
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            {evaluation.gaps.length > 0
              ? `Largest gap: ${evaluation.gaps[0].name} (-${evaluation.gaps[0].gap} pts)`
              : "Technical bar satisfied for all in-scope positions"}
          </p>
        </div>
      </div>

      {/* Role-Specific Fit Analysis Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs mb-6">
        <h3 className="font-heading text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-blue-600" />
          <span>Role-Specific Fit Analysis for {currentCompany.name}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evaluation.fitSummaryByRole.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                item.isPrimaryFit
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200 bg-slate-50/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900">{item.role}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isPrimaryFit
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.isPrimaryFit ? "High Fit Alignment" : "Bridge Gaps"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {item.fitNote}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Full 12-Skillset Benchmark Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h3 className="font-heading text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-blue-600" />
            <span>Full 12-Skillset Competency Breakdown</span>
          </h3>
          <button
            type="button"
            onClick={downloadReport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download report
          </button>
        </div>

        <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-900">
          Candidate estimates start at 1/10. Each documented skill contributes 3.2 points for high,
          2 for medium, or 1 for low confidence; relevant hackathons and internships contribute 1
          point each, and relevant certifications 0.5. Scores are rounded and capped at 10.
          Readiness is the sum of each category's score capped at its company threshold, divided by
          the sum of all 12 thresholds, then multiplied by 100. This is a profile-based estimate,
          not a measured assessment result.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evaluation.comparison.map((row) => {
            const isGap = row.status === "gap";
            const isExpanded = expandedCategory === row.category;

            return (
              <article
                key={row.category}
                className={`p-3.5 rounded-xl border transition-all ${
                  isGap
                    ? "border-amber-200/80 bg-amber-50/20 hover:bg-amber-50/40"
                    : "border-slate-200/80 bg-slate-50/40 hover:bg-slate-50/80"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`evidence-${row.category}`}
                  onClick={() => setExpandedCategory(isExpanded ? null : row.category)}
                  className="block w-full rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
                >
                <span className="flex items-center justify-between text-xs mb-2">
                  <span className="flex items-center gap-2">
                    <CategoryBadge code={row.category} size="sm" />
                    <span className="font-semibold text-slate-800">{row.name}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-slate-500">Bar: {row.req}/10</span>
                    {row.rawLevel && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        {row.rawLevel}
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span
                      className={`font-bold ${
                        isGap ? "text-rose-600" : row.status === "exceeds" ? "text-emerald-700" : "text-emerald-600"
                      }`}
                    >
                      Yours: {row.cand}/10 {isGap ? `(-${row.gap})` : "✓"}
                    </span>
                  </span>
                </span>
                </button>

                <div
                  className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-1"
                  role="img"
                  aria-label={`${row.name}: candidate level ${row.cand} out of 10; company bar ${row.req} out of 10`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      isGap ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${(row.cand / 10) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10"
                    style={{ left: `${(row.req / 10) * 100}%` }}
                    title={`Required bar: ${row.req}/10 (${row.rawLevel || ""})`}
                  />
                </div>

                {/* Expanded recommendation */}
                <div
                  id={`evidence-${row.category}`}
                  hidden={!isExpanded}
                  className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 leading-snug"
                >
                    <p className="font-bold text-slate-800">Evidence behind this estimate</p>
                    {row.evidence.length === 0 ? (
                      <p className="mt-1">
                        No supporting profile evidence was found for this category. The score is
                        the 1/10 starting level only; add a skill with evidence or relevant experience.
                      </p>
                    ) : (
                      <ul className="mt-1 space-y-2">
                        {row.evidence.map((item, index) => (
                          <li
                            key={`${row.category}-${item.source}-${item.title}-${index}`}
                            className="rounded-lg bg-white/80 p-2"
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-1">
                              <span className="font-semibold text-slate-800">
                                {item.source}: {item.title}
                              </span>
                              <span className="font-mono text-slate-500">
                                +{item.points.toFixed(1)} points
                                {item.confidence ? ` · ${item.confidence} confidence` : ""}
                              </span>
                            </div>
                            <p className="mt-1">{item.details}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-3">
                      <span className="font-bold text-slate-800">Recommendation: </span>
                      <span>{row.recommendation}</span>
                    </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      </>
      ) : (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center" role="status">
          <Target className="mx-auto h-7 w-7 text-blue-600" />
          <h2 className="mt-2 font-heading text-lg font-bold text-slate-900">Ready to assess {currentCompany.name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            The readiness score and company comparison will appear after you run the benchmark.
            Add supporting profile records across multiple categories to enable a meaningful estimate.
          </p>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
