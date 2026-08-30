"use client";

import { useMemo, useState, useEffect } from "react";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Search, Loader2 } from "lucide-react";
import { JobCard } from "./JobCard";
import { matchJob } from "@/lib/jobMatch";
import { ResumeData } from "@/lib/types";

const FILTERS = [
    { id: "all", label: "All roles" },
    { id: "remote", label: "Remote" },
    { id: "hybrid", label: "Hybrid" },
    { id: "onsite", label: "On-site" },
];

export function JobsBoard({
    basePath,
    compact,
}: {
    basePath: "/jobs" | "/dashboard/jobs";
    compact?: boolean;
}) {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [workplace, setWorkplace] = useState("all");

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 280);
        return () => clearTimeout(t);
    }, [search]);

    const ensureCrawl = useMutation(api.jobs.ensureCrawl);
    useEffect(() => {
        ensureCrawl({}).catch(() => undefined);
    }, [ensureCrawl]);

    const stats = useQuery(api.jobs.getStats);
    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const saved = useQuery(api.jobs.savedIds, user?.id ? {} : "skip");
    const toggleSave = useMutation(api.jobs.toggleSave);

    const latestResume = resumes?.[0]?.resumeData as ResumeData | undefined;
    const savedSet = useMemo(() => new Set((saved ?? []).map(String)), [saved]);

    const { results, status, loadMore } = usePaginatedQuery(
        api.jobs.listJobs,
        { search: debounced || undefined, workplace },
        { initialNumItems: compact ? 8 : 24 }
    );

    return (
        <div>
            <div className="jobs-searchbar">
                <Search size={18} color="var(--accents-4)" />
                <input
                    className="jobs-search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, company, skill…"
                />
                {stats && stats.activeJobs > 0 && (
                    <span style={{ fontSize: 12, color: "var(--accents-4)", whiteSpace: "nowrap" }}>
                        {stats.activeJobs >= 2000 ? "2,000+" : stats.activeJobs.toLocaleString()} live roles
                    </span>
                )}
            </div>

            <div style={{ display: "flex", gap: 8, margin: "16px 0 24px", flexWrap: "wrap" }}>
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        className={`chip ${workplace === f.id ? "chip-active" : ""}`}
                        onClick={() => setWorkplace(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {status === "LoadingFirstPage" && (
                <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                    <div className="loader" />
                </div>
            )}

            {status !== "LoadingFirstPage" && results.length === 0 && (
                <div className="card" style={{ textAlign: "center", padding: 48, color: "var(--accents-5)" }}>
                    {stats?.status === "running"
                        ? "Pulling live roles from company career pages… refresh in a minute."
                        : "No roles match that search yet. Try a broader keyword."}
                </div>
            )}

            <div className="jobs-grid">
                {results.map((job) => {
                    const match = latestResume
                        ? matchJob(latestResume, {
                            title: job.title,
                            company: job.company,
                            descriptionText: job.descriptionText,
                            tags: job.tags,
                            location: job.location,
                        }).score
                        : undefined;
                    return (
                        <JobCard
                            key={job._id}
                            job={job}
                            href={`${basePath}/${job._id}`}
                            match={match}
                            saved={savedSet.has(job._id)}
                            onToggleSave={user ? () => toggleSave({ jobId: job._id as Id<"jobs"> }) : undefined}
                        />
                    );
                })}
            </div>

            {status === "CanLoadMore" && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
                    <button className="btn btn-secondary" onClick={() => loadMore(24)}>
                        Load more roles
                    </button>
                </div>
            )}
            {status === "LoadingMore" && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                    <Loader2 size={18} className="spin" />
                </div>
            )}
        </div>
    );
}
