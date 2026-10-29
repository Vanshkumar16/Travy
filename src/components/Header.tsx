import React from "react";
import { useProfile } from "../context/ProfileContext";
import { SAMPLE_CANDIDATES } from "../data/sampleCandidates";
import {
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Save,
  Download,
  Share2,
  Sparkles,
  Users
} from "lucide-react";

interface HeaderProps {
  onOpenAnalyticsModal: () => void;
  onOpenContractModal: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAnalyticsModal,
  onOpenContractModal,
}) => {
  const {
    profile,
    activeCandidateId,
    switchCandidate,
    isBackendConnected,
    isSaving,
    saveProfile,
    validation,
    downloadProfileJSON,
  } = useProfile();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-sm ring-1 ring-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-bold tracking-tight text-slate-900">
                RADIX
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60">
                Profile Builder
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Talent Intelligence Engine</span>
            </div>
          </div>
        </div>

        {/* Backend health status badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border bg-slate-50">
          <Server className="h-3.5 w-3.5 text-slate-500" />
          {isBackendConnected ? (
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Python FastAPI (Port 8000)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-600" title="Running in self-contained browser mode with persistent JSON storage">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Local JSON Engine Active
            </span>
          )}
        </div>
      </div>

      {/* Center: Benchmark Candidate Switcher */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-500">
          <Users className="h-3.5 w-3.5" />
          <span>Benchmark Candidate:</span>
        </div>
        {(Object.keys(SAMPLE_CANDIDATES) as Array<keyof typeof SAMPLE_CANDIDATES>).map((key) => {
          const c = SAMPLE_CANDIDATES[key];
          const isActive = activeCandidateId === key;
          return (
            <button
              key={key}
              onClick={() => switchCandidate(key)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                isActive
                  ? "bg-white text-blue-700 font-semibold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {c.name.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Right: Contract status & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Contract compliance pill */}
        <button
          onClick={onOpenContractModal}
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
            validation.isValid
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          }`}
          title="Click to inspect Shared Data Contract JSON"
        >
          {validation.isValid ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
          <span>{validation.isValid ? "Shared Contract 100% Valid" : `${validation.errors.length} Required Fixes`}</span>
        </button>

        {/* Analytics Ingestion Trigger */}
        <button
          onClick={onOpenAnalyticsModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs"
        >
          <FileCode2 className="h-3.5 w-3.5 text-indigo-600" />
          <span>Analytics Input</span>
        </button>

        {/* Export JSON */}
        <button
          onClick={onOpenContractModal}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <Share2 className="h-3.5 w-3.5 text-slate-600" />
          <span className="hidden sm:inline">Export Data</span>
        </button>

        {/* Save button */}
        <button
          onClick={saveProfile}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSaving ? "Saving..." : "Save Profile"}</span>
        </button>
      </div>
    </header>
  );
};
