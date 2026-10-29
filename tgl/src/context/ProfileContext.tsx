import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  CandidateProfile,
  AchievementEntry,
  Skill,
  HackathonEntry,
  InternshipEntry,
  CertificationEntry,
  ExtractedSkillListInput,
  CategoryCode
} from "../types/contract";
import {
  fetchHealth,
  fetchCurrentProfile,
  saveProfileToBackend,
} from "../lib/api";
import {
  ExtractedJdResult,
  ExtractedResumeResult,
  extractSkillsAndPrerequisitesFromJd
} from "../lib/skillInferenceEngine";
import { COMPANY_JD_DATASET } from "../data/companyJdDataset";
import { toast } from "sonner";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  coverage: Record<CategoryCode, number>;
}

function mergeExtractedEntries<T extends { id: string }>(
  existing: T[],
  extracted: T[],
  identity: (item: T) => string,
): T[] {
  const merged = [...existing];
  const seen = new Set(existing.map((item) => identity(item).toLowerCase().trim()));
  for (const item of extracted) {
    const key = identity(item).toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

interface ProfileContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  hasResume: boolean;
  setHasResume: (val: boolean) => void;
  profile: CandidateProfile;
  activeCandidateId: string;
  isBackendConnected: boolean;
  isSaving: boolean;
  validation: ValidationState;
  activeJdResult: ExtractedJdResult | null;
  setActiveJdResult: (result: ExtractedJdResult | null) => void;
  updateProfile: (updates: Partial<CandidateProfile>) => void;
  saveProfile: () => Promise<void>;
  switchCandidate: (candidateId: string) => Promise<void>;
  ingestAnalyticsPayload: (payload: any) => Promise<void>;
  applyExtractedResumeToProfile: (extracted: ExtractedResumeResult) => void;
  addSkill: (skill: Skill) => void;
  updateSkill: (index: number, skill: Skill) => void;
  removeSkill: (index: number) => void;
  addHackathon: (item: Omit<HackathonEntry, "id">) => void;
  removeHackathon: (id: string) => void;
  addInternship: (item: Omit<InternshipEntry, "id">) => void;
  removeInternship: (id: string) => void;
  addCertification: (item: Omit<CertificationEntry, "id">) => void;
  removeCertification: (id: string) => void;
  addAchievement: (item: Omit<AchievementEntry, "id">) => void;
  removeAchievement: (id: string) => void;
  downloadProfileJSON: () => void;
  copyProfileJSON: () => Promise<boolean>;
  logout: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const DEFAULT_PROFILE: CandidateProfile = {
  name: "",
  email: "",
  education: "",
  skills: [],
  hackathons: [],
  internships: [],
  certifications: [],
  achievements: [],
  preferred_roles: ["Full Stack Developer", "Software Engineer"],
  preferred_mode: "Hybrid",
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User authentication state
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("radix_auth_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === "Alex Morgan" || parsed.email === "alex.morgan@example.com") {
          localStorage.removeItem("radix_auth_user");
          localStorage.removeItem("radix_user_profile");
          return null;
        }
        return parsed;
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [hasResume, setHasResume] = useState<boolean>(() => {
    return localStorage.getItem("radix_has_resume") === "true";
  });

  const [profile, setProfile] = useState<CandidateProfile>(() => {
    const saved = localStorage.getItem("radix_user_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          skills: parsed.skills || [],
          hackathons: parsed.hackathons || [],
          internships: parsed.internships || [],
          certifications: parsed.certifications || [],
          achievements: parsed.achievements || [],
        };
      } catch {
        // fallback
      }
    }
    return DEFAULT_PROFILE;
  });

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Default target JD from Meta React / UI Platform
  const [activeJdResult, setActiveJdResult] = useState<ExtractedJdResult | null>(() => {
    try {
      const defaultJd = COMPANY_JD_DATASET[0];
      return extractSkillsAndPrerequisitesFromJd(defaultJd.rawText, {
        title: defaultJd.role,
        company: defaultJd.company,
        location: defaultJd.location,
        workMode: defaultJd.workMode,
      });
    } catch {
      return null;
    }
  });

  // Sync profile when user updates
  useEffect(() => {
    if (user) {
      localStorage.setItem("radix_auth_user", JSON.stringify(user));
      setProfile((prev) => {
        if (!prev.name || prev.name === "Candidate") {
          return { ...prev, name: user.name, email: user.email };
        }
        return prev;
      });
    } else {
      localStorage.removeItem("radix_auth_user");
    }
  }, [user]);

  // Check backend health
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const healthy = await fetchHealth();
      if (mounted) setIsBackendConnected(healthy);
    };
    check();
    const interval = setInterval(check, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Validation
  const validation = useMemo<ValidationState>(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const coverage: Record<CategoryCode, number> = {
      COD: 0, DSA: 0, OOD: 0, APTI: 0, COMM: 0, AI: 0,
      CLOUD: 0, SQL: 0, SWE: 0, SYSD: 0, NETW: 0, OS: 0, OTHER: 0
    };

    if (!profile.name?.trim()) errors.push("Candidate name is required.");
    if (!profile.email?.trim() || !profile.email.includes("@")) {
      errors.push("A valid email address is required.");
    }
    profile.skills.forEach((s) => {
      if (coverage[s.category_code] !== undefined) {
        coverage[s.category_code]++;
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      coverage,
    };
  }, [profile]);

  const updateProfile = useCallback((updates: Partial<CandidateProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates, last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      return next;
    });
  }, []);

  const saveProfile = useCallback(async () => {
    setIsSaving(true);
    try {
      const saved = await saveProfileToBackend(profile);
      setProfile(saved);
      localStorage.setItem("radix_user_profile", JSON.stringify(saved));
      toast.success("Profile saved successfully!");
    } catch {
      localStorage.setItem("radix_user_profile", JSON.stringify(profile));
      toast.success("Profile saved to local storage!");
    } finally {
      setIsSaving(false);
    }
  }, [profile]);

  // Seamless transfer of extracted resume details & inferred foundation skills
  const applyExtractedResumeToProfile = useCallback((extracted: ExtractedResumeResult) => {
    setProfile((prev) => {
      const seen = new Set(prev.skills.map((s) => s.skill_name.toLowerCase()));
      const mergedSkills: Skill[] = [...prev.skills];

      for (const skill of extracted.allSkills) {
        if (!seen.has(skill.skill_name.toLowerCase())) {
          seen.add(skill.skill_name.toLowerCase());
          mergedSkills.push({
            skill_name: skill.skill_name,
            category_code: skill.category_code,
            evidence: skill.evidence,
            confidence: skill.confidence,
          });
        }
      }

      const updated: CandidateProfile = {
        ...prev,
        name: extracted.name || prev.name || (user?.name ?? "Candidate"),
        email: extracted.email || prev.email || (user?.email ?? "candidate@example.com"),
        phone: extracted.phone || prev.phone,
        education: extracted.education || prev.education,
        institution: extracted.institution || prev.institution,
        cgpa: extracted.cgpa || prev.cgpa,
        graduation_year: extracted.graduationYear || prev.graduation_year,
        linkedin: extracted.linkedin || prev.linkedin,
        github: extracted.github || prev.github,
        portfolio: extracted.portfolio || prev.portfolio,
        summary: extracted.summary || prev.summary,
        skills: mergedSkills,
        internships: mergeExtractedEntries(
          prev.internships || [],
          (extracted.internships || []).map((item, index) => ({
            ...item,
            id: `resume_internship_${Date.now()}_${index}`,
          })),
          (item) => `${item.company}|${item.role}|${item.duration}`,
        ),
        hackathons: mergeExtractedEntries(
          prev.hackathons || [],
          (extracted.hackathons || []).map((item, index) => ({
            ...item,
            id: `resume_hackathon_${Date.now()}_${index}`,
          })),
          (item) => `${item.title}|${item.role_or_project}`,
        ),
        certifications: mergeExtractedEntries(
          prev.certifications || [],
          (extracted.certifications || []).map((item, index) => ({
            ...item,
            id: `resume_certification_${Date.now()}_${index}`,
          })),
          (item) => `${item.name}|${item.issuer}`,
        ),
        achievements: mergeExtractedEntries(
          prev.achievements || [],
          (extracted.achievements || []).map((item, index) => ({
            ...item,
            id: `resume_achievement_${Date.now()}_${index}`,
          })),
          (item) => `${item.title}|${item.date}`,
        ),
        last_updated: new Date().toISOString(),
      };

      localStorage.setItem("radix_user_profile", JSON.stringify(updated));
      saveProfileToBackend(updated).catch(() => {});
      return updated;
    });

    setHasResume(true);
    localStorage.setItem("radix_has_resume", "true");
    toast.success("Resume details and skills transferred to your Profile!");
  }, [user]);

  const addSkill = useCallback((skill: Skill) => {
    setProfile((prev) => {
      const next = { ...prev, skills: [skill, ...prev.skills], last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
    toast.success(`Added ${skill.skill_name}`);
  }, []);

  const updateSkill = useCallback((index: number, skill: Skill) => {
    setProfile((prev) => {
      const nextSkills = [...prev.skills];
      nextSkills[index] = skill;
      const next = { ...prev, skills: nextSkills, last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
    toast.success(`Updated ${skill.skill_name}`);
  }, []);

  const removeSkill = useCallback((index: number) => {
    setProfile((prev) => {
      const removed = prev.skills[index];
      const nextSkills = prev.skills.filter((_, i) => i !== index);
      const next = { ...prev, skills: nextSkills, last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      if (removed) toast.info(`Removed ${removed.skill_name}`);
      return next;
    });
  }, []);

  const addHackathon = useCallback((item: Omit<HackathonEntry, "id">) => {
    const entry: HackathonEntry = { ...item, id: `h_${Date.now()}` };
    setProfile((prev) => {
      const next = { ...prev, hackathons: [entry, ...prev.hackathons], last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
    toast.success(`Added hackathon: ${entry.title}`);
  }, []);

  const removeHackathon = useCallback((id: string) => {
    setProfile((prev) => {
      const next = { ...prev, hackathons: prev.hackathons.filter((h) => h.id !== id), last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
  }, []);

  const addInternship = useCallback((item: Omit<InternshipEntry, "id">) => {
    const entry: InternshipEntry = { ...item, id: `i_${Date.now()}` };
    setProfile((prev) => {
      const next = { ...prev, internships: [entry, ...prev.internships], last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
    toast.success(`Added experience at ${entry.company}`);
  }, []);

  const removeInternship = useCallback((id: string) => {
    setProfile((prev) => {
      const next = { ...prev, internships: prev.internships.filter((i) => i.id !== id), last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
  }, []);

  const addCertification = useCallback((item: Omit<CertificationEntry, "id">) => {
    const entry: CertificationEntry = { ...item, id: `c_${Date.now()}` };
    setProfile((prev) => {
      const next = { ...prev, certifications: [entry, ...prev.certifications], last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
    toast.success(`Added certification: ${entry.name}`);
  }, []);

  const removeCertification = useCallback((id: string) => {
    setProfile((prev) => {
      const next = { ...prev, certifications: prev.certifications.filter((c) => c.id !== id), last_updated: new Date().toISOString() };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
  }, []);

  const addAchievement = useCallback((item: Omit<AchievementEntry, "id">) => {
    const entry: AchievementEntry = { ...item, id: `a_${Date.now()}` };
    setProfile((prev) => {
      const next = {
        ...prev,
        achievements: [entry, ...(prev.achievements || [])],
        last_updated: new Date().toISOString(),
      };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
    toast.success(`Added achievement: ${entry.title}`);
  }, []);

  const removeAchievement = useCallback((id: string) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        achievements: (prev.achievements || []).filter((item) => item.id !== id),
        last_updated: new Date().toISOString(),
      };
      localStorage.setItem("radix_user_profile", JSON.stringify(next));
      saveProfileToBackend(next).catch(() => {});
      return next;
    });
  }, []);

  const downloadProfileJSON = useCallback(() => {
    const exportData = {
      name: profile.name,
      email: profile.email,
      education: profile.education,
      skills: profile.skills,
      hackathons: profile.hackathons,
      internships: profile.internships,
      certifications: profile.certifications,
      achievements: profile.achievements || [],
      preferred_roles: profile.preferred_roles,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(profile.name || "candidate").toLowerCase().replace(/\s+/g, "_")}_profile.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded profile JSON");
  }, [profile]);

  const copyProfileJSON = useCallback(async (): Promise<boolean> => {
    try {
      const exportData = {
        name: profile.name,
        email: profile.email,
        education: profile.education,
        skills: profile.skills,
        hackathons: profile.hackathons,
        internships: profile.internships,
        certifications: profile.certifications,
        achievements: profile.achievements || [],
        preferred_roles: profile.preferred_roles,
      };
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      toast.success("Copied profile JSON to clipboard!");
      return true;
    } catch {
      toast.error("Failed to copy JSON.");
      return false;
    }
  }, [profile]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("radix_auth_user");
    toast.info("Logged out successfully.");
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        user,
        setUser,
        hasResume,
        setHasResume,
        profile,
        activeCandidateId: "user",
        isBackendConnected,
        isSaving,
        validation,
        activeJdResult,
        setActiveJdResult,
        updateProfile,
        saveProfile,
        switchCandidate: async () => {},
        ingestAnalyticsPayload: async (payload: any) => {
          if (payload.skills) {
            applyExtractedResumeToProfile({
              name: payload.name || profile.name,
              email: payload.email || profile.email,
              phone: payload.phone || profile.phone,
              education: payload.education || profile.education,
              cgpa: payload.cgpa || profile.cgpa,
              graduationYear: payload.graduation_year || profile.graduation_year,
              summary: "",
              explicitSkills: payload.skills,
              impliedSkills: [],
              allSkills: payload.skills,
              categoryCoverage: {} as any,
              rawJsonExport: payload,
            });
          }
        },
        applyExtractedResumeToProfile,
        addSkill,
        updateSkill,
        removeSkill,
        addHackathon,
        removeHackathon,
        addInternship,
        removeInternship,
        addCertification,
        removeCertification,
        addAchievement,
        removeAchievement,
        downloadProfileJSON,
        copyProfileJSON,
        logout,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
