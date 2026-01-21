import AnthropicFoundry from "@anthropic-ai/foundry-sdk";
import { ResumeData } from "./types";

// Azure Claude client
const endpoint = process.env.AZURE_CLAUDE_ENDPOINT || "";
const resourceMatch = endpoint.match(/https:\/\/([^.]+)\.services\.ai\.azure\.com/);
const resourceName = resourceMatch ? resourceMatch[1] : "";

const claude = new AnthropicFoundry({
    apiKey: process.env.AZURE_CLAUDE_API_KEY!,
    resource: resourceName,
});

// =============================================================================
// CLAUDE DOCX SKILL
// Claude Opus generates the DOCX structure using its knowledge of the docx library
// Reference: https://github.com/anthropics/skills/tree/main/skills/docx
// =============================================================================

const DOCX_SKILL_PROMPT = `---
name: docx-resume-generator
description: Generate professional DOCX resume using the docx npm library
---

# DOCX Resume Generator Skill

You are an expert at generating Word documents using the \`docx\` npm library. Your task is to generate a JSON structure that represents a professional resume document.

## Template Requirements (MUST MATCH EXACTLY)

The resume must look like this reference template:

### HEADER
- Left side: FULL NAME (uppercase, bold, 14pt), then LinkedIn link below, then GitHub link below
- Right side: "Email: " + clickable email, "Mobile: " + phone number
- LinkedIn format: "LastName | LinkedIn" (blue, underlined, clickable)
- GitHub format: "username (github.com)" (blue, underlined, clickable)

### SECTION HEADERS
- Centered, bold, 10pt
- Gray underline below (color: #808080)
- Sections: EDUCATION, SKILLS SUMMARY, WORK EXPERIENCE, PROJECTS, CERTIFICATES

### EDUCATION
- Row 1: Institution (bold) on left | Location (bold) on right
- Row 2: Degree; GPA: X.XX (italic) on left | Dates (bold) on right

### SKILLS SUMMARY
- Bullet format: ● Category: skill1, skill2, skill3
- Categories: Languages, Frameworks, Tools, Platforms, Soft Skills

### WORK EXPERIENCE
- Header: POSITION | COMPANY | LINK (uppercase, bold) | Dates (bold, right-aligned)
- Bullet points with ○ (open circle) for each achievement

### PROJECTS
- Header: Project Name | LINK (bold) | Dates (bold, right-aligned)
- Bullet points with ○ for each achievement

### CERTIFICATES
- Header: Certificate Name (Issuer) | CERTIFICATE (bold) | Date (bold, right-aligned)
- Bullet points with ○ for highlights if any

## Output Format

Return a JSON object with this exact structure that represents the document:

\`\`\`json
{
  "sections": [
    {
      "type": "header",
      "fullName": "FULL NAME",
      "linkedin": { "text": "LastName | LinkedIn", "url": "https://..." },
      "github": { "text": "username (github.com)", "url": "https://..." },
      "email": { "text": "email@example.com", "url": "mailto:..." },
      "phone": "+91 XXXXXXXXXX"
    },
    {
      "type": "education",
      "items": [
        {
          "institution": "University Name",
          "location": "City, Country",
          "degree": "Degree; GPA: X.XX",
          "dates": "Month Year - Month Year"
        }
      ]
    },
    {
      "type": "skills",
      "categories": [
        { "label": "Languages", "items": ["Python", "SQL", "Java"] },
        { "label": "Frameworks", "items": ["React", "Node.js"] }
      ]
    },
    {
      "type": "experience",
      "items": [
        {
          "position": "JOB TITLE",
          "company": "COMPANY NAME",
          "link": "https://...",
          "dates": "Month Year - Month Year",
          "highlights": ["Achievement 1", "Achievement 2"]
        }
      ]
    },
    {
      "type": "projects",
      "items": [
        {
          "name": "Project Name",
          "link": "https://...",
          "dates": "Month Year - Month Year",
          "highlights": ["Achievement 1", "Achievement 2"]
        }
      ]
    },
    {
      "type": "certificates",
      "items": [
        {
          "name": "Certificate Name",
          "issuer": "Issuing Organization",
          "link": "https://...",
          "date": "Month Year",
          "highlights": ["Key learning 1"]
        }
      ]
    }
  ]
}
\`\`\`

## Important Rules
1. UPPERCASE the full name, position titles, and company names
2. Format dates consistently as "Month Year - Month Year" or "Month Year- Present"
3. Make all links clickable (include full URLs)
4. Use strong action verbs for highlights
5. Include metrics/numbers in achievements where available
6. Return ONLY the JSON, no markdown code blocks`;

export interface DocxStructure {
    sections: DocxSection[];
}

export type DocxSection =
    | HeaderSection
    | EducationSection
    | SkillsSection
    | ExperienceSection
    | ProjectsSection
    | CertificatesSection;

interface HeaderSection {
    type: "header";
    fullName: string;
    linkedin?: { text: string; url: string };
    github?: { text: string; url: string };
    email?: { text: string; url: string };
    phone?: string;
}

interface EducationSection {
    type: "education";
    items: {
        institution: string;
        location: string;
        degree: string;
        dates: string;
    }[];
}

interface SkillsSection {
    type: "skills";
    categories: {
        label: string;
        items: string[];
    }[];
}

interface ExperienceSection {
    type: "experience";
    items: {
        position: string;
        company: string;
        link?: string;
        dates: string;
        highlights: string[];
    }[];
}

interface ProjectsSection {
    type: "projects";
    items: {
        name: string;
        link?: string;
        dates: string;
        highlights: string[];
    }[];
}

interface CertificatesSection {
    type: "certificates";
    items: {
        name: string;
        issuer: string;
        link?: string;
        date: string;
        highlights?: string[];
    }[];
}

/**
 * Use Claude Opus to generate the DOCX structure based on resume data
 */
export async function generateDocxStructureWithClaude(data: ResumeData): Promise<DocxStructure> {
    const userMessage = `Generate a DOCX structure for this resume data:

${JSON.stringify(data, null, 2)}

Remember to:
1. UPPERCASE the full name, positions, and company names
2. Format LinkedIn as "LastName | LinkedIn"
3. Format GitHub as "username (github.com)"
4. Include all sections even if empty (use empty arrays)
5. Return ONLY valid JSON`;

    const response = await claude.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 8000,
        system: DOCX_SKILL_PROMPT,
        messages: [{ role: "user", content: userMessage }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
        throw new Error("Unexpected response format from Claude");
    }

    // Parse JSON response
    let jsonStr = content.text.trim();

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
    }

    try {
        return JSON.parse(jsonStr) as DocxStructure;
    } catch (error) {
        console.error("Failed to parse Claude response:", content.text);
        throw new Error("Failed to parse DOCX structure from Claude");
    }
}
