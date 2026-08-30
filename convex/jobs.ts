import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUserId } from "./authz";

const jobFields = {
    source: v.string(),
    sourceId: v.string(),
    company: v.string(),
    companyLogo: v.optional(v.string()),
    title: v.string(),
    location: v.string(),
    workplace: v.string(),
    department: v.optional(v.string()),
    descriptionText: v.string(),
    applyUrl: v.string(),
    salary: v.optional(v.string()),
    tags: v.array(v.string()),
    postedAt: v.number(),
    searchText: v.string(),
};

export const listJobs = query({
    args: {
        paginationOpts: paginationOptsValidator,
        search: v.optional(v.string()),
        workplace: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const search = args.search?.trim();
        const workplace = args.workplace && args.workplace !== "all" ? args.workplace : undefined;

        if (search) {
            return await ctx.db
                .query("jobs")
                .withSearchIndex("search_jobs", (q) => {
                    const s = q.search("searchText", search).eq("isActive", true);
                    return workplace ? s.eq("workplace", workplace) : s;
                })
                .paginate(args.paginationOpts);
        }

        if (workplace) {
            return await ctx.db
                .query("jobs")
                .withIndex("by_workplace_active_postedAt", (q) =>
                    q.eq("workplace", workplace).eq("isActive", true)
                )
                .order("desc")
                .paginate(args.paginationOpts);
        }

        return await ctx.db
            .query("jobs")
            .withIndex("by_active_postedAt", (q) => q.eq("isActive", true))
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

export const getJob = query({
    args: { id: v.id("jobs") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const last = await ctx.db.query("crawlRuns").withIndex("by_startedAt").order("desc").first();
        return {
            activeJobs: last?.activeJobs ?? 0,
            lastSyncAt: last?.finishedAt ?? last?.startedAt ?? 0,
            status: last?.status ?? "idle",
        };
    },
});

export const listSaved = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);
        const saved = await ctx.db
            .query("savedJobs")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .take(100);
        const jobs = await Promise.all(saved.map((s) => ctx.db.get(s.jobId)));
        return saved
            .map((s, i) => ({ save: s, job: jobs[i] }))
            .filter((row) => row.job);
    },
});

export const savedIds = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [] as string[];
        const saved = await ctx.db
            .query("savedJobs")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .collect();
        return saved.map((s) => s.jobId);
    },
});

export const toggleSave = mutation({
    args: { jobId: v.id("jobs") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const existing = await ctx.db
            .query("savedJobs")
            .withIndex("by_user_job", (q) => q.eq("userId", userId).eq("jobId", args.jobId))
            .unique();
        if (existing) {
            await ctx.db.delete(existing._id);
            return false;
        }
        await ctx.db.insert("savedJobs", {
            userId,
            jobId: args.jobId,
            createdAt: Date.now(),
        });
        return true;
    },
});

/**
 * Kick a crawl if the board is empty or the last run is older than 6 hours.
 * Safe to call from the jobs page on load.
 */
export const ensureCrawl = mutation({
    args: {},
    handler: async (ctx) => {
        const last = await ctx.db.query("crawlRuns").withIndex("by_startedAt").order("desc").first();
        const sixHours = 6 * 60 * 60 * 1000;
        if (last && last.status === "running" && Date.now() - last.startedAt < 30 * 60 * 1000) {
            return { started: false, reason: "running" };
        }
        if (last?.status === "ok" && last.finishedAt && Date.now() - last.finishedAt < sixHours) {
            const any = await ctx.db.query("jobs").withIndex("by_active_postedAt", (q) => q.eq("isActive", true)).first();
            if (any) return { started: false, reason: "fresh" };
        }
        await ctx.scheduler.runAfter(0, internal.jobSync.syncAll, {});
        return { started: true, reason: "scheduled" };
    },
});

export const startCrawl = internalMutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.insert("crawlRuns", {
            startedAt: Date.now(),
            status: "running",
        });
    },
});

export const finishCrawl = internalMutation({
    args: {
        runId: v.id("crawlRuns"),
        upserted: v.number(),
        status: v.string(),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
        let deactivated = 0;
        const stale = await ctx.db
            .query("jobs")
            .withIndex("by_scrapedAt", (q) => q.lt("scrapedAt", cutoff))
            .take(400);
        for (const job of stale) {
            if (job.isActive) {
                await ctx.db.patch(job._id, { isActive: false });
                deactivated++;
            }
        }
        const sample = await ctx.db
            .query("jobs")
            .withIndex("by_active_postedAt", (q) => q.eq("isActive", true))
            .take(2000);
        await ctx.db.patch(args.runId, {
            finishedAt: Date.now(),
            status: args.status,
            upserted: args.upserted,
            activeJobs: sample.length + (sample.length === 2000 ? 1 : 0),
            error: args.error,
        });
        return { deactivated };
    },
});

export const upsertBatch = internalMutation({
    args: { jobs: v.array(v.object(jobFields)) },
    handler: async (ctx, args) => {
        const now = Date.now();
        let n = 0;
        for (const job of args.jobs) {
            const existing = await ctx.db
                .query("jobs")
                .withIndex("by_source_sourceId", (q) =>
                    q.eq("source", job.source).eq("sourceId", job.sourceId)
                )
                .unique();
            const doc = { ...job, scrapedAt: now, isActive: true };
            if (existing) {
                await ctx.db.patch(existing._id, doc);
            } else {
                await ctx.db.insert("jobs", doc);
            }
            n++;
        }
        return n;
    },
});
