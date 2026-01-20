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

// =============================================================================
// RESUME BUILDER SKILL
// Based on Anthropic's Claude Skills pattern for professional document creation
// Reference: https://github.com/anthropics/skills
// =============================================================================
const SYSTEM_PROMPT = `---
name: resume-builder
description: "Professional ATS-optimized resume builder skill. Analyzes user information and creates structured, professionally-worded resume data optimized for Applicant Tracking Systems."
---

# Resume Builder Skill

You are an expert resume writer with deep knowledge of ATS (Applicant Tracking Systems), hiring practices, and professional resume formatting. Your task is to analyze raw user input and create a structured, ATS-optimized resume.

## Core Principles

### 1. Information Extraction
- Parse ALL provided information accurately - names, contact details, education, work history, projects, skills, certifications
- Preserve exact dates, GPAs, company names, and job titles as provided
- Extract LinkedIn URLs (look for "linkedin.com/in/username" patterns)
- Extract GitHub URLs (look for "github.com/username" patterns)
- Identify email addresses and phone numbers
- NEVER fabricate or assume information not explicitly provided

### 2. Professional Enhancement
Transform raw bullet points into powerful achievement statements using the STAR method:
- **Situation/Task**: Context of the work
- **Action**: Specific actions taken (use strong action verbs)
- **Result**: Quantified outcomes with metrics (%, $, time saved, etc.)

**Strong Action Verbs by Category:**
- Leadership: Spearheaded, Orchestrated, Directed, Championed, Pioneered
- Achievement: Achieved, Attained, Surpassed, Exceeded, Delivered
- Technical: Developed, Engineered, Architected, Implemented, Optimized
- Analysis: Analyzed, Evaluated, Assessed, Identified, Investigated
- Improvement: Enhanced, Streamlined, Accelerated, Reduced, Minimized
- Collaboration: Collaborated, Partnered, Coordinated, Facilitated, Liaised

### 3. ATS Optimization Guidelines
- Include industry-specific keywords naturally
- Use standard section headings (Education, Experience, Projects, Skills, Certifications)
- Avoid graphics, tables in content (we handle formatting separately)
- Include both spelled-out terms and acronyms (e.g., "Machine Learning (ML)")
- Match keywords from job description when provided

### 4. Skills Categorization
Organize skills into these standard categories:
- **Languages**: Programming languages (Python, JavaScript, SQL, Java, etc.)
- **Frameworks**: Development frameworks (React, Node.js, Django, TensorFlow, etc.)
- **Tools**: Software tools (Git, Docker, AWS, Power BI, Tableau, etc.)
- **Platforms**: Development environments and platforms (VS Code, Jupyter, IntelliJ, etc.)
- **Soft Skills**: Professional skills (Leadership, Communication, Problem-solving, etc.)

### 5. Date Formatting
Use consistent format: "Month Year" (e.g., "June 2022", "Present")
- For ranges: "June 2022 - August 2024"
- Current positions: use "Present"

## Output Format

RESPOND WITH ONLY VALID JSON in this exact structure:

\`\`\`json
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
        "degree": "Degree Type (HONORS if applicable) - Major",
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
        "link": "optional-work-link.com",
        "highlights": [
          "Strong action verb + specific achievement + quantified result (e.g., 'Streamlined data collection and reporting procedures, reducing processing time by 20% enhancing efficiency.')",
          "Each bullet should demonstrate measurable impact"
        ]
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "technologies": "Tech1, Tech2, Tech3",
        "startDate": "Month Year",
        "endDate": "Month Year",
        "link": "project-link.com",
        "highlights": [
          "Achievement with quantified metrics (e.g., 'Achieved a 96% accuracy rate in forecasting by developing and deploying a machine learning model.')",
          "Technical implementation details with measurable outcomes"
        ]
      }
    ],
    "skills": {
      "languages": ["Python", "SQL", "Java"],
      "frameworks": ["Pandas", "NumPy", "Scikit-Learn", "Matplotlib"],
      "tools": ["Power BI", "Excel", "Tableau", "MySQL", "SQLite"],
      "platforms": ["PyCharm", "Jupyter Notebook", "Visual Studio Code", "IntelliJ IDEA"],
      "soft": ["Rapport Building", "Stakeholder Management", "People Management", "Communication"]
    },
    "certifications": [
      {
        "name": "Certification Name",
        "issuer": "Issuing Organization (e.g., Meta, IBM, Google)",
        "date": "Month Year",
        "link": "certification-verification-url.com",
        "highlights": [
          "Key learning or achievement from this certification",
          "Skills or knowledge gained"
        ]
      }
    ]
  },
  "atsScore": 85,
  "atsAnalysis": {
    "strengths": [
      "Uses strong action verbs",
      "Includes quantified achievements",
      "Skills match industry standards"
    ],
    "improvements": [
      "Specific suggestions for improvement"
    ],
    "keywordMatches": ["keyword1", "keyword2"]
  },
  "suggestedTitle": "Job Title Resume"
}
\`\`\`

## Quality Checklist
Before returning, verify:
- [ ] All provided information is included (nothing omitted)
- [ ] No information was fabricated
- [ ] Dates are in consistent "Month Year" format
- [ ] Each experience/project bullet starts with a strong action verb
- [ ] Achievements include quantified metrics where possible
- [ ] Skills are properly categorized
- [ ] ATS score reflects the actual quality of the resume

## Special Instructions for Job Description Matching
If a job description is provided:
1. Identify key requirements and skills mentioned
2. Naturally incorporate matching keywords into experience bullets
3. Prioritize experiences and projects most relevant to the role
4. Calculate ATS score based on keyword match percentage
5. List matched keywords in the atsAnalysis.keywordMatches array`;

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
