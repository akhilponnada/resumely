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
    convertInchesToTwip,
} from "docx";
import { ResumeData } from "./types";

// =============================================================================
// DOCX RESUME GENERATOR - Hardcoded template matching reference exactly
// =============================================================================

// Colors matching the reference template exactly
const LINK_COLOR = "2563EB";
const SECTION_LINE_COLOR = "808080";
const TEXT_COLOR = "000000";

// Font configuration - Calibri matches the reference template
// DOCX uses half-points: multiply pt by 2 (e.g., 11pt = 22)
// Standard resume fonts: Name 18-22pt, Headers 14-16pt, Body 10-12pt
const FONT = "Calibri";
const FONT_SIZE_NAME = 40;      // 20pt for name
const FONT_SIZE_SECTION = 28;   // 14pt for section headers
const FONT_SIZE_NORMAL = 22;    // 11pt for body text
const FONT_SIZE_SMALL = 20;     // 10pt for small text

// Border helpers
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

export async function generateDOCX(data: ResumeData): Promise<Blob> {
    const children: (Paragraph | Table)[] = [];

    // === HEADER ===
    const nameParts = (data.fullName || "").split(" ");
    const lastName = nameParts[nameParts.length - 1] || "Name";
    const githubUsername = data.github
        ? data.github.replace(/^https?:\/\//, "").replace("github.com/", "").split("/")[0]
        : "";

    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
            insideHorizontal: noBorder, insideVertical: noBorder,
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        borders: noBorders,
                        children: [
                            new Paragraph({
                                spacing: { after: 40 },
                                children: [
                                    new TextRun({
                                        text: (data.fullName || "FULL NAME").toUpperCase(),
                                        bold: true,
                                        size: FONT_SIZE_NAME,
                                        font: FONT,
                                        color: TEXT_COLOR,
                                    }),
                                ],
                            }),
                            ...(data.linkedin ? [
                                new Paragraph({
                                    spacing: { after: 20 },
                                    children: [
                                        new ExternalHyperlink({
                                            link: data.linkedin.startsWith("http") ? data.linkedin : `https://${data.linkedin}`,
                                            children: [
                                                new TextRun({
                                                    text: `${lastName} | LinkedIn`,
                                                    color: LINK_COLOR,
                                                    underline: {},
                                                    size: FONT_SIZE_NORMAL,
                                                    font: FONT,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ] : []),
                            ...(data.github ? [
                                new Paragraph({
                                    children: [
                                        new ExternalHyperlink({
                                            link: data.github.startsWith("http") ? data.github : `https://${data.github}`,
                                            children: [
                                                new TextRun({
                                                    text: `${githubUsername} (github.com)`,
                                                    color: LINK_COLOR,
                                                    underline: {},
                                                    size: FONT_SIZE_NORMAL,
                                                    font: FONT,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ] : []),
                        ],
                    }),
                    new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        borders: noBorders,
                        children: [
                            ...(data.email ? [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { after: 40 },
                                    children: [
                                        new TextRun({ text: "Email: ", size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR }),
                                        new ExternalHyperlink({
                                            link: `mailto:${data.email}`,
                                            children: [
                                                new TextRun({
                                                    text: data.email,
                                                    color: LINK_COLOR,
                                                    underline: {},
                                                    size: FONT_SIZE_NORMAL,
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
                                        new TextRun({ text: `Mobile: ${data.phone}`, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR }),
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

    // Section header helper
    const addSectionHeader = (title: string) => {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: title, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR })],
                alignment: AlignmentType.CENTER,
                border: { bottom: { color: SECTION_LINE_COLOR, space: 1, size: 6, style: BorderStyle.SINGLE } },
                spacing: { before: 180, after: 80 },
            })
        );
    };

    // === EDUCATION ===
    if (data.education && data.education.length > 0) {
        addSectionHeader("EDUCATION");
        for (const edu of data.education) {
            children.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 65, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ children: [new TextRun({ text: edu.institution, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR })] })],
                                }),
                                new TableCell({
                                    width: { size: 35, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: edu.location || "", bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 65, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ children: [new TextRun({ text: edu.gpa ? `${edu.degree}; GPA: ${edu.gpa}` : edu.degree, italics: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                                }),
                                new TableCell({
                                    width: { size: 35, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${edu.startDate || ""} - ${edu.endDate || ""}`, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ spacing: { after: 40 } })
            );
        }
    }

    // === SKILLS SUMMARY ===
    if (data.skills) {
        const skillItems: { label: string; items: string[] }[] = [];
        if (data.skills.languages?.length) skillItems.push({ label: "Languages", items: data.skills.languages });
        if (data.skills.frameworks?.length) skillItems.push({ label: "Frameworks", items: data.skills.frameworks });
        if (data.skills.tools?.length) skillItems.push({ label: "Tools", items: data.skills.tools });
        if (data.skills.platforms?.length) skillItems.push({ label: "Platforms", items: data.skills.platforms });
        if (data.skills.soft?.length) skillItems.push({ label: "Soft Skills", items: data.skills.soft });

        if (skillItems.length > 0) {
            addSectionHeader("SKILLS SUMMARY");
            for (const { label, items } of skillItems) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "●  ", size: FONT_SIZE_SMALL, font: FONT, color: TEXT_COLOR }),
                            new TextRun({ text: `${label}: `, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR }),
                            new TextRun({ text: items.join(", "), size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR }),
                        ],
                        indent: { left: convertInchesToTwip(0.15) },
                        spacing: { after: 40 },
                    })
                );
            }
        }
    }

    // === WORK EXPERIENCE ===
    if (data.experience && data.experience.length > 0) {
        addSectionHeader("WORK EXPERIENCE");
        for (const exp of data.experience) {
            const expHeaderChildren: (TextRun | ExternalHyperlink)[] = [
                new TextRun({ text: `${exp.position.toUpperCase()} | ${exp.company.toUpperCase()}`, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR }),
            ];
            // Only add link if one exists
            if (exp.link && exp.link.trim()) {
                expHeaderChildren.push(new TextRun({ text: " | ", bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR }));
                expHeaderChildren.push(
                    new ExternalHyperlink({
                        link: exp.link.startsWith("http") ? exp.link : `https://${exp.link}`,
                        children: [new TextRun({ text: "LINK", bold: true, color: LINK_COLOR, size: FONT_SIZE_SECTION, font: FONT })],
                    }) as unknown as TextRun
                );
            }

            children.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 70, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ children: expHeaderChildren })],
                                }),
                                new TableCell({
                                    width: { size: 30, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${exp.startDate || ""} - ${exp.endDate || ""}`, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                                }),
                            ],
                        }),
                    ],
                })
            );

            for (const highlight of exp.highlights || []) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: `○  ${highlight}`, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })],
                        indent: { left: convertInchesToTwip(0.2) },
                        spacing: { after: 30 },
                    })
                );
            }
            children.push(new Paragraph({ spacing: { after: 60 } }));
        }
    }

    // === PROJECTS ===
    if (data.projects && data.projects.length > 0) {
        addSectionHeader("PROJECTS");
        for (const proj of data.projects) {
            const projHeaderChildren: (TextRun | ExternalHyperlink)[] = [
                new TextRun({ text: proj.name, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR }),
            ];
            // Only add link if one exists
            if (proj.link && proj.link.trim()) {
                projHeaderChildren.push(new TextRun({ text: " | ", bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR }));
                projHeaderChildren.push(
                    new ExternalHyperlink({
                        link: proj.link.startsWith("http") ? proj.link : `https://${proj.link}`,
                        children: [new TextRun({ text: "LINK", bold: true, color: LINK_COLOR, size: FONT_SIZE_SECTION, font: FONT })],
                    }) as unknown as TextRun
                );
            }

            children.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 70, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ children: projHeaderChildren })],
                                }),
                                new TableCell({
                                    width: { size: 30, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: proj.startDate || proj.endDate ? `${proj.startDate || ""} - ${proj.endDate || ""}` : "", bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                                }),
                            ],
                        }),
                    ],
                })
            );

            for (const highlight of proj.highlights || []) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: `○  ${highlight}`, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })],
                        indent: { left: convertInchesToTwip(0.2) },
                        spacing: { after: 30 },
                    })
                );
            }
            children.push(new Paragraph({ spacing: { after: 60 } }));
        }
    }

    // === CERTIFICATES ===
    if (data.certifications && data.certifications.length > 0) {
        addSectionHeader("CERTIFICATES");
        for (const cert of data.certifications) {
            const namePart = cert.issuer ? `${cert.name} (${cert.issuer})` : cert.name;
            const certHeaderChildren: (TextRun | ExternalHyperlink)[] = [
                new TextRun({ text: namePart, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR }),
            ];
            // Only add certificate link if one exists
            if (cert.link && cert.link.trim()) {
                certHeaderChildren.push(new TextRun({ text: " | ", bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR }));
                certHeaderChildren.push(
                    new ExternalHyperlink({
                        link: cert.link.startsWith("http") ? cert.link : `https://${cert.link}`,
                        children: [new TextRun({ text: "VIEW", bold: true, color: LINK_COLOR, size: FONT_SIZE_SECTION, font: FONT })],
                    }) as unknown as TextRun
                );
            }

            children.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 70, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ children: certHeaderChildren })],
                                }),
                                new TableCell({
                                    width: { size: 30, type: WidthType.PERCENTAGE },
                                    borders: noBorders,
                                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: cert.date || "", bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                                }),
                            ],
                        }),
                    ],
                })
            );

            const certWithHighlights = cert as { highlights?: string[] };
            if (certWithHighlights.highlights && certWithHighlights.highlights.length > 0) {
                for (const highlight of certWithHighlights.highlights) {
                    children.push(
                        new Paragraph({
                            children: [new TextRun({ text: `○  ${highlight}`, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })],
                            indent: { left: convertInchesToTwip(0.2) },
                            spacing: { after: 30 },
                        })
                    );
                }
            }
            children.push(new Paragraph({ spacing: { after: 40 } }));
        }
    }

    // Create document
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

    return await Packer.toBlob(doc);
}
