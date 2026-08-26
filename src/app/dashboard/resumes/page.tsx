"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { FileText, Clock, Search, Trash2, Plus, ArrowRight } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ResumesPage() {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const deleteResume = useMutation(api.resumes.deleteResume);

    const filtered = resumes?.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()));

    const handleDelete = async (id: string) => {
        await deleteResume({ id: id as Id<"resumes"> });
        setDeleting(null);
    };

    return (
        <DashboardLayout>
            <div className="page-container-narrow">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "4px" }}>My Resumes</h1>
                        <p style={{ color: "var(--accents-5)", fontSize: "15px" }}>Manage all your created resumes</p>
                    </div>
                    <Link href="/dashboard/new" className="btn btn-primary">
                        <Plus size={16} /> New Resume
                    </Link>
                </div>

                {/* Search */}
                <div style={{ position: "relative", marginBottom: "24px" }}>
                    <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--accents-4)" }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search resumes..."
                        className="input"
                        style={{ paddingLeft: "44px" }}
                    />
                </div>

                {/* List */}
                {!resumes ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
                        <div className="loader" />
                    </div>
                ) : filtered?.length === 0 ? (
                    <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "64px 32px" }}>
                        <FileText size={40} color="var(--accents-3)" style={{ marginBottom: "20px" }} />
                        <p style={{ color: "var(--accents-5)", marginBottom: "20px", fontSize: "15px" }}>
                            {search ? "No resumes match your search" : "No resumes yet"}
                        </p>
                        {!search && (
                            <Link href="/dashboard/new" className="btn btn-primary">
                                <Plus size={16} /> Create Resume
                            </Link>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {filtered?.map((r) => (
                            <div key={r._id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px" }}>
                                <Link href={`/resume/${r._id}`} style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, textDecoration: "none", color: "inherit" }}>
                                    <div style={{
                                        width: "44px",
                                        height: "44px",
                                        borderRadius: "10px",
                                        background: "rgba(124, 58, 237, 0.08)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <FileText size={20} color="var(--violet)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "15px", fontWeight: 500, marginBottom: "2px" }}>{r.title}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--accents-5)" }}>
                                            <Clock size={12} />
                                            {new Date(r.createdAt).toLocaleDateString()}
                                            {r.resumeData?.fullName && <span>• {r.resumeData.fullName}</span>}
                                        </div>
                                    </div>
                                </Link>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {r.atsScore !== undefined && (
                                        <span className={`badge ${r.atsScore >= 80 ? "badge-success" : r.atsScore >= 60 ? "badge-warning" : "badge-error"}`}>
                                            {r.atsScore}%
                                        </span>
                                    )}

                                    {deleting === r._id ? (
                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <button onClick={() => handleDelete(r._id)} className="btn" style={{ height: "32px", padding: "0 12px", fontSize: "12px", background: "#c92a2a", color: "white", border: "none" }}>
                                                Delete
                                            </button>
                                            <button onClick={() => setDeleting(null)} className="btn" style={{ height: "32px", padding: "0 12px", fontSize: "12px" }}>
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => setDeleting(r._id)} className="btn btn-ghost" style={{ padding: "8px", height: "auto" }}>
                                                <Trash2 size={16} />
                                            </button>
                                            <ArrowRight size={16} color="var(--accents-3)" />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {resumes && resumes.length > 0 && (
                    <p style={{ textAlign: "center", fontSize: "13px", color: "var(--accents-4)", marginTop: "28px" }}>
                        {resumes.length} resume{resumes.length !== 1 ? "s" : ""} total
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
}
