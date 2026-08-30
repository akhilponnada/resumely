"use client";

import Link from "next/link";
import { ArrowUpRightIcon, BookmarkIcon, BriefcaseIcon, LogInIcon } from "lucide-react";
import { TailorResumeButton } from "@/components/resume/tailor-resume-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { relativeTime } from "@/lib/jobMatch";
import { sourceLabel, workplaceLabel } from "@/lib/companyLogos";
import { CompanyMark } from "./CompanyMark";
import { JobDescription } from "./JobDescription";
import { MatchPanel } from "./MatchPanel";
import type { BoardJob } from "./types";
import type { JobMatch } from "@/lib/jobMatch";

export function JobPreview({
    job,
    match,
    resumeTitle,
    signedIn,
    saved,
    onSave,
    basePath,
    showOpenPage = true,
}: {
    job: BoardJob | null;
    match: JobMatch | null;
    resumeTitle?: string;
    signedIn: boolean;
    saved?: boolean;
    onSave?: () => void;
    basePath: "/jobs" | "/dashboard/jobs";
    showOpenPage?: boolean;
}) {
    if (!job) {
        return (
            <Empty className="h-full min-h-80">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <BriefcaseIcon />
                    </EmptyMedia>
                    <EmptyTitle>Select a match</EmptyTitle>
                    <EmptyDescription>
                        Pick a role on the left to see the posting, your score, and a one-click tailor.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                    <CompanyMark
                        company={job.company}
                        logo={job.companyLogo}
                        applyUrl={job.applyUrl}
                        size="lg"
                    />
                    <div className="min-w-0 flex-1">
                        <h2 className="font-heading text-xl font-medium tracking-tight text-balance">
                            {job.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                            <span>{job.location || "Location not listed"}</span>
                            <Badge variant="secondary">{workplaceLabel(job.workplace)}</Badge>
                            <Badge variant="outline">{sourceLabel(job.source)}</Badge>
                            {job.salary ? (
                                <span className="font-mono text-xs tabular-nums">{job.salary}</span>
                            ) : null}
                            <span className="font-mono text-xs tabular-nums">{relativeTime(job.postedAt)}</span>
                        </div>
                    </div>
                </div>

                {job.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {job.tags.slice(0, 8).map((tag) => (
                            <Badge key={tag} variant="outline">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        nativeButton={false}
                        render={<a href={job.applyUrl} target="_blank" rel="noreferrer" />}
                    >
                        Apply
                        <ArrowUpRightIcon data-icon="inline-end" />
                    </Button>
                    {signedIn && onSave ? (
                        <Button variant={saved ? "secondary" : "outline"} onClick={onSave}>
                            <BookmarkIcon data-icon="inline-start" fill={saved ? "currentColor" : "none"} />
                            {saved ? "Saved" : "Save"}
                        </Button>
                    ) : null}
                    {signedIn ? (
                        <TailorResumeButton
                            jobId={job._id}
                            title={job.title}
                            company={job.company}
                            descriptionText={job.descriptionText}
                        />
                    ) : (
                        <Button
                            nativeButton={false}
                            render={<Link href="/sign-up" />}
                            variant="outline"
                        >
                            <LogInIcon data-icon="inline-start" />
                            Get matched
                        </Button>
                    )}
                </div>
            </div>

            <Separator />

            <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-5 p-5">
                    <MatchPanel
                        match={match}
                        resumeTitle={resumeTitle}
                        signedIn={signedIn}
                    />
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-medium">Job description</h3>
                            {showOpenPage ? (
                                <Button
                                    nativeButton={false}
                                    render={<Link href={`${basePath}/${job._id}`} />}
                                    variant="link"
                                    size="sm"
                                >
                                    Open page
                                </Button>
                            ) : null}
                        </div>
                        <JobDescription text={job.descriptionText} />
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
