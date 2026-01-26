"use client";

import { ResumeData } from "@/lib/types";

export function ResumePreview({ data }: { data: ResumeData }) {
    const skills = data.skills;

    // A4 dimensions: 210mm x 297mm (8.27in x 11.69in)
    return (
        <div style={{
            background: "#fff",
            color: "#000",
            padding: "20px 24px",
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: "10px",
            lineHeight: 1.35,
            width: "210mm",
            minHeight: "297mm",
            maxWidth: "210mm",
            boxSizing: "border-box",
            margin: "0 auto",
        }}>
            {/* HEADER - Name left, Contact right */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                <div>
                    <h1 style={{ fontSize: "14px", fontWeight: "bold", color: "#000", margin: "0 0 2px 0" }}>
                        {data.fullName?.toUpperCase() || "FULL NAME"}
                    </h1>
                    {data.linkedin && (
                        <a href={`https://${data.linkedin.replace(/^https?:\/\//, "")}`}
                            style={{ display: "block", color: "#2563eb", textDecoration: "underline", fontSize: "9px", lineHeight: 1.5 }}>
                            {data.fullName?.split(" ")[0]} | LinkedIn
                        </a>
                    )}
                    {data.github && (
                        <a href={`https://${data.github.replace(/^https?:\/\//, "")}`}
                            style={{ display: "block", color: "#2563eb", textDecoration: "underline", fontSize: "9px", lineHeight: 1.5 }}>
                            {data.github.replace(/^https?:\/\//, "").replace("github.com/", "")} (github.com)
                        </a>
                    )}
                </div>
                <div style={{ textAlign: "right", fontSize: "9px" }}>
                    {data.email && (
                        <div>Email: <a href={`mailto:${data.email}`} style={{ color: "#2563eb", textDecoration: "underline" }}>{data.email}</a></div>
                    )}
                    {data.phone && <div>Mobile: {data.phone}</div>}
                </div>
            </div>

            {/* EDUCATION */}
            {data.education && data.education.length > 0 && (
                <section>
                    <h2 style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        textAlign: "center",
                        margin: "8px 0 4px",
                        paddingBottom: "2px",
                        borderBottom: "1px solid #808080",
                    }}>EDUCATION</h2>
                    {data.education.map((edu, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <div>
                                <div style={{ fontWeight: "bold", fontSize: "10px" }}>{edu.institution}</div>
                                <div style={{ fontStyle: "italic", fontSize: "9px" }}>
                                    {edu.degree}{edu.gpa && `; GPA: ${edu.gpa}`}
                                </div>
                            </div>
                            <div style={{ textAlign: "right", fontSize: "9px" }}>
                                <div>{edu.location}</div>
                                <div style={{ fontWeight: "bold" }}>{edu.startDate} - {edu.endDate}</div>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* SKILLS SUMMARY */}
            {skills && (
                <section>
                    <h2 style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        textAlign: "center",
                        margin: "8px 0 4px",
                        paddingBottom: "2px",
                        borderBottom: "1px solid #808080",
                    }}>SKILLS SUMMARY</h2>
                    <div style={{ paddingLeft: "10px" }}>
                        {skills.languages && skills.languages.length > 0 && (
                            <div style={{ fontSize: "9px", marginBottom: "2px" }}>
                                <span style={{ fontSize: "7px", marginRight: "6px" }}>●</span>
                                <strong>Languages:</strong> {skills.languages.join(", ")}
                            </div>
                        )}
                        {skills.frameworks && skills.frameworks.length > 0 && (
                            <div style={{ fontSize: "9px", marginBottom: "2px" }}>
                                <span style={{ fontSize: "7px", marginRight: "6px" }}>●</span>
                                <strong>Frameworks:</strong> {skills.frameworks.join(", ")}
                            </div>
                        )}
                        {skills.tools && skills.tools.length > 0 && (
                            <div style={{ fontSize: "9px", marginBottom: "2px" }}>
                                <span style={{ fontSize: "7px", marginRight: "6px" }}>●</span>
                                <strong>Tools:</strong> {skills.tools.join(", ")}
                            </div>
                        )}
                        {skills.libraries && skills.libraries.length > 0 && (
                            <div style={{ fontSize: "9px", marginBottom: "2px" }}>
                                <span style={{ fontSize: "7px", marginRight: "6px" }}>●</span>
                                <strong>Platforms:</strong> {skills.libraries.join(", ")}
                            </div>
                        )}
                        {skills.soft && skills.soft.length > 0 && (
                            <div style={{ fontSize: "9px", marginBottom: "2px" }}>
                                <span style={{ fontSize: "7px", marginRight: "6px" }}>●</span>
                                <strong>Soft Skills:</strong> {skills.soft.join(", ")}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* WORK EXPERIENCE */}
            {data.experience && data.experience.length > 0 && (
                <section>
                    <h2 style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        textAlign: "center",
                        margin: "8px 0 4px",
                        paddingBottom: "2px",
                        borderBottom: "1px solid #808080",
                    }}>WORK EXPERIENCE</h2>
                    {data.experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontWeight: "bold", fontSize: "10px" }}>
                                    {exp.position.toUpperCase()} | {exp.company.toUpperCase()} | <span style={{ color: "#2563eb" }}>LINK</span>
                                </span>
                                <span style={{ fontWeight: "bold", fontSize: "9px" }}>{exp.startDate}- {exp.endDate}</span>
                            </div>
                            <ul style={{ margin: "2px 0 0 14px", padding: 0, listStyle: "none" }}>
                                {exp.highlights?.map((h, j) => (
                                    <li key={j} style={{ fontSize: "9px", marginBottom: "1px", paddingLeft: "10px", position: "relative", textAlign: "justify" }}>
                                        <span style={{ position: "absolute", left: 0 }}>○</span>
                                        {h}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            )}

            {/* PROJECTS */}
            {data.projects && data.projects.length > 0 && (
                <section>
                    <h2 style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        textAlign: "center",
                        margin: "8px 0 4px",
                        paddingBottom: "2px",
                        borderBottom: "1px solid #808080",
                    }}>PROJECTS</h2>
                    {data.projects.map((proj, i) => (
                        <div key={i} style={{ marginBottom: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontWeight: "bold", fontSize: "10px" }}>
                                    {proj.name} | <span style={{ color: "#2563eb" }}>LINK</span>
                                </span>
                                <span style={{ fontWeight: "bold", fontSize: "9px" }}>{proj.startDate}- {proj.endDate}</span>
                            </div>
                            <ul style={{ margin: "2px 0 0 14px", padding: 0, listStyle: "none" }}>
                                {proj.highlights?.map((h, j) => (
                                    <li key={j} style={{ fontSize: "9px", marginBottom: "1px", paddingLeft: "10px", position: "relative", textAlign: "justify" }}>
                                        <span style={{ position: "absolute", left: 0 }}>○</span>
                                        {h}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            )}

            {/* CERTIFICATES */}
            {data.certifications && data.certifications.length > 0 && (
                <section>
                    <h2 style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        textAlign: "center",
                        margin: "8px 0 4px",
                        paddingBottom: "2px",
                        borderBottom: "1px solid #808080",
                    }}>CERTIFICATES</h2>
                    {data.certifications.map((cert, i) => (
                        <div key={i} style={{ marginBottom: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontWeight: "bold", fontSize: "10px" }}>
                                    {cert.name}{cert.issuer && ` (${cert.issuer})`} | <span style={{ color: "#2563eb" }}>CERTIFICATE</span>
                                </span>
                                <span style={{ fontWeight: "bold", fontSize: "9px" }}>{cert.date}</span>
                            </div>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}
