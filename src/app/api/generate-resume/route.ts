import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import AnthropicFoundry from "@anthropic-ai/foundry-sdk";

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // 10 resume generations per minute

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

// Extract resource name from the endpoint URL
const endpoint = process.env.AZURE_CLAUDE_ENDPOINT || "";
const resourceMatch = endpoint.match(/https:\/\/([^.]+)\.services\.ai\.azure\.com/);
const resourceName = resourceMatch ? resourceMatch[1] : "";

const client = new AnthropicFoundry({
  apiKey: process.env.AZURE_CLAUDE_API_KEY!,
  resource: resourceName,
});

// Input validation constants
const MAX_RAW_INPUT_LENGTH = 50000; // 50k chars max
const MAX_JOB_DESCRIPTION_LENGTH = 20000; // 20k chars max

const SYSTEM_PROMPT = `You are an expert ATS-optimized resume writer. Your task is to extract information from raw user input and job description (if provided) and create a structured, professional resume.

INSTRUCTIONS:
1. Parse the user's raw input to extract all relevant information
2. If a job description is provided, tailor the resume to match the job requirements
3. Use strong action verbs and quantify achievements where possible
4. Ensure all information is professionally worded
5. Calculate an ATS score (0-100) based on:
   - Keyword matching with job description (if provided)
   - Use of action verbs
   - Quantified achievements
   - Clear section organization
   - Professional formatting indicators

RESPOND WITH ONLY VALID JSON in this exact format:
{
  "resumeData": {
    "fullName": "Full Name",
    "email": "email@example.com",
    "phone": "+1-xxx-xxx-xxxx",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "website": "website.com",
    "summary": "Professional summary if available",
    "education": [
      {
        "institution": "University Name",
        "degree": "Degree and Major",
        "location": "City, State/Country",
        "startDate": "Month Year",
        "endDate": "Month Year or Present",
        "gpa": "X.XX"
      }
    ],
    "experience": [
      {
        "company": "Company Name",
        "position": "Job Title",
        "location": "City, State/Country",
        "startDate": "Month Year",
        "endDate": "Month Year or Present",
        "highlights": [
          "Achievement with quantified impact",
          "Another achievement"
        ]
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "technologies": "Tech1, Tech2, Tech3",
        "startDate": "Month Year",
        "endDate": "Month Year or Present",
        "link": "project-url.com",
        "highlights": [
          "What you built/achieved",
          "Impact or result"
        ]
      }
    ],
    "skills": {
      "languages": ["Python", "JavaScript", "etc"],
      "frameworks": ["React", "Node.js", "etc"],
      "tools": ["Git", "Docker", "etc"],
      "libraries": ["pandas", "NumPy", "etc"],
      "soft": ["Leadership", "Communication", "etc"]
    },
    "certifications": [
      {
        "name": "Certification Name",
        "issuer": "Issuing Organization",
        "date": "Month Year",
        "link": "certification-url.com"
      }
    ]
  },
  "atsScore": 85,
  "atsAnalysis": {
    "strengths": ["Strong action verbs", "Quantified achievements"],
    "improvements": ["Add more keywords from job description"],
    "keywordMatches": ["matched", "keywords"]
  },
  "suggestedTitle": "Software Engineer Resume"
}

If information is not provided, leave those fields as empty strings or empty arrays. Never make up information that wasn't provided.`;

export async function POST(request: NextRequest) {
  try {
    // 🔒 Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔒 Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before generating more resumes." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { rawInput, jobDescription } = body;

    // 🔒 Input validation
    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json(
        { error: "Raw input is required" },
        { status: 400 }
      );
    }

    if (rawInput.length > MAX_RAW_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Raw input too long. Maximum ${MAX_RAW_INPUT_LENGTH} characters allowed.` },
        { status: 400 }
      );
    }

    if (jobDescription && typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Job description must be a string" },
        { status: 400 }
      );
    }

    if (jobDescription && jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Job description too long. Maximum ${MAX_JOB_DESCRIPTION_LENGTH} characters allowed.` },
        { status: 400 }
      );
    }

    // Sanitize inputs (trim whitespace)
    const sanitizedRawInput = rawInput.trim();
    const sanitizedJobDescription = jobDescription?.trim();

    const userMessage = sanitizedJobDescription
      ? `Raw Resume Information:\n${sanitizedRawInput}\n\n---\n\nJob Description to tailor for:\n${sanitizedJobDescription}`
      : `Raw Resume Information:\n${sanitizedRawInput}`;

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = content.text;
      const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Don't expose raw content to client
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Resume generation error:", error);
    // Don't leak error details to client
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
