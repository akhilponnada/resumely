"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/DashboardLayout";
import { matchJob, relativeTime } from "@/lib/jobMatch";
import { ResumeData } from "@/lib/types";
import {
    ArrowLeft, ArrowUpRight, Bookmark, Building2, MapPin, Sparkles, FileText,
} from "lucide-react";

export default function DashboardJobDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const jobId = id as Id<"jobs">;
    const job = useQuery(api.jobs.getJob, { id: jobId });
    const { user } = useUser();
    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const savedIds = useQuery(api.jobs.savedIds, user?.id ? {} : "skip");
    const toggleSave = useMutation(api.jobs.toggleSave);
    const latest = resumes?.[0]?.resumeData as ResumeData | undefined;
    const match = job && latest
        ? matchJob(latest, {
            title: job.title,
            company: job.company,
            descriptionText: job.descriptionText,
            tags: job.tags,
            location: job.location,
        })
        : null;
    const saved = savedIds?.some((sid) => sid === jobId);

    return (
        <DashboardLayout>
            <div className="page-container" style={{ maxWidth: 860 }}>
                <Link href="/dashboard/jobs" className="btn btn-ghost" style={{ marginBottom: 20, padding: "8px 12px", height: "auto" }}>
                    <ArrowLeft size={16} /> All jobs
                </Link>

                {!job && (
                    <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                        <div className="loader" />
                    </div>
                )}
                {job === null && <p>This role is no longer listed.</p>}

                {job && (
                    <>
                        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
                            <div className="job-logo" style={{ width: 56, height: 56 }}>
                                <Building2 size={22} color="var(--violet)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 6 }}>
                                    {job.title}
                                </h1>
                                <div style={{ fontSize: 16, color: "var(--accents-6)", marginBottom: 10 }}>{job.company}</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 14, color: "var(--accents-5)" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                        <MapPin size={14} /> {job.location}
                                    </span>
                                    <span className={`badge workplace-${job.workplace}`}>{job.workplace}</span>
                                    <span>{relativeTime(job.postedAt)}</span>
                                    {job.salary && <span>{job.salary}</span>}
                                </div>
                            </div>
                        </div>

                        {match ? (
                            <div className="card" style={{ marginBottom: 20, background: "rgba(124,58,237,0.04)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                                        <Sparkles size={16} color="var(--violet)" /> {match.score}% match with {resumes?.[0]?.title ?? "your resume"}
                                    </div>
                                    <Link href={`/dashboard/new?job=${job._id}`} className="btn btn-violet" style={{ height: 36 }}>
                                        <FileText size={14} /> Tailor resume for this role
                                    </Link>
                                </div>
                                {match.matched.length > 0 && (
                                    <p style={{ fontSize: 13, color: "var(--accents-6)", marginBottom: 8 }}>
                                        <strong>Already on your resume:</strong> {match.matched.join(", ")}
                                    </p>
                                )}
                                {match.missing.length > 0 && (
                                    <p style={{ fontSize: 13, color: "var(--accents-6)" }}>
                                        <strong>Add these keywords:</strong> {match.missing.join(", ")}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="card" style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 14, color: "var(--accents-6)" }}>
                                    <Link href="/dashboard/new" style={{ color: "var(--violet)", fontWeight: 600 }}>Create a resume</Link>
                                    {" "}to unlock a match score and one-click tailoring for this posting.
                                </p>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                            <a href={job.applyUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ height: 44 }}>
                                Apply on company site <ArrowUpRight size={16} />
                            </a>
                            <button
                                className="btn btn-secondary"
                                onClick={() => toggleSave({ jobId })}
                                style={{ height: 44, color: saved ? "var(--violet)" : undefined }}
                            >
                                <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
                                {saved ? "Saved" : "Save"}
                            </button>
                        </div>

                        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>About the role</h2>
                        <div className="job-description">
                            {job.descriptionText || "See the company posting for the full description."}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
