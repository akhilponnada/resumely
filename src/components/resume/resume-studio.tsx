"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
    ArrowLeftIcon,
    CheckIcon,
    FileTypeIcon,
    GaugeIcon,
    PencilIcon,
    RefreshCwIcon,
    StarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ATSReport } from "@/components/ATSReport";
import { ResumePreview } from "@/components/ResumePreview";
import { ResumeEditor } from "@/components/resume/resume-editor";
import {
    downloadResumeFile,
    generatedWriteFields,
    requestResumeGenerate,
} from "@/components/resume/resume-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeATS } from "@/lib/ats";
import {
    cloneResumeData,
    resumeKind,
    sanitizeResumeData,
    tailoredFor,
} from "@/lib/resume-model";
import type { Resume, ResumeData } from "@/lib/types";

export function ResumeStudio({ resume }: { resume: Resume }) {
    const updateResume = useMutation(api.resumes.updateResume);
    const setPrimary = useMutation(api.resumes.setPrimaryResume);
    const matching = useQuery(api.resumes.getPrimaryResume);
    const parent = useQuery(
        api.resumes.getResumeById,
        resume.parentId ? { id: resume.parentId as Id<"resumes"> } : "skip",
    );
    const job = useQuery(
        api.jobs.getJob,
        resume.jobId ? { id: resume.jobId as Id<"jobs"> } : "skip",
    );
    const [title, setTitle] = useState(resume.title);
    const [draft, setDraft] = useState<ResumeData>(() => cloneResumeData(resume.resumeData));
    const [saving, setSaving] = useState(false);
    const [retailoring, setRetailoring] = useState(false);
    const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
    const [tab, setTab] = useState("edit");
    const kind = resumeKind(resume);
    const isMatching = matching?._id === resume._id;
    const jobLabel = tailoredFor(resume);

    useEffect(() => {
        setTitle(resume.title);
        setDraft(cloneResumeData(resume.resumeData));
    }, [resume._id, resume.updatedAt]);

    const dirty = useMemo(() => {
        return (
            title.trim() !== resume.title ||
            JSON.stringify(sanitizeResumeData(draft)) !==
                JSON.stringify(sanitizeResumeData(resume.resumeData))
        );
    }, [title, draft, resume.title, resume.resumeData]);

    const ats = useMemo(
        () => computeATS(draft, resume.jobDescription),
        [draft, resume.jobDescription],
    );

    useEffect(() => {
        if (!dirty) return;
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [dirty]);

    const save = async () => {
        if (saving || !dirty) return;
        setSaving(true);
        try {
            const resumeData = sanitizeResumeData(draft);
            const scored = computeATS(resumeData, resume.jobDescription);
            await updateResume({
                id: resume._id as Id<"resumes">,
                title: title.trim() || resume.title,
                resumeData,
                atsScore: scored.score,
                atsChecks: scored.checks,
                matchedKeywords: scored.matchedKeywords,
                missingKeywords: scored.missingKeywords,
            });
            toast.success("Saved");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save");
        } finally {
            setSaving(false);
        }
    };

    const saveRef = useRef(save);
    saveRef.current = save;

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
            event.preventDefault();
            void saveRef.current();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const download = async (format: "pdf" | "docx") => {
        setDownloading(format);
        try {
            await downloadResumeFile(format, sanitizeResumeData(draft));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to generate ${format.toUpperCase()}`);
        } finally {
            setDownloading(null);
        }
    };

    const retailor = async () => {
        const source = parent?.resumeData ?? matching?.resumeData;
        const jobDescription = resume.jobDescription;
        if (!source || !jobDescription) {
            toast.error("Need a matching resume and a job description to re-tailor");
            return;
        }
        setRetailoring(true);
        try {
            const data = await requestResumeGenerate({
                mode: "tailor",
                resumeData: source,
                jobDescription,
                jobTitle: resume.targetTitle ?? "",
                company: resume.targetCompany ?? "",
            });
            const fields = generatedWriteFields(data);
            const nextTitle = data.suggestedTitle || title;
            await updateResume({
                id: resume._id as Id<"resumes">,
                title: nextTitle,
                ...fields,
            });
            setTitle(nextTitle);
            setDraft(cloneResumeData(fields.resumeData));
            toast.success("Re-tailored from your matching resume");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not re-tailor");
        } finally {
            setRetailoring(false);
        }
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-col gap-3 border-b px-4 py-3 md:px-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        nativeButton={false}
                        render={<Link href="/dashboard/resumes" />}
                        variant="ghost"
                        size="sm"
                    >
                        <ArrowLeftIcon data-icon="inline-start" />
                        All resumes
                    </Button>
                    {kind === "tailored" ? (
                        <Badge variant="secondary">Tailored</Badge>
                    ) : matching === undefined ? null : isMatching ? (
                        <Badge>Matching resume</Badge>
                    ) : (
                        <Badge variant="outline">Base resume</Badge>
                    )}
                    {dirty ? <Badge variant="outline">Unsaved</Badge> : null}
                    {kind === "tailored" ? (
                        <p className="text-sm text-muted-foreground">
                            {job?._id ? (
                                <Link
                                    href={`/dashboard/jobs/${job._id}`}
                                    className="underline-offset-4 hover:underline"
                                >
                                    {jobLabel}
                                </Link>
                            ) : (
                                jobLabel
                            )}
                            {parent?._id ? (
                                <>
                                    {" · "}
                                    <Link
                                        href={`/resume/${parent._id}`}
                                        className="underline-offset-4 hover:underline"
                                    >
                                        Matching resume
                                    </Link>
                                </>
                            ) : null}
                        </p>
                    ) : matching === undefined ? null : (
                        <p className="text-sm text-muted-foreground">
                            Jobs rank against {isMatching ? "this resume" : "a different resume"}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        aria-label="Resume title"
                        className="h-9 max-w-md font-heading text-base"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={save} disabled={saving || !dirty}>
                            {saving ? <Spinner data-icon="inline-start" /> : null}
                            {saving ? "Saving…" : "Save"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => download("pdf")}
                            disabled={downloading !== null}
                        >
                            {downloading === "pdf" ? (
                                <Spinner data-icon="inline-start" />
                            ) : (
                                <FileTypeIcon data-icon="inline-start" />
                            )}
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => download("docx")}
                            disabled={downloading !== null}
                        >
                            {downloading === "docx" ? (
                                <Spinner data-icon="inline-start" />
                            ) : (
                                <FileTypeIcon data-icon="inline-start" />
                            )}
                            DOCX
                        </Button>
                        {kind === "tailored" ? (
                            <Button
                                variant="outline"
                                disabled={dirty || retailoring || !resume.jobDescription}
                                onClick={() => void retailor()}
                            >
                                {retailoring ? (
                                    <Spinner data-icon="inline-start" />
                                ) : (
                                    <RefreshCwIcon data-icon="inline-start" />
                                )}
                                {retailoring ? "Re-tailoring…" : "Re-tailor"}
                            </Button>
                        ) : null}
                        {kind === "base" && matching !== undefined && !isMatching ? (
                            <Button
                                variant="outline"
                                disabled={dirty}
                                onClick={async () => {
                                    await setPrimary({ id: resume._id as Id<"resumes"> });
                                    toast.success("Jobs will now rank against this resume");
                                }}
                            >
                                <StarIcon data-icon="inline-start" />
                                Use for matching
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>

            <Tabs
                value={tab}
                onValueChange={(value) => {
                    if (value) setTab(value);
                }}
                className="flex min-h-0 flex-1 flex-col gap-0"
            >
                <div className="border-b px-4 md:px-6">
                    <TabsList variant="line">
                        <TabsTrigger value="edit">
                            <PencilIcon data-icon="inline-start" />
                            Edit
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                            <CheckIcon data-icon="inline-start" />
                            Preview
                        </TabsTrigger>
                        <TabsTrigger value="fit">
                            <GaugeIcon data-icon="inline-start" />
                            {kind === "tailored" ? "ATS fit" : "Readiness"}
                            <span className="font-mono tabular-nums">{ats.score}</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent
                    value="edit"
                    className="min-h-0 flex-1 overflow-hidden pt-0"
                >
                    <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)]">
                        <div className="min-h-0 overflow-auto border-b p-4 md:p-6 lg:border-r lg:border-b-0">
                            <ResumeEditor data={draft} onChange={setDraft} />
                        </div>
                        <div className="hidden min-h-0 overflow-auto bg-muted/60 p-6 lg:block">
                            <Paper data={draft} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="min-h-0 flex-1 overflow-auto bg-muted/60 p-4 md:p-8">
                    <Paper data={draft} />
                </TabsContent>

                <TabsContent value="fit" className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
                    <div className="mx-auto w-full max-w-3xl">
                        <ATSReport
                            score={ats.score}
                            checks={ats.checks}
                            matchedKeywords={ats.matchedKeywords}
                            missingKeywords={ats.missingKeywords}
                            strengths={resume.atsAnalysis?.strengths}
                            improvements={resume.atsAnalysis?.improvements}
                            variant={kind === "tailored" ? "fit" : "readiness"}
                            jobLabel={kind === "tailored" ? jobLabel : undefined}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Paper({ data }: { data: ResumeData }) {
    return (
        <div className="mx-auto flex w-fit flex-col items-center gap-2">
            <div className="shadow-md">
                <ResumePreview data={data} />
            </div>
            <p className="text-xs text-muted-foreground">
                US Letter · Times New Roman · same as PDF and DOCX
            </p>
        </div>
    );
}
