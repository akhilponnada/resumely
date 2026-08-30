"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { saveAs } from "file-saver";
import {
    AlertTriangleIcon,
    ArrowLeftIcon,
    CheckIcon,
    CodeIcon,
    EyeIcon,
    FileTypeIcon,
    GaugeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ATSReport } from "@/components/ATSReport";
import { PageBody } from "@/components/page-body";
import { ResumePreview } from "@/components/ResumePreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDate(value: number) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
    );
}

export default function ResumeViewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [tab, setTab] = useState("preview");
    const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);

    const resume = useQuery(api.resumes.getResumeById, {
        id: id as Id<"resumes">,
    });

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
            toast.error(
                err instanceof Error
                    ? err.message
                    : `Failed to generate ${format.toUpperCase()}`,
            );
        } finally {
            setDownloading(null);
        }
    };

    if (!resume) {
        return (
            <div
                className="flex flex-1 items-center justify-center"
                aria-busy="true"
                aria-label="Loading resume"
            >
                <Spinner />
            </div>
        );
    }

    const ats = resume.atsScore;

    return (
        <PageBody>
            <Button variant="ghost" className="mb-5" onClick={() => router.back()}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
            </Button>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="font-heading text-3xl font-medium text-balance">
                        {resume.title}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Created {formatDate(resume.createdAt)}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {ats !== undefined ? (
                        <Badge
                            variant={
                                ats >= 80 ? "default" : ats >= 60 ? "secondary" : "destructive"
                            }
                            className="h-8 gap-1.5 px-3 font-mono tabular-nums"
                        >
                            {ats >= 80 ? <CheckIcon /> : <AlertTriangleIcon />}
                            {ats}% ATS
                        </Badge>
                    ) : null}
                    <Button
                        onClick={() => download("pdf")}
                        disabled={downloading !== null}
                    >
                        {downloading === "pdf" ? (
                            <Spinner data-icon="inline-start" />
                        ) : (
                            <FileTypeIcon data-icon="inline-start" />
                        )}
                        {downloading === "pdf" ? "Generating…" : "Download PDF"}
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
                        {downloading === "docx" ? "Generating…" : "Download DOCX"}
                    </Button>
                </div>
            </div>

            <Tabs
                value={tab}
                onValueChange={(value) => {
                    if (value) setTab(value);
                }}
            >
                <TabsList variant="line">
                    <TabsTrigger value="preview">
                        <EyeIcon data-icon="inline-start" />
                        Preview
                    </TabsTrigger>
                    <TabsTrigger value="ats">
                        <GaugeIcon data-icon="inline-start" />
                        ATS report
                    </TabsTrigger>
                    <TabsTrigger value="data">
                        <CodeIcon data-icon="inline-start" />
                        Raw data
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="pt-6">
                    <div className="flex justify-center overflow-auto rounded-xl bg-muted p-6">
                        <div className="shadow-lg">
                            <ResumePreview data={resume.resumeData} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="ats" className="pt-6">
                    <ATSReport
                        score={resume.atsScore}
                        checks={resume.atsChecks}
                        matchedKeywords={resume.matchedKeywords}
                        missingKeywords={resume.missingKeywords}
                        strengths={resume.atsAnalysis?.strengths}
                        improvements={resume.atsAnalysis?.improvements}
                    />
                </TabsContent>

                <TabsContent value="data" className="pt-6">
                    <div className="flex flex-col gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Original input</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-4 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                                    {resume.rawInput}
                                </pre>
                            </CardContent>
                        </Card>
                        {resume.jobDescription ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Job description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-4 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                                        {resume.jobDescription}
                                    </pre>
                                </CardContent>
                            </Card>
                        ) : null}
                        <Card>
                            <CardHeader>
                                <CardTitle>Parsed resume data</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                                    {JSON.stringify(resume.resumeData, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </PageBody>
    );
}
