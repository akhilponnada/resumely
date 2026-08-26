"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Sparkles, Upload, X, File, Loader2 } from "lucide-react";

export default function NewResumePage() {
    const [tab, setTab] = useState<"info" | "job">("info");
    const [rawInput, setRawInput] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const { user } = useUser();
    const router = useRouter();
    const createResume = useMutation(api.resumes.createResume);

    const handleFile = async (file: File) => {
        setIsParsing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/parse-file", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to parse file");
            }

            setRawInput(data.text);
            setFileName(data.fileName);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to parse file");
        } finally {
            setIsParsing(false);
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    };

    const handleGenerate = async () => {
        if (!rawInput.trim()) {
            setError("Please enter your resume information");
            return;
        }
        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch("/api/generate-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rawInput, jobDescription: jobDescription.trim() || undefined }),
            });
            if (!res.ok) throw new Error("Failed to generate");

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const id = await createResume({
                title: data.suggestedTitle || "My Resume",
                rawInput,
                jobDescription: jobDescription || undefined,
                atsScore: data.atsScore,
                atsAnalysis: data.atsAnalysis,
                atsChecks: data.atsChecks,
                matchedKeywords: data.matchedKeywords,
                missingKeywords: data.missingKeywords,
                resumeData: data.resumeData,
            });
            router.push(`/resume/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate");
        } finally {
            setIsGenerating(false);
        }
    };

    const example = `John Smith
john@email.com | (555) 123-4567 | linkedin.com/in/johnsmith | github.com/johnsmith

EDUCATION
Stanford University, Stanford, CA
B.S. Computer Science | GPA: 3.8 | Sept 2019 - June 2023

EXPERIENCE
Software Engineer Intern, Google | Mountain View, CA | June 2022 - Sept 2022
- Built ML pipeline improving search relevance by 15%
- Developed REST APIs using Python and Flask serving 1M+ daily requests
- Collaborated with 5 engineers using Agile methodologies

PROJECTS
E-commerce Platform | React, Node.js, PostgreSQL
- Built full-stack e-commerce site with payment integration
- Implemented real-time inventory management

SKILLS
Languages: Python, JavaScript, Java, SQL
Frameworks: React, Node.js, Flask, Django
Tools: Git, Docker, AWS, Kubernetes`;

    return (
        <DashboardLayout>
            <div className="page-container-narrow">
                {/* Header */}
                <div style={{ marginBottom: "32px" }}>
                    <button onClick={() => router.back()} className="btn btn-ghost" style={{ marginBottom: "20px", padding: "8px 12px", height: "auto" }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>Create New Resume</h1>
                    <p style={{ color: "var(--accents-5)", fontSize: "15px" }}>
                        Upload your resume file or paste your information
                    </p>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button className={`tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>Your Information</button>
                    <button className={`tab ${tab === "job" ? "active" : ""}`} onClick={() => setTab("job")}>Job Description</button>
                </div>

                {/* Content */}
                {tab === "info" ? (
                    <div>
                        {/* Upload */}
                        <div
                            className={`upload-zone ${dragging ? "active" : ""}`}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onClick={() => !isParsing && fileRef.current?.click()}
                            style={{ marginBottom: "20px", cursor: isParsing ? "wait" : "pointer" }}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pdf,.docx,.doc,.txt,.md"
                                hidden
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                            {isParsing ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                                    <Loader2 size={24} color="var(--violet)" style={{ animation: "spin 1s linear infinite" }} />
                                    <span style={{ fontSize: "14px", color: "var(--accents-5)" }}>Parsing file...</span>
                                </div>
                            ) : fileName ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                                    <File size={22} color="var(--violet)" />
                                    <span style={{ fontSize: "14px" }}>{fileName}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFileName(null);
                                            setRawInput("");
                                        }}
                                        className="btn btn-ghost"
                                        style={{ padding: "6px", height: "auto" }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                                    <Upload size={28} color="var(--accents-4)" style={{ marginBottom: "12px" }} />
                                    <p style={{ fontSize: "14px", color: "var(--accents-5)" }}>
                                        Drop your resume file or <span style={{ color: "var(--violet)", fontWeight: 500 }}>browse</span>
                                    </p>
                                    <p style={{ fontSize: "12px", color: "var(--accents-4)", marginTop: "4px" }}>
                                        Supports PDF, DOCX, TXT files
                                    </p>
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <label style={{ fontSize: "14px", fontWeight: 500 }}>Or paste your information</label>
                            <button onClick={() => setRawInput(example)} style={{ fontSize: "13px", color: "var(--violet)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                                Load example
                            </button>
                        </div>
                        <textarea
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            placeholder="Paste your name, contact info, education, experience, projects, skills, certifications, or any other information about yourself..."
                            className="textarea"
                            style={{ minHeight: "280px" }}
                        />

                        {/* Job Description Recommendation */}
                        <div
                            onClick={() => setTab("job")}
                            style={{
                                marginTop: "16px",
                                padding: "14px 16px",
                                background: "rgba(124, 58, 237, 0.06)",
                                borderRadius: "10px",
                                border: "1px dashed rgba(124, 58, 237, 0.3)",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)";
                                e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.5)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(124, 58, 237, 0.06)";
                                e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.3)";
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "16px" }}>💡</span>
                                <p style={{ fontSize: "13px", color: "var(--accents-6)", margin: 0 }}>
                                    <strong style={{ color: "var(--violet)" }}>Pro tip:</strong> Add a job description in the next tab to get a tailored resume with better ATS scores!
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Recommendation Box */}
                        <div style={{
                            padding: "16px 20px",
                            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(167, 139, 250, 0.08) 100%)",
                            borderRadius: "12px",
                            marginBottom: "20px",
                            border: "1px solid rgba(124, 58, 237, 0.2)"
                        }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                <span style={{ fontSize: "20px" }}>💡</span>
                                <div>
                                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--violet-dark)", marginBottom: "4px" }}>
                                        Highly Recommended!
                                    </p>
                                    <p style={{ fontSize: "13px", color: "var(--accents-6)", lineHeight: 1.6 }}>
                                        Paste the job description to get a <strong>tailored resume</strong> that matches the role&apos;s requirements.
                                        This significantly improves your <strong>ATS score</strong> and interview chances!
                                    </p>
                                </div>
                            </div>
                        </div>

                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                            Target Job Description
                        </label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here to optimize your resume for ATS and tailor it to the role..."
                            className="textarea"
                            style={{ minHeight: "280px" }}
                        />
                        <p style={{ fontSize: "13px", color: "var(--accents-4)", marginTop: "12px" }}>
                            We&apos;ll extract key skills and requirements to customize your resume
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ marginTop: "20px", padding: "14px 16px", background: "#ffe3e3", color: "#c92a2a", borderRadius: "8px", fontSize: "14px" }}>
                        {error}
                    </div>
                )}

                {/* Generate */}
                <div style={{ marginTop: "28px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <button onClick={handleGenerate} disabled={isGenerating || !rawInput.trim()} className="btn btn-violet" style={{ height: "48px", padding: "0 28px", fontSize: "15px" }}>
                        {isGenerating ? (
                            <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                        ) : (
                            <><Sparkles size={18} /> Generate Resume</>
                        )}
                    </button>
                    {isGenerating && <span style={{ fontSize: "14px", color: "var(--accents-5)" }}>This may take 15-30 seconds...</span>}
                </div>
            </div>
        </DashboardLayout>
    );
}
