import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getMessages = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .collect();
    },
});

export const addMessage = mutation({
    args: {
        chatId: v.id("chats"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("messages", {
            chatId: args.chatId,
            role: args.role,
            content: args.content,
            createdAt: Date.now(),
        });

        // Update lastMessageAt for the chat
        await ctx.db.patch(args.chatId, {
            lastMessageAt: Date.now(),
        });
    },
});
