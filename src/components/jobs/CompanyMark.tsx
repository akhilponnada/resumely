"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { companyInitials, companyLogoCandidates } from "@/lib/companyLogos";

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
    const src = candidates[index];

    const mark = (
        <Avatar
            size={size}
            className={cn(
                "rounded-md bg-background after:rounded-md",
                size === "lg" && "size-12"
            )}
        >
            {src ? (
                <AvatarImage
                    src={src}
                    alt=""
                    className="rounded-md object-contain p-0.5"
                    onError={() => setIndex((i) => i + 1)}
                />
            ) : null}
            <AvatarFallback className="rounded-md font-mono text-[10px] font-medium tracking-wide">
                {companyInitials(company)}
            </AvatarFallback>
        </Avatar>
    );

    if (!hoverable) return mark;

    return (
        <HoverCard>
            <HoverCardTrigger className="inline-flex rounded-md border-0 bg-transparent p-0">
                {mark}
            </HoverCardTrigger>
            <HoverCardContent className="w-auto min-w-40">
                <div className="flex items-center gap-2">
                    <Avatar size="sm" className="rounded-md after:rounded-md">
                        {src ? (
                            <AvatarImage src={src} alt="" className="rounded-md object-contain p-0.5" />
                        ) : null}
                        <AvatarFallback className="rounded-md font-mono text-[10px]">
                            {companyInitials(company)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="truncate font-medium">{company}</p>
                        <p className="text-xs text-muted-foreground">From the posting</p>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
