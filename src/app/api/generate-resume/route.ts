import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAIClient, AI_DEPLOYMENT } from "@/lib/ai";
import { computeATS } from "@/lib/ats";
import { sanitizeAtsAnalysis, sanitizeResumeData } from "@/lib/resume-model";
import { PARSE_RESUME_PROMPT, TAILOR_RESUME_PROMPT } from "@/lib/resume-prompts";
import { ResumeData } from "@/lib/types";

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = 15;

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

// Model + endpoint configuration lives in src/lib/ai.ts.

// Input validation constants
const MAX_RAW_INPUT_LENGTH = 50000;
const MAX_JOB_DESCRIPTION_LENGTH = 20000;

// Prompts live in src/lib/resume-prompts.ts.

// Normalize/fix common AI response issues
function normalizeResumeData(data: Record<string, unknown>): Record<string, unknown> {
  const resumeData = data.resumeData as Record<string, unknown> || data;

  // Fix certifications if they're strings instead of objects
  if (resumeData.certifications && Array.isArray(resumeData.certifications)) {
    resumeData.certifications = resumeData.certifications.map((cert: unknown) => {
      if (typeof cert === 'string') {
        // Parse string like "Python for Data Science (IBM)" into object
        const match = cert.match(/^(.+?)\s*\(([^)]+)\)$/);
        if (match) {
          return { name: match[1].trim(), issuer: match[2].trim(), date: "", link: "", highlights: [] };
        }
        return { name: cert, issuer: "", date: "", link: "", highlights: [] };
      }
      // Ensure required fields exist
      const certObj = cert as Record<string, unknown>;
      return {
        name: certObj.name || "",
        issuer: certObj.issuer || "",
        date: certObj.date || "",
        link: certObj.link || "",
        highlights: certObj.highlights || []
      };
    });
  } else {
    resumeData.certifications = [];
  }

  // Ensure arrays exist
  if (!resumeData.education) resumeData.education = [];
  if (!resumeData.experience) resumeData.experience = [];
  if (!resumeData.projects) resumeData.projects = [];

  // Ensure skills object exists
  if (!resumeData.skills || typeof resumeData.skills !== 'object') {
    resumeData.skills = { languages: [], frameworks: [], tools: [], platforms: [], libraries: [], soft: [] };
  }

  // Ensure experience highlights are arrays
  if (Array.isArray(resumeData.experience)) {
    resumeData.experience = (resumeData.experience as Record<string, unknown>[]).map(exp => ({
      ...exp,
      highlights: Array.isArray(exp.highlights) ? exp.highlights : []
    }));
  }

  // Ensure project highlights are arrays
  if (Array.isArray(resumeData.projects)) {
    resumeData.projects = (resumeData.projects as Record<string, unknown>[]).map(proj => ({
      ...proj,
      highlights: Array.isArray(proj.highlights) ? proj.highlights : []
    }));
  }

  return data;
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
    const { rawInput, jobDescription, resumeData: sourceResume, jobTitle, company } = body;
    const mode = body.mode === "tailor" || (!rawInput && sourceResume && jobDescription)
      ? "tailor"
      : "parse";

    if (jobDescription && jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
      return NextResponse.json({ error: "Job description too long" }, { status: 400 });
    }

    let systemPrompt = PARSE_RESUME_PROMPT;
    let userMessage = "";

    if (mode === "tailor") {
      if (!sourceResume || typeof sourceResume !== "object") {
        return NextResponse.json({ error: "A matching resume is required to tailor" }, { status: 400 });
      }
      if (!jobDescription || typeof jobDescription !== "string") {
        return NextResponse.json({ error: "Job description is required to tailor" }, { status: 400 });
      }
      systemPrompt = TAILOR_RESUME_PROMPT;
      userMessage = JSON.stringify({
        resume: sourceResume,
        jobTitle: typeof jobTitle === "string" ? jobTitle : "",
        company: typeof company === "string" ? company : "",
        jobDescription: jobDescription.trim(),
      });
    } else {
      if (!rawInput || typeof rawInput !== "string") {
        return NextResponse.json({ error: "Raw input is required" }, { status: 400 });
      }
      if (rawInput.length > MAX_RAW_INPUT_LENGTH) {
        return NextResponse.json({ error: "Input too long" }, { status: 400 });
      }
      userMessage = `Raw Resume Information:\n${rawInput.trim()}`;
    }

    const response = await getAIClient().chat.completions.create({
      model: AI_DEPLOYMENT,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_completion_tokens: 8000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Parse JSON response and normalize data
    try {
      const parsed = JSON.parse(content);
      const normalized = normalizeResumeData(parsed) as Record<string, unknown>;
      const resumeData = sanitizeResumeData(
        (normalized.resumeData ?? normalized) as ResumeData,
      );

      // The model occasionally returns a shell with every field blank. Saving
      // that produces a resume with no name, no contact details and no history,
      // so reject it here rather than persisting an empty record.
      const hasContent =
        Boolean(resumeData.fullName.trim()) ||
        resumeData.experience.length > 0 ||
        resumeData.education.length > 0;

      if (!hasContent) {
        return NextResponse.json(
          { error: "Could not read any details from that input. Try pasting more of your resume, or add your name, roles and dates." },
          { status: 422 }
        );
      }

      // Score deterministically instead of trusting the number the model made
      // up: the same resume must always score the same, and every deduction
      // has to be explainable to the user.
      const ats = computeATS(resumeData, typeof jobDescription === "string" ? jobDescription : undefined);
      const suggestedTitle =
        (typeof normalized.suggestedTitle === "string" && normalized.suggestedTitle.trim()) ||
        (mode === "tailor"
          ? [jobTitle, company].filter((bit) => typeof bit === "string" && bit.trim()).join(" · ") || "Tailored resume"
          : "Matching resume");

      return NextResponse.json({
        resumeData,
        atsScore: ats.score,
        atsChecks: ats.checks,
        matchedKeywords: ats.matchedKeywords,
        missingKeywords: ats.missingKeywords,
        atsAnalysis: sanitizeAtsAnalysis(
          normalized.atsAnalysis as {
            strengths?: string[];
            improvements?: string[];
            keywordMatches?: string[];
          } | undefined,
        ),
        suggestedTitle,
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    }

  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
