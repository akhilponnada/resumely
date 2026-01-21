"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ResumePreview } from "@/components/ResumePreview";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { saveAs } from "file-saver";
import { ArrowLeft, FileType, Loader2, Eye, Code, Check, AlertTriangle, Sparkles } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ResumeViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [tab, setTab] = useState<"preview" | "data">("preview");
    const [downloading, setDownloading] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState("");

    const resume = useQuery(api.resumes.getResumeById, { id: id as Id<"resumes"> });

    const downloadDOCX = async () => {
        if (!resume) return;
        setDownloading(true);
        setDownloadStatus("Claude is crafting your resume...");

        try {
            // Call server API to generate DOCX (Claude runs server-side)
            const response = await fetch("/api/generate-docx", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeData: resume.resumeData }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to generate DOCX");
            }

            setDownloadStatus("Packaging your document...");
            const blob = await response.blob();
            saveAs(blob, `${resume.resumeData.fullName.replace(/\s+/g, "_")}_Resume.docx`);
            setDownloadStatus("");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to generate DOCX");
            setDownloadStatus("");
        } finally {
            setDownloading(false);
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
                                    padding: "10px 14px",
                                    background: atsBg,
                                    borderRadius: "8px"
                                }}>
                                    {ats >= 80 ? <Check size={16} color={atsColor} /> : <AlertTriangle size={16} color={atsColor} />}
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: atsColor }}>{ats}% ATS Score</span>
                                </div>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                                <button onClick={downloadDOCX} disabled={downloading} className="btn btn-primary">
                                    {downloading ? <Loader2 size={16} className="loader" /> : <FileType size={16} />}
                                    {downloading ? "Generating..." : "Download DOCX"}
                                </button>
                                {downloading && downloadStatus && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--violet)" }}>
                                        <Sparkles size={12} />
                                        <span>{downloadStatus}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button className={`tab ${tab === "preview" ? "active" : ""}`} onClick={() => setTab("preview")}>
                        <Eye size={16} /> Preview
                    </button>
                    <button className={`tab ${tab === "data" ? "active" : ""}`} onClick={() => setTab("data")}>
                        <Code size={16} /> Raw Data
                    </button>
                </div>

                {/* Content */}
                {tab === "preview" ? (
                    <div style={{ border: "1px solid var(--accents-2)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                        <ResumePreview data={resume.resumeData} />
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
