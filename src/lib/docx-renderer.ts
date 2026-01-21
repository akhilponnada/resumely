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
import { DocxStructure, DocxSection } from "./claude-docx-generator";

// Colors matching the reference template
const LINK_COLOR = "2563EB";
const SECTION_LINE_COLOR = "808080";
const TEXT_COLOR = "000000";

// Font configuration
const FONT = "Calibri";
const FONT_SIZE_NAME = 28;
const FONT_SIZE_SECTION = 20;
const FONT_SIZE_NORMAL = 18;
const FONT_SIZE_SMALL = 16;

// Border helpers
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

/**
 * Render Claude's DOCX structure into an actual Word document
 */
export async function renderDocxFromStructure(structure: DocxStructure): Promise<Blob> {
    const children: (Paragraph | Table)[] = [];

    for (const section of structure.sections) {
        switch (section.type) {
            case "header":
                children.push(...renderHeader(section));
                break;
            case "education":
                children.push(...renderEducation(section));
                break;
            case "skills":
                children.push(...renderSkills(section));
                break;
            case "experience":
                children.push(...renderExperience(section));
                break;
            case "projects":
                children.push(...renderProjects(section));
                break;
            case "certificates":
                children.push(...renderCertificates(section));
                break;
        }
    }

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

function renderHeader(section: Extract<DocxSection, { type: "header" }>): (Paragraph | Table)[] {
    const leftChildren: Paragraph[] = [
        new Paragraph({
            spacing: { after: 40 },
            children: [
                new TextRun({
                    text: section.fullName,
                    bold: true,
                    size: FONT_SIZE_NAME,
                    font: FONT,
                    color: TEXT_COLOR,
                }),
            ],
        }),
    ];

    if (section.linkedin) {
        leftChildren.push(
            new Paragraph({
                spacing: { after: 20 },
                children: [
                    new ExternalHyperlink({
                        link: section.linkedin.url,
                        children: [
                            new TextRun({
                                text: section.linkedin.text,
                                color: LINK_COLOR,
                                underline: {},
                                size: FONT_SIZE_NORMAL,
                                font: FONT,
                            }),
                        ],
                    }),
                ],
            })
        );
    }

    if (section.github) {
        leftChildren.push(
            new Paragraph({
                children: [
                    new ExternalHyperlink({
                        link: section.github.url,
                        children: [
                            new TextRun({
                                text: section.github.text,
                                color: LINK_COLOR,
                                underline: {},
                                size: FONT_SIZE_NORMAL,
                                font: FONT,
                            }),
                        ],
                    }),
                ],
            })
        );
    }

    const rightChildren: Paragraph[] = [];

    if (section.email) {
        rightChildren.push(
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 40 },
                children: [
                    new TextRun({ text: "Email: ", size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR }),
                    new ExternalHyperlink({
                        link: section.email.url,
                        children: [
                            new TextRun({
                                text: section.email.text,
                                color: LINK_COLOR,
                                underline: {},
                                size: FONT_SIZE_NORMAL,
                                font: FONT,
                            }),
                        ],
                    }),
                ],
            })
        );
    }

    if (section.phone) {
        rightChildren.push(
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                    new TextRun({ text: `Mobile: ${section.phone}`, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR }),
                ],
            })
        );
    }

    return [
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: noBorders, children: leftChildren }),
                        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: noBorders, children: rightChildren }),
                    ],
                }),
            ],
        }),
    ];
}

function createSectionHeader(title: string): Paragraph {
    return new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR })],
        alignment: AlignmentType.CENTER,
        border: { bottom: { color: SECTION_LINE_COLOR, space: 1, size: 6, style: BorderStyle.SINGLE } },
        spacing: { before: 180, after: 80 },
    });
}

function renderEducation(section: Extract<DocxSection, { type: "education" }>): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [createSectionHeader("EDUCATION")];

    for (const item of section.items) {
        elements.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 65, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ children: [new TextRun({ text: item.institution, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR })] })],
                            }),
                            new TableCell({
                                width: { size: 35, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.location, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 65, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ children: [new TextRun({ text: item.degree, italics: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                            }),
                            new TableCell({
                                width: { size: 35, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.dates, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                            }),
                        ],
                    }),
                ],
            }),
            new Paragraph({ spacing: { after: 40 } })
        );
    }

    return elements;
}

function renderSkills(section: Extract<DocxSection, { type: "skills" }>): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [createSectionHeader("SKILLS SUMMARY")];

    for (const category of section.categories) {
        if (category.items.length > 0) {
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: "●  ", size: FONT_SIZE_SMALL, font: FONT, color: TEXT_COLOR }),
                        new TextRun({ text: `${category.label}: `, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR }),
                        new TextRun({ text: category.items.join(", "), size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR }),
                    ],
                    indent: { left: convertInchesToTwip(0.15) },
                    spacing: { after: 40 },
                })
            );
        }
    }

    return elements;
}

function renderExperience(section: Extract<DocxSection, { type: "experience" }>): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [createSectionHeader("WORK EXPERIENCE")];

    for (const item of section.items) {
        const headerChildren = [
            new TextRun({ text: `${item.position} | ${item.company} | `, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR }),
        ];

        if (item.link) {
            headerChildren.push(
                new ExternalHyperlink({
                    link: item.link,
                    children: [new TextRun({ text: "LINK", bold: true, color: LINK_COLOR, size: FONT_SIZE_SECTION, font: FONT })],
                }) as unknown as TextRun
            );
        } else {
            headerChildren.push(new TextRun({ text: "LINK", bold: true, color: LINK_COLOR, size: FONT_SIZE_SECTION, font: FONT }));
        }

        elements.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ children: headerChildren })],
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.dates, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                            }),
                        ],
                    }),
                ],
            })
        );

        for (const highlight of item.highlights) {
            elements.push(
                new Paragraph({
                    children: [new TextRun({ text: `○  ${highlight}`, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })],
                    indent: { left: convertInchesToTwip(0.2) },
                    spacing: { after: 30 },
                })
            );
        }

        elements.push(new Paragraph({ spacing: { after: 60 } }));
    }

    return elements;
}

function renderProjects(section: Extract<DocxSection, { type: "projects" }>): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [createSectionHeader("PROJECTS")];

    for (const item of section.items) {
        const headerChildren = [
            new TextRun({ text: `${item.name} | `, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR }),
        ];

        if (item.link) {
            headerChildren.push(
                new ExternalHyperlink({
                    link: item.link,
                    children: [new TextRun({ text: "LINK", bold: true, color: LINK_COLOR, size: FONT_SIZE_SECTION, font: FONT })],
                }) as unknown as TextRun
            );
        } else {
            headerChildren.push(new TextRun({ text: "LINK", bold: true, color: LINK_COLOR, size: FONT_SIZE_SECTION, font: FONT }));
        }

        elements.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ children: headerChildren })],
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.dates, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                            }),
                        ],
                    }),
                ],
            })
        );

        for (const highlight of item.highlights) {
            elements.push(
                new Paragraph({
                    children: [new TextRun({ text: `○  ${highlight}`, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })],
                    indent: { left: convertInchesToTwip(0.2) },
                    spacing: { after: 30 },
                })
            );
        }

        elements.push(new Paragraph({ spacing: { after: 60 } }));
    }

    return elements;
}

function renderCertificates(section: Extract<DocxSection, { type: "certificates" }>): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [createSectionHeader("CERTIFICATES")];

    for (const item of section.items) {
        const namePart = item.issuer ? `${item.name} (${item.issuer})` : item.name;
        const headerChildren = [
            new TextRun({ text: `${namePart} | `, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: TEXT_COLOR }),
        ];

        if (item.link) {
            headerChildren.push(
                new ExternalHyperlink({
                    link: item.link,
                    children: [new TextRun({ text: "CERTIFICATE", bold: true, color: LINK_COLOR, size: FONT_SIZE_SECTION, font: FONT })],
                }) as unknown as TextRun
            );
        } else {
            headerChildren.push(new TextRun({ text: "CERTIFICATE", bold: true, color: LINK_COLOR, size: FONT_SIZE_SECTION, font: FONT }));
        }

        elements.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 70, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ children: headerChildren })],
                            }),
                            new TableCell({
                                width: { size: 30, type: WidthType.PERCENTAGE },
                                borders: noBorders,
                                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.date, bold: true, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })] })],
                            }),
                        ],
                    }),
                ],
            })
        );

        if (item.highlights && item.highlights.length > 0) {
            for (const highlight of item.highlights) {
                elements.push(
                    new Paragraph({
                        children: [new TextRun({ text: `○  ${highlight}`, size: FONT_SIZE_NORMAL, font: FONT, color: TEXT_COLOR })],
                        indent: { left: convertInchesToTwip(0.2) },
                        spacing: { after: 30 },
                    })
                );
            }
        }

        elements.push(new Paragraph({ spacing: { after: 40 } }));
    }

    return elements;
}
