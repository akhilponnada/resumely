import { Badge } from "@/components/ui/badge";

export function MatchScore({ score }: { score?: number | null }) {
    if (score == null) {
        return (
            <Badge variant="outline" className="font-mono tabular-nums">
                —
            </Badge>
        );
    }

    const variant = score >= 75 ? "default" : score >= 50 ? "secondary" : "outline";

    return (
        <Badge variant={variant} className="font-mono text-sm tabular-nums">
            {score}
            <span className="text-[0.7rem] opacity-70">%</span>
        </Badge>
    );
}
