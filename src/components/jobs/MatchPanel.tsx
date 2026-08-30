"use client";

import Link from "next/link";
import { FileTextIcon, LogInIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { matchSummary, type JobMatch } from "@/lib/jobMatch";

export function MatchPanel({
    match,
    resumeTitle,
    signedIn,
}: {
    match: JobMatch | null;
    resumeTitle?: string;
    signedIn: boolean;
}) {
    if (!signedIn) {
        return (
            <Alert>
                <LogInIcon />
                <AlertTitle>Get matched, then apply</AlertTitle>
                <AlertDescription>
                    Sign in to score this posting against your resume and generate an ATS-tailored version in one pass.
                </AlertDescription>
                <AlertAction>
                    <Button nativeButton={false} render={<Link href="/sign-up" />} size="sm">
                        Get started
                    </Button>
                </AlertAction>
            </Alert>
        );
    }

    if (!match) {
        return (
            <Alert>
                <FileTextIcon />
                <AlertTitle>Upload a resume to get matched</AlertTitle>
                <AlertDescription>
                    Build or paste a resume once. Every live role then gets a match score, skill gaps, and a one-click tailor.
                </AlertDescription>
                <AlertAction>
                    <Button nativeButton={false} render={<Link href="/dashboard/new" />} size="sm">
                        Add resume
                    </Button>
                </AlertAction>
            </Alert>
        );
    }

    return (
        <Card size="sm">
            <CardHeader>
                <CardDescription>{resumeTitle ?? "Matching resume"}</CardDescription>
                <CardTitle>Match</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div>
                    <div className="font-mono text-4xl font-medium tracking-tight tabular-nums">
                        {match.score}
                        <span className="text-base text-muted-foreground">%</span>
                    </div>
                    <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                        {matchSummary(match)}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {match.breakdown.map((row) => (
                        <Progress key={row.id} value={row.value}>
                            <div className="flex w-full">
                                <ProgressLabel>{row.label}</ProgressLabel>
                                <ProgressValue />
                            </div>
                        </Progress>
                    ))}
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Skills on your resume
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {match.matched.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No clear overlaps yet.</span>
                        ) : (
                            match.matched.map((k) => (
                                <Badge key={k} variant="secondary">
                                    {k}
                                </Badge>
                            ))
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Missing from this JD
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {match.missing.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Coverage looks tight.</span>
                        ) : (
                            match.missing.map((k) => (
                                <Badge key={k} variant="outline">
                                    {k}
                                </Badge>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
