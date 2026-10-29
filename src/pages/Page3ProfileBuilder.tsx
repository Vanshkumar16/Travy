import React, { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { SkillMatrix } from "../components/SkillMatrix";
import { BasicInfoSection } from "../components/BasicInfoSection";
import {
  HackathonsSection,
  InternshipsSection,
  CertificationsSection,
  AchievementsSection,
} from "../components/BeyondResumeSections";
import {
  ArrowRight,
  ArrowLeft,
  Save,
  GraduationCap,
  Award,
  Briefcase,
  BadgeCheck,
  User,
  Sparkles,
} from "lucide-react";

interface Page3ProfileBuilderProps {
  onNext: () => void;
  onBack: () => void;
  onOpenContractModal: () => void;
}

export const Page3ProfileBuilder: React.FC<Page3ProfileBuilderProps> = ({
  onNext,
  onBack,
  onOpenContractModal,
}) => {
  const { profile, saveProfile, isSaving } = useProfile();
  const [subTab, setSubTab] = useState<"skills" | "hackathons" | "internships" | "certifications" | "achievements" | "overview">("skills");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Profile Builder
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Review extracted resume details, competencies, competitions, achievements, experience, certifications, and career preferences.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={saveProfile}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Save className="h-3.5 w-3.5 text-slate-500" />
            <span>{isSaving ? "Saving..." : "Save Profile"}</span>
          </button>
          <button
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Tabs navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 mb-6 scrollbar-none">
        {[
          { id: "skills" as const, label: "Skills", icon: GraduationCap, count: profile.skills.length },
          { id: "hackathons" as const, label: "Hackathons & Competitions", icon: Award, count: profile.hackathons.length },
          { id: "internships" as const, label: "Experience", icon: Briefcase, count: profile.internships.length },
          { id: "certifications" as const, label: "Certifications", icon: BadgeCheck, count: profile.certifications.length },
          { id: "achievements" as const, label: "Achievements", icon: Sparkles, count: profile.achievements?.length || 0 },
          { id: "overview" as const, label: "Target Roles & Bio", icon: User, count: undefined },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${isActive ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {subTab === "skills" && <SkillMatrix />}
        {subTab === "hackathons" && <HackathonsSection />}
        {subTab === "internships" && <InternshipsSection />}
        {subTab === "certifications" && <CertificationsSection />}
        {subTab === "achievements" && <AchievementsSection />}
        {subTab === "overview" && <BasicInfoSection />}
      </div>

      {/* Bottom Stepper Nav */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
