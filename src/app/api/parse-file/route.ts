import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mammoth from "mammoth";
import PDFParser from "pdf2json";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed extensions
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

// Parse PDF using pdf2json
function parsePDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
            try {
                // Extract text from all pages with better formatting
                const pages: string[] = [];

                for (const page of pdfData.Pages) {
                    const lines: { y: number; text: string }[] = [];

                    for (const textItem of page.Texts) {
                        const y = Math.round(textItem.y * 10); // Group by approximate y position
                        const text = textItem.R.map((r: { T: string }) => decodeURIComponent(r.T)).join("");

                        // Find existing line at this y position or create new
                        const existingLine = lines.find(l => Math.abs(l.y - y) < 2);
                        if (existingLine) {
                            existingLine.text += " " + text;
                        } else {
                            lines.push({ y, text });
                        }
                    }

                    // Sort lines by y position and join
                    lines.sort((a, b) => a.y - b.y);
                    const pageText = lines.map(l => l.text.trim()).filter(t => t).join("\n");
                    pages.push(pageText);
                }

                resolve(pages.join("\n\n"));
            } catch (err) {
                reject(err);
            }
        });

        pdfParser.on("pdfParser_dataError", (errData) => {
            reject(new Error(errData.parserError?.message || "Failed to parse PDF"));
        });

        pdfParser.parseBuffer(buffer);
    });
}

export async function POST(req: NextRequest) {
    try {
        // 🔒 Authentication check
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 🔒 File size validation
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        const fileName = file.name.toLowerCase();

        // 🔒 Extension validation
        const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
        if (!hasValidExtension && !fileName.endsWith(".doc")) {
            return NextResponse.json(
                { error: "Invalid file type. Supported: PDF, DOCX, TXT, MD" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = "";

        if (fileName.endsWith(".pdf")) {
            // Parse PDF
            try {
                text = await parsePDF(buffer);
            } catch (err) {
                console.error("PDF parse error:", err);
                return NextResponse.json({ error: "Failed to parse PDF. Please try a different file or paste your information manually." }, { status: 400 });
            }
        } else if (fileName.endsWith(".docx")) {
            // Parse DOCX
            try {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
            } catch (err) {
                console.error("DOCX parse error:", err);
                return NextResponse.json({ error: "Failed to parse DOCX" }, { status: 400 });
            }
        } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
            // Plain text
            text = buffer.toString("utf-8");
        } else if (fileName.endsWith(".doc")) {
            return NextResponse.json({
                error: "Old .doc format not supported. Please convert to .docx"
            }, { status: 400 });
        } else {
            // Try to read as text
            try {
                text = buffer.toString("utf-8");
            } catch {
                return NextResponse.json({
                    error: "Unsupported file format. Please upload PDF, DOCX, or TXT files."
                }, { status: 400 });
            }
        }

        // Clean up the text - normalize whitespace only
        text = text
            // Fix spaces around punctuation
            .replace(/ +([.,;:!?])/g, "$1")
            // Normalize line endings
            .replace(/\r\n/g, "\n")
            // Collapse multiple spaces into one (but keep single spaces!)
            .replace(/[ \t]{2,}/g, " ")
            // Collapse multiple newlines
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        // 🔒 Limit response size
        if (text.length > 100000) {
            text = text.substring(0, 100000);
        }

        return NextResponse.json({ text, fileName: file.name });
    } catch (error) {
        console.error("File parse error:", error);
        return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
    }
}
