"use client";

import { ResumeData } from "@/lib/types";

export function ResumePreview({ data }: { data: ResumeData }) {
    const skills = data.skills;

    // A4 at 96 DPI = 794 x 1123 px
    // Font sizes converted from pt to px (1pt ≈ 1.33px at 96dpi):
    // - Name: 20pt = 27px
    // - Section headers: 14pt = 19px
    // - Body text: 11pt = 15px
    // - Small text: 10pt = 13px
    return (
        <div style={{
            background: "#fff",
            color: "#000",
            padding: "48px",
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: "15px",
            lineHeight: 1.4,
            width: "794px",
            minHeight: "1123px",
            boxSizing: "border-box",
        }}>
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "27px", fontWeight: "bold", color: "#000", margin: "0 0 4px 0" }}>
                        {data.fullName?.toUpperCase() || "FULL NAME"}
                    </h1>
                    {data.linkedin && (
                        <a href={data.linkedin.startsWith("http") ? data.linkedin : `https://${data.linkedin}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: "block", color: "#2563eb", textDecoration: "underline", fontSize: "13px" }}>
                            LinkedIn Profile
                        </a>
                    )}
                    {data.github && (
                        <a href={data.github.startsWith("http") ? data.github : `https://${data.github}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: "block", color: "#2563eb", textDecoration: "underline", fontSize: "13px" }}>
                            GitHub Profile
                        </a>
                    )}
                    {data.website && (
                        <a href={data.website.startsWith("http") ? data.website : `https://${data.website}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: "block", color: "#2563eb", textDecoration: "underline", fontSize: "13px" }}>
                            Portfolio
                        </a>
                    )}
                </div>
                <div style={{ textAlign: "right", fontSize: "13px" }}>
                    {data.email && (
                        <div><a href={`mailto:${data.email}`} style={{ color: "#2563eb", textDecoration: "underline" }}>{data.email}</a></div>
                    )}
                    {data.phone && <div style={{ marginTop: "2px" }}>{data.phone}</div>}
                </div>
            </div>

            {/* SUMMARY */}
            {data.summary && (
                <section style={{ marginBottom: "14px" }}>
                    <h2 style={{ fontSize: "19px", fontWeight: "bold", textAlign: "center", margin: "0 0 8px", paddingBottom: "4px", borderBottom: "2px solid #333" }}>
                        PROFESSIONAL SUMMARY
                    </h2>
                    <p style={{ fontSize: "15px", textAlign: "justify", margin: 0 }}>{data.summary}</p>
                </section>
            )}

            {/* EDUCATION */}
            {data.education && data.education.length > 0 && (
                <section style={{ marginBottom: "14px" }}>
                    <h2 style={{ fontSize: "19px", fontWeight: "bold", textAlign: "center", margin: "0 0 8px", paddingBottom: "4px", borderBottom: "2px solid #333" }}>
                        EDUCATION
                    </h2>
                    {data.education.map((edu, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <div>
                                <div style={{ fontWeight: "bold", fontSize: "15px" }}>{edu.institution}</div>
                                <div style={{ fontStyle: "italic", fontSize: "14px" }}>
                                    {edu.degree}{edu.gpa && ` | GPA: ${edu.gpa}`}
                                </div>
                            </div>
                            <div style={{ textAlign: "right", fontSize: "14px" }}>
                                {edu.location && <div>{edu.location}</div>}
                                <div>{edu.startDate} - {edu.endDate}</div>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* SKILLS */}
            {skills && (
                <section style={{ marginBottom: "14px" }}>
                    <h2 style={{ fontSize: "19px", fontWeight: "bold", textAlign: "center", margin: "0 0 8px", paddingBottom: "4px", borderBottom: "2px solid #333" }}>
                        SKILLS
                    </h2>
                    <div>
                        {skills.languages && skills.languages.length > 0 && (
                            <div style={{ fontSize: "14px", marginBottom: "3px" }}><strong>Languages:</strong> {skills.languages.join(", ")}</div>
                        )}
                        {skills.frameworks && skills.frameworks.length > 0 && (
                            <div style={{ fontSize: "14px", marginBottom: "3px" }}><strong>Frameworks:</strong> {skills.frameworks.join(", ")}</div>
                        )}
                        {skills.tools && skills.tools.length > 0 && (
                            <div style={{ fontSize: "14px", marginBottom: "3px" }}><strong>Tools:</strong> {skills.tools.join(", ")}</div>
                        )}
                        {((skills.libraries && skills.libraries.length > 0) || (skills.platforms && skills.platforms.length > 0)) && (
                            <div style={{ fontSize: "14px", marginBottom: "3px" }}><strong>Platforms:</strong> {[...(skills.libraries || []), ...(skills.platforms || [])].join(", ")}</div>
                        )}
                        {skills.soft && skills.soft.length > 0 && (
                            <div style={{ fontSize: "14px", marginBottom: "3px" }}><strong>Soft Skills:</strong> {skills.soft.join(", ")}</div>
                        )}
                    </div>
                </section>
            )}

            {/* WORK EXPERIENCE */}
            {data.experience && data.experience.length > 0 && (
                <section style={{ marginBottom: "14px" }}>
                    <h2 style={{ fontSize: "19px", fontWeight: "bold", textAlign: "center", margin: "0 0 8px", paddingBottom: "4px", borderBottom: "2px solid #333" }}>
                        WORK EXPERIENCE
                    </h2>
                    {data.experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                                    {exp.position} | {exp.company}
                                    {exp.link && (
                                        <a href={exp.link.startsWith("http") ? exp.link : `https://${exp.link}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{ color: "#2563eb", marginLeft: "6px", fontWeight: "normal", fontSize: "13px" }}>[Link]</a>
                                    )}
                                </div>
                                <span style={{ fontSize: "14px" }}>{exp.startDate} - {exp.endDate}</span>
                            </div>
                            {exp.location && <div style={{ fontSize: "14px", fontStyle: "italic", color: "#444" }}>{exp.location}</div>}
                            <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px" }}>
                                {exp.highlights?.map((h, j) => (
                                    <li key={j} style={{ fontSize: "14px", marginBottom: "2px" }}>{h}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            )}

            {/* PROJECTS */}
            {data.projects && data.projects.length > 0 && (
                <section style={{ marginBottom: "14px" }}>
                    <h2 style={{ fontSize: "19px", fontWeight: "bold", textAlign: "center", margin: "0 0 8px", paddingBottom: "4px", borderBottom: "2px solid #333" }}>
                        PROJECTS
                    </h2>
                    {data.projects.map((proj, i) => (
                        <div key={i} style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                                    {proj.name}
                                    {proj.technologies && <span style={{ fontWeight: "normal", fontSize: "14px", color: "#444" }}> | {proj.technologies}</span>}
                                    {proj.link && (
                                        <a href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{ color: "#2563eb", marginLeft: "6px", fontWeight: "normal", fontSize: "13px" }}>[Link]</a>
                                    )}
                                </div>
                                {(proj.startDate || proj.endDate) && <span style={{ fontSize: "14px" }}>{proj.startDate} - {proj.endDate}</span>}
                            </div>
                            <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px" }}>
                                {proj.highlights?.map((h, j) => (
                                    <li key={j} style={{ fontSize: "14px", marginBottom: "2px" }}>{h}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            )}

            {/* CERTIFICATIONS */}
            {data.certifications && data.certifications.length > 0 && (
                <section>
                    <h2 style={{ fontSize: "19px", fontWeight: "bold", textAlign: "center", margin: "0 0 8px", paddingBottom: "4px", borderBottom: "2px solid #333" }}>
                        CERTIFICATIONS
                    </h2>
                    {data.certifications.map((cert, i) => (
                        <div key={i} style={{ marginBottom: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                                    {cert.name}
                                    {cert.issuer && <span style={{ fontWeight: "normal" }}> ({cert.issuer})</span>}
                                    {cert.link && (
                                        <a href={cert.link.startsWith("http") ? cert.link : `https://${cert.link}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{ color: "#2563eb", marginLeft: "6px", fontWeight: "normal", fontSize: "13px" }}>[View]</a>
                                    )}
                                </div>
                                {cert.date && <span style={{ fontSize: "14px" }}>{cert.date}</span>}
                            </div>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}
