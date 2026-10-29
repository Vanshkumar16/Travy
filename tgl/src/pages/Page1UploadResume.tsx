import React, { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import {
  Upload,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { extractSkillsAndPrerequisitesFromResume } from "../lib/skillInferenceEngine";
import type { InferredSkillItem } from "../lib/skillInferenceEngine";
import { extractSkillsFromResumeFile, GroqExtractedSkill } from "../lib/api";
import { CategoryCode } from "../types/contract";

interface Page1UploadResumeProps {
  onNext: () => void;
}

export const Page1UploadResume: React.FC<Page1UploadResumeProps> = ({ onNext }) => {
  const { user, profile, updateProfile, applyExtractedResumeToProfile, hasResume } = useProfile();
  const [uploadedFileName, setUploadedFileName] = useState<string>(profile.cv_file || "");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resumeText, setResumeText] = useState<string>("");
  const [inputTab, setInputTab] = useState<"file" | "paste">("file");
  const [uploadError, setUploadError] = useState<string | null>(null);

  /** Convert Groq skill output to InferredSkillItem[] */
  function groqSkillsToInferred(groqSkills: GroqExtractedSkill[]): InferredSkillItem[] {
    return groqSkills.map((s, i) => ({
      id: `groq_p1_${i}_${Date.now()}`,
      skill_name: s.skill_name,
      category_code: (s.category_code as CategoryCode) ?? "OTHER",
      evidence: s.evidence,
      confidence: s.confidence,
      isImplied: s.mention_type === "implied",
      impliedBy: s.mention_type === "implied" ? "Groq LLM Inference" : undefined,
    }));
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadedFileName(file.name);
    setUploadError(null);

    if (file.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.skills) {
            updateProfile({
              name: parsed.name || profile.name || user?.name,
              email: parsed.email || profile.email || user?.email,
              education: parsed.education || profile.education,
              skills: parsed.skills,
              cv_file: file.name,
            });
            toast.success(`Loaded profile from ${file.name}`);
          }
        } catch {
          toast.error("Invalid JSON format.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
      return;
    }

    // Try Groq backend first
    try {
      const result = await extractSkillsFromResumeFile(file);
      const inferredSkills = groqSkillsToInferred(result.skills);
      const explicitSkills = inferredSkills.filter((s) => !s.isImplied);
      const impliedSkills = inferredSkills.filter((s) => s.isImplied);

      // Build a minimal ExtractedResumeResult shape
      const extracted = extractSkillsAndPrerequisitesFromResume(
        `Name: ${user?.name || "Candidate"}\nSkills: ${inferredSkills.map(s => s.skill_name).join(", ")}`,
        []
      );
      applyExtractedResumeToProfile({
        ...extracted,
        explicitSkills,
        impliedSkills,
        allSkills: inferredSkills,
      });
      updateProfile({ cv_file: file.name, cv_uploaded_at: new Date().toISOString() });
      toast.success(
        `Groq extracted ${result.skills_extracted} skill${result.skills_extracted !== 1 ? "s" : ""} from ${file.name}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setUploadError(msg);
      toast.error(`Groq extraction failed: ${msg}. Using local engine.`);

      // Local fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || "";
        const extracted = extractSkillsAndPrerequisitesFromResume(
          text.length > 20
            ? text
            : `Candidate: ${user?.name || "User"}\nSkills: React, TypeScript, Python, SQL`
        );
        applyExtractedResumeToProfile(extracted);
        updateProfile({ cv_file: file.name, cv_uploaded_at: new Date().toISOString() });
        toast.success(`Parsed ${file.name} (local engine)`);
      };
      reader.onerror = () => { /* silent */ };
      reader.readAsText(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsePastedText = () => {
    if (!resumeText.trim()) {
      toast.error("Please paste your resume text first.");
      return;
    }
    setIsProcessing(true);
    const extracted = extractSkillsAndPrerequisitesFromResume(resumeText);
    applyExtractedResumeToProfile(extracted);
    updateProfile({ cv_file: "pasted_resume.txt", cv_uploaded_at: new Date().toISOString() });
    setIsProcessing(false);
    toast.success("Extracted skills from resume!");
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Add Your Resume
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
          Upload your resume or paste its content. Our engine extracts your competencies and infers foundation prerequisites (e.g. React unlocks JavaScript, CSS, and HTML).
        </p>
      </div>

      {/* Switcher Tab between File Upload and Text Paste */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setInputTab("file")}
            className={`px-4 py-2 rounded-lg transition-all ${
              inputTab === "file" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Upload Document (PDF / DOCX / TXT)
          </button>
          <button
            onClick={() => setInputTab("paste")}
            className={`px-4 py-2 rounded-lg transition-all ${
              inputTab === "paste" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Paste Resume Text
          </button>
        </div>
      </div>

      {/* Main Upload Box */}
      {inputTab === "file" ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-xs hover:border-blue-500 transition-colors relative">
          <input
            type="file"
            id="resume-file-input"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-inner ring-1 ring-blue-500/10">
            <Upload className="h-8 w-8" />
          </div>

          <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">
            Drag & drop your resume file here
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Supports PDF, DOCX, or TXT (up to 10 MB)
          </p>

          <label
            htmlFor="resume-file-input"
            className={`cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all ${
              isProcessing ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{isProcessing ? "Extracting with Groq…" : "Browse Document"}</span>
          </label>

          {/* Upload error */}
          {uploadError && (
            <div className="mt-4 mx-auto max-w-md flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-red-700">Backend extraction failed</p>
                <p className="text-[11px] text-red-600 mt-0.5">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Selected File Card */}
          {uploadedFileName && (
            <div className="mt-6 inline-flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-xs text-emerald-900 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="text-left">
                <span className="font-semibold text-slate-800">Attached:</span>{" "}
                <span className="font-mono font-bold text-emerald-800">{uploadedFileName}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <label className="block text-xs font-semibold text-slate-700">
            Paste your resume text below:
          </label>
          <textarea
            rows={10}
            placeholder={`Name: ${user?.name || "Candidate"}\nEducation: B.Tech Computer Science\nSkills: React, Next.js, Node.js, PostgreSQL\nExperience: Frontend Developer Intern at TechCorp...`}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              onClick={handleParsePastedText}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isProcessing ? "Processing..." : "Extract Skills from Text"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Action to proceed if already attached */}
      {(hasResume || uploadedFileName || profile.skills.length > 0) && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>Proceed to Extracted Skills</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
