import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId, requireOwned } from "./authz";

export const createChat = mutation({
    args: {
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const chatId = await ctx.db.insert("chats", {
            userId,
            title: args.title,
            lastMessageAt: Date.now(),
            createdAt: Date.now(),
        });
        return chatId;
    },
});

// No userId argument: the caller is whoever the token says they are.
export const getChats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);
        return await ctx.db
            .query("chats")
            .withIndex("by_userId_lastMessageAt", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});

export const deleteChat = mutation({
    args: { id: v.id("chats") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        await requireOwned(ctx, await ctx.db.get(args.id), userId);

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
        const userId = await requireUserId(ctx);
        await requireOwned(ctx, await ctx.db.get(args.id), userId);
        await ctx.db.patch(args.id, { title: args.title });
    },
});
