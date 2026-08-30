import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Jobs — Resumely",
    description: "Live roles from real company career pages, scored against your resume.",
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
