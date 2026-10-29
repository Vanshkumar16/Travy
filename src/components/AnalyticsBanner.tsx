import React from "react";
import { useProfile } from "../context/ProfileContext";
import {
  Database,
  Upload
} from "lucide-react";

interface AnalyticsBannerProps {
  onOpenModal: () => void;
}

export const AnalyticsBanner: React.FC<AnalyticsBannerProps> = ({ onOpenModal }) => {
  const { profile, activeCandidateId, switchCandidate } = useProfile();

  const getCandidateSubtitle = () => {
    switch (activeCandidateId) {
      case "ananya":
        return "Systems-leaning generalist • High SWE fit";
      case "karthik":
        return "Data-leaning analyst • High Data Science fit";
      case "priya":
        return "Support & enterprise • Strong Oracle fit";
      case "rohan":
        return "Full stack generalist • Broad technical fit";
      default:
        return "Custom candidate profile";
    }
  };

  return (
    <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50 px-4 py-3 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Active Candidate Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {profile.name}
              </span>
              <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                {profile.cv_file || "Verified Profile"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {getCandidateSubtitle()}
            </p>
          </div>
        </div>

        {/* Right: Quick Switchers & Import Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-1.5 hidden md:inline">
              Sample Profiles:
            </span>
            {(["ananya", "karthik", "priya", "rohan"] as const).map((key) => (
              <button
                key={key}
                onClick={() => switchCandidate(key)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeCandidateId === key
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Profile JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
