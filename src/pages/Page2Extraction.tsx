import React, { useState, useMemo } from "react";
import { useProfile } from "../context/ProfileContext";
import { CategoryBadge } from "../components/CategoryBadge";
import { RADIX_SKILL_CATEGORIES, CategoryCode } from "../types/contract";
import {
  extractSkillsAndPrerequisitesFromResume,
  InferredSkillItem,
  ExtractedResumeResult,
} from "../lib/skillInferenceEngine";
import { extractSkillsFromResumeFile, GroqExtractedSkill } from "../lib/api";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Upload,
  RefreshCw,
  AlertCircle,
  Loader2,
  FileText,
  CheckCircle2,
  Target,
  FileCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface Page2ExtractionProps {
  onNext: () => void;
  onBack: () => void;
}

function groqSkillsToInferred(groqSkills: GroqExtractedSkill[]): InferredSkillItem[] {
  return groqSkills.map((s, i) => ({
    id: `groq_${i}_${Date.now()}`,
    skill_name: s.skill_name,
    category_code: (s.category_code as CategoryCode) ?? "OTHER",
    evidence: s.evidence,
    confidence: s.confidence,
    isImplied: s.mention_type === "implied",
    impliedBy: s.mention_type === "implied" ? "Groq LLM Inference" : undefined,
  }));
}

export const Page2Extraction: React.FC<Page2ExtractionProps> = ({ onNext, onBack }) => {
  const { user, profile, updateProfile, applyExtractedResumeToProfile, activeJdResult } =
    useProfile();

  // Initially display upload button; set to true once a resume is uploaded
  const [hasUploaded, setHasUploaded] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Extracted skills in state
  const [currentSkills, setCurrentSkills] = useState<InferredSkillItem[]>([]);

  // Filter tabs: 'all' | 'matching' | 'explicit' | 'implied'
  const [filterType, setFilterType] = useState<"all" | "matching" | "explicit" | "implied">("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryCode | "ALL">("ALL");

  // Implied skill selection
  const [selectedImpliedSkills, setSelectedImpliedSkills] = useState<Set<string>>(new Set());

  const toggleImpliedSkill = (name: string) => {
    setSelectedImpliedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // ── Matching with Target Job Description ──────────────────────────────────
  const targetJdSkills = useMemo(() => {
    if (!activeJdResult) return [];
    return activeJdResult.allSkills || [];
  }, [activeJdResult]);

  // Helper to determine if a resume skill matches the target job
  const isSkillMatchedWithJd = useMemo(() => {
    const jdSkillNames = targetJdSkills.map((j) => j.skill_name.toLowerCase());

    return (skillName: string, categoryCode: CategoryCode) => {
      const sLower = skillName.toLowerCase();
      // Direct substring match
      const directMatch = jdSkillNames.some(
        (j) => j === sLower || j.includes(sLower) || sLower.includes(j)
      );
      if (directMatch) return true;

      // Common framework-to-language or tech relationships
      if (sLower.includes("react") && jdSkillNames.some((j) => j.includes("javascript") || j.includes("frontend"))) return true;
      if (sLower.includes("python") && jdSkillNames.some((j) => j.includes("machine learning") || j.includes("fastapi") || j.includes("django"))) return true;
      if (sLower.includes("docker") && jdSkillNames.some((j) => j.includes("devops") || j.includes("cloud") || j.includes("kubernetes"))) return true;
      if (sLower.includes("sql") && jdSkillNames.some((j) => j.includes("database") || j.includes("postgresql") || j.includes("mysql"))) return true;

      return false;
    };
  }, [targetJdSkills]);

  // All skills with match status
  const annotatedSkills = useMemo(() => {
    return currentSkills.map((skill) => ({
      ...skill,
      isJdMatch: isSkillMatchedWithJd(skill.skill_name, skill.category_code),
    }));
  }, [currentSkills, isSkillMatchedWithJd]);

  // Match statistics
  const matchingSkillsCount = useMemo(() => {
    return annotatedSkills.filter((s) => s.isJdMatch).length;
  }, [annotatedSkills]);

  // ── File upload handler ──────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processResumeFile(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processResumeFile(file);
  };

  const processResumeFile = async (file: File) => {
    setExtractionError(null);
    setHasUploaded(false);
    setIsExtracting(true);
    setUploadedFileName(file.name);

    try {
      // 1. Send file to Groq backend
      const result = await extractSkillsFromResumeFile(file);
      const inferred = groqSkillsToInferred(result.skills);
      const explicit = inferred.filter((s) => !s.isImplied);
      const implied = inferred.filter((s) => s.isImplied);
      const { profile: extractedProfile } = result;

      setCurrentSkills(inferred);
      setSelectedImpliedSkills(new Set(implied.map((s) => s.skill_name)));

      // Save to profile context
      applyExtractedResumeToProfile({
        name: extractedProfile.name || profile.name || user?.name || "Candidate",
        email: extractedProfile.email || profile.email || user?.email || "candidate@example.com",
        phone: extractedProfile.phone || "",
        education: extractedProfile.education || "",
        institution: extractedProfile.institution || undefined,
        cgpa: extractedProfile.cgpa || "",
        graduationYear: extractedProfile.graduation_year || "",
        linkedin: extractedProfile.linkedin || undefined,
        github: extractedProfile.github || undefined,
        portfolio: extractedProfile.portfolio || undefined,
        summary: extractedProfile.summary || "",
        internships: result.experience,
        hackathons: result.hackathons.map(({ link, ...item }) => ({
          ...item,
          link: link || undefined,
        })),
        achievements: result.achievements,
        certifications: result.certifications.map(({ credential_id_or_url, ...item }) => ({
          ...item,
          credential_id_or_url: credential_id_or_url || undefined,
        })),
        explicitSkills: explicit,
        impliedSkills: implied,
        allSkills: inferred,
        categoryCoverage: {} as any,
        rawJsonExport: {},
      });

      updateProfile({
        cv_file: file.name,
        cv_uploaded_at: new Date().toISOString(),
      });

      setHasUploaded(true);
      toast.success(
        `Extracted ${result.skills_extracted} skills, ${result.hackathons.length} competitions, ${result.achievements.length} achievements, ${result.experience.length} work records, and ${result.certifications.length} certifications.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setExtractionError(msg);
      if (file.name.toLowerCase().endsWith(".txt")) {
        try {
          const text = await file.text();
          if (text.trim().length < 20) {
            throw new Error("The text resume is empty or too short to extract.");
          }
          const extracted = extractSkillsAndPrerequisitesFromResume(text);
          setCurrentSkills(extracted.allSkills);
          setSelectedImpliedSkills(new Set(extracted.impliedSkills.map((s) => s.skill_name)));
          applyExtractedResumeToProfile(extracted);
          updateProfile({
            cv_file: file.name,
            cv_uploaded_at: new Date().toISOString(),
          });
          setHasUploaded(true);
          setExtractionError(null);
          toast.warning("Used local text extraction. Work history, competitions, achievements, and certifications require the Groq backend.");
        } catch (fallbackError: unknown) {
          const fallbackMessage = fallbackError instanceof Error
            ? fallbackError.message
            : "Local text extraction failed.";
          setExtractionError(fallbackMessage);
          toast.error(fallbackMessage);
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Filtered skills ──────────────────────────────────────────────────────
  const displayedSkills = useMemo(() => {
    let list = annotatedSkills;
    if (filterType === "matching") list = list.filter((s) => s.isJdMatch);
    if (filterType === "explicit") list = list.filter((s) => !s.isImplied);
    if (filterType === "implied") list = list.filter((s) => s.isImplied);
    if (selectedCategoryFilter !== "ALL") {
      list = list.filter((s) => s.category_code === selectedCategoryFilter);
    }
    return list;
  }, [annotatedSkills, filterType, selectedCategoryFilter]);

  const skillsByCategory = useMemo(() => {
    const groups: Partial<Record<CategoryCode, typeof displayedSkills>> = {};
    displayedSkills.forEach((skill) => {
      const code = skill.category_code || "OTHER";
      if (!groups[code]) groups[code] = [];
      groups[code]!.push(skill);
    });
    return groups;
  }, [displayedSkills]);

  const activeCategories = useMemo(() => {
    const cats = new Set<CategoryCode>();
    annotatedSkills.forEach((s) => cats.add(s.category_code));
    return Array.from(cats);
  }, [annotatedSkills]);

  const handleContinue = () => {
    const finalSkills: InferredSkillItem[] = currentSkills.filter((s) => {
      if (!s.isImplied) return true;
      return selectedImpliedSkills.has(s.skill_name);
    });

    applyExtractedResumeToProfile({
      name: profile.name || user?.name || "Candidate",
      email: profile.email || user?.email || "candidate@example.com",
      phone: profile.phone || "",
      education: profile.education || "",
      cgpa: profile.cgpa || "",
      graduationYear: profile.graduation_year || "",
      summary: profile.summary || `Skills extracted from ${uploadedFileName}`,
      explicitSkills: finalSkills.filter((s) => !s.isImplied),
      impliedSkills: finalSkills.filter((s) => s.isImplied),
      allSkills: finalSkills,
      categoryCoverage: {} as any,
      rawJsonExport: {},
    });

    onNext();
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — STATE 1: Upload Prompt (Firstly display upload button)
  // ══════════════════════════════════════════════════════════════════════════
  if (!hasUploaded) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        {/* Top Back Navigation */}
        <div className="w-full flex items-center mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job Analysis
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-50 ring-1 ring-blue-500/20 shadow-sm mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Resume Scanner
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Upload your resume file. Our Groq LLM extraction engine will analyze your experience, extract all verified skills, and return the matching competencies.
          </p>

          {/* Active Job Target Chip */}
          {activeJdResult && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-3.5 py-1 text-xs text-blue-700">
              <Target className="h-3.5 w-3.5 text-blue-600" />
              <span>
                Matching against: <strong className="font-semibold">{activeJdResult.role}</strong> at{" "}
                <strong className="font-semibold">{activeJdResult.company}</strong> ({targetJdSkills.length} skills required)
              </span>
            </div>
          )}
        </div>

        {/* Primary Resume Upload Dropzone */}
        <div className="w-full">
          <input
            type="file"
            id="resume-upload-input"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={handleFileChange}
            disabled={isExtracting}
          />

          <label
            htmlFor="resume-upload-input"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`group w-full flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed p-14 text-center cursor-pointer transition-all shadow-sm ${
              isExtracting
                ? "border-blue-300 bg-blue-50/50 cursor-not-allowed"
                : isDragOver
                ? "border-blue-600 bg-blue-50/80 scale-[1.01]"
                : "border-slate-300 bg-white hover:border-blue-500 hover:bg-slate-50/70"
            }`}
          >
            {isExtracting ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <div>
                  <p className="text-base font-bold text-slate-900">
                    Scanning resume with Groq LLM…
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Extracting skills and evaluating job requirements
                  </p>
                </div>
                {uploadedFileName && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100/80 px-3 py-1 font-mono text-xs font-semibold text-blue-800">
                    <FileText className="h-3.5 w-3.5" />
                    {uploadedFileName}
                  </span>
                )}
              </div>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Upload your Resume
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 mt-2">
                    Accepts PDF, DOCX, or TXT · Max 10 MB · Powered by Groq AI
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm group-hover:bg-blue-700 transition-all">
                  <Upload className="h-4 w-4" />
                  Select Resume File
                </div>
              </>
            )}
          </label>

          {/* Extraction Error Notice */}
          {extractionError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-rose-800">
                  Resume extraction failed
                </p>
                <p className="text-xs text-rose-700 mt-0.5">
                  {extractionError}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — STATE 2: Skills View (Displays skills after upload)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Resume Skills
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              Extracted
            </span>
          </div>
          {uploadedFileName && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-mono font-semibold text-slate-700">{uploadedFileName}</span>
              <span className="text-slate-300">·</span>
              <span>{annotatedSkills.length} total competencies found</span>
            </div>
          )}
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {/* Upload another resume button */}
          <button
            onClick={() => setHasUploaded(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Scan Another Resume
          </button>

          <button
            onClick={handleContinue}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "all" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Skills ({annotatedSkills.length})
          </button>

          {activeJdResult && (
            <button
              onClick={() => setFilterType("matching")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                filterType === "matching"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Target className="h-3 w-3" />
              Matching Job ({matchingSkillsCount})
            </button>
          )}

          <button
            onClick={() => setFilterType("explicit")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "explicit" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Direct Mentions ({annotatedSkills.filter((s) => !s.isImplied).length})
          </button>

          <button
            onClick={() => setFilterType("implied")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "implied" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Inferred ({annotatedSkills.filter((s) => s.isImplied).length})
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-400 hidden sm:inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          Showing {displayedSkills.length} skills
        </span>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryFilter("ALL")}
          className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
            selectedCategoryFilter === "ALL"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          All Categories
        </button>
        {activeCategories.map((code) => {
          const meta = RADIX_SKILL_CATEGORIES[code];
          return (
            <button
              key={code}
              onClick={() => setSelectedCategoryFilter(code)}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedCategoryFilter === code
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {code} · {meta?.name || code}
            </button>
          );
        })}
      </div>

      {/* Skills Grid */}
      {Object.keys(skillsByCategory).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No skills match the current filter.</p>
          <button
            onClick={() => {
              setFilterType("all");
              setSelectedCategoryFilter("ALL");
            }}
            className="mt-2 text-xs text-blue-600 font-semibold underline underline-offset-2"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.keys(skillsByCategory) as CategoryCode[]).map((catCode) => {
            const skillsInCat = skillsByCategory[catCode] || [];
            const meta = RADIX_SKILL_CATEGORIES[catCode];
            return (
              <div key={catCode} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                {/* Category Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <CategoryBadge code={catCode} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {meta?.name || catCode} ({catCode})
                      </h3>
                      <p className="text-[11px] text-slate-500">{meta?.shortDesc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {skillsInCat.length}
                  </span>
                </div>

                {/* Skill Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skillsInCat.map((skill, i) => {
                    const isImplied = skill.isImplied;
                    const isApproved = !isImplied || selectedImpliedSkills.has(skill.skill_name);
                    const isMatched = skill.isJdMatch;

                    return (
                      <div
                        key={skill.id || i}
                        className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                          isMatched
                            ? "border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-500/20"
                            : isImplied
                            ? "border-indigo-200 bg-indigo-50/30"
                            : "border-slate-200 bg-slate-50/40"
                        } ${!isApproved ? "opacity-50" : ""}`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              {skill.skill_name}
                              {isMatched && (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <Target className="h-3 w-3 text-emerald-600" />
                                  Matches Job
                                </span>
                              )}
                            </h4>

                            {isImplied ? (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded">
                                Inferred
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Direct Mention
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-2">
                            "{skill.evidence}"
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                          <span className="capitalize text-slate-400 font-medium">
                            {skill.confidence} confidence
                          </span>
                          {isImplied && (
                            <button
                              type="button"
                              onClick={() => toggleImpliedSkill(skill.skill_name)}
                              className={`font-bold px-2.5 py-0.5 rounded transition-colors ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                              }`}
                            >
                              {isApproved ? "Approved ✓" : "Excluded"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Job Analysis
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHasUploaded(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="h-4 w-4 text-slate-400" />
            Upload Different Resume
          </button>

          <button
            onClick={handleContinue}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            Continue to Profile Builder
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
