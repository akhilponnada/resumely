"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { FileTextIcon } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ResumeStudio } from "@/components/resume/resume-studio";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

export default function ResumeViewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const resume = useQuery(api.resumes.getResumeById, {
        id: id as Id<"resumes">,
    });

    if (resume === undefined) {
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

    if (resume === null) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <FileTextIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>Resume not found</EmptyTitle>
                        <EmptyDescription>
                            It may have been deleted, or this link is for a different account.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button nativeButton={false} render={<Link href="/dashboard/resumes" />} variant="outline">
                            All resumes
                        </Button>
                    </EmptyContent>
                </Empty>
            </div>
        );
    }

    return <ResumeStudio resume={resume} />;
}
