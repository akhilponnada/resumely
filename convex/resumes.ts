import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const createResume = mutation({
    args: {
        userId: v.string(),
        title: v.string(),
        rawInput: v.string(),
        jobDescription: v.optional(v.string()),
        atsScore: v.optional(v.number()),
        resumeData: resumeDataValidator,
        docxStatus: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("resumes", {
            userId: args.userId,
            title: args.title,
            rawInput: args.rawInput,
            jobDescription: args.jobDescription,
            atsScore: args.atsScore,
            resumeData: args.resumeData,
            docxStatus: args.docxStatus || "pending",
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updateDocxStatus = mutation({
    args: {
        id: v.id("resumes"),
        docxStatus: v.string(),
        docxError: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            docxStatus: args.docxStatus,
            docxError: args.docxError,
            updatedAt: Date.now(),
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
        resumeData: v.optional(resumeDataValidator),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([, v]) => v !== undefined)
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
        await ctx.db.delete(args.id);
    },
});

export const getResumesByUser = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("resumes")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

export const getResumeById = query({
    args: { id: v.id("resumes") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
