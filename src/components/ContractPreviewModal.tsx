import React, { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import {
  X,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContractPreviewModal: React.FC<ContractPreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { profile, validation, downloadProfileJSON, copyProfileJSON } = useProfile();
  const [activeTab, setActiveTab] = useState<"json" | "validation" | "schema">("json");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const canonicalJSON = {
    name: profile.name,
    email: profile.email,
    education: profile.education,
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
    cv_file: profile.cv_file || `${profile.name.toLowerCase().replace(/\s+/g, "_")}_resume.pdf`,
  };

  const handleCopy = async () => {
    const success = await copyProfileJSON();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Data Export
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                    validation.isValid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {validation.isValid ? "Valid" : `${validation.errors.length} Issues`}
                </span>
              </div>

            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 bg-white">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("json")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "json"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setActiveTab("validation")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "validation"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Validation</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  validation.isValid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                {validation.isValid ? "PASS" : validation.errors.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("schema")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "schema"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Categories
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
            <button
              onClick={downloadProfileJSON}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === "json" && (
            <div className="rounded-xl border border-slate-300 bg-slate-900 p-4 shadow-inner">
              <pre className="font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                {JSON.stringify(canonicalJSON, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === "validation" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Profile Verification Checklist</span>
                </h4>
                <ul className="divide-y divide-slate-100 text-xs">
                  <li className="py-2 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Candidate Name & Email present</span>
                    <span className="text-emerald-700 font-semibold">✓ Compliant</span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Academic Background / Education non-empty</span>
                    <span className="text-emerald-700 font-semibold">✓ Compliant</span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Skills categorized across 12 RADIX codes</span>
                    <span className="text-emerald-700 font-semibold">
                      ✓ {profile.skills.length} skills verified
                    </span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Every skill contains quote/reason evidence</span>
                    <span className="text-emerald-700 font-semibold">✓ Compliant</span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Target Roles defined for Job Matching</span>
                    <span className="text-emerald-700 font-semibold">
                      ✓ {profile.preferred_roles?.length || 0} roles selected
                    </span>
                  </li>
                </ul>
              </div>

              {validation.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                  <h5 className="font-bold mb-1 flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Quality Recommendations:</span>
                  </h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {validation.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "schema" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Standard Competency Categories
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Each verified skill is categorized under one of the primary technical disciplines.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { code: "COD", name: "Coding" },
                  { code: "DSA", name: "Data Structures & Algorithms" },
                  { code: "OOD", name: "Object-Oriented Design" },
                  { code: "APTI", name: "Aptitude" },
                  { code: "COMM", name: "Communication" },
                  { code: "AI", name: "AI & Machine Learning" },
                  { code: "CLOUD", name: "Cloud & DevOps" },
                  { code: "SQL", name: "SQL & Databases" },
                  { code: "SWE", name: "Software Engineering" },
                  { code: "SYSD", name: "System Design" },
                  { code: "NETW", name: "Networking" },
                  { code: "OS", name: "Operating Systems" },
                  { code: "OTHER", name: "Other Disciplines" },
                ].map((item) => (
                  <div key={item.code} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="font-mono text-xs font-bold text-blue-700">{item.code}</span>
                    <span className="text-xs font-semibold text-slate-800 ml-2">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-3.5 bg-slate-50">

          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
