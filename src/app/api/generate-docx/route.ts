import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateDOCX } from "@/lib/docx-generator";
import { sanitizeResumeData } from "@/lib/resume-model";
import { ResumeData } from "@/lib/types";

export const maxDuration = 60;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = 10;

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

export async function POST(request: NextRequest) {
    try {
        // Authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limiting
        if (!checkRateLimit(userId)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please wait." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { resumeData } = body;

        if (!resumeData) {
            return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
        }

        const blob = await generateDOCX(sanitizeResumeData(resumeData as ResumeData));

        // Convert blob to buffer
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Return as binary response
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename="resume.docx"`,
            },
        });

    } catch (error) {
        console.error("DOCX generation error:", error);
        return NextResponse.json({ error: "Failed to generate DOCX" }, { status: 500 });
    }
}
