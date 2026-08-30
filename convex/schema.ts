import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  resumes: defineTable({
    userId: v.string(),
    title: v.string(),
    rawInput: v.string(),
    // "base" is the matching resume. "tailored" is a per-job copy.
    // Optional so existing rows still validate; classify client/server-side.
    kind: v.optional(v.union(v.literal("base"), v.literal("tailored"))),
    parentId: v.optional(v.id("resumes")),
    jobId: v.optional(v.id("jobs")),
    targetCompany: v.optional(v.string()),
    targetTitle: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
    jobDescription: v.optional(v.string()),
    atsScore: v.optional(v.number()),
    // Qualitative advice from the model.
    atsAnalysis: v.optional(v.object({
      strengths: v.optional(v.array(v.string())),
      improvements: v.optional(v.array(v.string())),
      keywordMatches: v.optional(v.array(v.string())),
    })),
    // Deterministic per-category breakdown behind atsScore, so the number can
    // be explained rather than just displayed.
    atsChecks: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      points: v.number(),
      max: v.number(),
      status: v.string(),
      detail: v.string(),
    }))),
    matchedKeywords: v.optional(v.array(v.string())),
    missingKeywords: v.optional(v.array(v.string())),
    // Retained so existing rows validate; DOCX generation is synchronous and
    // never updates these.
    docxStatus: v.optional(v.string()),
    docxError: v.optional(v.string()),
    resumeData: v.object({
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
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  chats: defineTable({
    userId: v.string(),
    title: v.string(),
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_lastMessageAt", ["userId", "lastMessageAt"]),

  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_chatId", ["chatId"]),

  // Aggregated live roles from public ATS boards (Greenhouse / Lever / Ashby)
  // and open job feeds. source + sourceId is the natural key of a posting.
  jobs: defineTable({
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
    scrapedAt: v.number(),
    isActive: v.boolean(),
    searchText: v.string(),
  })
    .index("by_source_sourceId", ["source", "sourceId"])
    .index("by_active_postedAt", ["isActive", "postedAt"])
    .index("by_workplace_active_postedAt", ["workplace", "isActive", "postedAt"])
    .index("by_company", ["company"])
    .index("by_scrapedAt", ["scrapedAt"])
    .searchIndex("search_jobs", {
      searchField: "searchText",
      filterFields: ["isActive", "workplace"],
    }),

  savedJobs: defineTable({
    userId: v.string(),
    jobId: v.id("jobs"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_job", ["userId", "jobId"]),

  crawlRuns: defineTable({
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    status: v.string(),
    upserted: v.optional(v.number()),
    activeJobs: v.optional(v.number()),
    error: v.optional(v.string()),
    market: v.optional(v.object({
      workplace: v.array(v.object({ id: v.string(), count: v.number() })),
      sources: v.array(v.object({ id: v.string(), count: v.number() })),
      topCompanies: v.array(v.object({
        name: v.string(),
        count: v.number(),
        logo: v.optional(v.string()),
        applyUrl: v.string(),
      })),
      companyCount: v.number(),
      postedLast7d: v.number(),
      withSalary: v.number(),
    })),
  }).index("by_startedAt", ["startedAt"]),
});
