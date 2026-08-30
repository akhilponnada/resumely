import type {
    Certification,
    Education,
    Experience,
    Project,
    Resume,
    ResumeData,
    ResumeKind,
    Skills,
} from "./types";

export function emptySkills(): Skills {
    return {
        languages: [],
        frameworks: [],
        tools: [],
        platforms: [],
        libraries: [],
        soft: [],
    };
}

export function emptyResumeData(): ResumeData {
    return {
        fullName: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        website: "",
        summary: "",
        education: [],
        experience: [],
        projects: [],
        skills: emptySkills(),
        certifications: [],
    };
}

export function emptyExperience(): Experience {
    return {
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "Present",
        link: "",
        highlights: [""],
    };
}

export function emptyEducation(): Education {
    return {
        institution: "",
        degree: "",
        location: "",
        startDate: "",
        endDate: "",
        gpa: "",
    };
}

export function emptyProject(): Project {
    return {
        name: "",
        technologies: "",
        startDate: "",
        endDate: "",
        link: "",
        highlights: [""],
    };
}

export function emptyCertification(): Certification {
    return {
        name: "",
        issuer: "",
        date: "",
        link: "",
        highlights: [],
    };
}

export function resumeKind(resume: {
    kind?: string;
    jobId?: string;
    jobDescription?: string;
    targetTitle?: string;
}): ResumeKind {
    if (resume.kind === "base" || resume.kind === "tailored") return resume.kind;
    if (resume.jobId || resume.jobDescription || resume.targetTitle) return "tailored";
    return "base";
}

export function pickPrimary<T extends {
    isPrimary?: boolean;
    updatedAt: number;
    createdAt: number;
    kind?: string;
    jobId?: string;
    jobDescription?: string;
    targetTitle?: string;
}>(resumes: T[] | undefined | null): T | undefined {
    if (!resumes?.length) return undefined;
    const newest = (rows: T[]) =>
        [...rows].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))[0];
    const bases = resumes.filter((resume) => resumeKind(resume) === "base");
    const markedBase = bases.find((resume) => resume.isPrimary);
    if (markedBase) return markedBase;
    if (bases.length) return newest(bases);
    const marked = resumes.find((resume) => resume.isPrimary);
    if (marked) return marked;
    return newest(resumes);
}

export function splitLines(value: string): string[] {
    // Keep blank lines so pressing Enter in a highlights field can start a new bullet.
    // Empty lines are dropped in sanitizeResumeData on save.
    return value.split("\n").map((line) =>
        line.replace(/^\s*[•\-–—*]\s*/, "").replace(/\s+$/, ""),
    );
}

export function joinLines(values: string[] | undefined): string {
    return (values ?? []).join("\n");
}

export function joinList(values: string[] | undefined): string {
    return (values ?? []).join(", ");
}

export function splitList(value: string): string[] {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function skillCount(data: ResumeData | undefined): number {
    if (!data?.skills) return 0;
    return Object.values(data.skills).reduce(
        (n, v) => n + (Array.isArray(v) ? v.length : 0),
        0,
    );
}

export function cloneResumeData(data: ResumeData): ResumeData {
    return structuredClone(data);
}

function cleanLines(items: string[] | undefined): string[] {
    return (items ?? [])
        .map((item) => String(item ?? "").replace(/^\s*[•\-–—*]\s*/, "").trim())
        .filter(Boolean);
}

export function sanitizeResumeData(data: ResumeData): ResumeData {
    return {
        fullName: (data.fullName ?? "").trim(),
        email: (data.email ?? "").trim(),
        phone: data.phone?.trim() || "",
        linkedin: data.linkedin?.trim() || "",
        github: data.github?.trim() || "",
        website: data.website?.trim() || "",
        summary: data.summary?.trim() || "",
        education: (data.education ?? [])
            .map((edu) => ({
                institution: (edu.institution ?? "").trim(),
                degree: (edu.degree ?? "").trim(),
                location: edu.location?.trim() || "",
                startDate: edu.startDate?.trim() || "",
                endDate: edu.endDate?.trim() || "",
                gpa: edu.gpa?.trim() || "",
            }))
            .filter((edu) => edu.institution || edu.degree),
        experience: (data.experience ?? [])
            .map((exp) => ({
                company: (exp.company ?? "").trim(),
                position: (exp.position ?? "").trim(),
                location: exp.location?.trim() || "",
                startDate: exp.startDate?.trim() || "",
                endDate: exp.endDate?.trim() || "",
                link: exp.link?.trim() || "",
                highlights: cleanLines(exp.highlights),
            }))
            .filter((exp) => exp.company || exp.position),
        projects: (data.projects ?? [])
            .map((project) => ({
                name: (project.name ?? "").trim(),
                technologies: project.technologies?.trim() || "",
                startDate: project.startDate?.trim() || "",
                endDate: project.endDate?.trim() || "",
                link: project.link?.trim() || "",
                highlights: cleanLines(project.highlights),
            }))
            .filter((project) => project.name),
        skills: {
            languages: cleanLines(data.skills?.languages),
            frameworks: cleanLines(data.skills?.frameworks),
            tools: cleanLines(data.skills?.tools),
            platforms: cleanLines(data.skills?.platforms),
            libraries: cleanLines(data.skills?.libraries),
            soft: cleanLines(data.skills?.soft),
        },
        certifications: (data.certifications ?? [])
            .map((cert) => ({
                name: (cert.name ?? "").trim(),
                issuer: cert.issuer?.trim() || "",
                date: cert.date?.trim() || "",
                link: cert.link?.trim() || "",
                highlights: cleanLines(cert.highlights),
            }))
            .filter((cert) => cert.name),
    };
}

export function sanitizeAtsAnalysis(analysis?: {
    strengths?: string[];
    improvements?: string[];
    keywordMatches?: string[];
} | null) {
    if (!analysis) return undefined;
    return {
        strengths: cleanLines(analysis.strengths),
        improvements: cleanLines(analysis.improvements),
        keywordMatches: cleanLines(analysis.keywordMatches),
    };
}

export const SKILL_FIELDS = [
    { key: "languages" as const, label: "Languages" },
    { key: "frameworks" as const, label: "Frameworks" },
    { key: "tools" as const, label: "Tools" },
    { key: "platforms" as const, label: "Platforms" },
    { key: "libraries" as const, label: "Libraries" },
    { key: "soft" as const, label: "Soft skills" },
];

export function skillRows(data: ResumeData) {
    return SKILL_FIELDS.map((field) => ({
        ...field,
        values: data.skills?.[field.key] ?? [],
    })).filter((field) => field.values.length > 0);
}

export function fileStem(data: ResumeData, fallback = "Resume"): string {
    const name = data.fullName.trim().replace(/\s+/g, "_");
    return name || fallback;
}

export function tailoredFor(resume: Pick<Resume, "targetTitle" | "targetCompany" | "title">): string {
    if (resume.targetTitle && resume.targetCompany) {
        return `${resume.targetTitle} · ${resume.targetCompany}`;
    }
    if (resume.targetTitle) return resume.targetTitle;
    return resume.title;
}
