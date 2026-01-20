import {
    Document,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle,
    Packer,
    ExternalHyperlink,
    TabStopType,
    TabStopPosition,
    convertInchesToTwip,
} from "docx";
import { ResumeData } from "./types";

// Colors matching the template
const LINK_COLOR = "2563EB"; // Blue for links
const SECTION_LINE_COLOR = "808080"; // Gray for section underlines

// Font to use - Calibri is default in Word and matches the template closely
const FONT = "Calibri";

export async function generateDOCX(data: ResumeData): Promise<Blob> {
    const children: (Paragraph | Table)[] = [];

    // === HEADER ===
    // Create a table for header: Name/Links on left, Contact on right
    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    // Left cell: Name + Links
                    new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                        },
                        children: [
                            // Name - Bold, left aligned
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: (data.fullName || "FULL NAME").toUpperCase(),
                                        bold: true,
                                        size: 28, // 14pt
                                        font: FONT,
                                    }),
                                ],
                            }),
                            // LinkedIn link
                            ...(data.linkedin ? [
                                new Paragraph({
                                    children: [
                                        new ExternalHyperlink({
                                            link: `https://${data.linkedin.replace(/^https?:\/\//, "")}`,
                                            children: [
                                                new TextRun({
                                                    text: `${data.fullName?.split(" ")[0] || "Name"} | LinkedIn`,
                                                    color: LINK_COLOR,
                                                    underline: {},
                                                    size: 18, // 9pt
                                                    font: FONT,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ] : []),
                            // GitHub link
                            ...(data.github ? [
                                new Paragraph({
                                    children: [
                                        new ExternalHyperlink({
                                            link: `https://${data.github.replace(/^https?:\/\//, "")}`,
                                            children: [
                                                new TextRun({
                                                    text: `${data.github.replace(/^https?:\/\//, "").replace("github.com/", "")} (github.com)`,
                                                    color: LINK_COLOR,
                                                    underline: {},
                                                    size: 18,
                                                    font: FONT,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ] : []),
                        ],
                    }),
                    // Right cell: Contact info
                    new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                        },
                        children: [
                            ...(data.email ? [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    children: [
                                        new TextRun({
                                            text: "Email: ",
                                            size: 18,
                                            font: FONT,
                                        }),
                                        new ExternalHyperlink({
                                            link: `mailto:${data.email}`,
                                            children: [
                                                new TextRun({
                                                    text: data.email,
                                                    color: LINK_COLOR,
                                                    underline: {},
                                                    size: 18,
                                                    font: FONT,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ] : []),
                            ...(data.phone ? [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    children: [
                                        new TextRun({
                                            text: `Mobile: ${data.phone}`,
                                            size: 18,
                                            font: FONT,
                                        }),
                                    ],
                                }),
                            ] : []),
                        ],
                    }),
                ],
            }),
        ],
    });
    children.push(headerTable);

    // Helper for centered section headers with gray underline
    const addSectionHeader = (title: string) => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: title,
                        bold: true,
                        size: 20, // 10pt
                        font: FONT,
                    }),
                ],
                alignment: AlignmentType.CENTER,
                border: {
                    bottom: {
                        color: SECTION_LINE_COLOR,
                        space: 1,
                        size: 8,
                        style: BorderStyle.SINGLE,
                    },
                },
                spacing: { before: 200, after: 100 },
            })
        );
    };

    // === EDUCATION ===
    if (data.education && data.education.length > 0) {
        addSectionHeader("EDUCATION");
        for (const edu of data.education) {
            // Create education table for proper alignment
            const eduTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    // Row 1: Institution | Location
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: edu.institution, bold: true, size: 20, font: FONT }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({ text: edu.location || "", size: 18, font: FONT }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                    // Row 2: Degree | Dates
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: edu.gpa ? `${edu.degree}; GPA: ${edu.gpa}` : edu.degree,
                                                italics: true,
                                                size: 18,
                                                font: FONT,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                text: `${edu.startDate || ""} - ${edu.endDate || ""}`,
                                                bold: true,
                                                size: 18,
                                                font: FONT,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });
            children.push(eduTable);
            children.push(new Paragraph({ spacing: { after: 60 } }));
        }
    }

    // === SKILLS SUMMARY ===
    if (data.skills) {
        const skillItems: { label: string; items: string[] }[] = [];
        if (data.skills.languages?.length) skillItems.push({ label: "Languages", items: data.skills.languages });
        if (data.skills.frameworks?.length) skillItems.push({ label: "Frameworks", items: data.skills.frameworks });
        if (data.skills.tools?.length) skillItems.push({ label: "Tools", items: data.skills.tools });
        if (data.skills.libraries?.length) skillItems.push({ label: "Platforms", items: data.skills.libraries });
        if (data.skills.soft?.length) skillItems.push({ label: "Soft Skills", items: data.skills.soft });

        if (skillItems.length > 0) {
            addSectionHeader("SKILLS SUMMARY");
            for (const { label, items } of skillItems) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "●  ", size: 14, font: FONT }),
                            new TextRun({ text: `${label}: `, bold: true, size: 18, font: FONT }),
                            new TextRun({ text: items.join(", "), size: 18, font: FONT }),
                        ],
                        indent: { left: convertInchesToTwip(0.15) },
                        spacing: { after: 30 },
                    })
                );
            }
        }
    }

    // === WORK EXPERIENCE ===
    if (data.experience && data.experience.length > 0) {
        addSectionHeader("WORK EXPERIENCE");
        for (const exp of data.experience) {
            // Header row: POSITION | COMPANY | WS | LINK    Date
            const expHeader = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 75, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: `${exp.position.toUpperCase()} | ${exp.company.toUpperCase()} | `, bold: true, size: 20, font: FONT }),
                                            new TextRun({ text: "LINK", bold: true, color: LINK_COLOR, size: 20, font: FONT }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 25, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({ text: `${exp.startDate || ""}- ${exp.endDate || ""}`, bold: true, size: 18, font: FONT }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });
            children.push(expHeader);

            // Bullet points with small circles
            for (const highlight of exp.highlights || []) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "○  " + highlight, size: 18, font: FONT }),
                        ],
                        indent: { left: convertInchesToTwip(0.2) },
                        spacing: { after: 20 },
                    })
                );
            }
            children.push(new Paragraph({ spacing: { after: 80 } }));
        }
    }

    // === PROJECTS ===
    if (data.projects && data.projects.length > 0) {
        addSectionHeader("PROJECTS");
        for (const proj of data.projects) {
            const projHeader = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 75, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: `${proj.name} | `, bold: true, size: 20, font: FONT }),
                                            new TextRun({ text: "LINK", bold: true, color: LINK_COLOR, size: 20, font: FONT }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 25, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                text: proj.startDate || proj.endDate ? `${proj.startDate || ""}- ${proj.endDate || ""}` : "",
                                                bold: true,
                                                size: 18,
                                                font: FONT,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });
            children.push(projHeader);

            for (const highlight of proj.highlights || []) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "○  " + highlight, size: 18, font: FONT }),
                        ],
                        indent: { left: convertInchesToTwip(0.2) },
                        spacing: { after: 20 },
                    })
                );
            }
            children.push(new Paragraph({ spacing: { after: 80 } }));
        }
    }

    // === CERTIFICATES ===
    if (data.certifications && data.certifications.length > 0) {
        addSectionHeader("CERTIFICATES");
        for (const cert of data.certifications) {
            const namePart = cert.issuer ? `${cert.name} (${cert.issuer})` : cert.name;
            const certHeader = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 75, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: `${namePart} | `, bold: true, size: 20, font: FONT }),
                                            new TextRun({ text: "CERTIFICATE", bold: true, color: LINK_COLOR, size: 20, font: FONT }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 25, type: WidthType.PERCENTAGE },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({ text: cert.date || "", bold: true, size: 18, font: FONT }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });
            children.push(certHeader);
            children.push(new Paragraph({ spacing: { after: 40 } }));
        }
    }

    const doc = new Document({
        sections: [
            {
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
            },
        ],
    });

    return await Packer.toBlob(doc);
}
