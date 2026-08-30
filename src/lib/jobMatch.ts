import { ResumeData } from "./types";

export interface JobMatchInput {
    title: string;
    company: string;
    descriptionText: string;
    tags: string[];
    location: string;
}

export interface JobMatch {
    score: number;
    matched: string[];
    missing: string[];
}

const STOPWORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
    "in", "is", "it", "its", "of", "on", "or", "that", "the", "to", "was", "were",
    "will", "with", "you", "your", "our", "we", "they", "this", "these", "those",
    "their", "them", "role", "job", "work", "working", "team", "teams", "company",
    "position", "candidate", "experience", "years", "year", "ability", "strong",
    "excellent", "required", "preferred", "responsibilities", "requirements",
    "qualifications", "including", "plus", "etc", "across", "within", "using",
]);

function tokens(text: string): string[] {
    return (text.toLowerCase().match(/[a-z][a-z0-9+#.]{1,}/g) ?? [])
        .map((t) => t.replace(/\.$/, ""))
        .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function resumeBlob(data: ResumeData): string {
    return [
        data.fullName, data.summary ?? "",
        ...(data.experience ?? []).flatMap((e) => [e.company, e.position, ...(e.highlights ?? [])]),
        ...(data.projects ?? []).flatMap((p) => [p.name, p.technologies ?? "", ...(p.highlights ?? [])]),
        ...(data.education ?? []).flatMap((e) => [e.institution, e.degree]),
        ...Object.values(data.skills ?? {}).flatMap((v) => (Array.isArray(v) ? v : [])),
        ...(data.certifications ?? []).flatMap((c) => [c.name, c.issuer ?? ""]),
    ].filter(Boolean).join(" ");
}

function skillList(data: ResumeData): string[] {
    return Object.values(data.skills ?? {})
        .flatMap((v) => (Array.isArray(v) ? v : []))
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Score a posting against a resume. Keyword overlap against the job's
 * distinctive vocabulary, boosted when the title/tags hit declared skills.
 */
export function matchJob(resume: ResumeData, job: JobMatchInput): JobMatch {
    const resumeText = resumeBlob(resume);
    const resumeSet = new Set(tokens(resumeText));
    const skills = skillList(resume).map((s) => s.toLowerCase());

    const jobTokens = tokens(
        `${job.title} ${job.company} ${job.tags.join(" ")} ${job.descriptionText.slice(0, 4000)}`
    );
    const freq = new Map<string, number>();
    for (const t of jobTokens) freq.set(t, (freq.get(t) ?? 0) + 1);

    // Distinctive job terms: appear a few times but aren't the whole posting.
    const keywords = [...freq.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 40)
        .map(([t]) => t);

    const pool = keywords.length > 0 ? keywords : [...new Set(jobTokens)].slice(0, 30);
    const matched: string[] = [];
    const missing: string[] = [];
    for (const k of pool) {
        if (resumeSet.has(k) || skills.some((s) => s.includes(k) || k.includes(s))) {
            matched.push(k);
        } else {
            missing.push(k);
        }
    }

    const titleHit = skills.some((s) => job.title.toLowerCase().includes(s)) ? 8 : 0;
    const tagHit = job.tags.filter((t) =>
        resumeSet.has(t.toLowerCase()) || skills.some((s) => s.includes(t.toLowerCase()))
    ).length * 3;
    const denom = Math.max(pool.length, 1);
    const overlap = Math.round((matched.length / denom) * 85);
    const score = Math.max(12, Math.min(99, overlap + titleHit + Math.min(tagHit, 10)));

    return {
        score,
        matched: matched.slice(0, 12),
        missing: missing.slice(0, 12),
    };
}

export function relativeTime(ts: number): string {
    const delta = Date.now() - ts;
    const mins = Math.floor(delta / 60000);
    if (mins < 60) return `${Math.max(mins, 1)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
}
