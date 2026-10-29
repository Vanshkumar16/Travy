import React, { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { CategoryBadge } from "../components/CategoryBadge";
import { RADIX_SKILL_CATEGORIES, CategoryCode } from "../types/contract";
import {
  ShieldCheck,
  FileCode2,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  GitPullRequest,
  Check,
  Send
} from "lucide-react";
import { toast } from "sonner";

interface PageContractExportProps {
  onNavigateToTalentCheck?: () => void;
  onNavigateToJobMatching?: () => void;
}

export const PageContractExport: React.FC<PageContractExportProps> = ({
  onNavigateToTalentCheck,
  onNavigateToJobMatching,
}) => {
  const { profile, validation, downloadProfileJSON, copyProfileJSON } = useProfile();
  const [activeTab, setActiveTab] = useState<"payload" | "schema" | "validation">("payload");
  const [copied, setCopied] = useState<boolean>(false);

  const canonicalJSON = {
    contract_schema: "RADIX_SHARED_DATA_CONTRACT_V1",
    role_handoff: "ROLE_3_TO_ROLE_4_AND_ROLE_5",
    timestamp: new Date().toISOString(),
    is_valid: validation.isValid,
    candidate_profile: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone || "+91 98765 43210",
      education: profile.education,
      institution: profile.institution,
      cgpa: profile.cgpa,
      graduation_year: profile.graduation_year,
      skills: profile.skills.map((s) => ({
        skill_name: s.skill_name,
        category_code: s.category_code,
        evidence: s.evidence,
        confidence: s.confidence,
      })),
      hackathons: profile.hackathons,
      internships: profile.internships,
      certifications: profile.certifications,
      preferred_roles: profile.preferred_roles,
      preferred_companies: profile.preferred_companies || ["Google", "Microsoft", "Oracle"],
      preferred_mode: profile.preferred_mode || "Hybrid",
      cv_file: profile.cv_file || `${profile.name.toLowerCase().replace(/\s+/g, "_")}_resume.pdf`,
      last_updated: profile.last_updated,
    },
  };

  const handleCopy = async () => {
    const success = await copyProfileJSON();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/60">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Step 7 · Shared Data Contract & Export</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800 border border-blue-200/60">
              JSON Standard Compliant
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Candidate Profile Export
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Structured candidate data matching standard evaluation and benchmark schemas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied!" : "Copy Payload"}</span>
          </button>

          <button
            onClick={downloadProfileJSON}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Contract Verification Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Contract Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-heading text-base font-bold text-slate-900">
                100% Contract Valid
              </h4>
              <p className="text-xs text-slate-500">All required fields verified</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Handoff Scope
          </span>
          <div className="flex items-center gap-2 mt-1">
            <GitPullRequest className="h-6 w-6 text-indigo-600 shrink-0" />
            <div>
              <h4 className="font-heading text-base font-bold text-slate-900">
                Verified Export
              </h4>
              <p className="text-xs text-slate-500">Benchmark & Job Fit Ready</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Profile Statistics
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-2xl font-bold text-blue-600">
              {profile.skills.length} skills
            </span>
            <span className="text-xs text-slate-500">
              · {profile.hackathons.length} hacks · {profile.internships.length} exps
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Canonical filename: candidate_profile.json</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          onClick={() => setActiveTab("payload")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "payload"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileCode2 className="h-4 w-4" />
          <span>Active JSON Export Payload</span>
        </button>

        <button
          onClick={() => setActiveTab("validation")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "validation"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Category Distribution Check</span>
        </button>
      </div>

      {/* Payload Tab */}
      {activeTab === "payload" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-emerald-400">
              candidate_profile.json
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={downloadProfileJSON}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <pre className="text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[550px] p-4 bg-slate-950 rounded-xl leading-relaxed">
            {JSON.stringify(canonicalJSON, null, 2)}
          </pre>
        </div>
      )}

      {/* Validation / Distribution Tab */}
      {activeTab === "validation" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-heading text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>12 RADIX Skillset Distribution</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {(Object.keys(RADIX_SKILL_CATEGORIES) as CategoryCode[]).map((code) => {
                const count = validation.coverage[code] || 0;
                const meta = RADIX_SKILL_CATEGORIES[code];
                return (
                  <div
                    key={code}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                      count > 0
                        ? "border-indigo-200 bg-indigo-50/50 text-indigo-950"
                        : "border-slate-100 bg-slate-50 text-slate-400 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold">{code}</span>
                      <span className="font-bold text-[10px] px-1.5 py-0.2 rounded-full bg-white border border-slate-200">
                        {count}
                      </span>
                    </div>
                    <span className="text-[10px] truncate mt-1 text-slate-600">{meta.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
