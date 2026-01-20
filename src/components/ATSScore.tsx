"use client";

interface ATSScoreProps {
    score: number;
    analysis?: {
        strengths?: string[];
        improvements?: string[];
        keywordMatches?: string[];
    };
}

export function ATSScore({ score, analysis }: ATSScoreProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return "#22c55e"; // green
        if (score >= 60) return "#f59e0b"; // yellow
        return "#ef4444"; // red
    };

    const color = getScoreColor(score);
    const circumference = 2 * Math.PI * 42;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="card">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem" }}>
                {/* Score Circle */}
                <div
                    style={{
                        position: "relative",
                        width: "100px",
                        height: "100px",
                        flexShrink: 0,
                    }}
                >
                    <svg
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        style={{ transform: "rotate(-90deg)" }}
                    >
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#e5e5e5"
                            strokeWidth="8"
                        />
                        {/* Score circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: "stroke-dashoffset 1s ease-out" }}
                        />
                    </svg>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span style={{ fontSize: "1.5rem", fontWeight: 700, color }}>
                            {score}
                        </span>
                        <span
                            style={{
                                fontSize: "0.625rem",
                                color: "#737373",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            ATS Score
                        </span>
                    </div>
                </div>

                {/* Analysis */}
                {analysis && (
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {analysis.strengths && analysis.strengths.length > 0 && (
                                <div>
                                    <h4
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                            color: "#16a34a",
                                            marginBottom: "0.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        <svg
                                            style={{ width: "1rem", height: "1rem" }}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        Strengths
                                    </h4>
                                    <ul
                                        style={{
                                            fontSize: "0.75rem",
                                            color: "#525252",
                                            listStyle: "none",
                                            padding: 0,
                                            margin: 0,
                                        }}
                                    >
                                        {analysis.strengths.slice(0, 3).map((s, i) => (
                                            <li key={i} style={{ marginBottom: "0.25rem" }}>
                                                • {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.improvements && analysis.improvements.length > 0 && (
                                <div>
                                    <h4
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                            color: "#d97706",
                                            marginBottom: "0.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        <svg
                                            style={{ width: "1rem", height: "1rem" }}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                        Improvements
                                    </h4>
                                    <ul
                                        style={{
                                            fontSize: "0.75rem",
                                            color: "#525252",
                                            listStyle: "none",
                                            padding: 0,
                                            margin: 0,
                                        }}
                                    >
                                        {analysis.improvements.slice(0, 3).map((s, i) => (
                                            <li key={i} style={{ marginBottom: "0.25rem" }}>
                                                • {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.keywordMatches && analysis.keywordMatches.length > 0 && (
                                <div>
                                    <h4
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                            color: "#6366f1",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        Matched Keywords
                                    </h4>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                                        {analysis.keywordMatches.slice(0, 8).map((kw, i) => (
                                            <span
                                                key={i}
                                                className="badge"
                                                style={{ fontSize: "0.75rem" }}
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
