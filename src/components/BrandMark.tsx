import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                "flex size-8 items-center justify-center rounded-md bg-foreground text-background",
                className
            )}
            aria-hidden="true"
        >
            <svg viewBox="0 0 24 24" fill="none" className="size-4">
                <path
                    d="M7 8h10M7 12h10M7 16h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        </span>
    );
}
