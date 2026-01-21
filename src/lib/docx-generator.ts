import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    AlignmentType,
    LevelFormat,
    BorderStyle,
    WidthType,
    HeadingLevel,
    ExternalHyperlink,
    convertInchesToTwip,
} from "docx";
import { ResumeData } from "./types";
import { generateDocxCodeWithClaude } from "./claude-docx-generator";

// =============================================================================
// DOCX RESUME GENERATOR
// Uses Claude Opus to generate actual docx library code
// Then executes that code to create the Word document
// =============================================================================

/**
 * Execute Claude's generated docx code safely
 */
function executeDocxCode(code: string): Document {
    // Create a function that has access to all docx imports
    const createDocument = new Function(
        "Document",
        "Packer",
        "Paragraph",
        "TextRun",
        "Table",
        "TableRow",
        "TableCell",
        "AlignmentType",
        "LevelFormat",
        "BorderStyle",
        "WidthType",
        "HeadingLevel",
        "ExternalHyperlink",
        "convertInchesToTwip",
        `
        ${code}
        return doc;
        `
    );

    // Execute with the docx library components
    return createDocument(
        Document,
        Packer,
        Paragraph,
        TextRun,
        Table,
        TableRow,
        TableCell,
        AlignmentType,
        LevelFormat,
        BorderStyle,
        WidthType,
        HeadingLevel,
        ExternalHyperlink,
        convertInchesToTwip
    );
}

/**
 * Generate a professional resume DOCX using Claude's DOCX skills
 *
 * Flow:
 * 1. Claude Opus generates actual JavaScript code using the docx library
 * 2. We execute that code to create the Document
 * 3. Pack it into a DOCX blob
 *
 * @param data - Resume data extracted by GPT-5-mini
 * @returns Blob of the generated DOCX file
 */
export async function generateDOCX(data: ResumeData): Promise<Blob> {
    // Step 1: Have Claude Opus generate the docx code
    console.log("[DOCX] Asking Claude to generate docx code...");
    const docxCode = await generateDocxCodeWithClaude(data);
    console.log("[DOCX] Claude generated code, executing...");

    // Step 2: Execute the code to create the Document
    const doc = executeDocxCode(docxCode);
    console.log("[DOCX] Document created, packing...");

    // Step 3: Pack into a blob
    return await Packer.toBlob(doc);
}
