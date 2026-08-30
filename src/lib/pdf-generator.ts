import { jsPDF } from "jspdf";
import { skillRows } from "./resume-model";
import { ResumeData } from "./types";

export async function generatePDF(data: ResumeData): Promise<Blob> {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    let y = 50;

    // Right-aligned runs (dates, locations) share a baseline with left-aligned
    // text, and some PDF text extractors concatenate adjacent runs with no
    // separator - turning "Amazon" + "Dunfermline" into "AmazonDunfermline" and
    // breaking keyword and date matching downstream. Every right-aligned draw
    // below therefore carries a leading space.

    const addSectionLine = () => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 12;
    };

    const checkPageBreak = (neededSpace: number) => {
        if (y + neededSpace > doc.internal.pageSize.getHeight() - 50) {
            doc.addPage();
            y = 50;
        }
    };

    // Header - Name
    doc.setFontSize(22);
    doc.setFont("times", "bold");
    doc.text(data.fullName.toUpperCase(), pageWidth / 2, y, { align: "center" });
    y += 18;

    // Contact info
    const contactParts: string[] = [];
    if (data.phone) contactParts.push(data.phone);
    if (data.email) contactParts.push(data.email);
    if (data.linkedin) contactParts.push(data.linkedin.replace("https://", ""));
    if (data.github) contactParts.push(data.github.replace("https://", ""));
    if (data.website) contactParts.push(data.website.replace("https://", ""));

    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text(contactParts.join(" | "), pageWidth / 2, y, { align: "center" });
    y += 20;

    // Summary
    if (data.summary) {
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("SUMMARY", margin, y);
        y += 4;
        addSectionLine();

        doc.setFont("times", "normal");
        doc.setFontSize(9);
        const summaryLines = doc.splitTextToSize(data.summary, contentWidth);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 11 + 10;
    }

    // Experience first — this is a job-hunt resume, not an academic CV.
    if (data.experience && data.experience.length > 0) {
        checkPageBreak(60);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("EXPERIENCE", margin, y);
        y += 4;
        addSectionLine();

        for (const exp of data.experience) {
            checkPageBreak(50);
            doc.setFontSize(10);
            doc.setFont("times", "bold");
            doc.text(exp.position, margin, y);
            if (exp.startDate || exp.endDate) {
                doc.setFont("times", "italic");
                doc.text(` ${exp.startDate || ""} – ${exp.endDate || ""}`, pageWidth - margin, y, { align: "right" });
            }
            y += 12;

            doc.setFont("times", "italic");
            doc.setFontSize(9);
            doc.text(exp.company, margin, y);
            if (exp.location) {
                doc.text(` ${exp.location}`, pageWidth - margin, y, { align: "right" });
            }
            y += 12;

            const highlights = (exp.highlights ?? []).filter((h) => h.trim());
            if (highlights.length > 0) {
                doc.setFont("times", "normal");
                for (const highlight of highlights) {
                    checkPageBreak(15);
                    const lines = doc.splitTextToSize(`• ${highlight}`, contentWidth - 10);
                    doc.text(lines, margin + 10, y);
                    y += lines.length * 10;
                }
            }
            y += 8;
        }
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
        checkPageBreak(60);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("PROJECTS", margin, y);
        y += 4;
        addSectionLine();

        for (const project of data.projects) {
            checkPageBreak(40);
            doc.setFontSize(10);
            doc.setFont("times", "bold");
            let projectTitle = project.name;
            if (project.technologies) {
                doc.text(projectTitle, margin, y);
                doc.setFont("times", "italic");
                doc.text(` | ${project.technologies}`, margin + doc.getTextWidth(projectTitle), y);
            } else {
                doc.text(projectTitle, margin, y);
            }
            if (project.startDate || project.endDate) {
                doc.setFont("times", "italic");
                doc.text(` ${project.startDate || ""} – ${project.endDate || ""}`, pageWidth - margin, y, { align: "right" });
            }
            y += 12;

            const highlights = (project.highlights ?? []).filter((h) => h.trim());
            if (highlights.length > 0) {
                doc.setFont("times", "normal");
                doc.setFontSize(9);
                for (const highlight of highlights) {
                    checkPageBreak(15);
                    const lines = doc.splitTextToSize(`• ${highlight}`, contentWidth - 10);
                    doc.text(lines, margin + 10, y);
                    y += lines.length * 10;
                }
            }
            y += 8;
        }
    }

    const skillList = skillRows(data);
    if (skillList.length) {
        checkPageBreak(80);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("TECHNICAL SKILLS", margin, y);
        y += 4;
        addSectionLine();

        doc.setFontSize(9);
        for (const row of skillList) {
            checkPageBreak(16);
            const label = `${row.label}: `;
            doc.setFont("times", "bold");
            doc.text(label, margin, y);
            doc.setFont("times", "normal");
            const lines = doc.splitTextToSize(row.values.join(", "), contentWidth - doc.getTextWidth(label));
            doc.text(lines, margin + doc.getTextWidth(label), y);
            y += Math.max(lines.length, 1) * 11;
        }
        y += 6;
    }

    // Education
    if (data.education && data.education.length > 0) {
        checkPageBreak(60);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("EDUCATION", margin, y);
        y += 4;
        addSectionLine();

        for (const edu of data.education) {
            checkPageBreak(40);
            doc.setFontSize(10);
            doc.setFont("times", "bold");
            doc.text(edu.institution, margin, y);
            if (edu.location) {
                doc.setFont("times", "normal");
                doc.text(` ${edu.location}`, pageWidth - margin, y, { align: "right" });
            }
            y += 12;

            doc.setFont("times", "italic");
            doc.setFontSize(9);
            const degreeText = edu.gpa ? `${edu.degree}; GPA: ${edu.gpa}` : edu.degree;
            doc.text(degreeText, margin, y);
            if (edu.startDate || edu.endDate) {
                doc.text(` ${edu.startDate || ""} – ${edu.endDate || ""}`, pageWidth - margin, y, { align: "right" });
            }
            y += 14;
        }
        y += 6;
    }

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
        checkPageBreak(60);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("CERTIFICATIONS", margin, y);
        y += 4;
        addSectionLine();

        for (const cert of data.certifications) {
            checkPageBreak(20);
            doc.setFontSize(10);
            doc.setFont("times", "bold");
            let certTitle = cert.name;
            if (cert.issuer) {
                certTitle += ` | ${cert.issuer}`;
            }
            doc.text(certTitle, margin, y);
            if (cert.date) {
                doc.setFont("times", "italic");
                doc.text(` ${cert.date}`, pageWidth - margin, y, { align: "right" });
            }
            y += 14;
        }
    }

    return doc.output("blob");
}
