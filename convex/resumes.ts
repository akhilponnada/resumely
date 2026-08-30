import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireUserId, requireOwned } from "./authz";
import type { Doc, Id } from "./_generated/dataModel";

const resumeDataValidator = v.object({
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    github: v.optional(v.string()),
    website: v.optional(v.string()),
    summary: v.optional(v.string()),
    education: v.array(v.object({
        institution: v.string(),
        degree: v.string(),
        location: v.optional(v.string()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        gpa: v.optional(v.string()),
    })),
    experience: v.array(v.object({
        company: v.string(),
        position: v.string(),
        location: v.optional(v.string()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        link: v.optional(v.string()),
        highlights: v.array(v.string()),
    })),
    projects: v.array(v.object({
        name: v.string(),
        technologies: v.optional(v.string()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        link: v.optional(v.string()),
        highlights: v.array(v.string()),
    })),
    skills: v.object({
        languages: v.optional(v.array(v.string())),
        frameworks: v.optional(v.array(v.string())),
        tools: v.optional(v.array(v.string())),
        platforms: v.optional(v.array(v.string())),
        libraries: v.optional(v.array(v.string())),
        soft: v.optional(v.array(v.string())),
    }),
    certifications: v.optional(v.array(v.object({
        name: v.string(),
        issuer: v.optional(v.string()),
        date: v.optional(v.string()),
        link: v.optional(v.string()),
        highlights: v.optional(v.array(v.string())),
    }))),
});

// Qualitative advice from the model; used to be discarded.
const atsAnalysisValidator = v.object({
    strengths: v.optional(v.array(v.string())),
    improvements: v.optional(v.array(v.string())),
    keywordMatches: v.optional(v.array(v.string())),
});

// Deterministic breakdown behind the score.
const atsChecksValidator = v.array(v.object({
    id: v.string(),
    label: v.string(),
    points: v.number(),
    max: v.number(),
    status: v.string(),
    detail: v.string(),
}));

function kindOf(row: {
    kind?: string;
    jobId?: string;
    jobDescription?: string;
    targetTitle?: string;
}) {
    if (row.kind === "base" || row.kind === "tailored") return row.kind;
    if (row.jobId || row.jobDescription || row.targetTitle) return "tailored";
    return "base";
}

async function resumesForUser(ctx: QueryCtx | MutationCtx, userId: string) {
    return await ctx.db
        .query("resumes")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
}

function pickPrimaryRow(rows: Doc<"resumes">[]) {
    const newest = (list: Doc<"resumes">[]) =>
        [...list].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))[0];
    const bases = rows.filter((row) => kindOf(row) === "base");
    const markedBase = bases.find((row) => row.isPrimary);
    if (markedBase) return markedBase;
    if (bases.length) return newest(bases);
    const marked = rows.find((row) => row.isPrimary);
    if (marked) return marked;
    return newest(rows);
}

async function clearPrimary(
    ctx: MutationCtx,
    rows: Doc<"resumes">[],
    except?: Id<"resumes">,
) {
    for (const row of rows) {
        if (row.isPrimary && row._id !== except) {
            await ctx.db.patch(row._id, { isPrimary: false });
        }
    }
}

export const createResume = mutation({
    args: {
        title: v.string(),
        rawInput: v.string(),
        kind: v.optional(v.union(v.literal("base"), v.literal("tailored"))),
        parentId: v.optional(v.id("resumes")),
        jobId: v.optional(v.id("jobs")),
        targetCompany: v.optional(v.string()),
        targetTitle: v.optional(v.string()),
        isPrimary: v.optional(v.boolean()),
        jobDescription: v.optional(v.string()),
        atsScore: v.optional(v.number()),
        atsAnalysis: v.optional(atsAnalysisValidator),
        atsChecks: v.optional(atsChecksValidator),
        matchedKeywords: v.optional(v.array(v.string())),
        missingKeywords: v.optional(v.array(v.string())),
        resumeData: resumeDataValidator,
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const existing = await resumesForUser(ctx, userId);
        const kind = args.kind ?? (args.jobId || args.jobDescription ? "tailored" : "base");
        const hasPrimary = existing.some((row) => row.isPrimary);
        const isPrimary = args.isPrimary ?? (kind === "base" && !hasPrimary);
        if (isPrimary) {
            await clearPrimary(ctx, existing);
        }
        const now = Date.now();
        return await ctx.db.insert("resumes", {
            userId,
            title: args.title,
            rawInput: args.rawInput,
            kind,
            parentId: args.parentId,
            jobId: args.jobId,
            targetCompany: args.targetCompany,
            targetTitle: args.targetTitle,
            isPrimary,
            jobDescription: args.jobDescription,
            atsScore: args.atsScore,
            atsAnalysis: args.atsAnalysis,
            atsChecks: args.atsChecks,
            matchedKeywords: args.matchedKeywords,
            missingKeywords: args.missingKeywords,
            resumeData: args.resumeData,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updateResume = mutation({
    args: {
        id: v.id("resumes"),
        title: v.optional(v.string()),
        rawInput: v.optional(v.string()),
        jobDescription: v.optional(v.string()),
        atsScore: v.optional(v.number()),
        atsAnalysis: v.optional(atsAnalysisValidator),
        atsChecks: v.optional(atsChecksValidator),
        matchedKeywords: v.optional(v.array(v.string())),
        missingKeywords: v.optional(v.array(v.string())),
        resumeData: v.optional(resumeDataValidator),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const { id, ...updates } = args;
        await requireOwned(ctx, await ctx.db.get(id), userId);

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([, value]) => value !== undefined)
        );
        await ctx.db.patch(id, {
            ...filteredUpdates,
            updatedAt: Date.now(),
        });
    },
});

export const setPrimaryResume = mutation({
    args: { id: v.id("resumes") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        await requireOwned(ctx, await ctx.db.get(args.id), userId);
        const existing = await resumesForUser(ctx, userId);
        await clearPrimary(ctx, existing, args.id);
        await ctx.db.patch(args.id, {
            isPrimary: true,
            kind: "base",
            updatedAt: Date.now(),
        });
    },
});

export const deleteResume = mutation({
    args: { id: v.id("resumes") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const row = await requireOwned(ctx, await ctx.db.get(args.id), userId);
        const wasPrimary = Boolean(row.isPrimary);
        await ctx.db.delete(args.id);
        if (!wasPrimary) return;
        const rest = await resumesForUser(ctx, userId);
        const next = pickPrimaryRow(rest);
        if (next) {
            await ctx.db.patch(next._id, {
                isPrimary: true,
                kind: "base",
                updatedAt: Date.now(),
            });
        }
    },
});

// No userId argument: the caller is whoever the token says they are.
export const getResumesByUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);
        return await ctx.db
            .query("resumes")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});

export const getResumeById = query({
    args: { id: v.id("resumes") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const row = await ctx.db.get(args.id);
        if (!row || row.userId !== userId) return null;
        return row;
    },
});

export const getPrimaryResume = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);
        const rows = await resumesForUser(ctx, userId);
        return pickPrimaryRow(rows) ?? null;
    },
});
