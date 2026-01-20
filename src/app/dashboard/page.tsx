"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Plus, FileText, TrendingUp, Clock, ArrowRight } from "lucide-react";

export default function Dashboard() {
    const { user } = useUser();
    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? { userId: user.id } : "skip");

    const totalResumes = resumes?.length || 0;
    const averageATS = resumes && resumes.length > 0
        ? Math.round(resumes.reduce((acc, r) => acc + (r.atsScore || 0), 0) / resumes.length)
        : 0;

    return (
        <DashboardLayout>
            <div className="page-container">
                {/* Header */}
                <div style={{ marginBottom: "32px" }}>
                    <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "4px" }}>
                        Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
                    </h1>
                    <p style={{ color: "var(--accents-5)", fontSize: "15px" }}>
                        Manage your AI-powered resumes
                    </p>
                </div>

                {/* Stats */}
                <div className="grid-3" style={{ marginBottom: "40px" }}>
                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "12px",
                                background: "rgba(124, 58, 237, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <FileText size={22} color="var(--violet)" />
                            </div>
                            <div>
                                <div style={{ fontSize: "28px", fontWeight: 600 }}>{totalResumes}</div>
                                <div style={{ fontSize: "14px", color: "var(--accents-5)" }}>Resumes</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "12px",
                                background: "rgba(16, 185, 129, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <TrendingUp size={22} color="#10b981" />
                            </div>
                            <div>
                                <div style={{ fontSize: "28px", fontWeight: 600 }}>{averageATS}%</div>
                                <div style={{ fontSize: "14px", color: "var(--accents-5)" }}>Avg ATS Score</div>
                            </div>
                        </div>
                    </div>

                    <Link href="/dashboard/new" className="card" style={{
                        background: "var(--geist-foreground)",
                        color: "var(--geist-background)",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        textDecoration: "none"
                    }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <Plus size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: "18px", fontWeight: 500 }}>New Resume</div>
                            <div style={{ fontSize: "14px", opacity: 0.7 }}>Create with AI</div>
                        </div>
                    </Link>
                </div>

                {/* Recent */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Recent Resumes</h2>
                        {totalResumes > 5 && (
                            <Link href="/dashboard/resumes" style={{ fontSize: "14px", color: "var(--violet)", fontWeight: 500 }}>
                                View all →
                            </Link>
                        )}
                    </div>

                    {!resumes ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
                            <div className="loader" />
                        </div>
                    ) : resumes.length === 0 ? (
                        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "64px 32px" }}>
                            <FileText size={40} color="var(--accents-3)" style={{ marginBottom: "20px" }} />
                            <p style={{ color: "var(--accents-5)", marginBottom: "20px", fontSize: "15px" }}>
                                No resumes yet. Create your first one!
                            </p>
                            <Link href="/dashboard/new" className="btn btn-primary">
                                <Plus size={16} /> Create Resume
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {resumes.slice(0, 5).map((resume) => (
                                <Link key={resume._id} href={`/resume/${resume._id}`} className="card" style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "20px 24px",
                                    textDecoration: "none"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                                            <div style={{ fontSize: "15px", fontWeight: 500, marginBottom: "2px" }}>{resume.title}</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--accents-5)" }}>
                                                <Clock size={12} />
                                                {new Date(resume.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        {resume.atsScore !== undefined && (
                                            <span className={`badge ${resume.atsScore >= 80 ? "badge-success" : resume.atsScore >= 60 ? "badge-warning" : "badge-error"}`}>
                                                {resume.atsScore}%
                                            </span>
                                        )}
                                        <ArrowRight size={18} color="var(--accents-3)" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
