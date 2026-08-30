const SAMPLE = [
    { score: 91, title: "Product Designer", company: "Harbor Labs", workplace: "Remote" },
    { score: 84, title: "Design Engineer", company: "Northline", workplace: "Hybrid" },
    { score: 76, title: "UX Engineer", company: "Fieldwork", workplace: "Remote" },
    { score: 61, title: "Brand Designer", company: "Kettle & Co.", workplace: "On-site" },
] as const;

export function MatchLedger() {
    return (
        <aside
            aria-label="Example ranking against a sample resume"
            className="rounded-xl bg-card ring-1 ring-foreground/10"
        >
            <div className="flex items-baseline justify-between border-b px-4 py-3">
                <p className="font-mono text-xs text-muted-foreground">Example shortlist</p>
                <p className="font-mono text-xs tabular-nums text-muted-foreground">Match %</p>
            </div>
            <ol className="divide-y">
                {SAMPLE.map((row) => (
                    <li key={row.title} className="flex items-center gap-4 px-4 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{row.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                                {row.company} · {row.workplace}
                            </p>
                        </div>
                        <p className="font-mono text-3xl tabular-nums leading-none">
                            {row.score}
                            <span className="text-sm text-muted-foreground">%</span>
                        </p>
                    </li>
                ))}
            </ol>
        </aside>
    );
}
