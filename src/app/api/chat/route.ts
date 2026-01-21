import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AzureOpenAI } from "openai";

export const maxDuration = 60;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = 30; // Higher limit since GPT-5-mini is faster

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

// Azure OpenAI client for GPT-5-mini
const client = new AzureOpenAI({
    apiKey: process.env.AZURE_CLAUDE_API_KEY!, // Same key works for both
    endpoint: "https://ai-akhilponnada2047ai102855017871.cognitiveservices.azure.com",
    apiVersion: "2024-12-01-preview",
});

const SYSTEM_PROMPT = `You are a helpful career and resume assistant called "Resumely". Help users with:
- Resume writing, formatting, and optimization
- Job search strategies and techniques
- Interview preparation and tips
- Career development advice
- ATS (Applicant Tracking System) optimization

IMPORTANT: If a user pastes a job description or job posting:
1. Identify the key requirements, skills, and qualifications mentioned
2. Suggest how to tailor their resume to match the role
3. Recommend specific keywords to include for ATS optimization
4. Offer to help them craft bullet points that align with the job requirements
5. Ask follow-up questions about their experience related to the role

Be friendly, professional, and concise. Use markdown formatting for better readability.`;

// Input validation
const MAX_MESSAGE_LENGTH = 15000;
const MAX_MESSAGES = 50;

interface ChatMessage {
    role: string;
    content: string;
}

function validateMessages(messages: unknown): messages is ChatMessage[] {
    if (!Array.isArray(messages)) return false;
    if (messages.length === 0 || messages.length > MAX_MESSAGES) return false;
    return messages.every((msg) => {
        if (typeof msg !== "object" || msg === null) return false;
        const m = msg as Record<string, unknown>;
        if (typeof m.role !== "string" || !["user", "assistant", "system"].includes(m.role)) return false;
        if (typeof m.content !== "string" || m.content.length === 0 || m.content.length > MAX_MESSAGE_LENGTH) return false;
        return true;
    });
}

export async function POST(req: NextRequest) {
    try {
        // Authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limiting
        if (!checkRateLimit(userId)) {
            return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
        }

        const { messages } = await req.json();

        // Validate input
        if (!validateMessages(messages)) {
            return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
        }

        // Format messages for OpenAI
        const formattedMessages = [
            { role: "system" as const, content: SYSTEM_PROMPT },
            ...messages.map((msg: ChatMessage) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content.trim(),
            }))
        ];

        // Stream response from Azure OpenAI GPT-5-mini
        const stream = await client.chat.completions.create({
            model: "gpt-5-mini",
            messages: formattedMessages,
            max_completion_tokens: 4096,
            stream: true,
        });

        // Create readable stream for response
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                } catch (error) {
                    console.error("Stream error:", error);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
