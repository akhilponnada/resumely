"use client";

import { useEffect, useMemo, useState } from "react";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { SearchIcon, BookmarkIcon } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { ItemGroup } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { JobRow } from "./JobRow";
import { JobPreview } from "./JobPreview";
import { MarketPulse } from "./MarketPulse";
import { QuietErrorBoundary } from "./QuietErrorBoundary";
import { useHiddenJobs } from "./useHiddenJobs";
import { matchJob } from "@/lib/jobMatch";
import type { ResumeData } from "@/lib/types";
import type { BoardJob, RankedJob } from "./types";

const WORKPLACES = [
    { id: "all", label: "All" },
    { id: "remote", label: "Remote" },
    { id: "hybrid", label: "Hybrid" },
    { id: "onsite", label: "On-site" },
];

function useDesktop() {
    const [desktop, setDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const update = () => setDesktop(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);
    return desktop;
}

export function JobsBoard({
    basePath,
    savedOnly = false,
    showPulse = true,
}: {
    basePath: "/jobs" | "/dashboard/jobs";
    savedOnly?: boolean;
    showPulse?: boolean;
}) {
    const { user } = useUser();
    const isDesktop = useDesktop();
    const { hidden, hide, unhide } = useHiddenJobs();
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [workplace, setWorkplace] = useState("all");
    const [sort, setSort] = useState<"newest" | "match">("match");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 280);
        return () => clearTimeout(t);
    }, [search]);

    const ensureCrawl = useMutation(api.jobs.ensureCrawl);
    useEffect(() => {
        if (!savedOnly) ensureCrawl({}).catch(() => undefined);
    }, [ensureCrawl, savedOnly]);

    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const saved = useQuery(api.jobs.savedIds, user?.id ? {} : "skip");
    const savedRows = useQuery(api.jobs.listSaved, user?.id && savedOnly ? {} : "skip");
    const toggleSave = useMutation(api.jobs.toggleSave);

    const latestResume = resumes?.[0]?.resumeData as ResumeData | undefined;
    const savedSet = useMemo(() => new Set((saved ?? []).map(String)), [saved]);

    const { results, status, loadMore } = usePaginatedQuery(
        api.jobs.listJobs,
        savedOnly ? "skip" : { search: debounced || undefined, workplace },
        { initialNumItems: 24 }
    );

    const sourceJobs = useMemo((): BoardJob[] => {
        if (savedOnly) {
            return (savedRows ?? [])
                .map((row) => row.job)
                .filter((job): job is NonNullable<typeof job> => Boolean(job)) as BoardJob[];
        }
        return results as BoardJob[];
    }, [savedOnly, savedRows, results]);

    const ranked = useMemo((): RankedJob[] => {
        const q = debounced.toLowerCase();
        const rows = sourceJobs
            .filter((job) => !hidden.has(job._id))
            .filter((job) => {
                if (!savedOnly || !q) return true;
                return (
                    job.title.toLowerCase().includes(q)
                    || job.company.toLowerCase().includes(q)
                    || job.tags.some((t) => t.toLowerCase().includes(q))
                );
            })
            .filter((job) => {
                if (!savedOnly || workplace === "all") return true;
                return job.workplace === workplace;
            })
            .map((job) => {
                const match = latestResume
                    ? matchJob(latestResume, {
                        title: job.title,
                        company: job.company,
                        descriptionText: job.descriptionText,
                        tags: job.tags,
                        location: job.location,
                    })
                    : null;
                return { job, match };
            });
        if (sort === "match" && latestResume) {
            return [...rows].sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
        }
        return rows;
    }, [sourceJobs, latestResume, sort, hidden, savedOnly, debounced, workplace]);

    const selected = ranked.find((row) => row.job._id === selectedId) ?? ranked[0] ?? null;
    const loading = savedOnly ? savedRows === undefined : status === "LoadingFirstPage";

    async function onSave(jobId: string) {
        const nowSaved = await toggleSave({ jobId: jobId as Id<"jobs"> });
        toast(nowSaved ? "Saved" : "Removed from saved");
    }

    function onHide(jobId: string) {
        hide(jobId);
        toast("Hidden from this list", {
            action: {
                label: "Undo",
                onClick: () => unhide(jobId),
            },
        });
    }

    function selectJob(id: string) {
        setSelectedId(id);
        if (!isDesktop) setSheetOpen(true);
    }

    const activeId = selected?.job._id ?? null;

    const list = (
        <MatchList
            ranked={ranked}
            loading={loading}
            selectedId={activeId}
            savedSet={savedSet}
            canSave={Boolean(user)}
            status={savedOnly ? "Exhausted" : status}
            onSelect={selectJob}
            onSave={onSave}
            onHide={onHide}
            onLoadMore={() => loadMore(24)}
        />
    );

    const preview = loading ? (
        <PreviewSkeleton />
    ) : (
        <JobPreview
            job={selected?.job ?? null}
            match={selected?.match ?? null}
            resumeTitle={resumes?.[0]?.title}
            signedIn={Boolean(user)}
            saved={selected ? savedSet.has(selected.job._id) : false}
            onSave={user && selected ? () => onSave(selected.job._id) : undefined}
            basePath={basePath}
        />
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
            {showPulse && !savedOnly ? (
                <QuietErrorBoundary>
                    <MarketPulseLoader />
                </QuietErrorBoundary>
            ) : null}

            <div className="flex flex-col gap-3">
                <InputGroup>
                    <InputGroupAddon>
                        <SearchIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={savedOnly ? "Filter saved roles" : "Search title, company, stack…"}
                        aria-label="Search jobs"
                        autoComplete="off"
                    />
                    <QuietErrorBoundary>
                        <RoleCountAddon count={ranked.length} loading={loading} />
                    </QuietErrorBoundary>
                </InputGroup>

                <div className="flex flex-wrap items-center gap-2">
                    <ToggleGroup
                        value={[workplace]}
                        onValueChange={(v) => {
                            if (v[0]) setWorkplace(v[0]);
                        }}
                        variant="outline"
                        size="sm"
                    >
                        {WORKPLACES.map((w) => (
                            <ToggleGroupItem key={w.id} value={w.id}>
                                {w.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    {latestResume ? (
                        <ToggleGroup
                            value={[sort]}
                            onValueChange={(v) => {
                                if (v[0] === "newest" || v[0] === "match") setSort(v[0]);
                            }}
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                        >
                            <ToggleGroupItem value="match">Best match</ToggleGroupItem>
                            <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
                        </ToggleGroup>
                    ) : null}
                </div>
            </div>

            <div className="min-h-[28rem] flex-1 md:hidden">
                {list}
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
                        <SheetHeader className="sr-only">
                            <SheetTitle>{selected?.job.title ?? "Job"}</SheetTitle>
                            <SheetDescription>Match preview and job description</SheetDescription>
                        </SheetHeader>
                        {preview}
                    </SheetContent>
                </Sheet>
            </div>

            <ResizablePanelGroup
                orientation="horizontal"
                className="hidden h-[min(70svh,52rem)] min-h-[32rem] flex-1 rounded-xl border md:flex"
            >
                <ResizablePanel defaultSize="38%" minSize="28%" className="min-h-0 overflow-hidden">
                    {list}
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="62%" minSize="40%" className="min-h-0 overflow-hidden">
                    {preview}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

function MatchList({
    ranked,
    loading,
    selectedId,
    savedSet,
    canSave,
    status,
    onSelect,
    onSave,
    onHide,
    onLoadMore,
}: {
    ranked: RankedJob[];
    loading: boolean;
    selectedId: string | null;
    savedSet: Set<string>;
    canSave: boolean;
    status: string;
    onSelect: (id: string) => void;
    onSave: (id: string) => void;
    onHide: (id: string) => void;
    onLoadMore: () => void;
}) {
    if (loading) {
        return (
            <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                ))}
            </div>
        );
    }

    if (ranked.length === 0) {
        return (
            <Empty className="h-full min-h-80">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <BookmarkIcon />
                    </EmptyMedia>
                    <EmptyTitle>No matches in this slice</EmptyTitle>
                    <EmptyDescription>
                        Try a broader keyword, clear the workplace filter, or unhide roles.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <ScrollArea className="h-full">
            <ItemGroup role="listbox" aria-label="Job matches" className="gap-0">
                {ranked.map(({ job, match }) => (
                    <JobRow
                        key={job._id}
                        job={job}
                        match={match}
                        saved={savedSet.has(job._id)}
                        selected={selectedId === job._id}
                        onSelect={() => onSelect(job._id)}
                        onToggleSave={canSave ? () => onSave(job._id) : undefined}
                        onHide={() => onHide(job._id)}
                    />
                ))}
            </ItemGroup>
            {status === "CanLoadMore" ? (
                <div className="flex justify-center p-3">
                    <Button variant="outline" size="sm" onClick={onLoadMore}>
                        Load more
                    </Button>
                </div>
            ) : null}
            {status === "LoadingMore" ? (
                <div className="flex justify-center p-3">
                    <Spinner className="text-muted-foreground" />
                </div>
            ) : null}
        </ScrollArea>
    );
}

function PreviewSkeleton() {
    return (
        <div className="flex flex-col gap-4 p-5">
            <div className="flex items-start gap-3">
                <Skeleton className="size-12 rounded-md" />
                <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </div>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}

function MarketPulseLoader() {
    const pulse = useQuery(api.jobs.getMarketPulse);
    return (
        <MarketPulse
            activeJobs={pulse?.activeJobs ?? 0}
            market={pulse?.market}
            lastSyncAt={pulse?.lastSyncAt}
            status={pulse?.status}
        />
    );
}

function RoleCountAddon({ count, loading }: { count: number; loading: boolean }) {
    if (loading) return null;
    return (
        <InputGroupAddon align="inline-end">
            <InputGroupText className="font-mono text-xs tabular-nums">
                {count.toLocaleString()} matches
            </InputGroupText>
        </InputGroupAddon>
    );
}
