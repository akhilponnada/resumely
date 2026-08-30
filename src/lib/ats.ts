import { ResumeData } from "./types";

/**
 * Deterministic ATS scoring.
 *
 * This replaces asking the model to invent a number. Every point below comes
 * from something an applicant tracking system actually does: pull contact
 * details out of the header, find the sections it expects, match the posting's
 * vocabulary against the resume, and parse employment dates. The same resume
 * always scores the same, and every deduction can be explained to the user.
 */

export type CheckStatus = "pass" | "warn" | "fail";

export interface ATSCheck {
    id: string;
    label: string;
    points: number;
    max: number;
    status: CheckStatus;
    detail: string;
}

export interface ATSResult {
    score: number;
    checks: ATSCheck[];
    matchedKeywords: string[];
    missingKeywords: string[];
}

// Words that carry no signal when matching a posting against a resume.
const STOPWORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
    "in", "is", "it", "its", "of", "on", "or", "that", "the", "to", "was", "were",
    "will", "with", "you", "your", "our", "we", "they", "this", "these", "those",
    "their", "them", "he", "she", "his", "her", "but", "not", "can", "all", "any",
    "who", "what", "when", "where", "how", "why", "which", "if", "then", "than",
    "there", "here", "about", "into", "over", "under", "more", "most", "other",
    "such", "own", "same", "so", "up", "out", "do", "does", "did", "done", "being",
    "been", "also", "may", "must", "should", "would", "could", "shall", "each",
    "role", "job", "work", "working", "team", "teams", "company", "position",
    "candidate", "candidates", "experience", "years", "year", "ability", "strong",
    "excellent", "good", "great", "help", "helping", "including", "etc", "plus",
    "required", "preferred", "responsibilities", "requirements", "qualifications",
    "looking", "join", "us", "new", "well", "across", "within", "using", "use",
]);

const ACTION_VERBS = new Set([
    "led", "built", "designed", "developed", "implemented", "launched", "created",
    "managed", "delivered", "improved", "increased", "reduced", "optimized",
    "automated", "architected", "scaled", "migrated", "shipped", "drove", "owned",
    "established", "spearheaded", "coordinated", "analyzed", "streamlined",
    "negotiated", "mentored", "founded", "achieved", "generated", "grew",
    "engineered", "deployed", "integrated", "refactored", "resolved", "trained",
    "supervised", "produced", "executed", "initiated", "restructured", "expanded",
]);

function tokenize(text: string): string[] {
    return (text.toLowerCase().match(/[a-z][a-z0-9+#.]{1,}/g) ?? [])
        .map((t) => t.replace(/\.$/, ""))
        .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/** Everything on the resume as one searchable blob. */
function resumeText(data: ResumeData): string {
    const parts: string[] = [
        data.fullName, data.summary ?? "",
        ...(data.experience ?? []).flatMap((e) => [e.company, e.position, ...(e.highlights ?? [])]),
        ...(data.projects ?? []).flatMap((p) => [p.name, p.technologies ?? "", ...(p.highlights ?? [])]),
        ...(data.education ?? []).flatMap((e) => [e.institution, e.degree]),
        ...Object.values(data.skills ?? {}).flatMap((v) => (Array.isArray(v) ? v : [])),
        ...(data.certifications ?? []).flatMap((c) => [c.name, c.issuer ?? ""]),
    ];
    return parts.filter(Boolean).join(" ");
}

/** Dates an ATS can actually turn into an employment range. */
function isParseableDate(value?: string): boolean {
    if (!value) return false;
    const v = value.trim();
    if (/^(present|current|ongoing|now)$/i.test(v)) return true;
    if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}$/i.test(v)) return true;
    if (/^\d{4}$/.test(v)) return true;
    if (/^\d{1,2}\/\d{4}$/.test(v)) return true;
    if (/^\d{4}-\d{2}$/.test(v)) return true;
    return false;
}

export function computeATS(data: ResumeData, jobDescription?: string): ATSResult {
    const checks: ATSCheck[] = [];
    const text = resumeText(data);
    const resumeTokens = new Set(tokenize(text));

    // -- contact details the parser lifts into its own fields -----------------
    {
        const max = 15;
        let points = 0;
        const missing: string[] = [];
        if (data.email?.includes("@")) points += 6; else missing.push("email");
        if (data.phone?.trim()) points += 5; else missing.push("phone");
        if (data.linkedin?.trim()) points += 4; else missing.push("LinkedIn");
        checks.push({
            id: "contact",
            label: "Contact details",
            points, max,
            status: points === max ? "pass" : points >= 6 ? "warn" : "fail",
            detail: missing.length
                ? `Missing ${missing.join(", ")}. Parsers pull these into dedicated fields; a recruiter filtering on them will not see you.`
                : "Email, phone and LinkedIn all present.",
        });
    }

    // -- the sections a parser expects to find --------------------------------
    {
        const max = 20;
        let points = 0;
        const missing: string[] = [];
        const skillCount = Object.values(data.skills ?? {})
            .reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0);

        if ((data.experience ?? []).length > 0) points += 8; else missing.push("experience");
        if ((data.education ?? []).length > 0) points += 5; else missing.push("education");
        if (skillCount >= 5) points += 5;
        else if (skillCount > 0) points += 2;
        else missing.push("skills");
        if (data.summary?.trim()) points += 2; else missing.push("summary");

        checks.push({
            id: "sections",
            label: "Standard sections",
            points, max,
            status: missing.length === 0 ? "pass" : points >= 13 ? "warn" : "fail",
            detail: missing.length
                ? `No ${missing.join(", ")} section. Parsers look for these by heading and score what they cannot find as absent.`
                : "Experience, education, skills and summary all present.",
        });
    }

    // -- vocabulary overlap with the posting ----------------------------------
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];
    if (jobDescription?.trim()) {
        const max = 30;
        const counts = new Map<string, number>();
        for (const t of tokenize(jobDescription)) {
            counts.set(t, (counts.get(t) ?? 0) + 1);
        }
        // Terms the posting leans on hardest are the ones worth matching.
        const ranked = [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 30)
            .map(([t]) => t);

        for (const term of ranked) {
            if (resumeTokens.has(term)) matchedKeywords.push(term);
            else missingKeywords.push(term);
        }

        const ratio = ranked.length ? matchedKeywords.length / ranked.length : 0;
        const points = Math.round(ratio * max);
        checks.push({
            id: "keywords",
            label: "Keyword match",
            points, max,
            status: ratio >= 0.6 ? "pass" : ratio >= 0.35 ? "warn" : "fail",
            detail: `Matched ${matchedKeywords.length} of the posting's ${ranked.length} most-used terms.` +
                (missingKeywords.length ? ` Consider working in: ${missingKeywords.slice(0, 8).join(", ")}.` : ""),
        });
    }

    // -- measurable outcomes --------------------------------------------------
    {
        const max = 15;
        const highlights = [
            ...(data.experience ?? []).flatMap((e) => e.highlights ?? []),
            ...(data.projects ?? []).flatMap((p) => p.highlights ?? []),
        ];
        const quantified = highlights.filter((h) => /\d/.test(h) && /\d+\s*(%|percent|k\b|m\b|x\b|\+)|\b\d{2,}\b/i.test(h));
        const ratio = highlights.length ? quantified.length / highlights.length : 0;
        const points = Math.round(Math.min(ratio / 0.4, 1) * max);
        checks.push({
            id: "quantified",
            label: "Quantified results",
            points, max,
            status: ratio >= 0.4 ? "pass" : ratio >= 0.15 ? "warn" : "fail",
            detail: highlights.length
                ? `${quantified.length} of ${highlights.length} bullet points carry a number. Aim for roughly 4 in 10 - figures are what a reviewer remembers.`
                : "No bullet points found to measure.",
        });
    }

    // -- bullets that open with a verb ---------------------------------------
    {
        const max = 10;
        const highlights = [
            ...(data.experience ?? []).flatMap((e) => e.highlights ?? []),
            ...(data.projects ?? []).flatMap((p) => p.highlights ?? []),
        ];
        const strong = highlights.filter((h) => {
            const first = h.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
            return first ? ACTION_VERBS.has(first) : false;
        });
        const ratio = highlights.length ? strong.length / highlights.length : 0;
        const points = Math.round(Math.min(ratio / 0.7, 1) * max);
        checks.push({
            id: "verbs",
            label: "Action verbs",
            points, max,
            status: ratio >= 0.7 ? "pass" : ratio >= 0.4 ? "warn" : "fail",
            detail: highlights.length
                ? `${strong.length} of ${highlights.length} bullet points open with a strong verb such as Led, Built or Reduced.`
                : "No bullet points found to measure.",
        });
    }

    // -- dates the parser can read -------------------------------------------
    {
        const max = 10;
        const roles = data.experience ?? [];
        const dated = roles.filter((e) => isParseableDate(e.startDate) && isParseableDate(e.endDate));
        const ratio = roles.length ? dated.length / roles.length : 0;
        const points = Math.round(ratio * max);
        checks.push({
            id: "dates",
            label: "Readable dates",
            points, max,
            status: ratio === 1 ? "pass" : ratio >= 0.5 ? "warn" : "fail",
            detail: roles.length
                ? `${dated.length} of ${roles.length} roles use a format a parser can read, such as "March 2024" or "2024". Unparseable dates mean your experience length is not counted.`
                : "No roles found to check.",
        });
    }

    const raw = checks.reduce((sum, c) => sum + c.points, 0);
    const maxTotal = checks.reduce((sum, c) => sum + c.max, 0) || 1;
    const score = Math.max(0, Math.min(100, Math.round((raw / maxTotal) * 100)));
    return { score, checks, matchedKeywords, missingKeywords };
}
