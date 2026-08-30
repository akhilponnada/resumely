import {
    AlignmentType,
    BorderStyle,
    Document,
    ExternalHyperlink,
    Packer,
    Paragraph,
    TextRun,
} from "docx";
import { skillRows } from "./resume-model";
import { ResumeData } from "./types";

const FONT = "Times New Roman";
const NAME = 44;
const SECTION = 22;
const BODY = 20;
const SMALL = 18;

const sectionBorder = {
    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 },
};

function run(
    text: string,
    opts: { bold?: boolean; italics?: boolean; size?: number } = {},
) {
    return new TextRun({
        text,
        font: FONT,
        size: opts.size ?? BODY,
        bold: opts.bold,
        italics: opts.italics,
    });
}

function heading(text: string) {
    return new Paragraph({
        spacing: { before: 200, after: 60 },
        border: sectionBorder,
        children: [run(text.toUpperCase(), { bold: true, size: SECTION })],
    });
}

function linkRun(label: string, url: string) {
    const href = url.startsWith("http") ? url : `https://${url}`;
    return new ExternalHyperlink({
        link: href,
        children: [run(label)],
    });
}

export async function generateDOCX(data: ResumeData): Promise<Blob> {
    const children: Paragraph[] = [];

    children.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [run((data.fullName || "YOUR NAME").toUpperCase(), { bold: true, size: NAME })],
        }),
    );

    const contactChildren: (TextRun | ExternalHyperlink)[] = [];
    const pushSep = () => {
        if (contactChildren.length) contactChildren.push(run(" | "));
    };
    if (data.phone) {
        pushSep();
        contactChildren.push(run(data.phone, { size: SMALL }));
    }
    if (data.email) {
        pushSep();
        contactChildren.push(
            new ExternalHyperlink({
                link: `mailto:${data.email}`,
                children: [run(data.email, { size: SMALL })],
            }),
        );
    }
    if (data.linkedin) {
        pushSep();
        contactChildren.push(linkRun(data.linkedin.replace(/^https?:\/\//, ""), data.linkedin));
    }
    if (data.github) {
        pushSep();
        contactChildren.push(linkRun(data.github.replace(/^https?:\/\//, ""), data.github));
    }
    if (data.website) {
        pushSep();
        contactChildren.push(linkRun(data.website.replace(/^https?:\/\//, ""), data.website));
    }
    if (contactChildren.length) {
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 160 },
                children: contactChildren,
            }),
        );
    }

    if (data.summary) {
        children.push(heading("Summary"));
        children.push(new Paragraph({ spacing: { after: 80 }, children: [run(data.summary, { size: SMALL })] }));
    }

    if (data.experience?.length) {
        children.push(heading("Experience"));
        for (const exp of data.experience) {
            children.push(
                new Paragraph({
                    spacing: { before: 80 },
                    children: [
                        run(exp.position, { bold: true }),
                        run(
                            `  ${[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}`,
                            { italics: true, size: SMALL },
                        ),
                    ],
                }),
            );
            children.push(
                new Paragraph({
                    spacing: { after: 40 },
                    children: [
                        run(
                            [exp.company, exp.location].filter(Boolean).join(", "),
                            { italics: true, size: SMALL },
                        ),
                    ],
                }),
            );
            for (const highlight of (exp.highlights ?? []).filter((h) => h.trim())) {
                children.push(
                    new Paragraph({
                        indent: { left: 200 },
                        spacing: { after: 40 },
                        children: [run(`• ${highlight}`, { size: SMALL })],
                    }),
                );
            }
        }
    }

    if (data.projects?.length) {
        children.push(heading("Projects"));
        for (const project of data.projects) {
            const title = project.technologies
                ? `${project.name} | ${project.technologies}`
                : project.name;
            children.push(
                new Paragraph({
                    spacing: { before: 80 },
                    children: [
                        run(title, { bold: true }),
                        run(
                            `  ${[project.startDate, project.endDate].filter(Boolean).join(" – ")}`,
                            { italics: true, size: SMALL },
                        ),
                    ],
                }),
            );
            for (const highlight of (project.highlights ?? []).filter((h) => h.trim())) {
                children.push(
                    new Paragraph({
                        indent: { left: 200 },
                        spacing: { after: 40 },
                        children: [run(`• ${highlight}`, { size: SMALL })],
                    }),
                );
            }
        }
    }

    const presentSkills = skillRows(data);
    if (presentSkills.length) {
        children.push(heading("Technical Skills"));
        for (const row of presentSkills) {
            children.push(
                new Paragraph({
                    spacing: { after: 40 },
                    children: [
                        run(`${row.label}: `, { bold: true, size: SMALL }),
                        run(row.values.join(", "), { size: SMALL }),
                    ],
                }),
            );
        }
    }

    if (data.education?.length) {
        children.push(heading("Education"));
        for (const edu of data.education) {
            children.push(
                new Paragraph({
                    spacing: { before: 80 },
                    children: [
                        run(edu.institution, { bold: true }),
                        run(edu.location ? `  ${edu.location}` : "", { size: SMALL }),
                    ],
                }),
            );
            children.push(
                new Paragraph({
                    spacing: { after: 40 },
                    children: [
                        run(
                            edu.gpa ? `${edu.degree}; GPA: ${edu.gpa}` : edu.degree,
                            { italics: true, size: SMALL },
                        ),
                        run(
                            `  ${[edu.startDate, edu.endDate].filter(Boolean).join(" – ")}`,
                            { italics: true, size: SMALL },
                        ),
                    ],
                }),
            );
        }
    }

    if (data.certifications?.length) {
        children.push(heading("Certifications"));
        for (const cert of data.certifications) {
            children.push(
                new Paragraph({
                    spacing: { after: 40 },
                    children: [
                        run(
                            cert.issuer ? `${cert.name} | ${cert.issuer}` : cert.name,
                            { bold: true },
                        ),
                        run(cert.date ? `  ${cert.date}` : "", { italics: true, size: SMALL }),
                    ],
                }),
            );
        }
    }

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 720, bottom: 720, left: 720, right: 720 },
                    },
                },
                children,
            },
        ],
    });

    return Packer.toBlob(doc);
}
