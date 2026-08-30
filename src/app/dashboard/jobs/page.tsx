"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { BookmarkIcon } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobsBoard } from "@/components/jobs/JobsBoard";
import { StatCard } from "@/components/jobs/MarketPulse";
import { QuietErrorBoundary } from "@/components/jobs/QuietErrorBoundary";
import { countSkills } from "@/lib/jobMatch";
import type { ResumeData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardJobsPage() {
    const [tab, setTab] = useState("all");
    const { user } = useUser();
    const saved = useQuery(api.jobs.listSaved, user?.id ? {} : "skip");
    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const latest = resumes?.[0]?.resumeData as ResumeData | undefined;

    const skills = useMemo(() => countSkills(latest), [latest]);
    const firstName = user?.firstName ?? "there";

    return (
        <DashboardLayout>
            <div className="flex min-h-svh flex-col gap-5 px-6 py-6 md:px-8">
                <header className="flex flex-col gap-1">
                    <h1 className="font-heading text-3xl font-medium text-balance">
                        Welcome back, {firstName}
                    </h1>
                    <p className="text-pretty text-muted-foreground">
                        {latest
                            ? `Ranked against ${resumes?.[0]?.title ?? "your latest resume"}.`
                            : "Upload a resume to rank every live role against your skills."}
                    </p>
                    {!latest ? (
                        <div className="pt-1">
                            <Button nativeButton={false} render={<Link href="/dashboard/new" />} size="sm">
                                Create a resume
                            </Button>
                        </div>
                    ) : null}
                </header>

                <QuietErrorBoundary>
                    <DashboardStats
                        savedCount={saved?.length}
                        skillCount={skills}
                        resumeCount={resumes?.length}
                    />
                </QuietErrorBoundary>

                <Tabs
                    value={tab}
                    onValueChange={(value) => {
                        if (value) setTab(value);
                    }}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <TabsList>
                        <TabsTrigger value="all">Top matches</TabsTrigger>
                        <TabsTrigger value="saved">
                            <BookmarkIcon data-icon="inline-start" />
                            Saved
                            {saved ? <Badge variant="secondary">{saved.length}</Badge> : null}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="flex min-h-0 flex-1 flex-col pt-4">
                        <JobsBoard basePath="/dashboard/jobs" showPulse={false} />
                    </TabsContent>
                    <TabsContent value="saved" className="flex min-h-0 flex-1 flex-col pt-4">
                        <JobsBoard basePath="/dashboard/jobs" savedOnly showPulse={false} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

function DashboardStats({
    savedCount,
    skillCount,
    resumeCount,
}: {
    savedCount?: number;
    skillCount: number;
    resumeCount?: number;
}) {
    const pulse = useQuery(api.jobs.getMarketPulse);
    const live = pulse?.activeJobs;

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
                label="Live roles"
                value={live == null ? "—" : live >= 2000 ? "2,000+" : live.toLocaleString()}
                hint="Company career pages"
            />
            <StatCard
                label="Saved"
                value={savedCount == null ? "—" : savedCount.toLocaleString()}
                hint="Roles you pinned"
            />
            <StatCard
                label="Skills"
                value={skillCount.toLocaleString()}
                hint="From your latest resume"
            />
            <StatCard
                label="Resumes"
                value={resumeCount == null ? "—" : resumeCount.toLocaleString()}
                hint="Ready to tailor"
            />
        </div>
    );
}
