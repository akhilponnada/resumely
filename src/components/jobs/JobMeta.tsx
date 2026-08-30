import { workplaceLabel } from "@/lib/companyLogos";
import { cn } from "@/lib/utils";
import type { BoardJob } from "./types";

export function jobMetaParts(job: BoardJob): string[] {
    return [
        job.company,
        job.location || null,
        workplaceLabel(job.workplace),
        job.salary ?? null,
    ].filter((part): part is string => Boolean(part));
}

export function JobMeta({
    job,
    className,
}: {
    job: BoardJob;
    className?: string;
}) {
    return (
        <span className={cn("truncate text-muted-foreground", className)}>
            {jobMetaParts(job).join(" · ")}
        </span>
    );
}
