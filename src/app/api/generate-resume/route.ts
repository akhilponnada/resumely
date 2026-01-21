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
const SYSTEM_PROMPT = `You are an expert resume parser. Extract and structure resume information from raw user input.

## CRITICAL FORMATTING RULES
1. ALWAYS use proper spacing in all text:
   - "Heriot-Watt University" NOT "Heriot-WattUniversity"
   - "Edinburgh Trams Limited" NOT "EdinburghTramsLimited"
   - "Software Engineer" NOT "SoftwareEngineer"
   - "New York, USA" NOT "NewYork,USA"

2. Institution names: SEPARATE institution from location
   - institution field: ONLY the university name, e.g., "Heriot-Watt University"
   - location field: ONLY city and country, e.g., "Edinburgh, UK"
   - DO NOT combine them - they go in separate fields

3. Company names: Use proper formatting with spaces
   - Example: "Edinburgh Trams Limited"
   - Example: "IHG Hotels Management Limited"
   - Example: "Amazon UK"

4. Job titles: Use proper formatting with spaces
   - Example: "Ticketing Service Assistant"
   - Example: "Customer Service Associate"
   - Example: "FC Administration Associate"

5. Degree names: Use proper formatting
   - Example: "MSc International Business Management"
   - Example: "Bachelor of Business Administration"

6. Highlights/bullet points: Write as plain text, no special formatting
   - Start with action verb
   - Include metrics where possible
   - Example: "Spearheaded cross-functional coordination with drivers during incidents"

## Skills Categorization
- Languages: Programming languages (Python, JavaScript, SQL, etc.)
- Frameworks: Development frameworks (React, Node.js, Django, etc.)
- Tools: Software tools (Git, Docker, AWS, Microsoft Office Suite, etc.)
- Platforms: Development environments or platforms
- Soft: Professional skills (Communication, Customer Service, Leadership, etc.)

## Output Format - RESPOND WITH ONLY VALID JSON:

{
  "resumeData": {
    "fullName": "Full Name",
    "email": "email@example.com",
    "phone": "+44 XXXXXXXXXX",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "website": "",
    "summary": "",
    "education": [
      {
        "institution": "Heriot-Watt University",
        "degree": "MSc International Business Management",
        "location": "Edinburgh, UK",
        "startDate": "January 2023",
        "endDate": "June 2024",
        "gpa": "2:1"
      }
    ],
    "experience": [
      {
        "company": "Edinburgh Trams Limited",
        "position": "Ticketing Service Assistant",
        "location": "Edinburgh, UK",
        "startDate": "June 2025",
        "endDate": "Present",
        "link": "",
        "highlights": ["Spearheaded cross-functional coordination with drivers and Operations Control Room during incidents"]
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "technologies": "Tech1, Tech2, Tech3",
        "startDate": "Month Year",
        "endDate": "Month Year",
        "link": "",
        "highlights": ["Plain text achievement"]
      }
    ],
    "skills": {
      "languages": [],
      "frameworks": [],
      "tools": ["Microsoft Office Suite", "Tool2"],
      "platforms": [],
      "soft": ["Communication", "Customer Service"]
    },
    "certifications": []
  },
  "atsScore": 85,
  "atsAnalysis": {
    "strengths": ["Strength 1"],
    "improvements": ["Improvement 1"],
    "keywordMatches": []
  },
  "suggestedTitle": "Job Title Resume"
}

REMEMBER: All text must have proper spacing between words. Never concatenate words together.`;

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
