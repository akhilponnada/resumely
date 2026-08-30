"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { BOARDS } from "./jobSources";

type NormalizedJob = {
    source: string;
    sourceId: string;
    company: string;
    companyLogo?: string;
    title: string;
    location: string;
    workplace: string;
    department?: string;
    descriptionText: string;
    applyUrl: string;
    salary?: string;
    tags: string[];
    postedAt: number;
    searchText: string;
};

const UA = "ResumelyJobBot/1.0 (+https://resumely.online)";
const DESC_MAX = 12000;

function stripHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, DESC_MAX);
}

function workplaceFrom(location: string, remote?: boolean): string {
    const l = (location || "").toLowerCase();
    if (remote || /remote|anywhere|distributed|work from home|\bwfh\b|worldwide/.test(l)) {
        return "remote";
    }
    if (/hybrid/.test(l)) return "hybrid";
    if (!l.trim()) return "unknown";
    return "onsite";
}

function searchText(job: Pick<NormalizedJob, "title" | "company" | "location" | "tags" | "department">): string {
    return [job.title, job.company, job.location, job.department ?? "", ...job.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

async function fetchJson(url: string, timeoutMs = 18000): Promise<unknown> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: { "User-Agent": UA, Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`${res.status} ${url}`);
        return await res.json();
    } finally {
        clearTimeout(t);
    }
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

async function fetchGreenhouse(token: string, companyName?: string): Promise<NormalizedJob[]> {
    const data = asRecord(await fetchJson(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`
    ));
    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
    const out: NormalizedJob[] = [];
    for (const raw of jobs) {
        const j = asRecord(raw);
        if (!j) continue;
        const loc = asRecord(j.location)?.name ? String(asRecord(j.location)!.name) : "";
        const depts = Array.isArray(j.departments)
            ? j.departments.map((d) => asRecord(d)?.name).filter(Boolean).map(String)
            : [];
        const title = String(j.title ?? "");
        const company = String(j.company_name ?? companyName ?? token);
        const descriptionText = stripHtml(String(j.content ?? ""));
        const postedAt = Date.parse(String(j.updated_at ?? j.first_published ?? "")) || Date.now();
        const job: NormalizedJob = {
            source: "greenhouse",
            sourceId: String(j.id),
            company,
            title,
            location: loc || "Unspecified",
            workplace: workplaceFrom(loc),
            department: depts[0],
            descriptionText,
            applyUrl: String(j.absolute_url ?? ""),
            tags: depts.slice(0, 6),
            postedAt,
            searchText: "",
        };
        job.searchText = searchText(job);
        if (job.title && job.applyUrl) out.push(job);
    }
    return out;
}

async function fetchLever(token: string, companyName?: string): Promise<NormalizedJob[]> {
    const data = await fetchJson(
        `https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`
    );
    const jobs = Array.isArray(data) ? data : [];
    const out: NormalizedJob[] = [];
    for (const raw of jobs) {
        const j = asRecord(raw);
        if (!j) continue;
        const cats = asRecord(j.categories) ?? {};
        const loc = String(cats.location ?? j.country ?? "");
        const workplaceHint = String(cats.commitment ?? "") + " " + loc;
        const lists = Array.isArray(j.lists) ? j.lists : [];
        const listText = lists
            .map((l) => {
                const row = asRecord(l);
                return row ? `${row.text ?? ""} ${row.content ?? ""}` : "";
            })
            .join(" ");
        const descriptionText = stripHtml(`${j.descriptionPlain ?? j.description ?? ""} ${listText}`);
        const title = String(j.text ?? "");
        const job: NormalizedJob = {
            source: "lever",
            sourceId: String(j.id),
            company: companyName ?? token,
            title,
            location: loc || "Unspecified",
            workplace: workplaceFrom(workplaceHint, /remote/i.test(String(j.workplaceType ?? ""))),
            department: cats.team ? String(cats.team) : undefined,
            descriptionText,
            applyUrl: String(j.hostedUrl ?? j.applyUrl ?? ""),
            salary: undefined,
            tags: [cats.team, cats.commitment].filter(Boolean).map(String),
            postedAt: typeof j.createdAt === "number" ? j.createdAt : Date.now(),
            searchText: "",
        };
        job.searchText = searchText(job);
        if (job.title && job.applyUrl) out.push(job);
    }
    return out;
}

async function fetchAshby(token: string, companyName?: string): Promise<NormalizedJob[]> {
    const data = asRecord(await fetchJson(
        `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}?includeCompensation=true`
    ));
    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
    const out: NormalizedJob[] = [];
    for (const raw of jobs) {
        const j = asRecord(raw);
        if (!j) continue;
        const locParts = [j.location, ...(Array.isArray(j.locations) ? j.locations : [])]
            .map((x) => (typeof x === "string" ? x : asRecord(x)?.locationName ?? asRecord(x)?.name))
            .filter(Boolean)
            .map(String);
        const loc = locParts[0] ?? "";
        const isRemote = Boolean(j.isRemote) || locParts.some((l) => /remote/i.test(l));
        const title = String(j.title ?? "");
        const job: NormalizedJob = {
            source: "ashby",
            sourceId: String(j.id ?? j.jobId ?? title),
            company: String(data?.jobBoardName ?? companyName ?? token),
            title,
            location: loc || (isRemote ? "Remote" : "Unspecified"),
            workplace: workplaceFrom(loc, isRemote),
            department: j.departmentName ? String(j.departmentName) : undefined,
            descriptionText: stripHtml(String(j.descriptionHtml ?? j.descriptionPlain ?? "")),
            applyUrl: String(j.jobUrl ?? j.applyUrl ?? ""),
            tags: j.departmentName ? [String(j.departmentName)] : [],
            postedAt: Date.parse(String(j.publishedAt ?? j.updatedAt ?? "")) || Date.now(),
            searchText: "",
        };
        job.searchText = searchText(job);
        if (job.title && job.applyUrl) out.push(job);
    }
    return out;
}

async function fetchRemoteOK(): Promise<NormalizedJob[]> {
    const data = await fetchJson("https://remoteok.com/api");
    const rows = Array.isArray(data) ? data : [];
    const out: NormalizedJob[] = [];
    for (const raw of rows) {
        const j = asRecord(raw);
        if (!j || j.legal || !j.id || !j.position) continue;
        const tags = Array.isArray(j.tags) ? j.tags.map(String).slice(0, 8) : [];
        const salary =
            j.salary_min && j.salary_max
                ? `$${j.salary_min}–$${j.salary_max}`
                : undefined;
        const job: NormalizedJob = {
            source: "remoteok",
            sourceId: String(j.id),
            company: String(j.company ?? "Remote"),
            companyLogo: j.company_logo ? String(j.company_logo) : undefined,
            title: String(j.position),
            location: String(j.location ?? "Remote"),
            workplace: "remote",
            descriptionText: stripHtml(String(j.description ?? "")),
            applyUrl: String(j.apply_url ?? j.url ?? ""),
            salary,
            tags,
            postedAt: typeof j.epoch === "number" ? j.epoch * 1000 : Date.now(),
            searchText: "",
        };
        job.searchText = searchText(job);
        if (job.title && job.applyUrl) out.push(job);
    }
    return out;
}

async function fetchArbeitnow(): Promise<NormalizedJob[]> {
    const data = asRecord(await fetchJson("https://www.arbeitnow.com/api/job-board-api"));
    const rows = Array.isArray(data?.data) ? data.data : [];
    const out: NormalizedJob[] = [];
    for (const raw of rows) {
        const j = asRecord(raw);
        if (!j) continue;
        const tags = Array.isArray(j.tags) ? j.tags.map(String).slice(0, 8) : [];
        const types = Array.isArray(j.job_types) ? j.job_types.map(String) : [];
        const job: NormalizedJob = {
            source: "arbeitnow",
            sourceId: String(j.slug ?? j.url),
            company: String(j.company_name ?? "Unknown"),
            title: String(j.title ?? ""),
            location: String(j.location ?? ""),
            workplace: workplaceFrom(String(j.location ?? ""), Boolean(j.remote)),
            descriptionText: stripHtml(String(j.description ?? "")),
            applyUrl: String(j.url ?? ""),
            tags: [...tags, ...types].slice(0, 8),
            postedAt: Date.parse(String(j.created_at ?? "")) || Date.now(),
            searchText: "",
        };
        job.searchText = searchText(job);
        if (job.title && job.applyUrl) out.push(job);
    }
    return out;
}

async function fetchJobicy(): Promise<NormalizedJob[]> {
    const data = asRecord(await fetchJson("https://jobicy.com/api/v2/remote-jobs?count=50"));
    const rows = Array.isArray(data?.jobs) ? data.jobs : [];
    const out: NormalizedJob[] = [];
    for (const raw of rows) {
        const j = asRecord(raw);
        if (!j) continue;
        const salary =
            j.salaryMin && j.salaryMax
                ? `${j.salaryCurrency ?? ""} ${j.salaryMin}–${j.salaryMax}`.trim()
                : undefined;
        const job: NormalizedJob = {
            source: "jobicy",
            sourceId: String(j.id ?? j.jobSlug),
            company: String(j.companyName ?? "Remote"),
            companyLogo: j.companyLogo ? String(j.companyLogo) : undefined,
            title: String(j.jobTitle ?? ""),
            location: String(j.jobGeo ?? "Remote"),
            workplace: "remote",
            department: j.jobIndustry ? String(j.jobIndustry) : undefined,
            descriptionText: stripHtml(String(j.jobDescription ?? j.jobExcerpt ?? "")),
            applyUrl: String(j.url ?? ""),
            salary,
            tags: [j.jobType, j.jobLevel, j.jobIndustry].filter(Boolean).map(String),
            postedAt: Date.parse(String(j.pubDate ?? "")) || Date.now(),
            searchText: "",
        };
        job.searchText = searchText(job);
        if (job.title && job.applyUrl) out.push(job);
    }
    return out;
}

export const syncAll = internalAction({
    args: {},
    handler: async (ctx) => {
        const runId = await ctx.runMutation(internal.jobs.startCrawl, {});
        let upserted = 0;
        try {
            const flush = async (jobs: NormalizedJob[]) => {
                for (let i = 0; i < jobs.length; i += 80) {
                    const slice = jobs.slice(i, i + 80);
                    upserted += await ctx.runMutation(internal.jobs.upsertBatch, { jobs: slice });
                }
            };

            for (const feed of [fetchRemoteOK, fetchArbeitnow, fetchJobicy]) {
                try {
                    await flush(await feed());
                } catch (err) {
                    console.error("feed failed", err);
                }
            }

            for (const board of BOARDS) {
                try {
                    let jobs: NormalizedJob[] = [];
                    if (board.kind === "greenhouse") {
                        jobs = await fetchGreenhouse(board.token, board.company);
                    } else if (board.kind === "lever") {
                        jobs = await fetchLever(board.token, board.company);
                    } else {
                        jobs = await fetchAshby(board.token, board.company);
                    }
                    await flush(jobs);
                } catch (err) {
                    console.error("board failed", board.kind, board.token, err);
                }
            }

            await ctx.runMutation(internal.jobs.finishCrawl, {
                runId,
                upserted,
                status: "ok",
            });
            return { upserted };
        } catch (err) {
            await ctx.runMutation(internal.jobs.finishCrawl, {
                runId,
                upserted,
                status: "error",
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    },
});
