"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { FileTextIcon, PlusIcon } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { DashboardLayout } from "@/components/DashboardLayout";
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
import { Badge } from "@/components/ui/badge";

function formatDate(value: number) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value)
    );
}

export default function Dashboard() {
    const { user } = useUser();
    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");

    const totalResumes = resumes?.length ?? 0;
    const averageATS =
        resumes && resumes.length > 0
            ? Math.round(
                  resumes.reduce((acc, r) => acc + (r.atsScore || 0), 0) / resumes.length
              )
            : 0;

    const userName = `${user?.firstName || ""} ${user?.lastName || ""}`.toLowerCase();
    const isSpecialUser =
        userName.includes("nagasri") ||
        userName.includes("naga sri") ||
        userName.includes("arvapalli");

    return (
        <DashboardLayout>
            <div className="page-container">
                {isSpecialUser ? (
                    <Card size="sm" className="mb-6">
                        <CardHeader>
                            <CardTitle>Gurujiii — you got this</CardTitle>
                            <CardDescription>
                                Apply to 5 jobs today, then rest. Small steps compound.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : null}

                <header className="mb-8">
                    <h1 className="font-heading text-3xl font-medium text-balance">
                        Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
                    </h1>
                    <p className="mt-1 text-pretty text-muted-foreground">
                        Manage resumes and match them to live roles.
                    </p>
                </header>

                <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Card size="sm">
                        <CardHeader>
                            <CardDescription>Resumes</CardDescription>
                            <CardTitle className="font-mono text-2xl tabular-nums">
                                {resumes == null ? "—" : totalResumes.toLocaleString()}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card size="sm">
                        <CardHeader>
                            <CardDescription>Avg ATS score</CardDescription>
                            <CardTitle className="font-mono text-2xl tabular-nums">
                                {resumes == null ? "—" : `${averageATS}%`}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Link href="/dashboard/jobs" className="block">
                        <Card size="sm" className="h-full bg-foreground text-background">
                            <CardHeader>
                                <CardDescription className="text-background/70">
                                    Jobs
                                </CardDescription>
                                <CardTitle>Get matched</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>

                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-heading text-xl font-medium">Recent resumes</h2>
                    {totalResumes > 5 ? (
                        <Button
                            nativeButton={false}
                            render={<Link href="/dashboard/resumes" />}
                            variant="ghost"
                            size="sm"
                        >
                            View all
                        </Button>
                    ) : null}
                </div>

                {resumes == null ? (
                    <div
                        className="flex justify-center py-12"
                        aria-busy="true"
                        aria-label="Loading resumes"
                    >
                        <div className="loader" />
                    </div>
                ) : resumes.length === 0 ? (
                    <Empty className="border border-dashed">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <FileTextIcon aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>No resumes yet</EmptyTitle>
                            <EmptyDescription>
                                Create one to rank live roles against your skills.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button nativeButton={false} render={<Link href="/dashboard/new" />}>
                                <PlusIcon data-icon="inline-start" />
                                Create resume
                            </Button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {resumes.slice(0, 5).map((resume) => (
                            <li key={resume._id}>
                                <Link
                                    href={`/resume/${resume._id}`}
                                    className="flex items-center justify-between gap-4 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10 hover:bg-muted"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{resume.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(resume.createdAt)}
                                        </p>
                                    </div>
                                    {resume.atsScore !== undefined ? (
                                        <Badge
                                            variant={resume.atsScore >= 80 ? "default" : "secondary"}
                                            className="font-mono tabular-nums"
                                        >
                                            {resume.atsScore}%
                                        </Badge>
                                    ) : null}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </DashboardLayout>
    );
}
