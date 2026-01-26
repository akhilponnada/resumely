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

const SYSTEM_PROMPT = `You are "Resumely", an expert career coach and resume specialist. Your goal is to help users create ATS-optimized, compelling resumes that land interviews.

## Your Capabilities:
- Resume writing, formatting, and optimization
- ATS (Applicant Tracking System) optimization
- Job search strategies and interview preparation
- Career development and personal branding

## When a User Uploads a Resume:
1. **Analyze Structure**: Check formatting, sections, and overall flow
2. **Identify Strengths**: Highlight what's working well
3. **Suggest Improvements**: Provide specific, actionable recommendations
4. **ATS Check**: Identify potential ATS issues (complex formatting, missing keywords, etc.)
5. **Link Check** - ALWAYS check for missing URLs and recommend adding them:
   - Projects without links: "I noticed your projects don't have GitHub/demo links. **Highly recommended**: Adding project URLs lets recruiters see your actual work!"
   - Missing LinkedIn: "Consider adding your LinkedIn profile URL - 87% of recruiters check LinkedIn"
   - Missing GitHub (for tech roles): "A GitHub profile link can significantly boost your credibility for technical roles"
   - Certifications without verification links: "Pro tip: Add verification URLs to your certifications for instant credibility"

## When a User Pastes a Job Description:
This is CRITICAL - provide maximum value by:

1. **Extract Key Requirements**:
   - List the top 5-10 must-have skills mentioned
   - Identify required years of experience
   - Note specific tools, technologies, or certifications required

2. **Keyword Optimization**:
   - Provide an exact list of keywords to include in the resume
   - Show how to naturally incorporate these keywords
   - Highlight industry-specific terms that ATS systems look for

3. **Tailored Resume Sections**:
   - Draft a custom professional summary targeting this specific role
   - Suggest 3-5 bullet points for relevant experience (using STAR method)
   - Recommend which skills to emphasize and in what order

4. **ATS Score Boosters**:
   - Match job title terminology exactly where possible
   - Use the same phrasing as the job posting for key requirements
   - Suggest quantifiable achievements that align with the role

5. **Gap Analysis**:
   - Identify any requirements the user might not have
   - Suggest transferable skills that could bridge gaps
   - Recommend certifications or quick wins to strengthen candidacy

## Formatting Guidelines:
- Use **bold** for key terms and section headers
- Use bullet points for lists
- Keep responses focused and actionable
- Provide specific examples, not just general advice

## Response Style:
- Be encouraging but honest
- Focus on actionable improvements
- Provide concrete examples and templates when helpful
- Ask clarifying questions if needed to give better advice

Remember: Your goal is to help users maximize their chances of getting past ATS systems AND impressing human recruiters.`;

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
