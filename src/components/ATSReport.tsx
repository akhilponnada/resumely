"use client";

import { Check, AlertTriangle, X, Info } from "lucide-react";

interface ATSCheck {
    id: string;
    label: string;
    points: number;
    max: number;
    status: string;
    detail: string;
}

interface Props {
    score?: number;
    checks?: ATSCheck[];
    matchedKeywords?: string[];
    missingKeywords?: string[];
    improvements?: string[];
    strengths?: string[];
}

const TONE: Record<string, { color: string; bg: string; Icon: typeof Check }> = {
    pass: { color: "#1a7f4b", bg: "rgba(26,127,75,0.10)", Icon: Check },
    warn: { color: "#a15c00", bg: "rgba(161,92,0,0.10)", Icon: AlertTriangle },
    fail: { color: "#b3261e", bg: "rgba(179,38,30,0.10)", Icon: X },
};

export function ATSReport({ score, checks, matchedKeywords, missingKeywords, improvements, strengths }: Props) {
    if (!checks?.length) {
        return (
            <div style={{
                border: "1px solid var(--accents-2)", borderRadius: "12px", padding: "24px",
                display: "flex", gap: "12px", alignItems: "flex-start",
            }}>
                <Info size={18} style={{ flexShrink: 0, marginTop: "2px", opacity: 0.6 }} />
                <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>No ATS breakdown for this resume</div>
                    <div style={{ fontSize: "14px", opacity: 0.75, lineHeight: 1.55 }}>
                        It was created before scoring was added. Regenerate it to get a full report.
                    </div>
                </div>
            </div>
        );
    }

    const band = (score ?? 0) >= 80 ? "#1a7f4b" : (score ?? 0) >= 60 ? "#a15c00" : "#b3261e";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Score */}
            <div style={{
                border: "1px solid var(--accents-2)", borderRadius: "12px", padding: "24px",
                display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap",
            }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "48px", fontWeight: 700, color: band, lineHeight: 1 }}>{score ?? 0}</span>
                    <span style={{ fontSize: "18px", opacity: 0.5 }}>/100</span>
                </div>
                <div style={{ flex: 1, minWidth: "240px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>ATS readiness</div>
                    <div style={{ fontSize: "14px", opacity: 0.75, lineHeight: 1.55 }}>
                        Calculated from the checks below, not estimated. The same resume always scores the same.
                    </div>
                </div>
            </div>

            {/* Checks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {checks.map((c) => {
                    const tone = TONE[c.status] ?? TONE.warn;
                    const { Icon } = tone;
                    return (
                        <div key={c.id} style={{
                            border: "1px solid var(--accents-2)", borderRadius: "10px", padding: "16px",
                            display: "flex", gap: "12px", alignItems: "flex-start",
                        }}>
                            <span style={{
                                width: "26px", height: "26px", borderRadius: "6px", flexShrink: 0,
                                background: tone.bg, color: tone.color,
                                display: "grid", placeItems: "center",
                            }}>
                                <Icon size={15} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "3px" }}>
                                    <span style={{ fontWeight: 600, fontSize: "15px" }}>{c.label}</span>
                                    <span style={{ fontSize: "13px", color: tone.color, fontWeight: 600, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                                        {c.points}/{c.max}
                                    </span>
                                </div>
                                <div style={{ fontSize: "14px", opacity: 0.75, lineHeight: 1.55 }}>{c.detail}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Keywords */}
            {(matchedKeywords?.length || missingKeywords?.length) ? (
                <div style={{ border: "1px solid var(--accents-2)", borderRadius: "12px", padding: "20px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "12px" }}>Keywords from the job description</div>
                    {matchedKeywords?.length ? (
                        <div style={{ marginBottom: missingKeywords?.length ? "14px" : 0 }}>
                            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.6, marginBottom: "7px" }}>
                                Found in your resume
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {matchedKeywords.map((k) => (
                                    <span key={k} style={{
                                        fontSize: "13px", padding: "3px 9px", borderRadius: "5px",
                                        background: TONE.pass.bg, color: TONE.pass.color,
                                    }}>{k}</span>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    {missingKeywords?.length ? (
                        <div>
                            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.6, marginBottom: "7px" }}>
                                Missing — work these in where they are true
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {missingKeywords.map((k) => (
                                    <span key={k} style={{
                                        fontSize: "13px", padding: "3px 9px", borderRadius: "5px",
                                        background: TONE.fail.bg, color: TONE.fail.color,
                                    }}>{k}</span>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {/* Model advice */}
            {(strengths?.length || improvements?.length) ? (
                <div style={{ border: "1px solid var(--accents-2)", borderRadius: "12px", padding: "20px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "12px" }}>Suggestions</div>
                    {strengths?.length ? (
                        <ul style={{ margin: "0 0 14px", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {strengths.map((s, i) => (
                                <li key={i} style={{ fontSize: "14px", lineHeight: 1.55 }}>{s}</li>
                            ))}
                        </ul>
                    ) : null}
                    {improvements?.length ? (
                        <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {improvements.map((s, i) => (
                                <li key={i} style={{ fontSize: "14px", lineHeight: 1.55, opacity: 0.85 }}>{s}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
