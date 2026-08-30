"use client";

import Link from "next/link";
import { Bookmark, MapPin, Building2, ArrowUpRight } from "lucide-react";
import { relativeTime } from "@/lib/jobMatch";

export interface JobCardJob {
    _id: string;
    company: string;
    companyLogo?: string;
    title: string;
    location: string;
    workplace: string;
    salary?: string;
    tags: string[];
    postedAt: number;
    applyUrl: string;
}

function MatchRing({ score }: { score: number }) {
    const color = score >= 75 ? "#087f5b" : score >= 50 ? "#e67700" : "#c92a2a";
    const r = 16;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    return (
        <div title={`${score}% match`} style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r={r} fill="none" stroke="var(--accents-2)" strokeWidth="3" />
                <circle
                    cx="22"
                    cy="22"
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    transform="rotate(-90 22 22)"
                />
            </svg>
            <span style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color,
            }}>{score}</span>
        </div>
    );
}

export function JobCard({
    job,
    href,
    match,
    saved,
    onToggleSave,
}: {
    job: JobCardJob;
    href: string;
    match?: number;
    saved?: boolean;
    onToggleSave?: () => void;
}) {
    return (
        <div className="card job-card" style={{ padding: 0, overflow: "hidden" }}>
            <Link href={href} style={{ display: "block", padding: "20px 22px 16px", textDecoration: "none" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div className="job-logo">
                        {job.companyLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={job.companyLogo} alt="" width={36} height={36} style={{ objectFit: "contain" }} />
                        ) : (
                            <Building2 size={18} color="var(--violet)" />
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.2px" }}>
                            {job.title}
                        </div>
                        <div style={{ fontSize: 14, color: "var(--accents-6)", marginBottom: 8 }}>
                            {job.company}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 13, color: "var(--accents-5)" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <MapPin size={13} /> {job.location}
                            </span>
                            <span className={`badge workplace-${job.workplace}`}>
                                {job.workplace === "unknown" ? "Flexible" : job.workplace}
                            </span>
                            {job.salary && <span>{job.salary}</span>}
                            <span>{relativeTime(job.postedAt)}</span>
                        </div>
                    </div>
                    {match !== undefined && <MatchRing score={match} />}
                </div>
                {job.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                        {job.tags.slice(0, 5).map((tag) => (
                            <span key={tag} className="badge">{tag}</span>
                        ))}
                    </div>
                )}
            </Link>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 22px",
                borderTop: "1px solid var(--accents-2)",
                background: "var(--accents-1)",
            }}>
                <Link href={href} style={{ fontSize: 13, fontWeight: 500, color: "var(--violet)" }}>
                    View match
                </Link>
                <div style={{ display: "flex", gap: 8 }}>
                    {onToggleSave && (
                        <button
                            className="btn btn-ghost"
                            onClick={onToggleSave}
                            style={{ height: 34, padding: "0 10px", color: saved ? "var(--violet)" : "var(--accents-5)" }}
                            aria-label={saved ? "Unsave job" : "Save job"}
                        >
                            <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
                        </button>
                    )}
                    <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary"
                        style={{ height: 34, padding: "0 12px", fontSize: 13 }}
                    >
                        Apply <ArrowUpRight size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}
