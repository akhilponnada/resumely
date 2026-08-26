"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ResumePreview } from "@/components/ResumePreview";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { saveAs } from "file-saver";
import { ArrowLeft, FileType, Loader2, Eye, Code, Check, AlertTriangle, Gauge } from "lucide-react";
import { ATSReport } from "@/components/ATSReport";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ResumeViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [tab, setTab] = useState<"preview" | "ats" | "data">("preview");
    const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);

    const resume = useQuery(api.resumes.getResumeById, { id: id as Id<"resumes"> });

    const download = async (format: "docx" | "pdf") => {
        if (!resume) return;
        setDownloading(format);

        try {
            const response = await fetch(`/api/generate-${format}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeData: resume.resumeData }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to generate ${format.toUpperCase()}`);
            }

            const blob = await response.blob();
            const name = resume.resumeData.fullName.replace(/\s+/g, "_");
            saveAs(blob, `${name}_Resume.${format}`);
        } catch (err) {
            alert(err instanceof Error ? err.message : `Failed to generate ${format.toUpperCase()}`);
        } finally {
            setDownloading(null);
        }
    };

    if (!resume) {
        return (
            <DashboardLayout>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                    <div className="loader" />
                </div>
            </DashboardLayout>
        );
    }

    const ats = resume.atsScore;
    const atsColor = ats !== undefined ? (ats >= 80 ? "#087f5b" : ats >= 60 ? "#e67700" : "#c92a2a") : "#666";
    const atsBg = ats !== undefined ? (ats >= 80 ? "#d3f9d8" : ats >= 60 ? "#fff3bf" : "#ffe3e3") : "#eee";

    return (
        <DashboardLayout>
            <div className="page-container">
                {/* Header */}
                <div style={{ marginBottom: "28px" }}>
                    <button onClick={() => router.back()} className="btn btn-ghost" style={{ marginBottom: "20px", padding: "8px 12px", height: "auto" }}>
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "4px" }}>{resume.title}</h1>
                            <p style={{ color: "var(--accents-5)", fontSize: "14px" }}>
                                Created on {new Date(resume.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {ats !== undefined && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "0 16px",
                                    height: "40px",
                                    background: atsBg,
                                    borderRadius: "8px"
                                }}>
                                    {ats >= 80 ? <Check size={16} color={atsColor} /> : <AlertTriangle size={16} color={atsColor} />}
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: atsColor }}>{ats}% ATS Score</span>
                                </div>
                            )}

                            <button onClick={() => download("pdf")} disabled={downloading !== null} className="btn btn-primary" style={{ height: "40px" }}>
                                {downloading === "pdf" ? <Loader2 size={16} className="loader" /> : <FileType size={16} />}
                                {downloading === "pdf" ? "Generating..." : "Download PDF"}
                            </button>

                            <button onClick={() => download("docx")} disabled={downloading !== null} className="btn btn-ghost" style={{ height: "40px" }}>
                                {downloading === "docx" ? <Loader2 size={16} className="loader" /> : <FileType size={16} />}
                                {downloading === "docx" ? "Generating..." : "Download DOCX"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button className={`tab ${tab === "preview" ? "active" : ""}`} onClick={() => setTab("preview")}>
                        <Eye size={16} /> Preview
                    </button>
                    <button className={`tab ${tab === "ats" ? "active" : ""}`} onClick={() => setTab("ats")}>
                        <Gauge size={16} /> ATS Report
                    </button>
                    <button className={`tab ${tab === "data" ? "active" : ""}`} onClick={() => setTab("data")}>
                        <Code size={16} /> Raw Data
                    </button>
                </div>

                {/* Content */}
                {tab === "ats" ? (
                    <ATSReport
                        score={resume.atsScore}
                        checks={resume.atsChecks}
                        matchedKeywords={resume.matchedKeywords}
                        missingKeywords={resume.missingKeywords}
                        strengths={resume.atsAnalysis?.strengths}
                        improvements={resume.atsAnalysis?.improvements}
                    />
                ) : tab === "preview" ? (
                    <div style={{
                        border: "1px solid var(--accents-2)",
                        borderRadius: "12px",
                        overflow: "auto",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                        background: "#e5e5e5",
                        padding: "24px",
                        display: "flex",
                        justifyContent: "center"
                    }}>
                        <div style={{
                            boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
                        }}>
                            <ResumePreview data={resume.resumeData} />
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div className="card">
                            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>Original Input</h3>
                            <pre style={{
                                fontSize: "13px",
                                color: "var(--accents-6)",
                                whiteSpace: "pre-wrap",
                                fontFamily: "ui-monospace, monospace",
                                background: "var(--accents-1)",
                                padding: "16px",
                                borderRadius: "8px",
                                maxHeight: "300px",
                                overflow: "auto",
                                border: "1px solid var(--accents-2)"
                            }}>
                                {resume.rawInput}
                            </pre>
                        </div>

                        {resume.jobDescription && (
                            <div className="card">
                                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>Job Description</h3>
                                <pre style={{
                                    fontSize: "13px",
                                    color: "var(--accents-6)",
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "ui-monospace, monospace",
                                    background: "var(--accents-1)",
                                    padding: "16px",
                                    borderRadius: "8px",
                                    maxHeight: "300px",
                                    overflow: "auto",
                                    border: "1px solid var(--accents-2)"
                                }}>
                                    {resume.jobDescription}
                                </pre>
                            </div>
                        )}

                        <div className="card">
                            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>Parsed Resume Data</h3>
                            <pre style={{
                                fontSize: "13px",
                                color: "var(--accents-6)",
                                whiteSpace: "pre-wrap",
                                fontFamily: "ui-monospace, monospace",
                                background: "var(--accents-1)",
                                padding: "16px",
                                borderRadius: "8px",
                                maxHeight: "400px",
                                overflow: "auto",
                                border: "1px solid var(--accents-2)"
                            }}>
                                {JSON.stringify(resume.resumeData, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
