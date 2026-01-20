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
    jobDescription: v.optional(v.string()),
    atsScore: v.optional(v.number()),
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
        libraries: v.optional(v.array(v.string())),
        soft: v.optional(v.array(v.string())),
      }),
      certifications: v.optional(v.array(v.object({
        name: v.string(),
        issuer: v.optional(v.string()),
        date: v.optional(v.string()),
        link: v.optional(v.string()),
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
});
