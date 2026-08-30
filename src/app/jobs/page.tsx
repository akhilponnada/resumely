"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { JobsBoard } from "@/components/jobs/JobsBoard";
import { Button } from "@/components/ui/button";

export default function PublicJobsPage() {
    const { isSignedIn } = useAuth();

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
            <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="font-heading text-3xl font-medium text-balance md:text-4xl">
                        Stop searching. Get matched.
                    </h1>
                    <p className="max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
                        Live roles from company career pages — Greenhouse, Lever, Ashby — ranked against your resume. Save, hide, tailor, apply.
                    </p>
                </div>
                {!isSignedIn ? (
                    <Button nativeButton={false} render={<Link href="/sign-up" />}>
                        Get matched
                    </Button>
                ) : (
                    <Button nativeButton={false} render={<Link href="/dashboard/jobs" />} variant="outline">
                        Open your matches
                    </Button>
                )}
            </header>
            <JobsBoard basePath="/jobs" />
        </div>
    );
}
