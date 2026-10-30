import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  CalendarDays,
  Check,
  CircleAlert,
  ExternalLink,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { useProfile } from "../context/ProfileContext";
import { fetchOpportunities } from "../lib/api";
import type {
  Opportunity,
  OpportunityKind,
  OpportunityListResponse,
} from "../types/opportunity";

type OpportunityTab = "all" | "recommended" | "saved" | "planned" | "completed";
type CompletionDraft = {
  opportunity: Opportunity;
  projectOrResult: string;
};

interface StoredOpportunityState {
  savedIds: string[];
  plannedIds: string[];
  completedIds: string[];
}

const EMPTY_STATE: StoredOpportunityState = {
  savedIds: [],
  plannedIds: [],
  completedIds: [],
};
const STORAGE_PREFIX = "radix_opportunities_v1_";

function readStoredState(key: string): StoredOpportunityState {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_STATE;
    const state = parsed as Partial<StoredOpportunityState>;
    return {
      savedIds: Array.isArray(state.savedIds)
        ? state.savedIds.filter((id): id is string => typeof id === "string")
        : [],
      plannedIds: Array.isArray(state.plannedIds)
        ? state.plannedIds.filter((id): id is string => typeof id === "string")
        : [],
      completedIds: Array.isArray(state.completedIds)
        ? state.completedIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch (error) {
    console.error("Could not read saved opportunities from local storage.", error);
    return EMPTY_STATE;
  }
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function normalized(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function containsTerm(text: string, term: string): boolean {
  return (
    text === term ||
    text.startsWith(`${term} `) ||
    text.endsWith(` ${term}`) ||
    text.includes(` ${term} `)
  );
}

const TAG_ALIASES: Record<string, string[]> = {
  "ai ml": ["artificial intelligence", "machine learning", "deep learning", "llm", "pytorch", "tensorflow"],
  "ar vr": ["augmented reality", "virtual reality", "vr", "ar"],
  "data analytics": ["data science", "analytics", "statistics", "data analysis"],
};

function getMatchingTags(
  opportunity: Opportunity,
  candidateSkills: string[],
  targetSkills: string[],
): string[] {
  const candidateTerms = [...candidateSkills, ...targetSkills].map(normalized).filter(Boolean);
  return opportunity.tags.filter((tag) => {
    const key = normalized(tag);
    const terms = [key, ...(TAG_ALIASES[key] ?? [])].map(normalized);
    return candidateTerms.some((candidate) =>
      terms.some(
        (term) =>
          containsTerm(candidate, term) || containsTerm(term, candidate),
      ),
    );
  });
}

export function PageOpportunities() {
  const { user } = useUser();
  const { profile, activeJdResult, addHackathon, addAchievement } = useProfile();
  const storageKey = `${STORAGE_PREFIX}${user?.id ?? "local"}`;
  const [result, setResult] = useState<OpportunityListResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kind, setKind] = useState<OpportunityKind | "all">("all");
  const [tab, setTab] = useState<OpportunityTab>("all");
  const [search, setSearch] = useState("");
  const [storedState, setStoredState] = useState<StoredOpportunityState>(() =>
    readStoredState(storageKey),
  );
  const [completionDraft, setCompletionDraft] = useState<CompletionDraft | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    fetchOpportunities()
      .then((response) => {
        if (active) setResult(response);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load opportunities.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setStoredState(readStoredState(storageKey));
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(storedState));
    } catch (error) {
      console.error("Could not save opportunities to local storage.", error);
      toast.error("Your opportunity changes could not be saved on this device.");
    }
  }, [storageKey, storedState]);

  const candidateSkills = useMemo(
    () => (profile.skills ?? []).map((skill) => skill.skill_name),
    [profile.skills],
  );
  const targetSkills = useMemo(
    () => (activeJdResult?.allSkills ?? []).map((skill) => skill.skill_name),
    [activeJdResult],
  );

  const visibleOpportunities = useMemo(() => {
    const query = normalized(search);
    return (result?.items ?? [])
      .map((opportunity) => ({
        opportunity,
        matchingTags: getMatchingTags(opportunity, candidateSkills, targetSkills),
      }))
      .filter(({ opportunity, matchingTags }) => {
        if (kind !== "all" && opportunity.kind !== kind) return false;
        if (tab === "recommended" && matchingTags.length === 0) return false;
        if (tab === "saved" && !storedState.savedIds.includes(opportunity.id)) return false;
        if (tab === "planned" && !storedState.plannedIds.includes(opportunity.id)) return false;
        if (tab === "completed" && !storedState.completedIds.includes(opportunity.id)) return false;
        if (!query) return true;
        return normalized(
          [
            opportunity.title,
            opportunity.organizer,
            opportunity.description,
            opportunity.provider,
            ...opportunity.tags,
          ].join(" "),
        ).includes(query);
      })
      .sort((left, right) => {
        const recommendationOrder =
          right.matchingTags.length - left.matchingTags.length;
        if (recommendationOrder !== 0) return recommendationOrder;
        return left.opportunity.ends_on.localeCompare(right.opportunity.ends_on);
      });
  }, [candidateSkills, kind, result, search, storedState, tab, targetSkills]);

  const recommendedCount = useMemo(
    () =>
      (result?.items ?? []).filter(
        (opportunity) =>
          getMatchingTags(opportunity, candidateSkills, targetSkills).length > 0,
      ).length,
    [candidateSkills, result, targetSkills],
  );

  function toggleSaved(id: string) {
    setStoredState((current) => ({
      ...current,
      savedIds: current.savedIds.includes(id)
        ? current.savedIds.filter((savedId) => savedId !== id)
        : [...current.savedIds, id],
    }));
  }

  function togglePlanned(id: string) {
    setStoredState((current) => ({
      ...current,
      plannedIds: current.plannedIds.includes(id)
        ? current.plannedIds.filter((plannedId) => plannedId !== id)
        : [...current.plannedIds, id],
    }));
  }

  function markCompleted(draft: CompletionDraft) {
    const { opportunity, projectOrResult } = draft;
    if (opportunity.kind === "hackathon") {
      addHackathon({
        title: opportunity.title,
        role_or_project: projectOrResult,
        achievement: "Participation marked complete by candidate.",
        skills_used: [],
        year: new Date().getFullYear().toString(),
        link: opportunity.source_url,
      });
    } else {
      addAchievement({
        title: `Participated in ${opportunity.title}`,
        description: projectOrResult,
        date: new Date().toISOString().slice(0, 10),
      });
    }
    setStoredState((current) => ({
      ...current,
      plannedIds: current.plannedIds.filter((id) => id !== opportunity.id),
      completedIds: current.completedIds.includes(opportunity.id)
        ? current.completedIds
        : [...current.completedIds, opportunity.id],
    }));
    setCompletionDraft(null);
    toast.success("Participation added to your profile.");
  }

  const tabs: { id: OpportunityTab; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "recommended", label: "For you", count: recommendedCount },
    { id: "saved", label: "Saved", count: storedState.savedIds.length },
    { id: "planned", label: "Planning", count: storedState.plannedIds.length },
    { id: "completed", label: "Completed", count: storedState.completedIds.length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          <Sparkles className="h-4 w-4" />
          Build experience for your next role
        </div>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-slate-900">
          Opportunities
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Find hackathons and competitions that connect to your skills and analyzed
          job description. Save events, track participation, and add completed work
          to your profile.
        </p>
      </div>

      <div
        className={`mb-6 flex gap-3 rounded-2xl border p-4 text-sm ${
          result?.sync.enabled
            ? "border-blue-200 bg-blue-50 text-blue-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        <CircleAlert className={`mt-0.5 h-5 w-5 shrink-0 ${
          result?.sync.enabled ? "text-blue-700" : "text-amber-700"
        }`} />
        <div>
          <p>
            {result?.sync.enabled
              ? result.sync.last_success_at
                ? `Kaggle competitions automatically refresh every ${result.sync.interval_hours} hours. Last successful refresh: ${new Date(result.sync.last_success_at).toLocaleString()}.`
                : "Kaggle automatic refresh is enabled and its first refresh is pending."
              : "Kaggle auto-refresh is off. Configure KAGGLE_USERNAME and KAGGLE_KEY in the backend environment, then restart the backend to enable it."}
          </p>
          <p className="mt-1">
            Hackathons remain manually curated; no public Devpost feed is configured.
            Verify dates and eligibility with the organizer. Saved, planned, and
            completed states are stored on this device.
          </p>
          {result?.sync.last_error && (
            <p className="mt-1 text-xs">
              Latest sync issue: {result.sync.last_error}
            </p>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Opportunity view">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                  tab === item.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label}
                {item.count !== undefined && (
                  <span className="ml-1.5 opacity-75">{item.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block sm:min-w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search opportunities"
                aria-label="Search opportunities"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as OpportunityKind | "all")
              }
              aria-label="Filter by opportunity type"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All types</option>
              <option value="hackathon">Hackathons</option>
              <option value="competition">Competitions</option>
            </select>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading opportunities…
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {loadError}
            </div>
          ) : visibleOpportunities.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="mx-auto h-8 w-8 text-slate-300" />
              <h2 className="mt-3 font-semibold text-slate-800">
                No opportunities found
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Try another filter, or check back when the curated catalog is updated.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-medium text-slate-500">
                Showing {visibleOpportunities.length} of {result?.count ?? 0} curated opportunities
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {visibleOpportunities.map(({ opportunity, matchingTags }) => {
                  const isSaved = storedState.savedIds.includes(opportunity.id);
                  const isPlanned = storedState.plannedIds.includes(opportunity.id);
                  const isCompleted = storedState.completedIds.includes(opportunity.id);
                  return (
                    <article
                      key={opportunity.id}
                      className="flex flex-col rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                              {opportunity.kind}
                            </span>
                            <span
                              className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                opportunity.status === "open"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : opportunity.status === "upcoming"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {opportunity.status}
                            </span>
                          </div>
                          <h2 className="mt-3 text-base font-bold leading-snug text-slate-900">
                            {opportunity.title}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            {opportunity.organizer} · via {opportunity.provider}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSaved(opportunity.id)}
                          aria-label={isSaved ? "Remove saved opportunity" : "Save opportunity"}
                          aria-pressed={isSaved}
                          className={`rounded-lg border p-2 transition ${
                            isSaved
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                        </button>
                      </div>

                      <p className="mt-3 text-sm leading-5 text-slate-600">
                        {opportunity.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(opportunity.starts_on)} – {formatDate(opportunity.ends_on)}
                        </span>
                        <span>{opportunity.format}</span>
                        {opportunity.prize && (
                          <span className="font-semibold text-slate-700">
                            Prize pool: {opportunity.prize}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {opportunity.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                              matchingTags.includes(tag)
                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {matchingTags.length > 0 && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-violet-700">
                          <Sparkles className="h-3.5 w-3.5" />
                          Matches your profile or analyzed job skills: {matchingTags.join(", ")}
                        </p>
                      )}

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                        <a
                          href={opportunity.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                          Visit organizer
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                            <Check className="h-3.5 w-3.5" />
                            Added to profile
                          </span>
                        ) : opportunity.status === "ended" ? (
                          <button
                            type="button"
                            onClick={() =>
                              setCompletionDraft({ opportunity, projectOrResult: "" })
                            }
                            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Record participation
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-pressed={isPlanned}
                            onClick={() => togglePlanned(opportunity.id)}
                            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold ${
                              isPlanned
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {isPlanned ? "Planning to participate" : "Track participation"}
                          </button>
                        )}
                        {isPlanned && !isCompleted && (
                          <span className="text-[11px] text-blue-700">
                            Participation tracked on this device
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {completionDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCompletionDraft(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="participation-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="participation-title" className="font-heading text-lg font-bold text-slate-900">
                  Record participation
                </h2>
                <p className="mt-1 text-sm text-slate-500">{completionDraft.opportunity.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setCompletionDraft(null)}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold text-slate-700">
              What did you build or achieve?
              <textarea
                autoFocus
                value={completionDraft.projectOrResult}
                onChange={(event) =>
                  setCompletionDraft((current) =>
                    current ? { ...current, projectOrResult: event.target.value } : current,
                  )
                }
                rows={4}
                maxLength={1000}
                required
                placeholder="Describe your project, contribution, or result."
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletionDraft(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!completionDraft.projectOrResult.trim()}
                onClick={() => markCompleted(completionDraft)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to profile
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
