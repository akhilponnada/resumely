"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { JobPreview } from "./JobPreview";
import { matchJob } from "@/lib/jobMatch";
import type { ResumeData } from "@/lib/types";
import type { BoardJob } from "./types";

export function JobDetailView({
    params,
    basePath,
}: {
    params: Promise<{ id: string }>;
    basePath: "/jobs" | "/dashboard/jobs";
}) {
    const { id } = use(params);
    const jobId = id as Id<"jobs">;
    const job = useQuery(api.jobs.getJob, { id: jobId });
    const { user } = useUser();
    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const savedIds = useQuery(api.jobs.savedIds, user?.id ? {} : "skip");
    const toggleSave = useMutation(api.jobs.toggleSave);
    const latest = resumes?.[0]?.resumeData as ResumeData | undefined;
    const match = job && latest
        ? matchJob(latest, {
            title: job.title,
            company: job.company,
            descriptionText: job.descriptionText,
            tags: job.tags,
            location: job.location,
        })
        : null;
    const saved = savedIds?.some((sid) => sid === jobId);

    async function onSave() {
        const nowSaved = await toggleSave({ jobId });
        toast(nowSaved ? "Saved" : "Removed from saved");
    }

    if (job === undefined) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (job === null) {
        return (
            <Empty className="border border-dashed">
                <EmptyHeader>
                    <EmptyTitle>This role is no longer listed</EmptyTitle>
                    <EmptyDescription>
                        It may have closed on the company board. Head back to the live list.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button nativeButton={false} render={<Link href={basePath} />} variant="outline">
                        All jobs
                    </Button>
                </EmptyContent>
            </Empty>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link href={basePath} />}>Jobs</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="max-w-[20rem] truncate">{job.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
                <JobPreview
                    job={job as BoardJob}
                    match={match}
                    resumeTitle={resumes?.[0]?.title}
                    signedIn={Boolean(user)}
                    saved={saved}
                    onSave={user ? onSave : undefined}
                    basePath={basePath}
                    showOpenPage={false}
                />
            </div>
        </div>
    );
}
