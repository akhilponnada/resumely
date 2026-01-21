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
// CLAUDE DOCX SKILL - Generate actual docx library code
// Claude Opus uses its knowledge of the docx npm library to generate code
// Reference: https://github.com/anthropics/skills/tree/main/skills/docx
// =============================================================================

const DOCX_SKILL_PROMPT = `---
name: docx-resume-generator
description: Generate professional DOCX resume code using the docx npm library
---

# DOCX Resume Generator Skill

You are an expert at generating Word documents using the \`docx\` npm library. Your task is to generate JavaScript code that creates a professional resume document.

## Available Imports (already imported for you)
\`\`\`javascript
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, LevelFormat, BorderStyle, WidthType,
        HeadingLevel, ExternalHyperlink, convertInchesToTwip } = require('docx');
\`\`\`

## Template Requirements (MUST MATCH EXACTLY)

### HEADER
- Left side: FULL NAME (uppercase, bold, 14pt), then LinkedIn link below, then GitHub link below
- Right side: "Email: " + clickable email, "Mobile: " + phone number
- LinkedIn format: "LastName | LinkedIn" (blue, underlined, clickable)
- GitHub format: "username (github.com)" (blue, underlined, clickable)
- Use a 2-column table with no borders

### SECTION HEADERS
- Centered, bold, 10pt
- Gray underline below (color: #808080)
- Sections: EDUCATION, SKILLS SUMMARY, WORK EXPERIENCE, PROJECTS, CERTIFICATES

### EDUCATION
- Row 1: Institution (bold) on left | Location (bold) on right
- Row 2: Degree; GPA: X.XX (italic) on left | Dates (bold) on right
- Use borderless tables for alignment

### SKILLS SUMMARY
- Bullet format: ● Category: skill1, skill2, skill3
- Categories: Languages, Frameworks, Tools, Platforms, Soft Skills

### WORK EXPERIENCE
- Header: POSITION | COMPANY | LINK (bold, blue clickable) | Dates (bold, right-aligned)
- Bullet points with ○ (open circle) for each achievement

### PROJECTS
- Header: Project Name | LINK (bold, blue clickable) | Dates (bold, right-aligned)
- Bullet points with ○ for each achievement

### CERTIFICATES
- Header: Certificate Name (Issuer) | CERTIFICATE link (bold, blue) | Date (bold, right-aligned)
- Bullet points with ○ for highlights if any

## Style Constants to Use
\`\`\`javascript
const LINK_COLOR = "2563EB";
const SECTION_LINE_COLOR = "808080";
const TEXT_COLOR = "000000";
const FONT = "Calibri";
const FONT_SIZE_NAME = 28;    // 14pt
const FONT_SIZE_SECTION = 20; // 10pt
const FONT_SIZE_NORMAL = 18;  // 9pt
const FONT_SIZE_SMALL = 16;   // 8pt
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
\`\`\`

## Output Format

Return ONLY valid JavaScript code that:
1. Creates a \`children\` array of Paragraph and Table elements
2. Creates the Document with proper margins (0.5 inch all around)
3. Exports the document

Your code should look like this structure:
\`\`\`javascript
const children = [];

// Header section
children.push(new Table({ ... }));

// Education section
children.push(new Paragraph({ ... })); // section header
// ... education items

// Skills section
// ... etc

const doc = new Document({
    sections: [{
        properties: {
            page: {
                margin: {
                    top: convertInchesToTwip(0.5),
                    right: convertInchesToTwip(0.5),
                    bottom: convertInchesToTwip(0.5),
                    left: convertInchesToTwip(0.5),
                },
            },
        },
        children,
    }],
});

module.exports = doc;
\`\`\`

## Important Rules
1. UPPERCASE the full name, position titles, and company names
2. Format dates consistently as "Month Year - Month Year" or "Month Year - Present"
3. Make all links clickable using ExternalHyperlink
4. Use strong action verbs for highlights
5. Return ONLY the JavaScript code, no markdown code blocks
6. The code must be valid and executable
7. Handle missing/optional data gracefully (check if fields exist before using)`;

/**
 * Use Claude Opus to generate actual docx library code
 */
export async function generateDocxCodeWithClaude(data: ResumeData): Promise<string> {
    const userMessage = `Generate JavaScript code using the docx library to create a resume for this data:

${JSON.stringify(data, null, 2)}

Remember to:
1. UPPERCASE the full name: "${(data.fullName || "").toUpperCase()}"
2. Format LinkedIn as "LastName | LinkedIn" where LastName is "${(data.fullName || "").split(" ").pop()}"
3. Format GitHub as "username (github.com)" where username is extracted from the github URL
4. Handle missing fields gracefully (check if they exist)
5. Return ONLY valid JavaScript code that creates the document
6. Do NOT include markdown code blocks - just raw JavaScript`;

    const response = await claude.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 16000,
        system: DOCX_SKILL_PROMPT,
        messages: [{ role: "user", content: userMessage }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
        throw new Error("Unexpected response format from Claude");
    }

    // Extract code from response (remove markdown if present)
    let code = content.text.trim();

    // Remove markdown code blocks if Claude included them
    const codeMatch = code.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
    if (codeMatch) {
        code = codeMatch[1].trim();
    }

    return code;
}
