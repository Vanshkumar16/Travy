import React, { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Globe,
  Github,
  Linkedin,
  Building,
  Briefcase,
  FileText,
  Upload,
  CheckCircle,
  Save,
  Download
} from "lucide-react";
import { toast } from "sonner";

export const BasicInfoSection: React.FC = () => {
  const { profile, updateProfile, saveProfile, isSaving } = useProfile();

  const [roleInput, setRoleInput] = useState("");

  const ALL_PREFERRED_ROLES = [
    "Software Engineer (SWE)",
    "Data Scientist",
    "Data Analyst",
    "Associate Software Engineer",
    "Application Support Analyst",
    "Backend Systems Engineer",
    "Cloud & DevOps Engineer"
  ];

  const ALL_TARGET_COMPANIES = [
    "Google LLC",
    "Microsoft Corporation",
    "Oracle Financial Services Software"
  ];

  const togglePreferredRole = (role: string) => {
    const current = profile.preferred_roles || [];
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    updateProfile({ preferred_roles: updated });
  };

  const toggleTargetCompany = (comp: string) => {
    const current = profile.preferred_companies || [];
    const updated = current.includes(comp)
      ? current.filter((c) => c !== comp)
      : [...current, comp];
    updateProfile({ preferred_companies: updated });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateProfile({
        cv_file: file.name,
        cv_uploaded_at: new Date().toISOString(),
      });
      toast.success(`Attached CV file: ${file.name}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
            Biographical Details & Target Roles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal information, links, and target career preferences.
          </p>
        </div>

        <button
          onClick={saveProfile}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Saving..." : "Save Details"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Contact Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Personal Info Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>Biographical Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder="e.g. Ananya Rao"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateProfile({ email: e.target.value })}
                  placeholder="e.g. ananya.rao@example.com"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => updateProfile({ phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Preferred Work Mode
                </label>
                <select
                  value={profile.preferred_mode || "Hybrid"}
                  onChange={(e) => updateProfile({ preferred_mode: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Professional Summary
                </label>
                <textarea
                  rows={2}
                  value={profile.summary || ""}
                  onChange={(e) => updateProfile({ summary: e.target.value })}
                  placeholder="Concise overview of engineering focus, specialized technologies, and career trajectory..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Education Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              <span>Academic Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Degree & Major <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.education}
                  onChange={(e) => updateProfile({ education: e.target.value })}
                  placeholder="e.g. B.Tech in Computer Science and Engineering, 2024, CGPA 8.9 / 10.0"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  College / Institution
                </label>
                <input
                  type="text"
                  value={profile.institution || ""}
                  onChange={(e) => updateProfile({ institution: e.target.value })}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    CGPA / GPA
                  </label>
                  <input
                    type="text"
                    value={profile.cgpa || ""}
                    onChange={(e) => updateProfile({ cgpa: e.target.value })}
                    placeholder="8.9"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Grad Year
                  </label>
                  <input
                    type="text"
                    value={profile.graduation_year || ""}
                    onChange={(e) => updateProfile({ graduation_year: e.target.value })}
                    placeholder="2024"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Online Profiles & Repos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-600" />
              <span>Online Repositories & Profiles</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Linkedin className="h-3.5 w-3.5 text-blue-600" />
                  <span>LinkedIn</span>
                </label>
                <input
                  type="url"
                  value={profile.linkedin || ""}
                  onChange={(e) => updateProfile({ linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Github className="h-3.5 w-3.5 text-slate-800" />
                  <span>GitHub</span>
                </label>
                <input
                  type="url"
                  value={profile.github || ""}
                  onChange={(e) => updateProfile({ github: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Portfolio</span>
                </label>
                <input
                  type="url"
                  value={profile.portfolio || ""}
                  onChange={(e) => updateProfile({ portfolio: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Roles, Companies & CV Upload */}
        <div className="flex flex-col gap-6">
          {/* Target Roles */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span>Preferred Target Roles</span>
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Used for automated skill matching and personalized gap analysis.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {ALL_PREFERRED_ROLES.map((role) => {
                const isSelected = profile.preferred_roles?.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => togglePreferredRole(role)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Companies in Scope */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-600" />
              <span>Target Companies</span>
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Companies evaluated during automated hiring benchmark analysis.
            </p>

            <div className="flex flex-col gap-2">
              {ALL_TARGET_COMPANIES.map((comp) => {
                const isSelected = profile.preferred_companies?.includes(comp);
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => toggleTargetCompany(comp)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold shadow-xs"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{comp}</span>
                    {isSelected && <CheckCircle className="h-4 w-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CV File Upload Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600" />
              <span>CV Document Attachment</span>
            </h3>

            <div className="rounded-xl border border-dashed border-slate-300 p-4 bg-slate-50 text-center">
              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-800">
                {profile.cv_file || "No CV attached"}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                PDF or Word (.docx) format
              </p>

              <label className="mt-3 cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs">
                <Upload className="h-3.5 w-3.5 text-slate-600" />
                <span>Replace / Attach CV</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
