"use client";

import { useEffect, useMemo, useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { companyInitials, companyLogoCandidates, companyMarkColor } from "@/lib/companyLogos";

export function CompanyMark({
    company,
    logo,
    applyUrl,
    size = "default",
    hoverable = true,
}: {
    company: string;
    logo?: string;
    applyUrl?: string;
    size?: "sm" | "default" | "lg";
    hoverable?: boolean;
}) {
    const candidates = useMemo(
        () => companyLogoCandidates(company, applyUrl, logo),
        [company, applyUrl, logo]
    );
    const [index, setIndex] = useState(0);
    const [showLogo, setShowLogo] = useState(false);
    const src = candidates[index];
    const initials = companyInitials(company);
    const color = companyMarkColor(company);

    useEffect(() => {
        setIndex(0);
        setShowLogo(false);
    }, [company, logo, applyUrl]);

    const mark = (
        <span
            className={cn(
                "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md font-mono font-medium tracking-wide text-white select-none",
                size === "sm" && "size-8 text-[10px]",
                size === "default" && "size-9 text-[11px]",
                size === "lg" && "size-12 text-sm"
            )}
            style={{ backgroundColor: color }}
            aria-hidden
        >
            {initials}
            {src ? (
                <img
                    key={src}
                    src={src}
                    alt=""
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className={cn(
                        "absolute inset-0 size-full bg-background object-contain p-0.5",
                        !showLogo && "hidden"
                    )}
                    onLoad={() => setShowLogo(true)}
                    onError={() => {
                        setShowLogo(false);
                        setIndex((i) => i + 1);
                    }}
                />
            ) : null}
        </span>
    );

    if (!hoverable) return mark;

    return (
        <HoverCard>
            <HoverCardTrigger className="inline-flex rounded-md border-0 bg-transparent p-0">
                {mark}
            </HoverCardTrigger>
            <HoverCardContent className="w-auto min-w-40">
                <div className="flex items-center gap-2">
                    <CompanyMark
                        company={company}
                        logo={logo}
                        applyUrl={applyUrl}
                        size="sm"
                        hoverable={false}
                    />
                    <div className="min-w-0">
                        <p className="truncate font-medium">{company}</p>
                        <p className="text-xs text-muted-foreground">From the posting</p>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
