import { jsPDF } from "jspdf";
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

    // Helper function for text
    const addText = (
        text: string,
        x: number,
        fontSize: number,
        fontStyle: "normal" | "bold" | "italic" | "bolditalic" = "normal",
        align: "left" | "center" | "right" = "left"
    ) => {
        doc.setFontSize(fontSize);
        doc.setFont("times", fontStyle);
        doc.text(text, x, y, { align });
    };

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
                doc.text(edu.location, pageWidth - margin, y, { align: "right" });
            }
            y += 12;

            doc.setFont("times", "italic");
            doc.setFontSize(9);
            const degreeText = edu.gpa ? `${edu.degree}; GPA: ${edu.gpa}` : edu.degree;
            doc.text(degreeText, margin, y);
            if (edu.startDate || edu.endDate) {
                doc.text(`${edu.startDate || ""} – ${edu.endDate || ""}`, pageWidth - margin, y, { align: "right" });
            }
            y += 14;
        }
        y += 6;
    }

    // Experience
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
                doc.text(`${exp.startDate || ""} – ${exp.endDate || ""}`, pageWidth - margin, y, { align: "right" });
            }
            y += 12;

            doc.setFont("times", "italic");
            doc.setFontSize(9);
            doc.text(exp.company, margin, y);
            if (exp.location) {
                doc.text(exp.location, pageWidth - margin, y, { align: "right" });
            }
            y += 12;

            if (exp.highlights && exp.highlights.length > 0) {
                doc.setFont("times", "normal");
                for (const highlight of exp.highlights) {
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
                doc.text(`${project.startDate || ""} – ${project.endDate || ""}`, pageWidth - margin, y, { align: "right" });
            }
            y += 12;

            if (project.highlights && project.highlights.length > 0) {
                doc.setFont("times", "normal");
                doc.setFontSize(9);
                for (const highlight of project.highlights) {
                    checkPageBreak(15);
                    const lines = doc.splitTextToSize(`• ${highlight}`, contentWidth - 10);
                    doc.text(lines, margin + 10, y);
                    y += lines.length * 10;
                }
            }
            y += 8;
        }
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
                doc.text(cert.date, pageWidth - margin, y, { align: "right" });
            }
            y += 14;
        }
        y += 6;
    }

    // Technical Skills
    if (data.skills) {
        checkPageBreak(80);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("TECHNICAL SKILLS", margin, y);
        y += 4;
        addSectionLine();

        doc.setFontSize(9);
        const skills = data.skills;

        if (skills.languages && skills.languages.length > 0) {
            doc.setFont("times", "bold");
            doc.text("Languages: ", margin, y);
            doc.setFont("times", "normal");
            doc.text(skills.languages.join(", "), margin + doc.getTextWidth("Languages: "), y);
            y += 11;
        }
        if (skills.frameworks && skills.frameworks.length > 0) {
            doc.setFont("times", "bold");
            doc.text("Frameworks: ", margin, y);
            doc.setFont("times", "normal");
            doc.text(skills.frameworks.join(", "), margin + doc.getTextWidth("Frameworks: "), y);
            y += 11;
        }
        if (skills.tools && skills.tools.length > 0) {
            doc.setFont("times", "bold");
            doc.text("Developer Tools: ", margin, y);
            doc.setFont("times", "normal");
            doc.text(skills.tools.join(", "), margin + doc.getTextWidth("Developer Tools: "), y);
            y += 11;
        }
        if (skills.libraries && skills.libraries.length > 0) {
            doc.setFont("times", "bold");
            doc.text("Libraries: ", margin, y);
            doc.setFont("times", "normal");
            doc.text(skills.libraries.join(", "), margin + doc.getTextWidth("Libraries: "), y);
            y += 11;
        }
        if (skills.soft && skills.soft.length > 0) {
            doc.setFont("times", "bold");
            doc.text("Soft Skills: ", margin, y);
            doc.setFont("times", "normal");
            doc.text(skills.soft.join(", "), margin + doc.getTextWidth("Soft Skills: "), y);
        }
    }

    return doc.output("blob");
}
