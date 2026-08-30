"use client";

import { AlertTriangleIcon, CheckIcon, InfoIcon, XIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ATSCheck {
    id: string;
    label: string;
    points: number;
    max: number;
    status: string;
    detail: string;
}

interface Props {
    score?: number;
    checks?: ATSCheck[];
    matchedKeywords?: string[];
    missingKeywords?: string[];
    improvements?: string[];
    strengths?: string[];
    variant?: "readiness" | "fit";
    jobLabel?: string;
}

function statusVariant(status: string) {
    if (status === "pass") return "default" as const;
    if (status === "fail") return "destructive" as const;
    return "secondary" as const;
}

function StatusIcon({ status }: { status: string }) {
    if (status === "pass") return <CheckIcon />;
    if (status === "fail") return <XIcon />;
    return <AlertTriangleIcon />;
}

export function ATSReport({
    score,
    checks,
    matchedKeywords,
    missingKeywords,
    improvements,
    strengths,
    variant = "readiness",
    jobLabel,
}: Props) {
    if (!checks?.length) {
        return (
            <Alert>
                <InfoIcon />
                <AlertTitle>No breakdown for this resume</AlertTitle>
                <AlertDescription>
                    Save the resume in the editor to generate a full breakdown.
                </AlertDescription>
            </Alert>
        );
    }

    const isFit = variant === "fit";

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center gap-6">
                    <p className="font-mono text-5xl font-medium tabular-nums leading-none">
                        {score ?? 0}
                        <span className="text-lg text-muted-foreground">/100</span>
                    </p>
                    <div>
                        <CardTitle>
                            {isFit
                                ? jobLabel
                                    ? `ATS fit · ${jobLabel}`
                                    : "ATS fit"
                                : "Resume readiness"}
                        </CardTitle>
                        <CardDescription>
                            {isFit
                                ? "Keyword overlap with this posting plus structure, bullets, and dates. Same resume, same number."
                                : "Structure, contact details, bullets, and dates. Keyword match is scored when you tailor this to a job."}
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <ul className="flex flex-col gap-2">
                {checks.map((check) => (
                    <li key={check.id}>
                        <Card size="sm">
                            <CardHeader className="flex flex-row items-start gap-3">
                                <Badge
                                    variant={statusVariant(check.status)}
                                    className="mt-0.5 size-7 justify-center rounded-md px-0"
                                >
                                    <StatusIcon status={check.status} />
                                    <span className="sr-only">{check.status}</span>
                                </Badge>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <CardTitle>{check.label}</CardTitle>
                                        <p className="font-mono text-xs tabular-nums text-muted-foreground">
                                            {check.points}/{check.max}
                                        </p>
                                    </div>
                                    <CardDescription>{check.detail}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </li>
                ))}
            </ul>

            {isFit && (matchedKeywords?.length || missingKeywords?.length) ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Keywords from the job description</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {matchedKeywords?.length ? (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Found in your resume
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {matchedKeywords.map((keyword) => (
                                        <Badge key={keyword} variant="secondary">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        {missingKeywords?.length ? (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Missing — work these in where they are true
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {missingKeywords.map((keyword) => (
                                        <Badge key={keyword} variant="outline">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            ) : null}

            {strengths?.length || improvements?.length ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {strengths?.length ? (
                            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
                                {strengths.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        ) : null}
                        {improvements?.length ? (
                            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
                                {improvements.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        ) : null}
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
