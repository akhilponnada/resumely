import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createChat = mutation({
    args: {
        userId: v.string(),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const chatId = await ctx.db.insert("chats", {
            userId: args.userId,
            title: args.title,
            lastMessageAt: Date.now(),
            createdAt: Date.now(),
        });
        return chatId;
    },
});

export const getChats = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("chats")
            .withIndex("by_userId_lastMessageAt", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

export const deleteChat = mutation({
    args: { id: v.id("chats") },
    handler: async (ctx, args) => {
        // Delete messages first
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.id))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }

        // Delete chat
        await ctx.db.delete(args.id);
    },
});

export const updateChatTitle = mutation({
    args: { id: v.id("chats"), title: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { title: args.title });
    },
});
