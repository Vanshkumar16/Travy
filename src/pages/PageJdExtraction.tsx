import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { extractSkillsAndPrerequisitesFromJd } from "../lib/skillInferenceEngine";
import {
  analyzeJdFile,
  analyzeJdSample,
  analyzeJdText,
  fetchJdEngine,
  fetchJdSamples,
  toContract,
  toExtractedJdResult,
} from "../lib/jdApi";
import { COMPANY_JD_DATASET } from "../data/companyJdDataset";
import { CategoryBadge } from "../components/CategoryBadge";
import { RADIX_SKILL_CATEGORIES } from "../types/contract";
import { JdAnalysis, JdEngine, JdEngineStatus, JdSample, JdSkill } from "../types/jd";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bot,
  Copy,
  Download,
  FileText,
  Info,
  Loader2,
  Sparkles,
  Target,
  Upload,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

interface PageJdExtractionProps {
  onNext?: () => void;
  onNavigateToJobMatching?: () => void;
  onNavigateToTalentCheck?: () => void;
}

type InputMode = "upload" | "samples" | "paste";
type ResultView = "skills" | "source" | "json";

const SECTION_LABEL: Record<string, string> = {
  overview: "Overview",
  responsibilities: "Responsibilities",
  requirements: "Requirements",
  preferred: "Preferred",
  company: "About company",
  benefits: "Benefits",
  other: "Other",
};

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-500 border-slate-200",
};

export const PageJdExtraction: React.FC<PageJdExtractionProps> = ({ onNext, onNavigateToJobMatching }) => {
  const { activeJdResult, setActiveJdResult } = useProfile();

  const [engineStatus, setEngineStatus] = useState<JdEngineStatus | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [samples, setSamples] = useState<JdSample[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>("samples");
  const [engine, setEngine] = useState<JdEngine>("auto");
  const [busy, setBusy] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteCompany, setPasteCompany] = useState("");
  const [pasteRole, setPasteRole] = useState("");
  const [view, setView] = useState<ResultView>("skills");
  const [selectedSkill, setSelectedSkill] = useState<JdSkill | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([fetchJdEngine(), fetchJdSamples()])
      .then(([status, list]) => {
        setEngineStatus(status);
        setSamples(list);
        setBackendOnline(true);
      })
      .catch(() => {
        setBackendOnline(false);
        setInputMode("paste");
      });
  }, []);

  const analysis: JdAnalysis | undefined = activeJdResult?.analysis;

  const run = async (label: string, job: () => Promise<JdAnalysis>) => {
    setBusy(label);
    try {
      const result = await job();
      setActiveJdResult(toExtractedJdResult(result));
      setSelectedSkill(null);
      setView("skills");
      const note = result.engine_used === "llm+rules" ? "LLM + rules" : "rule engine";
      toast.success(`Analysed ${result.role} at ${result.company} (${note}, ${result.processing_ms} ms)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusy(null);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".pdf", ".docx", ".txt", ".md"].includes(ext)) {
      toast.error("Upload a PDF, DOCX or TXT file.");
      return;
    }
    run(file.name, () => analyzeJdFile(file, engine));
  };

  const handlePaste = () => {
    if (pasteText.trim().length < 40) {
      toast.error("Paste the full job description (at least a few sentences).");
      return;
    }
    if (!backendOnline) {
      // Offline fallback: the in-browser keyword engine keeps the demo alive.
      setActiveJdResult(
        extractSkillsAndPrerequisitesFromJd(pasteText, {
          title: pasteRole || undefined,
          company: pasteCompany || undefined,
        })
      );
      toast.message("Backend offline: used the in-browser keyword engine.");
      return;
    }
    run("pasted text", () => analyzeJdText(pasteText, engine, pasteCompany, pasteRole));
  };

  const contract = analysis ? toContract(analysis) : activeJdResult?.rawJsonExport;

  const downloadContract = () => {
    if (!contract) return;
    const blob = new Blob([JSON.stringify(contract, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jd_skills_${(activeJdResult?.company || "jd").toLowerCase().replace(/[^a-z0-9]+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(contract, null, 2));
      toast.success("Copied skill list JSON");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const goToMatching = () => {
    if (onNavigateToJobMatching) onNavigateToJobMatching();
    else if (onNext) onNext();
  };

  const showSkillInSource = (skill: JdSkill) => {
    setSelectedSkill(skill);
    setView("source");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Job Analysis</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Upload a job description and see what it actually requires, mapped to the 12 RADIX skillsets with evidence for every skill.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <EngineBadge status={engineStatus} online={backendOnline} />
          <button
            onClick={() => (onNext ? onNext() : goToMatching())}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            {(["upload", "samples", "paste"] as InputMode[]).map((mode) => (
              <button
                key={mode}
                disabled={mode !== "paste" && backendOnline === false}
                onClick={() => setInputMode(mode)}
                className={`px-3 py-1 rounded-md transition-all disabled:opacity-40 ${
                  inputMode === mode ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {mode === "upload" ? "Upload PDF / DOCX" : mode === "samples" ? "Sample JDs" : "Paste text"}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold">Engine</span>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as JdEngine)}
              disabled={!backendOnline}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="auto">Auto (best available)</option>
              <option value="llm" disabled={!engineStatus?.llm_available}>
                LLM + rules{engineStatus?.llm_available ? ` (${engineStatus.llm_model})` : " (no LLM configured)"}
              </option>
              <option value="rules">Rules only (offline)</option>
            </select>
          </label>
        </div>

        {backendOnline === false && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <WifiOff className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              JD Analytics backend is offline (start it on port 8000). Pasted text is analysed with the in-browser keyword engine in the meantime.
            </span>
          </div>
        )}

        {inputMode === "upload" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInput.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              dragOver ? "border-blue-500 bg-blue-50/60" : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white"
            }`}
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> : <Upload className="h-6 w-6 text-slate-400" />}
            <p className="text-sm font-semibold text-slate-800">{busy ? `Analysing ${busy}…` : "Drop a JD here or click to browse"}</p>
            <p className="text-[11px] text-slate-500">PDF, DOCX or TXT, up to 10 MB</p>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {inputMode === "samples" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {samples.map((sample) => {
              const isActive = analysis?.source_file === sample.file;
              return (
                <button
                  key={sample.id}
                  disabled={busy !== null}
                  onClick={() => run(sample.file, () => analyzeJdSample(sample.id, engine))}
                  className={`text-left p-3 rounded-xl border text-xs transition-all disabled:opacity-60 ${
                    isActive
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-bold text-slate-900 truncate">{sample.company}</span>
                    {busy === sample.file ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    ) : (
                      <span className="text-[10px] font-mono uppercase text-slate-400">{sample.format}</span>
                    )}
                  </div>
                  <p className="text-slate-700 font-semibold line-clamp-1">{sample.role}</p>
                  <div className="mt-1 text-[10px] text-slate-400 truncate">{sample.location}</div>
                </button>
              );
            })}
          </div>
        )}

        {inputMode === "paste" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Company (optional, detected if blank)"
                value={pasteCompany}
                onChange={(e) => setPasteCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Role (optional, detected if blank)"
                value={pasteRole}
                onChange={(e) => setPasteRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <textarea
              rows={6}
              placeholder="Paste the full job description, including the responsibilities and requirements sections…"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center justify-between gap-2">
              {backendOnline === false ? (
                <select
                  onChange={(e) => {
                    const preset = COMPANY_JD_DATASET.find((p) => p.id === e.target.value);
                    if (preset) {
                      setPasteText(preset.rawText);
                      setPasteCompany(preset.company);
                      setPasteRole(preset.role);
                    }
                  }}
                  defaultValue=""
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="" disabled>
                    Load an offline example…
                  </option>
                  {COMPANY_JD_DATASET.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.company}: {p.role}
                    </option>
                  ))}
                </select>
              ) : (
                <span />
              )}
              <button
                onClick={handlePaste}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60 transition-all"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>Analyse JD</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {analysis ? (
        <AnalysisView
          analysis={analysis}
          view={view}
          setView={setView}
          selectedSkill={selectedSkill}
          onSelectSkill={showSkillInSource}
          contract={contract}
          onCopy={copyContract}
          onDownload={downloadContract}
          onUseForMatching={goToMatching}
        />
      ) : activeJdResult ? (
        <LegacyResult result={activeJdResult} onDownload={downloadContract} onUseForMatching={goToMatching} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Pick a sample JD or upload one to see its skill breakdown.
        </div>
      )}
    </div>
  );
};

const EngineBadge: React.FC<{ status: JdEngineStatus | null; online: boolean | null }> = ({ status, online }) => {
  if (online === null) return null;
  if (!online)
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
        <WifiOff className="h-3 w-3" /> Offline mode
      </span>
    );
  return status?.llm_available ? (
    <span className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">
      <Bot className="h-3 w-3" /> LLM + rules{status.llm_model ? ` · ${status.llm_model}` : ""}
    </span>
  ) : (
    <span
      title="Set GROQ_API_KEY (free) in tgl/.env, or run Ollama, to enable LLM extraction"
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600"
    >
      <Sparkles className="h-3 w-3" /> Rule engine
    </span>
  );
};

interface AnalysisViewProps {
  analysis: JdAnalysis;
  view: ResultView;
  setView: (v: ResultView) => void;
  selectedSkill: JdSkill | null;
  onSelectSkill: (s: JdSkill) => void;
  contract: unknown;
  onCopy: () => void;
  onDownload: () => void;
  onUseForMatching: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({
  analysis,
  view,
  setView,
  selectedSkill,
  onSelectSkill,
  contract,
  onCopy,
  onDownload,
  onUseForMatching,
}) => {
  const meta = analysis.metadata;
  const direct = analysis.skills.filter((s) => !s.implied_by);
  const must = direct.filter((s) => s.importance === "must_have");
  const nice = direct.filter((s) => s.importance === "nice_to_have");
  const implied = analysis.skills.filter((s) => s.implied_by);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">{analysis.company}</p>
            <h2 className="text-xl font-extrabold text-slate-900">{analysis.role}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              {[meta.location, meta.work_mode, meta.experience, `${meta.seniority} level`].filter(Boolean).map((v) => (
                <span key={v as string} className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  {v}
                </span>
              ))}
            </div>
            {meta.education && <p className="mt-2 text-[11px] text-slate-500 line-clamp-1">Education: {meta.education}</p>}
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
              <FileText className="h-3 w-3" /> {analysis.source_file} · {analysis.engine_used === "llm+rules" ? analysis.engine_note?.replace("LLM: ", "") || "LLM + rules" : "rule engine"} ·{" "}
              {analysis.processing_ms} ms
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <Stat label="Must-have" value={must.length} tone="text-blue-700" />
            <Stat label="Nice-to-have" value={nice.length} tone="text-slate-700" />
            <Stat label="Implied" value={implied.length} tone="text-indigo-600" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={onUseForMatching}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all"
          >
            <Target className="h-3.5 w-3.5" /> Use for Job Match
          </button>
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Download skill list JSON
          </button>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {analysis.insights.map((insight, i) => (
          <div
            key={i}
            className={`flex gap-2.5 rounded-xl border p-3 text-xs ${
              insight.kind === "focus"
                ? "border-blue-200 bg-blue-50/60"
                : insight.kind === "warning"
                ? "border-amber-200 bg-amber-50/60"
                : "border-slate-200 bg-white"
            }`}
          >
            {insight.kind === "focus" ? (
              <Target className="h-4 w-4 shrink-0 text-blue-600" />
            ) : insight.kind === "warning" ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            ) : (
              <Info className="h-4 w-4 shrink-0 text-slate-400" />
            )}
            <div>
              <p className="font-bold text-slate-900">{insight.title}</p>
              <p className="mt-0.5 text-slate-600 leading-relaxed">{insight.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Demand profile */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">12-skillset demand profile</h3>
            <p className="text-[11px] text-slate-500">
              Required level 1–10, on the same scale as Talent Check's company bar.
            </p>
          </div>
          {analysis.company_bar_source && (
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="inline-block h-3 w-0.5 bg-slate-900" /> {analysis.company_bar_source} company bar
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
          {analysis.category_demand.map((d) => {
            const metaCat = RADIX_SKILL_CATEGORIES[d.category_code];
            return (
              <div key={d.category_code} className="flex items-center gap-3">
                <div className="w-12 shrink-0">
                  <CategoryBadge code={d.category_code} size="sm" />
                </div>
                <div className="relative h-2.5 flex-1 rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{ width: `${d.required_level * 10}%`, backgroundColor: metaCat?.accentHex || "#2563EB" }}
                  />
                  {d.company_bar != null && (
                    <div
                      className="absolute -top-1 h-4.5 w-0.5 bg-slate-900"
                      style={{ left: `calc(${d.company_bar * 10}% - 1px)`, height: "18px" }}
                      title={`Company bar: ${d.company_bar}/10`}
                    />
                  )}
                </div>
                <span className={`w-10 text-right font-mono text-xs font-bold ${d.required_level ? "text-slate-800" : "text-slate-300"}`}>
                  {d.required_level || "–"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Result views */}
      <div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-fit mb-4">
          {(["skills", "source", "json"] as ResultView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                view === v ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {v === "skills" ? "Skills" : v === "source" ? "Source JD" : "Shared-format JSON"}
            </button>
          ))}
        </div>

        {view === "skills" && (
          <div className="space-y-6">
            <SkillGroup title="Must-have" subtitle="Required by the responsibilities and requirements" skills={must} onSelect={onSelectSkill} />
            <SkillGroup title="Nice-to-have" subtitle="Preferred, bonus, or softly worded" skills={nice} onSelect={onSelectSkill} />
            <SkillGroup
              title="Implied prerequisites"
              subtitle="Foundations implied by named technologies; low confidence"
              skills={implied}
              onSelect={onSelectSkill}
            />
          </div>
        )}

        {view === "source" && <SourceView analysis={analysis} selected={selectedSkill} />}

        {view === "json" && (
          <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-emerald-400">jd_skill_list.json · source_type "jd"</span>
              <button
                onClick={onCopy}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[500px] leading-relaxed">
              {JSON.stringify(contract, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-center">
    <p className={`text-xl font-extrabold ${tone}`}>{value}</p>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
);

const SkillGroup: React.FC<{
  title: string;
  subtitle: string;
  skills: JdSkill[];
  onSelect: (s: JdSkill) => void;
}> = ({ title, subtitle, skills, onSelect }) => {
  if (!skills.length) return null;
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-sm font-bold text-slate-900">
          {title} <span className="font-mono text-slate-400">({skills.length})</span>
        </h3>
        <span className="text-[11px] text-slate-500">{subtitle}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {skills.map((skill, i) => (
          <button
            key={`${skill.skill_name}-${i}`}
            onClick={() => onSelect(skill)}
            title="Show where this comes from in the JD"
            className={`text-left rounded-xl border p-3 transition-all hover:border-blue-300 hover:shadow-xs ${
              skill.implied_by ? "border-indigo-100 bg-indigo-50/30" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <CategoryBadge code={skill.category_code} size="sm" />
                <span className="text-xs font-bold text-slate-900 truncate">{skill.skill_name}</span>
              </div>
              <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${CONFIDENCE_STYLE[skill.confidence]}`}>
                {skill.confidence}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-2">“{skill.evidence}”</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
              <span>{SECTION_LABEL[skill.source_section]}</span>
              {skill.sources.map((src) => (
                <span key={src} className={`rounded px-1.5 py-0.5 font-semibold ${src === "llm" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
                  {src === "llm" ? "LLM" : "Rules"}
                </span>
              ))}
              {skill.grounded ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600">
                  <BadgeCheck className="h-3 w-3" /> quote verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-amber-600">
                  <AlertTriangle className="h-3 w-3" /> quote not found
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/** Raw JD with every evidence sentence underlined and the selected one highlighted. */
const SourceView: React.FC<{ analysis: JdAnalysis; selected: JdSkill | null }> = ({ analysis, selected }) => {
  const markRef = useRef<HTMLElement>(null);

  const segments = useMemo(() => {
    const text = analysis.raw_text;
    const ranges: Array<{ start: number; end: number; skills: string[] }> = [];
    for (const skill of analysis.skills) {
      if (skill.implied_by || !skill.grounded) continue;
      const idx = text.indexOf(skill.evidence);
      if (idx === -1) continue;
      const existing = ranges.find((r) => r.start === idx);
      if (existing) existing.skills.push(skill.skill_name);
      else ranges.push({ start: idx, end: idx + skill.evidence.length, skills: [skill.skill_name] });
    }
    ranges.sort((a, b) => a.start - b.start);
    const out: Array<{ text: string; skills?: string[] }> = [];
    let cursor = 0;
    for (const r of ranges) {
      if (r.start < cursor) continue; // overlapping sentence; keep the first
      out.push({ text: text.slice(cursor, r.start) });
      out.push({ text: text.slice(r.start, r.end), skills: r.skills });
      cursor = r.end;
    }
    out.push({ text: text.slice(cursor) });
    return out;
  }, [analysis]);

  useEffect(() => {
    markRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      {selected && (
        <p className="mb-3 text-xs text-slate-600">
          Showing evidence for <span className="font-bold text-slate-900">{selected.skill_name}</span>
          {selected.implied_by && <> (implied by {selected.implied_by})</>}
        </p>
      )}
      <div className="max-h-[560px] overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700 font-mono">
        {segments.map((seg, i) => {
          if (!seg.skills) return <span key={i}>{seg.text}</span>;
          const isSelected =
            selected != null && (seg.skills.includes(selected.skill_name) || (selected.implied_by != null && seg.skills.includes(selected.implied_by)));
          return (
            <mark
              key={i}
              ref={isSelected ? markRef : undefined}
              title={seg.skills.join(", ")}
              className={`rounded px-0.5 ${isSelected ? "bg-yellow-200 text-slate-900 ring-2 ring-yellow-300" : "bg-blue-50 text-slate-800 underline decoration-blue-300 decoration-dotted"}`}
            >
              {seg.text}
            </mark>
          );
        })}
      </div>
    </div>
  );
};

/** Result produced by the in-browser fallback engine (backend offline). */
const LegacyResult: React.FC<{
  result: NonNullable<ReturnType<typeof useProfile>["activeJdResult"]>;
  onDownload: () => void;
  onUseForMatching: () => void;
}> = ({ result, onDownload, onUseForMatching }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">{result.company}</p>
        <h2 className="text-lg font-extrabold text-slate-900">{result.title}</h2>
        <p className="text-[11px] text-slate-400">In-browser keyword engine (offline fallback)</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onUseForMatching} className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
          Use for Job Match
        </button>
        <button onClick={onDownload} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          Download JSON
        </button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {result.allSkills.map((s, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-xs">
          <CategoryBadge code={s.category_code} size="sm" />
          <span className="font-semibold text-slate-800">{s.skill_name}</span>
          {s.isImplied && <span className="text-[10px] text-indigo-600">implied</span>}
        </div>
      ))}
    </div>
  </div>
);
