import type { JobMatch } from "@/lib/jobMatch";

export type BoardJob = {
    _id: string;
    company: string;
    companyLogo?: string;
    title: string;
    location: string;
    workplace: string;
    salary?: string;
    tags: string[];
    postedAt: number;
    applyUrl: string;
    descriptionText: string;
    source: string;
    department?: string;
};

export type RankedJob = {
    job: BoardJob;
    match: JobMatch | null;
};
