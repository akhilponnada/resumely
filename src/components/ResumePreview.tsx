"use client";

import { type ReactNode } from "react";
import { skillRows } from "@/lib/resume-model";
import { ResumeData } from "@/lib/types";

function href(value?: string) {
    if (!value) return undefined;
    return value.startsWith("http") ? value : `https://${value}`;
}

function range(start?: string, end?: string) {
    if (!start && !end) return "";
    return [start, end].filter(Boolean).join(" – ");
}

export function ResumePreview({ data }: { data: ResumeData }) {
    const hasContact = Boolean(
        data.phone || data.email || data.linkedin || data.github || data.website,
    );

    const skills = skillRows(data);

    return (
        <article className="resume-preview">
            <h1>{data.fullName || "Your name"}</h1>
            {hasContact ? (
                <p className="contact">
                    {[
                        data.phone ? <span key="phone">{data.phone}</span> : null,
                        data.email ? (
                            <a key="email" href={`mailto:${data.email}`}>{data.email}</a>
                        ) : null,
                        data.linkedin ? (
                            <a key="linkedin" href={href(data.linkedin)} target="_blank" rel="noopener noreferrer">
                                {data.linkedin.replace(/^https?:\/\//, "")}
                            </a>
                        ) : null,
                        data.github ? (
                            <a key="github" href={href(data.github)} target="_blank" rel="noopener noreferrer">
                                {data.github.replace(/^https?:\/\//, "")}
                            </a>
                        ) : null,
                        data.website ? (
                            <a key="website" href={href(data.website)} target="_blank" rel="noopener noreferrer">
                                {data.website.replace(/^https?:\/\//, "")}
                            </a>
                        ) : null,
                    ]
                        .filter(Boolean)
                        .reduce<ReactNode[]>((parts, node, index) => {
                            if (index > 0) parts.push(" | ");
                            parts.push(node);
                            return parts;
                        }, [])}
                </p>
            ) : null}

            {data.summary ? (
                <section>
                    <h2>Summary</h2>
                    <p>{data.summary}</p>
                </section>
            ) : null}

            {data.experience?.length ? (
                <section>
                    <h2>Experience</h2>
                    {data.experience.map((exp, i) => (
                        <div className="entry" key={`${exp.company}-${i}`}>
                            <div className="entry-header">
                                <span className="entry-title">{exp.position}</span>
                                <span className="entry-date">{range(exp.startDate, exp.endDate)}</span>
                            </div>
                            <div className="entry-sub">
                                {exp.company}
                                {exp.location ? `, ${exp.location}` : ""}
                            </div>
                            {exp.highlights?.filter(Boolean).length ? (
                                <ul>
                                    {exp.highlights.filter(Boolean).map((h, j) => (
                                        <li key={j}>{h}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ))}
                </section>
            ) : null}

            {data.projects?.length ? (
                <section>
                    <h2>Projects</h2>
                    {data.projects.map((project, i) => (
                        <div className="entry" key={`${project.name}-${i}`}>
                            <div className="entry-header">
                                <span className="entry-title">
                                    {project.name}
                                    {project.technologies ? ` | ${project.technologies}` : ""}
                                </span>
                                <span className="entry-date">{range(project.startDate, project.endDate)}</span>
                            </div>
                            {project.highlights?.filter(Boolean).length ? (
                                <ul>
                                    {project.highlights.filter(Boolean).map((h, j) => (
                                        <li key={j}>{h}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ))}
                </section>
            ) : null}

            {skills.length ? (
                <section>
                    <h2>Technical skills</h2>
                    {skills.map((field) => (
                        <p className="skills-row" key={field.key}>
                            <strong>{field.label}: </strong>
                            {field.values.join(", ")}
                        </p>
                    ))}
                </section>
            ) : null}

            {data.education?.length ? (
                <section>
                    <h2>Education</h2>
                    {data.education.map((edu, i) => (
                        <div className="entry" key={`${edu.institution}-${i}`}>
                            <div className="entry-header">
                                <span className="entry-title">{edu.institution}</span>
                                <span className="entry-date">{edu.location}</span>
                            </div>
                            <div className="entry-sub">
                                {edu.degree}
                                {edu.gpa ? `; GPA: ${edu.gpa}` : ""}
                                {edu.startDate || edu.endDate
                                    ? ` · ${range(edu.startDate, edu.endDate)}`
                                    : ""}
                            </div>
                        </div>
                    ))}
                </section>
            ) : null}

            {data.certifications?.length ? (
                <section>
                    <h2>Certifications</h2>
                    {data.certifications.map((cert, i) => (
                        <div className="entry" key={`${cert.name}-${i}`}>
                            <div className="entry-header">
                                <span className="entry-title">
                                    {cert.name}
                                    {cert.issuer ? ` | ${cert.issuer}` : ""}
                                </span>
                                <span className="entry-date">{cert.date}</span>
                            </div>
                        </div>
                    ))}
                </section>
            ) : null}
        </article>
    );
}
