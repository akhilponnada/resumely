import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId, requireOwned } from "./authz";

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

// The model already produces this alongside atsScore; it used to be discarded.
const atsAnalysisValidator = v.object({
    strengths: v.optional(v.array(v.string())),
    improvements: v.optional(v.array(v.string())),
    keywordMatches: v.optional(v.array(v.string())),
});

export const createResume = mutation({
    args: {
        title: v.string(),
        rawInput: v.string(),
        jobDescription: v.optional(v.string()),
        atsScore: v.optional(v.number()),
        atsAnalysis: v.optional(atsAnalysisValidator),
        resumeData: resumeDataValidator,
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const now = Date.now();
        return await ctx.db.insert("resumes", {
            userId,
            title: args.title,
            rawInput: args.rawInput,
            jobDescription: args.jobDescription,
            atsScore: args.atsScore,
            atsAnalysis: args.atsAnalysis,
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

export const deleteResume = mutation({
    args: { id: v.id("resumes") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        await requireOwned(ctx, await ctx.db.get(args.id), userId);
        await ctx.db.delete(args.id);
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
        return await requireOwned(ctx, await ctx.db.get(args.id), userId);
    },
});
