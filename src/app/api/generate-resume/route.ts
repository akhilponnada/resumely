import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AzureOpenAI } from "openai";

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

// Azure OpenAI client for GPT-5-mini (fast fact extraction)
const client = new AzureOpenAI({
  apiKey: process.env.AZURE_CLAUDE_API_KEY!,
  endpoint: "https://ai-akhilponnada2047ai102855017871.cognitiveservices.azure.com",
  apiVersion: "2024-12-01-preview",
});

// Input validation constants
const MAX_RAW_INPUT_LENGTH = 50000;
const MAX_JOB_DESCRIPTION_LENGTH = 20000;

// =============================================================================
// RESUME BUILDER - GPT-5-mini for fast, accurate fact extraction
// =============================================================================
const SYSTEM_PROMPT = `You are an expert resume parser and ATS optimization specialist. Your task is to extract and structure resume information from raw user input.

## Core Rules
1. Extract ALL information accurately - names, contacts, education, work, projects, skills, certifications
2. Preserve exact dates, GPAs, company names, job titles as provided
3. NEVER fabricate or assume information not explicitly provided
4. Transform bullet points into achievement statements with metrics when possible

## Strong Action Verbs
- Leadership: Spearheaded, Orchestrated, Directed, Championed
- Achievement: Achieved, Attained, Surpassed, Exceeded, Delivered
- Technical: Developed, Engineered, Architected, Implemented, Optimized
- Analysis: Analyzed, Evaluated, Assessed, Identified
- Improvement: Enhanced, Streamlined, Accelerated, Reduced, Minimized

## Skills Categorization
- Languages: Programming languages (Python, JavaScript, SQL, Java, etc.)
- Frameworks: Development frameworks (React, Node.js, Django, TensorFlow, etc.)
- Tools: Software tools (Git, Docker, AWS, Power BI, Tableau, etc.)
- Platforms: Development environments (VS Code, Jupyter, IntelliJ, etc.)
- Soft: Professional skills (Leadership, Communication, Problem-solving, etc.)

## Output Format
RESPOND WITH ONLY VALID JSON:

{
  "resumeData": {
    "fullName": "Full Name",
    "email": "email@example.com",
    "phone": "+91 XXXXXXXXXX or +1-XXX-XXX-XXXX",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "website": "optional-website.com",
    "summary": "Optional professional summary",
    "education": [
      {
        "institution": "University Name",
        "degree": "Degree Type - Major",
        "location": "City, Country",
        "startDate": "Month Year",
        "endDate": "Month Year",
        "gpa": "X.XX"
      }
    ],
    "experience": [
      {
        "company": "Company Name",
        "position": "Job Title",
        "location": "City, Country",
        "startDate": "Month Year",
        "endDate": "Month Year or Present",
        "link": "",
        "highlights": ["Achievement with quantified impact"]
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "technologies": "Tech1, Tech2, Tech3",
        "startDate": "Month Year",
        "endDate": "Month Year",
        "link": "project-link.com",
        "highlights": ["Achievement with metrics"]
      }
    ],
    "skills": {
      "languages": ["Python", "SQL"],
      "frameworks": ["React", "Node.js"],
      "tools": ["Git", "Docker"],
      "platforms": ["VS Code", "Jupyter"],
      "soft": ["Leadership", "Communication"]
    },
    "certifications": [
      {
        "name": "Certification Name",
        "issuer": "Issuing Organization",
        "date": "Month Year",
        "link": "certification-url.com",
        "highlights": ["Key achievement or skill gained"]
      }
    ]
  },
  "atsScore": 85,
  "atsAnalysis": {
    "strengths": ["Strong action verbs", "Quantified achievements"],
    "improvements": ["Suggestions for improvement"],
    "keywordMatches": ["matched", "keywords"]
  },
  "suggestedTitle": "Job Title Resume"
}

If job description is provided, match keywords and calculate ATS score based on keyword match percentage.`;

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
    const { rawInput, jobDescription } = body;

    // Input validation
    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json({ error: "Raw input is required" }, { status: 400 });
    }

    if (rawInput.length > MAX_RAW_INPUT_LENGTH) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    if (jobDescription && jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
      return NextResponse.json({ error: "Job description too long" }, { status: 400 });
    }

    const userMessage = jobDescription
      ? `Raw Resume Information:\n${rawInput.trim()}\n\n---\n\nJob Description to tailor for:\n${jobDescription.trim()}`
      : `Raw Resume Information:\n${rawInput.trim()}`;

    // Use GPT-5-mini for fast fact extraction
    const response = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      max_completion_tokens: 8000,
      response_format: { type: "json_object" }, // Enforce JSON output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    }

  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
