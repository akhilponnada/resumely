import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId, requireOwned } from "./authz";

// Messages have no userId of their own - ownership is inherited from the chat,
// so both paths below check the parent chat before touching anything.
export const getMessages = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        await requireOwned(ctx, await ctx.db.get(args.chatId), userId);

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
        const userId = await requireUserId(ctx);
        await requireOwned(ctx, await ctx.db.get(args.chatId), userId);

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
