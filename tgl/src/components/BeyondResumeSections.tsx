import React, { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { AchievementEntry, HackathonEntry, InternshipEntry, CertificationEntry } from "../types/contract";
import {
  Award,
  Briefcase,
  BadgeCheck,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  Sparkles,
  Building
} from "lucide-react";

export const HackathonsSection: React.FC = () => {
  const { profile, addHackathon, removeHackathon } = useProfile();
  const [isAdding, setIsAdding] = useState(false);

  const [title, setTitle] = useState("");
  const [roleOrProject, setRoleOrProject] = useState("");
  const [achievement, setAchievement] = useState("");
  const [skillsStr, setSkillsStr] = useState("");
  const [year, setYear] = useState("2024");
  const [link, setLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addHackathon({
      title: title.trim(),
      role_or_project: roleOrProject.trim() || title.trim(),
      achievement: achievement.trim() || "Participant",
      skills_used: skillsStr.split(",").map((s) => s.trim()).filter(Boolean),
      year: year.trim() || "2024",
      link: link.trim() || undefined,
    });

    setTitle("");
    setRoleOrProject("");
    setAchievement("");
    setSkillsStr("");
    setLink("");
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
            Hackathons & Coding Competitions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Beyond-the-resume competitive achievements demonstrating real-time prototyping under pressure.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{isAdding ? "Cancel" : "Add Hackathon"}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Record Hackathon Experience</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Hackathon Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HackSystem 2024, Smart India Hackathon..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Project Title / Submission
              </label>
              <input
                type="text"
                value={roleOrProject}
                onChange={(e) => setRoleOrProject(e.target.value)}
                placeholder="e.g. Distributed Raft Key-Value Store"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Achievement / Standing
              </label>
              <input
                type="text"
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                placeholder="e.g. 1st Place Winner, Top 10 Finalist..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Year</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Project Link / Repo</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden bg-white"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Technologies & Skills Used (comma separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="Go, Raft, gRPC, Docker, Linux..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden bg-white"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Save Hackathon
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.hackathons.map((h) => (
          <div
            key={h.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  <Award className="h-3 w-3 text-amber-600" />
                  <span>{h.year}</span>
                </span>
                <button
                  onClick={() => removeHackathon(h.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h4 className="text-base font-bold text-slate-900">{h.title}</h4>
              <p className="text-xs font-medium text-slate-600 mt-1">
                Project: <span className="text-slate-800 font-semibold">{h.role_or_project}</span>
              </p>
              <div className="mt-2 inline-block rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                🏆 {h.achievement}
              </div>

              {h.skills_used && h.skills_used.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {h.skills_used.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-700 font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {h.link && (
              <a
                href={h.link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                <span>View Project Repository</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ))}

        {profile.hackathons.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white">
            <Award className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-heading text-sm font-bold text-slate-700">No hackathons recorded yet</h4>
            <p className="text-xs text-slate-500 mt-1">
              Adding hackathons provides strong signal for technical and system building benchmarks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const InternshipsSection: React.FC = () => {
  const { profile, addInternship, removeInternship } = useProfile();
  const [isAdding, setIsAdding] = useState(false);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [duration, setDuration] = useState("3 months");
  const [description, setDescription] = useState("");
  const [skillsStr, setSkillsStr] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    addInternship({
      company: company.trim(),
      role: role.trim(),
      duration: duration.trim(),
      description: description.trim(),
      skills_used: skillsStr.split(",").map((s) => s.trim()).filter(Boolean),
    });

    setCompany("");
    setRole("");
    setDuration("3 months");
    setDescription("");
    setSkillsStr("");
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
            Internships & Professional Work Experience
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Practical engineering experience, production deployments, and team collaboration history.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{isAdding ? "Cancel" : "Add Internship"}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Record Internship / Work Experience</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. HighLoad Systems Corp, TechScale Global..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Role Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Systems Engineering Intern, Data Analyst..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Duration / Timeline
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. Jan 2024 - Jun 2024 (6 months)"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Key Skills / Technologies (comma separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="C++, Go, Docker, PostgreSQL, BigQuery..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Accomplishments & Responsibilities
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe key impact, e.g. 'Optimized lock contention in storage engine, reducing tail latency by 28%.'..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Save Internship
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.internships.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <Briefcase className="h-3 w-3 text-emerald-600" />
                  <span>{item.duration}</span>
                </span>
                <button
                  onClick={() => removeInternship(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h4 className="text-base font-bold text-slate-900">{item.role}</h4>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">{item.company}</p>

              <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {item.description}
              </p>

              {item.skills_used && item.skills_used.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.skills_used.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-700 font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {profile.internships.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white">
            <Briefcase className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-heading text-sm font-bold text-slate-700">No internships recorded</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add internships or work experience to strengthen the candidate profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const CertificationsSection: React.FC = () => {
  const { profile, addCertification, removeCertification } = useProfile();
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("2024");
  const [credentialId, setCredentialId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !issuer.trim()) return;

    addCertification({
      name: name.trim(),
      issuer: issuer.trim(),
      issue_date: issueDate.trim(),
      credential_id_or_url: credentialId.trim() || undefined,
    });

    setName("");
    setIssuer("");
    setIssueDate("2024");
    setCredentialId("");
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
            Professional Certifications & Accreditations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified industry certifications (AWS, Google Cloud, Oracle, Linux Foundation, etc.).
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{isAdding ? "Cancel" : "Add Certification"}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Record Certification</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Certification Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AWS Certified Solutions Architect..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Issuing Organization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. Amazon Web Services, Linux Foundation, Oracle..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Issue Date / Year
              </label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="e.g. Dec 2023"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Credential ID or Verification URL
              </label>
              <input
                type="text"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="e.g. AWS-SAA-810923"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-hidden bg-white"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
            >
              Save Certification
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.certifications.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold text-purple-800">
                  <BadgeCheck className="h-3.5 w-3.5 text-purple-600" />
                  <span>{c.issue_date}</span>
                </span>
                <button
                  onClick={() => removeCertification(c.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h4 className="text-base font-bold text-slate-900">{c.name}</h4>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                Issuer: <span className="text-purple-700">{c.issuer}</span>
              </p>

              {c.credential_id_or_url && (
                <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-100 p-2 text-[11px] font-mono text-slate-600 truncate">
                  ID: {c.credential_id_or_url}
                </div>
              )}
            </div>
          </div>
        ))}

        {profile.certifications.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white">
            <BadgeCheck className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-heading text-sm font-bold text-slate-700">No certifications recorded</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add verified industry credentials to substantiate candidate competence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const AchievementsSection: React.FC = () => {
  const { profile, addAchievement, removeAchievement } = useProfile();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const achievements = profile.achievements || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addAchievement({
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
    });
    setTitle("");
    setDescription("");
    setDate("");
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
            Achievements & Awards
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Resume accomplishments, honors, and measurable outcomes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding((current) => !current)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {isAdding ? "Cancel" : "Add Achievement"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold text-slate-700">
              Achievement title
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Date or year
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
              Details
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
              Save Achievement
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement: AchievementEntry) => (
          <article key={achievement.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{achievement.title}</h3>
                {achievement.date && <p className="mt-1 text-[11px] text-slate-500">{achievement.date}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeAchievement(achievement.id)}
                className="p-1 text-slate-400 hover:text-rose-600"
                title="Remove achievement"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {achievement.description && (
              <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{achievement.description}</p>
            )}
          </article>
        ))}
        {achievements.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700">No achievements recorded</h3>
            <p className="mt-1 text-xs text-slate-500">Resume awards and accomplishments will appear here after extraction.</p>
          </div>
        )}
      </div>
    </div>
  );
};
