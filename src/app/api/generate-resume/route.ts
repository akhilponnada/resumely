import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAIClient, AI_DEPLOYMENT } from "@/lib/ai";
import { computeATS } from "@/lib/ats";
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

// =============================================================================
// RESUME BUILDER - GPT-5-mini for fast, accurate fact extraction
// =============================================================================
const SYSTEM_PROMPT = `You are an expert resume parser. Your job is to CLEAN, PROCESS, and STRUCTURE resume information - NOT just copy raw text.

## STEP 1: CLEAN THE INPUT FIRST
Before extracting any information, you MUST clean the raw input:
- Remove ALL special bullet characters: ○ ● ◦ ◆ ▪ ▫ ► ▸ ✓ ✔ → ➤ ➢ ★ ☆ ■ □
- Remove weird symbols and replace with clean text
- Fix broken spacing and formatting
- Convert any bullet points to plain text sentences
- Remove duplicate spaces, tabs, and excessive line breaks

## STEP 2: PROCESS AND REWRITE
- Rewrite bullet points as clean, professional sentences starting with action verbs
- Don't copy raw text - process it into proper resume language
- Ensure consistent formatting throughout

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

6. Highlights/bullet points: Write as CLEAN plain text only
   - NO special characters like ○ ● ◦ ▪ ► etc - just plain text
   - Start with strong action verb (Led, Developed, Managed, Achieved, etc.)
   - Include metrics and numbers where possible
   - Example: "Spearheaded cross-functional coordination with drivers during incidents"
   - Example: "Increased sales by 25% through implementation of new CRM system"
   - WRONG: "○ Led team..." or "• Managed..." - NO bullet characters in the text

## Skills Categorization
- Languages: Programming languages (Python, JavaScript, SQL, etc.)
- Frameworks: Development frameworks (React, Node.js, Django, etc.)
- Tools: Software tools (Git, Docker, AWS, Microsoft Office Suite, etc.)
- Platforms: Development environments or platforms
- Soft: Professional skills (Communication, Customer Service, Leadership, etc.)

## LINK EXTRACTION - CRITICAL
- ONLY include a link if an actual URL is provided in the input
- If no URL is provided, set the link field to empty string ""
- DO NOT make up or guess URLs - only extract what's actually there
- Look for URLs like: https://..., http://..., github.com/..., linkedin.com/..., etc.

## ATS ANALYSIS - LINK RECOMMENDATIONS
In the atsAnalysis.improvements array, add recommendations for missing links:
- If projects have no URLs: "Add GitHub/demo links to your projects - recruiters want to see your work"
- If experience has no company URLs: "Consider adding company website links to verify your employment"
- If certifications have no verification links: "Add certificate verification URLs to boost credibility"
- If LinkedIn is missing: "Add your LinkedIn profile URL - most recruiters check LinkedIn"
- If GitHub is missing for tech roles: "Add your GitHub profile to showcase your coding skills"

## Output Format - RESPOND WITH ONLY VALID JSON:

{
  "resumeData": {
    "fullName": "Full Name",
    "email": "email@example.com",
    "phone": "+44 XXXXXXXXXX",
    "linkedin": "linkedin.com/in/username or empty if not provided",
    "github": "github.com/username or empty if not provided",
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
        "link": "ONLY if URL provided in input, otherwise empty string",
        "highlights": ["Spearheaded cross-functional coordination with drivers and Operations Control Room during incidents"]
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "technologies": "Tech1, Tech2, Tech3",
        "startDate": "Month Year",
        "endDate": "Month Year",
        "link": "ONLY if URL provided in input, otherwise empty string",
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
    "certifications": [
      {
        "name": "Python for Data Science",
        "issuer": "IBM",
        "date": "January 2024",
        "link": "ONLY if URL provided in input, otherwise empty string",
        "highlights": []
      }
    ]
  },
  "atsAnalysis": {
    "strengths": ["Strength 1"],
    "improvements": ["Improvement 1"]
  },
  "suggestedTitle": "Job Title Resume"
}

DO NOT output an atsScore. The score is calculated from the extracted data, not
estimated. Use atsAnalysis only for qualitative advice a calculation cannot give:
what reads well, and what the person should rewrite or add.

REMEMBER: All text must have proper spacing between words. Never concatenate words together.
IMPORTANT: certifications must be an array of OBJECTS, not strings. Each certification needs name, issuer, date fields.`;

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
    resumeData.skills = { languages: [], frameworks: [], tools: [], platforms: [], soft: [] };
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
    const response = await getAIClient().chat.completions.create({
      model: AI_DEPLOYMENT,
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

    // Parse JSON response and normalize data
    try {
      const parsed = JSON.parse(content);
      const normalized = normalizeResumeData(parsed) as Record<string, unknown>;
      const resumeData = (normalized.resumeData ?? normalized) as ResumeData;

      // The model occasionally returns a shell with every field blank. Saving
      // that produces a resume with no name, no contact details and no history,
      // so reject it here rather than persisting an empty record.
      const hasContent =
        Boolean(resumeData?.fullName?.trim()) ||
        (resumeData?.experience?.length ?? 0) > 0 ||
        (resumeData?.education?.length ?? 0) > 0;

      if (!hasContent) {
        return NextResponse.json(
          { error: "Could not read any details from that input. Try pasting more of your resume, or add your name, roles and dates." },
          { status: 422 }
        );
      }

      // Score deterministically instead of trusting the number the model made
      // up: the same resume must always score the same, and every deduction
      // has to be explainable to the user.
      const ats = computeATS(resumeData, jobDescription);
      normalized.atsScore = ats.score;
      normalized.atsChecks = ats.checks;
      normalized.matchedKeywords = ats.matchedKeywords;
      normalized.missingKeywords = ats.missingKeywords;

      return NextResponse.json(normalized);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    }

  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
