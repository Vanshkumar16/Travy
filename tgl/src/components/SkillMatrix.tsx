import React, { useState, useMemo } from "react";
import { useProfile } from "../context/ProfileContext";
import {
  CategoryCode,
  ConfidenceLevel,
  Skill,
  RADIX_SKILL_CATEGORIES
} from "../types/contract";
import { CategoryBadge } from "./CategoryBadge";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  Info,
  ShieldCheck,
  Quote
} from "lucide-react";

export const SkillMatrix: React.FC = () => {
  const { profile, addSkill, updateSkill, removeSkill, validation } = useProfile();

  const [selectedCategory, setSelectedCategory] = useState<CategoryCode | "ALL">("ALL");
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form state for add/edit
  const [formSkillName, setFormSkillName] = useState<string>("");
  const [formCategory, setFormCategory] = useState<CategoryCode>("COD");
  const [formConfidence, setFormConfidence] = useState<ConfidenceLevel>("high");
  const [formEvidence, setFormEvidence] = useState<string>("");

  // Smart auto-detection of category from skill name
  const handleSkillNameChange = (name: string) => {
    setFormSkillName(name);
    const lower = name.toLowerCase();

    if (lower.includes("tree") || lower.includes("graph") || lower.includes("dsa") || lower.includes("leetcode") || lower.includes("dynamic programming") || lower.includes("sort")) {
      setFormCategory("DSA");
    } else if (lower.includes("python") || lower.includes("c++") || lower.includes("java") || lower.includes("typescript") || lower.includes("javascript") || lower.includes("golang") || lower.includes("rust")) {
      setFormCategory("COD");
    } else if (lower.includes("solid") || lower.includes("design pattern") || lower.includes("oop") || lower.includes("factory")) {
      setFormCategory("OOD");
    } else if (lower.includes("math") || lower.includes("quantitative") || lower.includes("logic") || lower.includes("aptitude") || lower.includes("statistics")) {
      setFormCategory("APTI");
    } else if (lower.includes("communication") || lower.includes("presentation") || lower.includes("writing") || lower.includes("client") || lower.includes("dashboard")) {
      setFormCategory("COMM");
    } else if (lower.includes("ml") || lower.includes("ai") || lower.includes("pytorch") || lower.includes("llm") || lower.includes("neural") || lower.includes("deep learning") || lower.includes("xgboost")) {
      setFormCategory("AI");
    } else if (lower.includes("aws") || lower.includes("cloud") || lower.includes("docker") || lower.includes("kubernetes") || lower.includes("gcp") || lower.includes("devops")) {
      setFormCategory("CLOUD");
    } else if (lower.includes("sql") || lower.includes("postgres") || lower.includes("database") || lower.includes("oracle db") || lower.includes("mysql") || lower.includes("indexing")) {
      setFormCategory("SQL");
    } else if (lower.includes("test") || lower.includes("git") || lower.includes("ci/cd") || lower.includes("agile") || lower.includes("junit") || lower.includes("qa")) {
      setFormCategory("SWE");
    } else if (lower.includes("system design") || lower.includes("microservice") || lower.includes("distributed") || lower.includes("kafka") || lower.includes("redis") || lower.includes("raft")) {
      setFormCategory("SYSD");
    } else if (lower.includes("tcp") || lower.includes("network") || lower.includes("http") || lower.includes("websocket") || lower.includes("grpc") || lower.includes("socket")) {
      setFormCategory("NETW");
    } else if (lower.includes("linux") || lower.includes("os") || lower.includes("kernel") || lower.includes("process") || lower.includes("concurrency") || lower.includes("epoll")) {
      setFormCategory("OS");
    }
  };

  const openAddModal = () => {
    setFormSkillName("");
    setFormCategory("COD");
    setFormConfidence("high");
    setFormEvidence("");
    setEditingIndex(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (skill: Skill, index: number) => {
    setFormSkillName(skill.skill_name);
    setFormCategory(skill.category_code);
    setFormConfidence(skill.confidence);
    setFormEvidence(skill.evidence);
    setEditingIndex(index);
    setIsAddModalOpen(true);
  };

  const handleSubmitSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSkillName.trim()) return;

    const skillData: Skill = {
      skill_name: formSkillName.trim(),
      category_code: formCategory,
      confidence: formConfidence,
      evidence: formEvidence.trim() || `Demonstrated competency in ${formSkillName}`,
    };

    if (editingIndex !== null) {
      updateSkill(editingIndex, skillData);
    } else {
      addSkill(skillData);
    }

    setIsAddModalOpen(false);
  };

  // Filter skills
  const filteredSkills = useMemo(() => {
    return profile.skills.filter((s) => {
      const matchesCategory = selectedCategory === "ALL" || s.category_code === selectedCategory;
      const matchesConfidence = selectedConfidence === "ALL" || s.confidence === selectedConfidence;
      const matchesSearch =
        searchQuery === "" ||
        s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.evidence.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesConfidence && matchesSearch;
    });
  }, [profile.skills, selectedCategory, selectedConfidence, searchQuery]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Title & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
            Competencies
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified skills with confidence ratings and supporting project evidence.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Categories Visual Filter Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Categories ({Object.values(validation.coverage).filter((v) => v > 0).length} active)
          </span>
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`text-xs font-medium px-2 py-0.5 rounded-md transition-colors ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Show All ({profile.skills.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
          {(Object.keys(RADIX_SKILL_CATEGORIES) as CategoryCode[]).map((code) => {
            const meta = RADIX_SKILL_CATEGORIES[code];
            const count = validation.coverage[code] || 0;
            const isSelected = selectedCategory === code;

            return (
              <button
                key={code}
                onClick={() => setSelectedCategory(isSelected ? "ALL" : code)}
                className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-500"
                    : count > 0
                    ? "border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 text-slate-800"
                    : "border-dashed border-slate-200 bg-transparent text-slate-400 opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-xs font-bold" style={{ color: count > 0 ? meta.accentHex : undefined }}>
                    {code}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      count > 0 ? "bg-white text-slate-700 border border-slate-200" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-600 truncate w-full mt-0.5">
                  {meta.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills by name or evidence quote..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Confidence:</span>
          {(["ALL", "high", "medium", "low"] as const).map((conf) => (
            <button
              key={conf}
              onClick={() => setSelectedConfidence(conf)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                selectedConfidence === conf
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {conf}
            </button>
          ))}
        </div>
      </div>

      {/* Skill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill, index) => {
          return (
            <div
              key={`${skill.skill_name}-${index}`}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md transition-shadow group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge code={skill.category_code} showName={false} size="sm" />
                    <span
                      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${
                        skill.confidence === "high"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : skill.confidence === "medium"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {skill.confidence} confidence
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(skill, index)}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="Edit skill"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeSkill(index)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                      title="Delete skill"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {skill.skill_name}
                </h4>

                <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600 leading-relaxed">
                  <div className="flex items-center gap-1 font-semibold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                    <Quote className="h-3 w-3 text-slate-400" />
                    <span>Evidence</span>
                  </div>
                  <p className="italic">{skill.evidence || "No evidence recorded"}</p>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSkills.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
            <Info className="h-8 w-8 text-slate-400 mb-2" />
            <h4 className="font-heading text-sm font-bold text-slate-700">No skills match your filters</h4>
            <p className="text-xs text-slate-500 mt-1">Try resetting the category filter or add a new skill.</p>
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setSelectedConfidence("ALL");
                setSearchQuery("");
              }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Skill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmitSkill}>
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
                <h3 className="font-heading text-base font-bold text-slate-900">
                  {editingIndex !== null ? "Edit Skill" : "Add Skill"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4 p-6">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Skill Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={formSkillName}
                    onChange={(e) => handleSkillNameChange(e.target.value)}
                    placeholder="e.g. C++, PyTorch, PostgreSQL, System Design..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Category:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CategoryCode)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden bg-white font-mono"
                  >
                    {(Object.keys(RADIX_SKILL_CATEGORIES) as CategoryCode[]).map((code) => {
                      const meta = RADIX_SKILL_CATEGORIES[code];
                      return (
                        <option key={code} value={code}>
                          {code} — {meta.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Confidence:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["high", "medium", "low"] as const).map((conf) => (
                      <button
                        key={conf}
                        type="button"
                        onClick={() => setFormConfidence(conf)}
                        className={`rounded-xl p-2 text-xs font-semibold capitalize border transition-all ${
                          formConfidence === conf
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {conf}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Evidence:
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formEvidence}
                    onChange={(e) => setFormEvidence(e.target.value)}
                    placeholder="Short quote or reason from projects/experience..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-3.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                >
                  {editingIndex !== null ? "Save Changes" : "Add Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
