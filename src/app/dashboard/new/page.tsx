"use client";

import { DragEvent, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeftIcon, FileIcon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PageBody } from "@/components/page-body";
import { generatedWriteFields, requestResumeGenerate } from "@/components/resume/resume-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
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
    const [rawInput, setRawInput] = useState("");
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
            setError("Paste or upload your resume first");
            return;
        }
        if (!user?.id) {
            setError("Sign in to save a resume");
            return;
        }
        setIsGenerating(true);
        setError(null);

        try {
            const data = await requestResumeGenerate({ rawInput, mode: "parse" });
            const id = await createResume({
                title: data.suggestedTitle || "Matching resume",
                rawInput,
                kind: "base",
                ...generatedWriteFields(data),
            });

            if (sourcedJob) {
                try {
                    const tailored = await requestResumeGenerate({
                        mode: "tailor",
                        resumeData: data.resumeData,
                        jobDescription: sourcedJob.descriptionText,
                        jobTitle: sourcedJob.title,
                        company: sourcedJob.company,
                    });
                    const tailoredId = await createResume({
                        title: tailored.suggestedTitle || `${sourcedJob.title} · ${sourcedJob.company}`,
                        rawInput,
                        kind: "tailored",
                        parentId: id,
                        jobId: sourcedJob._id,
                        targetCompany: sourcedJob.company,
                        targetTitle: sourcedJob.title,
                        isPrimary: false,
                        jobDescription: sourcedJob.descriptionText,
                        ...generatedWriteFields(tailored),
                    });
                    router.push(`/resume/${tailoredId}`);
                    return;
                } catch {
                    toast.error("Saved your matching resume. Tailor failed — open the job to try again.");
                }
            }

            router.push(`/resume/${id}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to generate";
            setError(message);
            toast.error(message);
        } finally {
            setIsGenerating(false);
        }
    };

    const example = `Jane Chen
jane@email.com | (555) 123-4567 | linkedin.com/in/janechen | github.com/janechen

EXPERIENCE
Software Engineer, Stripe | San Francisco, CA | Jan 2022 - Present
- Shipped billing APIs used by 40k merchants
- Cut p95 latency 35% by rewriting the invoice worker in Go

EDUCATION
Stanford University, Stanford, CA
B.S. Computer Science | GPA: 3.8 | Sept 2018 - June 2022

SKILLS
Languages: TypeScript, Python, Go, SQL
Frameworks: React, Node.js, Next.js
Tools: Git, Docker, AWS, Kubernetes`;

    return (
        <PageBody size="narrow">
            <Button variant="ghost" className="mb-5" onClick={() => router.back()}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
            </Button>
            <header className="mb-8">
                <h1 className="font-heading text-3xl font-medium text-balance">
                    Add your resume
                </h1>
                <p className="mt-1 text-pretty text-muted-foreground">
                    This becomes the matching resume jobs are ranked against. You can edit every field after it is saved.
                </p>
            </header>

            {sourcedJob ? (
                <Alert className="mb-6">
                    <AlertTitle>
                        Next: tailor for {sourcedJob.title} at {sourcedJob.company}
                    </AlertTitle>
                    <AlertDescription>
                        We will save this as your matching resume, then generate a separate copy for that posting. The original stays untouched.
                    </AlertDescription>
                </Alert>
            ) : null}

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
                            <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
                        </>
                    )}
                </button>

                <Field>
                    <div className="flex items-center justify-between gap-3">
                        <FieldLabel htmlFor="resume-info">Or paste your information</FieldLabel>
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
                        placeholder="Paste your name, contact info, experience, education, projects, and skills…"
                        className="min-h-64"
                    />
                </Field>
            </FieldGroup>

            {error ? (
                <Alert variant="destructive" className="mt-6">
                    <AlertTitle>Could not save</AlertTitle>
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
                    {isGenerating
                        ? sourcedJob
                            ? "Saving and tailoring…"
                            : "Building resume…"
                        : sourcedJob
                          ? "Save and tailor"
                          : "Save matching resume"}
                </Button>
                {isGenerating ? (
                    <p className="text-sm text-muted-foreground">This may take 15–30 seconds…</p>
                ) : null}
            </div>
        </PageBody>
    );
}
