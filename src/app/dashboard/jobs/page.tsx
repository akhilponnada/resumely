"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobsBoard } from "@/components/JobsBoard";
import { JobCard } from "@/components/JobCard";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { matchJob } from "@/lib/jobMatch";
import { ResumeData } from "@/lib/types";
import { Bookmark } from "lucide-react";

export default function DashboardJobsPage() {
    const [tab, setTab] = useState<"all" | "saved">("all");
    const { user } = useUser();
    const saved = useQuery(api.jobs.listSaved, user?.id ? {} : "skip");
    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const toggleSave = useMutation(api.jobs.toggleSave);
    const latest = resumes?.[0]?.resumeData as ResumeData | undefined;

    return (
        <DashboardLayout>
            <div className="page-container-wide">
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>Job matches</h1>
                    <p style={{ color: "var(--accents-5)", fontSize: 15 }}>
                        Live roles from company career pages, ranked against your latest resume.
                    </p>
                </div>

                <div className="tabs">
                    <button className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
                        For you
                    </button>
                    <button className={`tab ${tab === "saved" ? "active" : ""}`} onClick={() => setTab("saved")}>
                        <Bookmark size={14} /> Saved {saved ? `(${saved.length})` : ""}
                    </button>
                </div>

                {tab === "all" ? (
                    <JobsBoard basePath="/dashboard/jobs" />
                ) : !saved ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><div className="loader" /></div>
                ) : saved.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: 48, color: "var(--accents-5)" }}>
                        Save roles you want to come back to. They stay here even after the listing ages out of the homepage.
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {saved.map(({ job }) => {
                            if (!job) return null;
                            const match = latest
                                ? matchJob(latest, {
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
                                    href={`/dashboard/jobs/${job._id}`}
                                    match={match}
                                    saved
                                    onToggleSave={() => toggleSave({ jobId: job._id as Id<"jobs"> })}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
