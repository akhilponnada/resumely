"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ClockIcon, FileTextIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
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
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

function formatDate(value: number) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
    );
}

function atsVariant(score: number) {
    if (score >= 80) return "default" as const;
    if (score >= 60) return "secondary" as const;
    return "destructive" as const;
}

export default function ResumesPage() {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const deleteResume = useMutation(api.resumes.deleteResume);

    const filtered = resumes?.filter((resume) =>
        resume.title.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <PageBody size="narrow">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-medium text-balance">
                        My resumes
                    </h1>
                    <p className="mt-1 text-pretty text-muted-foreground">
                        Open a file to preview, download, or check the ATS report.
                    </p>
                </div>
                <Button nativeButton={false} render={<Link href="/dashboard/new" />}>
                    <PlusIcon data-icon="inline-start" />
                    New resume
                </Button>
            </div>

            <InputGroup className="mb-6">
                <InputGroupAddon>
                    <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search resumes…"
                    aria-label="Search resumes"
                />
            </InputGroup>

            {resumes == null ? (
                <div
                    className="flex justify-center py-16"
                    aria-busy="true"
                    aria-label="Loading resumes"
                >
                    <Spinner />
                </div>
            ) : filtered?.length === 0 ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <FileTextIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>
                            {search ? "No resumes match that search" : "No resumes yet"}
                        </EmptyTitle>
                        <EmptyDescription>
                            {search
                                ? "Try a different title."
                                : "Create one to rank live roles against your skills."}
                        </EmptyDescription>
                    </EmptyHeader>
                    {!search ? (
                        <EmptyContent>
                            <Button nativeButton={false} render={<Link href="/dashboard/new" />}>
                                <PlusIcon data-icon="inline-start" />
                                Create resume
                            </Button>
                        </EmptyContent>
                    ) : null}
                </Empty>
            ) : (
                <ul className="flex flex-col gap-2">
                    {filtered?.map((resume) => (
                        <li key={resume._id}>
                            <Card size="sm">
                                <CardHeader className="flex flex-row items-center gap-3">
                                    <Link
                                        href={`/resume/${resume._id}`}
                                        className="flex min-w-0 flex-1 items-center gap-3"
                                    >
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <FileTextIcon aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0">
                                            <CardTitle className="truncate">{resume.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-1.5">
                                                <ClockIcon />
                                                {formatDate(resume.createdAt)}
                                                {resume.resumeData?.fullName
                                                    ? ` · ${resume.resumeData.fullName}`
                                                    : null}
                                            </CardDescription>
                                        </div>
                                    </Link>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {resume.atsScore !== undefined ? (
                                            <Badge
                                                variant={atsVariant(resume.atsScore)}
                                                className="font-mono tabular-nums"
                                            >
                                                {resume.atsScore}%
                                            </Badge>
                                        ) : null}
                                        {deleting === resume._id ? (
                                            <div className="flex gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        deleteResume({
                                                            id: resume._id as Id<"resumes">,
                                                        }).then(() => setDeleting(null))
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setDeleting(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={`Delete ${resume.title}`}
                                                onClick={() => setDeleting(resume._id)}
                                            >
                                                <Trash2Icon />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}

            {resumes && resumes.length > 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    {resumes.length} resume{resumes.length === 1 ? "" : "s"} total
                </p>
            ) : null}
        </PageBody>
    );
}
