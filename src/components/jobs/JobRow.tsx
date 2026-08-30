"use client";

import { BookmarkIcon, EyeOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { relativeTime } from "@/lib/jobMatch";
import { cn } from "@/lib/utils";
import { CompanyMark } from "./CompanyMark";
import { JobMeta } from "./JobMeta";
import { MatchScore } from "./MatchScore";
import type { BoardJob } from "./types";
import type { JobMatch } from "@/lib/jobMatch";

export function JobRow({
    job,
    match,
    saved,
    selected,
    onSelect,
    onToggleSave,
    onHide,
}: {
    job: BoardJob;
    match?: JobMatch | null;
    saved?: boolean;
    selected?: boolean;
    onSelect: () => void;
    onToggleSave?: () => void;
    onHide?: () => void;
}) {
    return (
        <Item
            role="option"
            aria-selected={selected}
            variant={selected ? "muted" : "default"}
            size="sm"
            className={cn(
                "cursor-pointer flex-nowrap rounded-none border-x-0 border-t-0",
                selected && "bg-muted"
            )}
            onClick={onSelect}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect();
                }
            }}
            tabIndex={0}
        >
            <ItemMedia>
                <CompanyMark
                    company={job.company}
                    logo={job.companyLogo}
                    applyUrl={job.applyUrl}
                    size="sm"
                    hoverable={false}
                />
            </ItemMedia>
            <ItemContent className="min-w-0 gap-0.5">
                <ItemTitle className="w-full">
                    <span className="min-w-0 flex-1 truncate">{job.title}</span>
                    {saved ? (
                        <Badge variant="secondary">Saved</Badge>
                    ) : null}
                </ItemTitle>
                <ItemDescription className="line-clamp-1">
                    <JobMeta job={job} />
                    <span className="text-muted-foreground"> · {relativeTime(job.postedAt)}</span>
                </ItemDescription>
            </ItemContent>
            <ItemActions className="shrink-0">
                <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 md:group-focus-within/item:opacity-100">
                    {onToggleSave ? (
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={saved ? "Unsave" : "Save"}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onToggleSave();
                                        }}
                                    />
                                }
                            >
                                <BookmarkIcon fill={saved ? "currentColor" : "none"} />
                            </TooltipTrigger>
                            <TooltipContent>{saved ? "Saved" : "Save"}</TooltipContent>
                        </Tooltip>
                    ) : null}
                    {onHide ? (
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Hide job"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onHide();
                                        }}
                                    />
                                }
                            >
                                <EyeOffIcon />
                            </TooltipTrigger>
                            <TooltipContent>Hide</TooltipContent>
                        </Tooltip>
                    ) : null}
                </div>
                {match?.score != null ? <MatchScore score={match.score} /> : null}
            </ItemActions>
        </Item>
    );
}
