import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
    title: "Jobs",
    description: "Live roles from real company career pages, scored against your resume.",
    alternates: { canonical: "/jobs" },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-svh flex-col bg-background">
            <SiteHeader />
            <div
                id="main"
                className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col"
            >
                {children}
            </div>
        </div>
    );
}
