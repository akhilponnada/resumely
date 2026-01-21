import { ResumeData } from "./types";
import { generateDocxStructureWithClaude } from "./claude-docx-generator";
import { renderDocxFromStructure } from "./docx-renderer";

// =============================================================================
// DOCX RESUME GENERATOR
// Uses Claude Opus to generate DOCX structure using its skills
// Then renders that structure to an actual Word document
// =============================================================================

/**
 * Generate a professional resume DOCX using Claude's DOCX skills
 *
 * Flow:
 * 1. Claude Opus analyzes the resume data and generates a structured DOCX format
 * 2. The renderer converts Claude's structure into an actual Word document
 *
 * @param data - Resume data extracted by GPT-5-mini
 * @returns Blob of the generated DOCX file
 */
export async function generateDOCX(data: ResumeData): Promise<Blob> {
    // Step 1: Have Claude Opus generate the DOCX structure using its skills
    const docxStructure = await generateDocxStructureWithClaude(data);

    // Step 2: Render Claude's structure into an actual Word document
    return await renderDocxFromStructure(docxStructure);
}
