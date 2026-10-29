import React, { useState, useMemo, useEffect } from "react";
import { useProfile } from "../context/ProfileContext";
import { CategoryBadge } from "./CategoryBadge";
import {
  listCompanies,
  computeCandidateCompetencyScores,
  evaluateCandidateAgainstCompany,
  CompanySkillsetExpectation,
  TalentCheckCompanyDataset
} from "../data/talentCheckCompanySkillsets";
import { fetchCompanySkillsets } from "../lib/api";
import {
  Building2,
  AlertCircle,
  Target,
  BarChart2
} from "lucide-react";

export const TalentCheckPreview: React.FC = () => {
  const { profile } = useProfile();
  const [selectedCompanyKey, setSelectedCompanyKey] = useState<string>("google");
  const [dataset, setDataset] = useState<TalentCheckCompanyDataset | null>(null);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCompanySkillsets()
      .then((result) => {
        if (active) setDataset(result);
      })
      .catch((error: unknown) => {
        if (active) setDatasetError(error instanceof Error ? error.message : "Could not load company benchmarks.");
      });
    return () => {
      active = false;
    };
  }, []);

  const companyList = useMemo(() => dataset ? listCompanies(dataset) : [], [dataset]);
  const company: CompanySkillsetExpectation | undefined = dataset?.companies[selectedCompanyKey];

  const candidateScores = useMemo(() => {
    return computeCandidateCompetencyScores(profile);
  }, [profile]);

  const evaluation = useMemo(() => {
    return company ? evaluateCandidateAgainstCompany(candidateScores, company) : null;
  }, [candidateScores, company]);

  if (datasetError || !dataset || !company || !evaluation) {
    return (
      <div className="p-6 text-sm text-slate-600" role={datasetError ? "alert" : "status"}>
        {datasetError || "Loading verified company benchmarks…"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
              Hiring Bar Benchmark Simulation
            </h2>
            <span className="rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 border border-cyan-200">
              {companyList.length} Company Skillsets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate candidate profile readiness against target company hiring bars.
          </p>
        </div>

        {/* Company Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <fieldset className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <legend className="sr-only">Select a featured benchmark company</legend>
            {(["google", "microsoft", "oracle"] as const).map((key) => {
              const featuredCompany = dataset.companies[key];
              const isSelected = selectedCompanyKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCompanyKey(key)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                    isSelected
                      ? "bg-white text-blue-700 font-bold shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {featuredCompany.name}
                </button>
              );
            })}
          </fieldset>

          <select
            aria-label="Select benchmark company"
            value={selectedCompanyKey}
            onChange={(e) => setSelectedCompanyKey(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-slate-700 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {companyList.map((c) => (
              <option key={c.company_id} value={c.company_id}>
                {c.id ? `[#${c.id}] ` : ""}{c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Readiness Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>Target Company Bar</span>
              </span>
              {company.id && (
                <span className="text-[10px] font-mono text-slate-400">
                  RECORD #{company.id}
                </span>
              )}
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900">{company.name}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{company.description}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">In-Scope Roles:</span>
            <div className="flex flex-wrap gap-1">
              {(company.roles || ["Software Engineer"]).map((r) => (
                <span key={r} className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium border border-blue-100">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-purple-600" />
                <span>Readiness Score</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">0-100 scale</span>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="font-heading text-4xl font-extrabold tracking-tight text-slate-900">
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
                className={`h-full rounded-full transition-all duration-500 ${
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

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Candidate <strong className="text-slate-700">{profile.name}</strong> meets requirements across{" "}
            <strong className="text-emerald-700 font-semibold">{evaluation.strengths.length} of 12</strong> skill categories.
          </p>
        </div>

        {/* Priority Skillset Gaps */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Skill Gaps ({evaluation.gaps.length})</span>
            </div>

            <div className="flex flex-col gap-2 mt-2 max-h-40 overflow-y-auto pr-1">
              {evaluation.gaps.map((g) => (
                <div
                  key={g.category}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <CategoryBadge code={g.category} size="sm" />
                    <span className="font-medium text-slate-700 truncate">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2 font-mono text-[11px]">
                    {g.rawLevel && (
                      <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {g.rawLevel}
                      </span>
                    )}
                    <span className="font-semibold text-rose-600">
                      {g.cand}/10 (Req: {g.req})
                    </span>
                  </div>
                </div>
              ))}

              {evaluation.gaps.length === 0 && (
                <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg">
                  No skill gaps! Candidate exceeds all 12 skillset bars.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 12-Skillset Comparison Bar Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-blue-600" />
          <span>12-Skillset Bar Comparison: Candidate Level vs. Expected Bar (1-10)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evaluation.comparison.map((row) => {
            const hasGap = row.status === "gap";

            return (
              <div
                key={row.category}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CategoryBadge code={row.category} size="sm" />
                    <span className="font-semibold text-slate-800">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-slate-500">Req: {row.req}</span>
                    {row.rawLevel && (
                      <span className="px-1 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        {row.rawLevel}
                      </span>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className={`font-bold ${hasGap ? "text-rose-600" : "text-emerald-600"}`}>
                      Cand: {row.cand} {hasGap ? "(Gap)" : "✓"}
                    </span>
                  </div>
                </div>

                <div className="relative h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-full transition-all ${
                      hasGap ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${(row.cand / 10) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10"
                    style={{ left: `${(row.req / 10) * 100}%` }}
                    title={`Required level: ${row.req}/10 (${row.rawLevel || ""})`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
