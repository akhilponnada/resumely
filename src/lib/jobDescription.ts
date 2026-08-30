export type JobDescriptionBlock =
    | { type: "h"; text: string }
    | { type: "p"; text: string }
    | { type: "ul"; items: string[] };

const HEADING_NAMES =
    "About the Role|About Us|About You|About the Company|About the Team|About This Role|" +
    "Our Mission|The Role|The Company|Role Overview|Your Impact|" +
    "What You'll Do|What You Will Do|What We're Looking For|What We Are Looking For|" +
    "Key Responsibilities|Responsibilities|Requirements|Qualifications|" +
    "Minimum Qualifications|Preferred Qualifications|Nice to Have|Must Have|" +
    "Who You Are|Benefits|Compensation|Compensation & Benefits|Tech Stack|" +
    "Why Join|Why Join Us|What We Offer|How to Apply|Equal Opportunity|" +
    "Equal Opportunity Employer|Location";

const ABOUT_COMPANY = "About [A-Z][A-Za-z0-9&.’']{2,24}";

const HEADING_LINE = new RegExp(`^(?:${HEADING_NAMES}|${ABOUT_COMPANY})$`, "i");
const HEADING_SPLIT = new RegExp(`(?=\\b(?:${HEADING_NAMES}|${ABOUT_COMPANY})\\b)`, "g");
const HEADING_LEAD = new RegExp(`^(${HEADING_NAMES}|${ABOUT_COMPANY})[:\\s]*`, "i");

function isHeading(line: string): boolean {
    const text = line.replace(/:$/, "").trim();
    if (!text || text.length > 60) return false;
    if (HEADING_LINE.test(text)) return true;
    return text.length < 42 && /:$/.test(line) && !/[.]/.test(text);
}

function wrapSentences(text: string, every = 2): string[] {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return [];
    const sentences = cleaned.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
    if (!sentences || sentences.length <= every) return [cleaned];
    const out: string[] = [];
    for (let i = 0; i < sentences.length; i += every) {
        out.push(sentences.slice(i, i + every).join(" ").replace(/\s+/g, " ").trim());
    }
    return out.filter(Boolean);
}

function splitBlob(text: string): string[] {
    const chunks = text.split(HEADING_SPLIT).map((s) => s.trim()).filter(Boolean);
    const paras: string[] = [];
    for (const chunk of chunks) {
        const lead = chunk.match(HEADING_LEAD);
        if (lead && lead[0].length < chunk.length) {
            paras.push(lead[1] ?? lead[0].trim());
            paras.push(...wrapSentences(chunk.slice(lead[0].length)));
        } else {
            paras.push(...wrapSentences(chunk));
        }
    }
    return paras.filter(Boolean);
}

function paragraphsOf(raw: string): string[] {
    if (/\n/.test(raw)) {
        return raw
            .split(/\n+/)
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return splitBlob(raw);
}

export function jobDescriptionBlocks(raw: string): JobDescriptionBlock[] {
    const text = raw.trim();
    if (!text) return [];

    const out: JobDescriptionBlock[] = [];
    let list: string[] = [];

    const flushList = () => {
        if (list.length === 0) return;
        out.push({ type: "ul", items: list });
        list = [];
    };

    for (const paragraph of paragraphsOf(text)) {
        const bullet = paragraph.match(/^(?:[•\-\*]|\d+[.)])\s+(.+)/);
        if (bullet?.[1]) {
            list.push(bullet[1].trim());
            continue;
        }
        flushList();
        if (isHeading(paragraph)) {
            out.push({ type: "h", text: paragraph.replace(/:$/, "").trim() });
        } else {
            out.push({ type: "p", text: paragraph });
        }
    }
    flushList();
    return out;
}
