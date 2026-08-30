"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/jobMatch";

type Market = {
    workplace: { id: string; count: number }[];
    sources: { id: string; count: number }[];
    topCompanies: { name: string; count: number; logo?: string; applyUrl: string }[];
    companyCount: number;
    postedLast7d: number;
    withSalary: number;
};

export function StatCard({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <Card size="sm">
            <CardHeader>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="font-mono text-2xl tabular-nums tracking-tight">
                    {value}
                </CardTitle>
                {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
            </CardHeader>
        </Card>
    );
}

export function MarketPulse({
    activeJobs,
    market,
    lastSyncAt,
    status,
}: {
    activeJobs: number;
    market: Market | null | undefined;
    lastSyncAt?: number;
    status?: string;
}) {
    if (market === undefined) {
        return (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                ))}
            </div>
        );
    }

    const remoteCount = market?.workplace.find((w) => w.id === "remote")?.count ?? 0;
    const remoteShare = market && activeJobs
        ? `${Math.round((remoteCount / Math.max(activeJobs, 1)) * 100)}%`
        : "—";

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
                label="Live roles"
                value={activeJobs >= 2000 ? "2,000+" : activeJobs.toLocaleString()}
                hint={
                    status === "running"
                        ? "Sync in progress"
                        : lastSyncAt
                            ? `Updated ${relativeTime(lastSyncAt)}`
                            : "Company career pages"
                }
            />
            <StatCard
                label="Companies"
                value={market ? market.companyCount.toLocaleString() : "—"}
                hint="Hiring on this board"
            />
            <StatCard
                label="Remote"
                value={remoteShare}
                hint="Parsed from the posting"
            />
            <Card size="sm">
                <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                        This week
                        {status === "running" ? <Badge variant="secondary">syncing</Badge> : null}
                    </CardDescription>
                    <CardTitle className="font-mono text-2xl tabular-nums tracking-tight">
                        {market ? market.postedLast7d.toLocaleString() : "—"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Posted in the last 7 days</p>
                </CardHeader>
            </Card>
        </div>
    );
}
