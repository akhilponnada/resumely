"use client";

import { DragEvent, Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeftIcon, FileIcon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PageBody } from "@/components/page-body";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function NewResumePage() {
    return (
        <Suspense
            fallback={
                <PageBody size="narrow" className="flex justify-center py-20">
                    <Spinner />
                </PageBody>
            }
        >
            <NewResumeForm />
        </Suspense>
    );
}

function NewResumeForm() {
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
    const searchParams = useSearchParams();
    const jobParam = searchParams.get("job");
    const createResume = useMutation(api.resumes.createResume);
    const sourcedJob = useQuery(
        api.jobs.getJob,
        jobParam ? { id: jobParam as Id<"jobs"> } : "skip",
    );

    useEffect(() => {
        if (sourcedJob?.descriptionText) {
            setJobDescription(sourcedJob.descriptionText);
            setTab("job");
        }
    }, [sourcedJob]);

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

    const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files[0]) handleFile(event.dataTransfer.files[0]);
    };

    const handleGenerate = async () => {
        if (!rawInput.trim()) {
            setError("Please enter your resume information");
            return;
        }
        if (!user?.id) {
            setError("Sign in to generate a resume");
            return;
        }
        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch("/api/generate-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rawInput,
                    jobDescription: jobDescription.trim() || undefined,
                }),
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
            const message = err instanceof Error ? err.message : "Failed to generate";
            setError(message);
            toast.error(message);
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
        <PageBody size="narrow">
            <Button variant="ghost" className="mb-5" onClick={() => router.back()}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
            </Button>
            <header className="mb-8">
                <h1 className="font-heading text-3xl font-medium text-balance">
                    Create resume
                </h1>
                <p className="mt-1 text-pretty text-muted-foreground">
                    {sourcedJob
                        ? `Tailoring for ${sourcedJob.title} at ${sourcedJob.company}`
                        : "Upload a file or paste what you already have."}
                </p>
            </header>

            <Tabs
                value={tab}
                onValueChange={(value) => {
                    if (value === "info" || value === "job") setTab(value);
                }}
            >
                <TabsList variant="line">
                    <TabsTrigger value="info">Your information</TabsTrigger>
                    <TabsTrigger value="job">Job description</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="pt-6">
                    <FieldGroup>
                        <button
                            type="button"
                            data-dragging={dragging}
                            disabled={isParsing}
                            onDrop={handleDrop}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onClick={() => !isParsing && fileRef.current?.click()}
                            className={cn(
                                "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input px-6 py-10 text-center transition-colors hover:bg-muted disabled:pointer-events-none",
                                dragging && "border-foreground bg-muted",
                            )}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pdf,.docx,.doc,.txt,.md"
                                hidden
                                onChange={(event) =>
                                    event.target.files?.[0] && handleFile(event.target.files[0])
                                }
                            />
                            {isParsing ? (
                                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Spinner />
                                    Parsing file…
                                </span>
                            ) : fileName ? (
                                <span className="flex items-center gap-2 text-sm">
                                    <FileIcon />
                                    {fileName}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Remove file"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setFileName(null);
                                            setRawInput("");
                                        }}
                                    >
                                        <XIcon />
                                    </Button>
                                </span>
                            ) : (
                                <>
                                    <UploadIcon className="text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Drop your resume or{" "}
                                        <span className="font-medium text-foreground">browse</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        PDF, DOCX, or TXT
                                    </p>
                                </>
                            )}
                        </button>

                        <Field>
                            <div className="flex items-center justify-between gap-3">
                                <FieldLabel htmlFor="resume-info">
                                    Or paste your information
                                </FieldLabel>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRawInput(example)}
                                >
                                    Load example
                                </Button>
                            </div>
                            <Textarea
                                id="resume-info"
                                value={rawInput}
                                onChange={(event) => setRawInput(event.target.value)}
                                placeholder="Paste your name, contact info, education, experience, projects, and skills…"
                                className="min-h-64"
                            />
                        </Field>

                        <button
                            type="button"
                            onClick={() => setTab("job")}
                            className="rounded-xl border border-dashed border-input px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
                        >
                            <strong className="text-foreground">Next:</strong> Add a job
                            description to tailor bullets and raise the ATS score.
                        </button>
                    </FieldGroup>
                </TabsContent>

                <TabsContent value="job" className="pt-6">
                    <FieldGroup>
                        <Card size="sm">
                            <CardHeader>
                                <CardTitle>Paste the posting</CardTitle>
                                <CardDescription>
                                    Used to tailor bullets and keywords — it does not invent
                                    experience.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Field>
                            <FieldLabel htmlFor="job-description">
                                Target job description
                            </FieldLabel>
                            <Textarea
                                id="job-description"
                                value={jobDescription}
                                onChange={(event) => setJobDescription(event.target.value)}
                                placeholder="Paste the job description to tailor keywords and bullets…"
                                className="min-h-64"
                            />
                            <FieldDescription>
                                We extract skills and requirements to customize this resume.
                            </FieldDescription>
                        </Field>
                    </FieldGroup>
                </TabsContent>
            </Tabs>

            {error ? (
                <Alert variant="destructive" className="mt-6">
                    <AlertTitle>Could not generate</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !rawInput.trim()}
                    size="lg"
                >
                    {isGenerating ? <Spinner data-icon="inline-start" /> : null}
                    {isGenerating ? "Generating…" : "Generate resume"}
                </Button>
                {isGenerating ? (
                    <p className="text-sm text-muted-foreground">
                        This may take 15–30 seconds…
                    </p>
                ) : null}
            </div>
        </PageBody>
    );
}
