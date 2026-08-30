"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ClockIcon, FileTextIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PageBody } from "@/components/page-body";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { pickPrimary, resumeKind, skillCount, tailoredFor } from "@/lib/resume-model";
import type { ResumeData } from "@/lib/types";

function formatDate(value: number) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
    );
}

export default function ResumesPage() {
    const { user } = useUser();
    const [deleting, setDeleting] = useState<string | null>(null);

    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const deleteResume = useMutation(api.resumes.deleteResume);
    const setPrimary = useMutation(api.resumes.setPrimaryResume);

    const primary = pickPrimary(resumes);
    const bases = (resumes ?? []).filter((resume) => resumeKind(resume) === "base");
    const tailored = (resumes ?? []).filter((resume) => resumeKind(resume) === "tailored");

    return (
        <PageBody>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-medium text-balance">
                        Resumes
                    </h1>
                    <p className="mt-1 text-pretty text-muted-foreground">
                        One matching resume ranks jobs. Tailored copies are what you send to a posting.
                    </p>
                </div>
                <Button nativeButton={false} render={<Link href="/dashboard/new" />}>
                    <PlusIcon data-icon="inline-start" />
                    New resume
                </Button>
            </div>

            {resumes == null ? (
                <div
                    className="flex justify-center py-16"
                    aria-busy="true"
                    aria-label="Loading resumes"
                >
                    <Spinner />
                </div>
            ) : resumes.length === 0 ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <FileTextIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>No matching resume yet</EmptyTitle>
                        <EmptyDescription>
                            Upload or paste once. Live roles then rank against it, and you tailor a copy per job.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button nativeButton={false} render={<Link href="/dashboard/new" />}>
                            <PlusIcon data-icon="inline-start" />
                            Add resume
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="flex flex-col gap-10">
                    <section className="flex flex-col gap-3">
                        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                            Matching resume
                        </h2>
                        {primary ? (
                            <PrimaryCard
                                resume={primary}
                                deleting={deleting === primary._id}
                                onDelete={() => setDeleting(primary._id)}
                                onCancel={() => setDeleting(null)}
                                onConfirmDelete={() =>
                                    deleteResume({ id: primary._id as Id<"resumes"> }).then(() =>
                                        setDeleting(null),
                                    )
                                }
                            />
                        ) : null}
                        {bases.filter((resume) => resume._id !== primary?._id).length > 0 ? (
                            <ul className="flex flex-col gap-2">
                                {bases
                                    .filter((resume) => resume._id !== primary?._id)
                                    .map((resume) => (
                                        <li key={resume._id}>
                                            <ResumeRow
                                                href={`/resume/${resume._id}`}
                                                title={resume.title}
                                                subtitle={`${resume.resumeData.fullName || "Untitled"} · ${formatDate(resume.updatedAt || resume.createdAt)}`}
                                                badge="Base"
                                                deleting={deleting === resume._id}
                                                onDelete={() => setDeleting(resume._id)}
                                                onCancel={() => setDeleting(null)}
                                                onConfirmDelete={() =>
                                                    deleteResume({
                                                        id: resume._id as Id<"resumes">,
                                                    }).then(() => setDeleting(null))
                                                }
                                                extra={
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setPrimary({
                                                                id: resume._id as Id<"resumes">,
                                                            })
                                                        }
                                                    >
                                                        <StarIcon data-icon="inline-start" />
                                                        Use for matching
                                                    </Button>
                                                }
                                            />
                                        </li>
                                    ))}
                            </ul>
                        ) : null}
                    </section>

                    <section className="flex flex-col gap-3">
                        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                            Tailored copies
                        </h2>
                        {tailored.length === 0 ? (
                            <Empty className="border border-dashed">
                                <EmptyHeader>
                                    <EmptyTitle>No tailored copies yet</EmptyTitle>
                                    <EmptyDescription>
                                        Open a live role and tailor. The matching resume stays as-is.
                                    </EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <Button
                                        nativeButton={false}
                                        render={<Link href="/dashboard/jobs" />}
                                        variant="outline"
                                    >
                                        Browse jobs
                                    </Button>
                                </EmptyContent>
                            </Empty>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {[...tailored]
                                    .sort(
                                        (a, b) =>
                                            (b.updatedAt || b.createdAt) -
                                            (a.updatedAt || a.createdAt),
                                    )
                                    .map((resume) => (
                                    <li key={resume._id}>
                                        <ResumeRow
                                            href={`/resume/${resume._id}`}
                                            title={tailoredFor(resume)}
                                            subtitle={formatDate(resume.updatedAt || resume.createdAt)}
                                            badge={
                                                resume.atsScore !== undefined
                                                    ? `${resume.atsScore}% ATS`
                                                    : "Tailored"
                                            }
                                            deleting={deleting === resume._id}
                                            onDelete={() => setDeleting(resume._id)}
                                            onCancel={() => setDeleting(null)}
                                            onConfirmDelete={() =>
                                                deleteResume({
                                                    id: resume._id as Id<"resumes">,
                                                }).then(() => setDeleting(null))
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
        </PageBody>
    );
}

function PrimaryCard({
    resume,
    deleting,
    onDelete,
    onCancel,
    onConfirmDelete,
}: {
    resume: {
        _id: string;
        title: string;
        createdAt: number;
        updatedAt: number;
        atsScore?: number;
        resumeData: ResumeData;
    };
    deleting: boolean;
    onDelete: () => void;
    onCancel: () => void;
    onConfirmDelete: () => void;
}) {
    const skills = skillCount(resume.resumeData);
    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <Link href={`/resume/${resume._id}`} className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                        <Badge>Matching</Badge>
                        <span className="text-xs text-muted-foreground">
                            Jobs rank against this
                        </span>
                    </div>
                    <CardTitle className="font-heading text-2xl font-medium">
                        {resume.resumeData.fullName || resume.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                        {resume.title} · {skills} skills · updated {formatDate(resume.updatedAt || resume.createdAt)}
                    </CardDescription>
                    {resume.resumeData.summary ? (
                        <p className="mt-3 line-clamp-2 text-sm text-pretty">
                            {resume.resumeData.summary}
                        </p>
                    ) : null}
                </Link>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <Button nativeButton={false} render={<Link href={`/resume/${resume._id}`} />}>
                        Edit
                    </Button>
                    {deleting ? (
                        <>
                            <Button size="sm" variant="destructive" onClick={onConfirmDelete}>
                                Delete
                            </Button>
                            <Button size="sm" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${resume.title}`}
                            onClick={onDelete}
                        >
                            <Trash2Icon />
                        </Button>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
}

function ResumeRow({
    href,
    title,
    subtitle,
    badge,
    extra,
    deleting,
    onDelete,
    onCancel,
    onConfirmDelete,
}: {
    href: string;
    title: string;
    subtitle: string;
    badge?: string;
    extra?: ReactNode;
    deleting: boolean;
    onDelete: () => void;
    onCancel: () => void;
    onConfirmDelete: () => void;
}) {
    return (
        <Card size="sm">
            <CardHeader className="flex flex-row items-center gap-3">
                <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileTextIcon aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="truncate">{title}</CardTitle>
                        <CardDescription className="flex items-center gap-1.5">
                            <ClockIcon />
                            {subtitle}
                        </CardDescription>
                    </div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                    {badge ? (
                        <Badge variant="secondary" className="font-mono tabular-nums">
                            {badge}
                        </Badge>
                    ) : null}
                    {extra}
                    {deleting ? (
                        <div className="flex gap-1.5">
                            <Button size="sm" variant="destructive" onClick={onConfirmDelete}>
                                Delete
                            </Button>
                            <Button size="sm" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${title}`}
                            onClick={onDelete}
                        >
                            <Trash2Icon />
                        </Button>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
}
