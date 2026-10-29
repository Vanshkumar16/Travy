import React, { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { SAMPLE_ANALYTICS_INPUTS } from "../data/sampleCandidates";
import { ExtractedSkillListInput } from "../types/contract";
import {
  X,
  Upload,
  Check,
  AlertCircle,
  FileCode,
  FileText,
  Sparkles,
  Copy
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsIngestModal: React.FC<AnalyticsIngestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { ingestAnalyticsPayload, activeCandidateId } = useProfile();
  const [selectedTemplate, setSelectedTemplate] = useState<string>(activeCandidateId);
  const [jsonText, setJsonText] = useState<string>(() => {
    const initial = SAMPLE_ANALYTICS_INPUTS[activeCandidateId] || SAMPLE_ANALYTICS_INPUTS.ananya;
    return JSON.stringify(initial, null, 2);
  });
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplate(key);
    const data = SAMPLE_ANALYTICS_INPUTS[key];
    if (data) {
      setJsonText(JSON.stringify(data, null, 2));
      setParseError(null);
    }
  };

  const handleApply = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.skills || !Array.isArray(parsed.skills)) {
        setParseError("Payload must include a 'skills' array.");
        return;
      }
      setParseError(null);
      await ingestAnalyticsPayload(parsed as ExtractedSkillListInput);
      onClose();
    } catch (err: any) {
      setParseError(err.message || "Invalid JSON syntax.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          JSON.parse(content); // test validity
          setJsonText(content);
          setParseError(null);
          toast.success(`Loaded JSON file: ${file.name}`);
        } catch {
          setParseError("Uploaded file contains invalid JSON.");
        }
      };
      reader.readAsText(file);
    } else {
      // Mock parsing for PDF/DOCX
      toast.info(`Uploaded ${file.name}. Pre-filling extracted structure from file.`);
      const mockPayload = {
        ...SAMPLE_ANALYTICS_INPUTS.ananya,
        source_file: file.name,
        name: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      };
      setJsonText(JSON.stringify(mockPayload, null, 2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Profile Data Import
              </h3>
              <p className="text-xs text-slate-500">
                Load candidate profile from parsed resume JSON or test payload
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6 gap-4">
          {/* Quick Benchmark Presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Sample Candidate Payload:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["ananya", "karthik", "priya", "rohan"] as const).map((key) => {
                const isSelected = selectedTemplate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectTemplate(key)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-500"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold capitalize">{key} Rao / Candidate</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {key === "ananya" && "SWE Generalist"}
                      {key === "karthik" && "Data / ML Analyst"}
                      {key === "priya" && "Support Engineer"}
                      {key === "rohan" && "All-Rounder"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload File Option */}
          <div className="flex items-center justify-between border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/60">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <Upload className="h-4 w-4 text-indigo-600" />
              <span>Or import directly from a file (.json, .pdf, .docx):</span>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs">
              <span>Choose File</span>
              <input
                type="file"
                accept=".json,.pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* JSON Payload Textarea */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Inbound JSON Payload (Shared Contract Schema):
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                source_type: "resume" | "jd"
              </span>
            </div>
            <div className="relative">
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setParseError(null);
                }}
                rows={12}
                className="w-full rounded-xl border border-slate-300 bg-slate-900 p-3.5 font-mono text-xs text-emerald-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                spellCheck={false}
              />
            </div>
            {parseError && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50">
          <span className="text-xs text-slate-500">
            Pre-fills basic info, education, and 12-category skills.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply & Ingest into Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
