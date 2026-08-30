import { saveAs } from "file-saver";
import { fileStem, sanitizeAtsAnalysis, sanitizeResumeData } from "@/lib/resume-model";
import type { ResumeData } from "@/lib/types";

export async function requestResumeGenerate(body: Record<string, unknown>) {
    const response = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Failed to generate resume");
    }
    const payload = data as GenerateResumeResult;
    return {
        ...payload,
        resumeData: sanitizeResumeData(payload.resumeData),
        atsAnalysis: sanitizeAtsAnalysis(payload.atsAnalysis),
    };
}

export type GenerateResumeResult = {
    resumeData: ResumeData;
    atsScore?: number;
    atsAnalysis?: {
        strengths?: string[];
        improvements?: string[];
        keywordMatches?: string[];
    };
    atsChecks?: Array<{
        id: string;
        label: string;
        points: number;
        max: number;
        status: string;
        detail: string;
    }>;
    matchedKeywords?: string[];
    missingKeywords?: string[];
    suggestedTitle?: string;
    error?: string;
};

export function generatedWriteFields(data: GenerateResumeResult) {
    return {
        resumeData: sanitizeResumeData(data.resumeData),
        atsScore: data.atsScore,
        atsAnalysis: sanitizeAtsAnalysis(data.atsAnalysis),
        atsChecks: data.atsChecks,
        matchedKeywords: data.matchedKeywords,
        missingKeywords: data.missingKeywords,
    };
}

export async function downloadResumeFile(
    format: "pdf" | "docx",
    resumeData: ResumeData,
) {
    const response = await fetch(`/api/generate-${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to generate ${format.toUpperCase()}`);
    }
    const blob = await response.blob();
    saveAs(blob, `${fileStem(resumeData)}.${format}`);
}
