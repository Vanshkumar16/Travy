import React, { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { SAMPLE_ANALYTICS_INPUTS } from "../data/sampleCandidates";
import {
  FileCode,
  ArrowRight,
  Database,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  FileCheck,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { CategoryBadge } from "./CategoryBadge";

export const AnalyticsInspector: React.FC<{ onOpenModal: () => void }> = ({ onOpenModal }) => {
  const { profile, activeCandidateId, switchCandidate, ingestAnalyticsPayload } = useProfile();
  const [copied, setCopied] = useState(false);

  const activeAnalyticsData = SAMPLE_ANALYTICS_INPUTS[activeCandidateId] || SAMPLE_ANALYTICS_INPUTS.ananya;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(activeAnalyticsData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied inbound analytics JSON!");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
              Profile Data Ingestion
            </h2>
            <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 border border-blue-200">
              Pipeline Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Candidate profile automatically synchronized from parsed resume data and skill inference.
          </p>
        </div>

        <button
          onClick={onOpenModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Database className="h-4 w-4" />
          <span>Ingest Custom Analytics JSON</span>
        </button>
      </div>

      {/* 4 Sample Test Streams */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(["ananya", "karthik", "priya", "rohan"] as const).map((key) => {
          const item = SAMPLE_ANALYTICS_INPUTS[key];
          const isSelected = activeCandidateId === key;
          return (
            <button
              key={key}
              onClick={() => switchCandidate(key)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 capitalize">{key} Rao / Candidate</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                    {item.skills.length} skills
                  </span>
                </div>
                <div className="text-[11px] font-mono text-indigo-700 truncate">
                  📄 {item.source_file}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {key === "ananya" && "Systems & Distributed Systems focus"}
                  {key === "karthik" && "Data Science & SQL Analytics focus"}
                  {key === "priya" && "Application Support & IT Operations focus"}
                  {key === "rohan" && "Competitive All-Rounder SWE focus"}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold">
                <span className={isSelected ? "text-indigo-800" : "text-slate-500"}>
                  {isSelected ? "● Currently Loaded" : "Click to Ingest"}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Ingestion & Mapping Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapping Visualizer */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Inbound Data Mapping to Profile Builder</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Parsed resume fields automatically map to structured profile attributes.
            </p>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-slate-500">source_file</span>
                  <div className="text-slate-800 font-semibold">{activeAnalyticsData.source_file}</div>
                </div>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mapped to CV Document</span>
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-slate-500">skills[]</span>
                  <div className="text-slate-800 font-semibold">
                    {activeAnalyticsData.skills.length} skills with quotes & confidence
                  </div>
                </div>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mapped to Competencies</span>
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-slate-500">name, email, education</span>
                  <div className="text-slate-800 font-semibold">{activeAnalyticsData.name}</div>
                </div>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Pre-filled biographical</span>
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-slate-500">projects[] / experience[]</span>
                  <div className="text-slate-800 font-semibold">
                    {activeAnalyticsData.experience?.length || 0} work positions
                  </div>
                </div>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mapped to Internships</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 leading-relaxed">
            <strong>Profile Enrichment:</strong> Add beyond-resume signals (hackathons, certifications, and career target roles) to unlock deep benchmark analysis and job matching.
          </div>
        </div>

        {/* Raw Analytics Input JSON Inspector */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="h-4 w-4 text-indigo-600" />
              <span>Inbound Payload JSON</span>
            </h3>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? "Copied" : "Copy Payload"}</span>
            </button>
          </div>

          <div className="flex-1 rounded-xl border border-slate-300 bg-slate-900 p-3.5 overflow-hidden">
            <pre className="font-mono text-xs text-emerald-400 max-h-72 overflow-y-auto whitespace-pre leading-relaxed">
              {JSON.stringify(activeAnalyticsData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
