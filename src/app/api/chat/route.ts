import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { getAzureModel } from "@/lib/ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat-prompt";

export const maxDuration = 60;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = 30;
const MAX_MESSAGE_LENGTH = 15000;
const MAX_MESSAGES = 50;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (userLimit.count >= MAX_REQUESTS) {
        return false;
    }

    userLimit.count++;
    return true;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

function validateMessages(messages: unknown): messages is ChatMessage[] {
    if (!Array.isArray(messages)) return false;
    if (messages.length === 0 || messages.length > MAX_MESSAGES) return false;
    return messages.every((msg) => {
        if (typeof msg !== "object" || msg === null) return false;
        const m = msg as Record<string, unknown>;
        if (m.role !== "user" && m.role !== "assistant") return false;
        if (typeof m.content !== "string" || m.content.length === 0 || m.content.length > MAX_MESSAGE_LENGTH) {
            return false;
        }
        return true;
    });
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!checkRateLimit(userId)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please wait." },
                { status: 429 },
            );
        }

        const { messages } = await req.json();
        if (!validateMessages(messages)) {
            return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
        }

        const result = streamText({
            model: getAzureModel(),
            system: CHAT_SYSTEM_PROMPT,
            messages: messages.map((message) => ({
                role: message.role,
                content: message.content.trim(),
            })),
            maxOutputTokens: 4096,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
