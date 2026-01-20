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
// DOCX RESUME GENERATOR
// Based on Anthropic's Claude Skills docx pattern
// Reference: https://github.com/anthropics/skills/tree/main/skills/docx
// =============================================================================

// Colors matching the reference template exactly
const LINK_COLOR = "2563EB"; // Blue for links (matching reference)
const SECTION_LINE_COLOR = "808080"; // Gray for section underlines
const TEXT_COLOR = "000000"; // Black for regular text

// Font configuration - Calibri matches the reference template
const FONT = "Calibri";
const FONT_SIZE_NAME = 28; // 14pt for name
const FONT_SIZE_SECTION = 20; // 10pt for section headers
const FONT_SIZE_NORMAL = 18; // 9pt for body text
const FONT_SIZE_SMALL = 16; // 8pt for smaller text

export async function generateDOCX(data: ResumeData): Promise<Blob> {
    const children: (Paragraph | Table)[] = [];

    // === HEADER ===
    // Create a table for header matching the reference template exactly:
    // Left: FULL NAME (bold, uppercase), LinkedIn link, GitHub link
    // Right: Email and Mobile
    const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

    // Extract last name for LinkedIn display (e.g., "Chowdhury | LinkedIn")
    const nameParts = (data.fullName || "").split(" ");
    const lastName = nameParts[nameParts.length - 1] || "Name";

    // Extract GitHub username
    const githubUsername = data.github
        ? data.github.replace(/^https?:\/\//, "").replace("github.com/", "").split("/")[0]
        : "";

    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: noBorder,
            bottom: noBorder,
            left: noBorder,
            right: noBorder,
            insideHorizontal: noBorder,
            insideVertical: noBorder,
        },
        rows: [
            new TableRow({
                children: [
                    // Left cell: Name + Links
                    new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        borders: noBorders,
                        children: [
                            // Name - Bold, uppercase, left aligned
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
                            // LinkedIn link (format: "LastName | LinkedIn")
                            ...(data.linkedin ? [
                                new Paragraph({
                                    spacing: { after: 20 },
                                    children: [
                                        new ExternalHyperlink({
                                            link: data.linkedin.startsWith("http")
                                                ? data.linkedin
                                                : `https://${data.linkedin}`,
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
                            // GitHub link (format: "username (github.com)")
                            ...(data.github ? [
                                new Paragraph({
                                    children: [
                                        new ExternalHyperlink({
                                            link: data.github.startsWith("http")
                                                ? data.github
                                                : `https://${data.github}`,
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
                    // Right cell: Contact info
                    new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        borders: noBorders,
                        children: [
                            // Email with mailto link
                            ...(data.email ? [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { after: 40 },
                                    children: [
                                        new TextRun({
                                            text: "Email: ",
                                            size: FONT_SIZE_NORMAL,
                                            font: FONT,
                                            color: TEXT_COLOR,
                                        }),
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
                            // Mobile number
                            ...(data.phone ? [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    children: [
                                        new TextRun({
                                            text: `Mobile: ${data.phone}`,
                                            size: FONT_SIZE_NORMAL,
                                            font: FONT,
                                            color: TEXT_COLOR,
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

    // Helper for centered section headers with gray underline (matching reference exactly)
    const addSectionHeader = (title: string) => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: title,
                        bold: true,
                        size: FONT_SIZE_SECTION,
                        font: FONT,
                        color: TEXT_COLOR,
                    }),
                ],
                alignment: AlignmentType.CENTER,
                border: {
                    bottom: {
                        color: SECTION_LINE_COLOR,
                        space: 1,
                        size: 6,
                        style: BorderStyle.SINGLE,
                    },
                },
                spacing: { before: 180, after: 80 },
            })
        );
    };

    // === EDUCATION ===
    // Format matching reference: Institution (bold) | Location (bold right)
    //                           Degree; GPA: X.XX (italic) | Dates (bold right)
    if (data.education && data.education.length > 0) {
        addSectionHeader("EDUCATION");
        for (const edu of data.education) {
            const eduTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: noBorder,
                    bottom: noBorder,
                    left: noBorder,
                    right: noBorder,
                    insideHorizontal: noBorder,
                    insideVertical: noBorder,
                },
                rows: [
                    // Row 1: Institution | Location
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 65, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: edu.institution,
                                                bold: true,
                                                size: FONT_SIZE_SECTION,
                                                font: FONT,
                                                color: TEXT_COLOR,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 35, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                text: edu.location || "",
                                                bold: true,
                                                size: FONT_SIZE_NORMAL,
                                                font: FONT,
                                                color: TEXT_COLOR,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                    // Row 2: Degree with GPA | Dates
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 65, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: edu.gpa ? `${edu.degree}; GPA: ${edu.gpa}` : edu.degree,
                                                italics: true,
                                                size: FONT_SIZE_NORMAL,
                                                font: FONT,
                                                color: TEXT_COLOR,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 35, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                text: `${edu.startDate || ""} - ${edu.endDate || ""}`,
                                                bold: true,
                                                size: FONT_SIZE_NORMAL,
                                                font: FONT,
                                                color: TEXT_COLOR,
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
            children.push(new Paragraph({ spacing: { after: 40 } }));
        }
    }

    // === SKILLS SUMMARY ===
    // Format matching reference: ● Category: skill1, skill2, skill3
    if (data.skills) {
        const skillItems: { label: string; items: string[] }[] = [];
        if (data.skills.languages?.length) skillItems.push({ label: "Languages", items: data.skills.languages });
        if (data.skills.frameworks?.length) skillItems.push({ label: "Frameworks", items: data.skills.frameworks });
        if (data.skills.tools?.length) skillItems.push({ label: "Tools", items: data.skills.tools });
        if (data.skills.platforms?.length) skillItems.push({ label: "Platforms", items: data.skills.platforms });
        else if (data.skills.libraries?.length) skillItems.push({ label: "Platforms", items: data.skills.libraries });
        if (data.skills.soft?.length) skillItems.push({ label: "Soft Skills", items: data.skills.soft });

        if (skillItems.length > 0) {
            addSectionHeader("SKILLS SUMMARY");
            for (const { label, items } of skillItems) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "●  ",
                                size: FONT_SIZE_SMALL,
                                font: FONT,
                                color: TEXT_COLOR,
                            }),
                            new TextRun({
                                text: `${label}: `,
                                bold: true,
                                size: FONT_SIZE_NORMAL,
                                font: FONT,
                                color: TEXT_COLOR,
                            }),
                            new TextRun({
                                text: items.join(", "),
                                size: FONT_SIZE_NORMAL,
                                font: FONT,
                                color: TEXT_COLOR,
                            }),
                        ],
                        indent: { left: convertInchesToTwip(0.15) },
                        spacing: { after: 40 },
                    })
                );
            }
        }
    }

    // === WORK EXPERIENCE ===
    // Format matching reference: POSITION | COMPANY | WS | LINK (uppercase, bold) | Dates (bold right)
    //                           ○ Bullet points for achievements
    if (data.experience && data.experience.length > 0) {
        addSectionHeader("WORK EXPERIENCE");
        for (const exp of data.experience) {
            // Build the header text parts
            const headerParts: TextRun[] = [
                new TextRun({
                    text: `${exp.position.toUpperCase()} | ${exp.company.toUpperCase()} | `,
                    bold: true,
                    size: FONT_SIZE_SECTION,
                    font: FONT,
                    color: TEXT_COLOR,
                }),
            ];

            // Add LINK as clickable hyperlink if available
            if (exp.link) {
                headerParts.push(
                    new TextRun({
                        text: "LINK",
                        bold: true,
                        color: LINK_COLOR,
                        size: FONT_SIZE_SECTION,
                        font: FONT,
                    })
                );
            } else {
                headerParts.push(
                    new TextRun({
                        text: "LINK",
                        bold: true,
                        color: LINK_COLOR,
                        size: FONT_SIZE_SECTION,
                        font: FONT,
                    })
                );
            }

            const expHeader = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: noBorder,
                    bottom: noBorder,
                    left: noBorder,
                    right: noBorder,
                    insideHorizontal: noBorder,
                    insideVertical: noBorder,
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        children: exp.link
                                            ? [
                                                  new TextRun({
                                                      text: `${exp.position.toUpperCase()} | ${exp.company.toUpperCase()} | `,
                                                      bold: true,
                                                      size: FONT_SIZE_SECTION,
                                                      font: FONT,
                                                      color: TEXT_COLOR,
                                                  }),
                                                  new ExternalHyperlink({
                                                      link: exp.link.startsWith("http") ? exp.link : `https://${exp.link}`,
                                                      children: [
                                                          new TextRun({
                                                              text: "LINK",
                                                              bold: true,
                                                              color: LINK_COLOR,
                                                              size: FONT_SIZE_SECTION,
                                                              font: FONT,
                                                          }),
                                                      ],
                                                  }),
                                              ]
                                            : [
                                                  new TextRun({
                                                      text: `${exp.position.toUpperCase()} | ${exp.company.toUpperCase()} | `,
                                                      bold: true,
                                                      size: FONT_SIZE_SECTION,
                                                      font: FONT,
                                                      color: TEXT_COLOR,
                                                  }),
                                                  new TextRun({
                                                      text: "LINK",
                                                      bold: true,
                                                      color: LINK_COLOR,
                                                      size: FONT_SIZE_SECTION,
                                                      font: FONT,
                                                  }),
                                              ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                text: `${exp.startDate || ""}- ${exp.endDate || ""}`,
                                                bold: true,
                                                size: FONT_SIZE_NORMAL,
                                                font: FONT,
                                                color: TEXT_COLOR,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });
            children.push(expHeader);

            // Bullet points with open circles (○)
            for (const highlight of exp.highlights || []) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "○  " + highlight,
                                size: FONT_SIZE_NORMAL,
                                font: FONT,
                                color: TEXT_COLOR,
                            }),
                        ],
                        indent: { left: convertInchesToTwip(0.2) },
                        spacing: { after: 30 },
                    })
                );
            }
            children.push(new Paragraph({ spacing: { after: 60 } }));
        }
    }

    // === PROJECTS ===
    // Format matching reference: Project Name | LINK (bold) | Dates (bold right)
    //                           ○ Bullet points for achievements
    if (data.projects && data.projects.length > 0) {
        addSectionHeader("PROJECTS");
        for (const proj of data.projects) {
            const projHeader = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: noBorder,
                    bottom: noBorder,
                    left: noBorder,
                    right: noBorder,
                    insideHorizontal: noBorder,
                    insideVertical: noBorder,
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        children: proj.link
                                            ? [
                                                  new TextRun({
                                                      text: `${proj.name} | `,
                                                      bold: true,
                                                      size: FONT_SIZE_SECTION,
                                                      font: FONT,
                                                      color: TEXT_COLOR,
                                                  }),
                                                  new ExternalHyperlink({
                                                      link: proj.link.startsWith("http") ? proj.link : `https://${proj.link}`,
                                                      children: [
                                                          new TextRun({
                                                              text: "LINK",
                                                              bold: true,
                                                              color: LINK_COLOR,
                                                              size: FONT_SIZE_SECTION,
                                                              font: FONT,
                                                          }),
                                                      ],
                                                  }),
                                              ]
                                            : [
                                                  new TextRun({
                                                      text: `${proj.name} | `,
                                                      bold: true,
                                                      size: FONT_SIZE_SECTION,
                                                      font: FONT,
                                                      color: TEXT_COLOR,
                                                  }),
                                                  new TextRun({
                                                      text: "LINK",
                                                      bold: true,
                                                      color: LINK_COLOR,
                                                      size: FONT_SIZE_SECTION,
                                                      font: FONT,
                                                  }),
                                              ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                text: proj.startDate || proj.endDate ? `${proj.startDate || ""}- ${proj.endDate || ""}` : "",
                                                bold: true,
                                                size: FONT_SIZE_NORMAL,
                                                font: FONT,
                                                color: TEXT_COLOR,
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

            // Bullet points with open circles (○)
            for (const highlight of proj.highlights || []) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "○  " + highlight,
                                size: FONT_SIZE_NORMAL,
                                font: FONT,
                                color: TEXT_COLOR,
                            }),
                        ],
                        indent: { left: convertInchesToTwip(0.2) },
                        spacing: { after: 30 },
                    })
                );
            }
            children.push(new Paragraph({ spacing: { after: 60 } }));
        }
    }

    // === CERTIFICATES ===
    // Format matching reference: Certificate Name (Issuer) | CERTIFICATE (bold) | Date (bold right)
    //                           ○ Bullet points for highlights (if any)
    if (data.certifications && data.certifications.length > 0) {
        addSectionHeader("CERTIFICATES");
        for (const cert of data.certifications) {
            const namePart = cert.issuer ? `${cert.name} (${cert.issuer})` : cert.name;
            const certHeader = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: noBorder,
                    bottom: noBorder,
                    left: noBorder,
                    right: noBorder,
                    insideHorizontal: noBorder,
                    insideVertical: noBorder,
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        children: cert.link
                                            ? [
                                                  new TextRun({
                                                      text: `${namePart} | `,
                                                      bold: true,
                                                      size: FONT_SIZE_SECTION,
                                                      font: FONT,
                                                      color: TEXT_COLOR,
                                                  }),
                                                  new ExternalHyperlink({
                                                      link: cert.link.startsWith("http") ? cert.link : `https://${cert.link}`,
                                                      children: [
                                                          new TextRun({
                                                              text: "CERTIFICATE",
                                                              bold: true,
                                                              color: LINK_COLOR,
                                                              size: FONT_SIZE_SECTION,
                                                              font: FONT,
                                                          }),
                                                      ],
                                                  }),
                                              ]
                                            : [
                                                  new TextRun({
                                                      text: `${namePart} | `,
                                                      bold: true,
                                                      size: FONT_SIZE_SECTION,
                                                      font: FONT,
                                                      color: TEXT_COLOR,
                                                  }),
                                                  new TextRun({
                                                      text: "CERTIFICATE",
                                                      bold: true,
                                                      color: LINK_COLOR,
                                                      size: FONT_SIZE_SECTION,
                                                      font: FONT,
                                                  }),
                                              ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                text: cert.date || "",
                                                bold: true,
                                                size: FONT_SIZE_NORMAL,
                                                font: FONT,
                                                color: TEXT_COLOR,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });
            children.push(certHeader);

            // Add bullet points for certificate highlights if available
            const certWithHighlights = cert as { highlights?: string[] };
            if (certWithHighlights.highlights && certWithHighlights.highlights.length > 0) {
                for (const highlight of certWithHighlights.highlights) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "○  " + highlight,
                                    size: FONT_SIZE_NORMAL,
                                    font: FONT,
                                    color: TEXT_COLOR,
                                }),
                            ],
                            indent: { left: convertInchesToTwip(0.2) },
                            spacing: { after: 30 },
                        })
                    );
                }
            }
            children.push(new Paragraph({ spacing: { after: 40 } }));
        }
    }

    // Create the document with professional margins matching the reference template
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
