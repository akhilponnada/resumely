"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { JobsBoard } from "@/components/JobsBoard";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function PublicJobsPage() {
    const { isSignedIn } = useAuth();

    return (
        <div style={{ minHeight: "100vh", background: "var(--geist-background)" }}>
            <SiteHeader />
            <main className="page-container-wide">
                <div style={{ marginBottom: 32, maxWidth: 720 }}>
                    <div className="eyebrow">
                        <Sparkles size={14} /> Live roles from company career pages
                    </div>
                    <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.8px", margin: "10px 0 12px" }}>
                        Stop searching. Get matched.
                    </h1>
                    <p style={{ fontSize: 17, color: "var(--accents-5)", lineHeight: 1.6 }}>
                        Real openings pulled from Greenhouse, Lever, Ashby and open remote feeds —
                        scored against your Resumely resume so you apply where you actually fit.
                    </p>
                    {!isSignedIn && (
                        <p style={{ marginTop: 12, fontSize: 14, color: "var(--accents-4)" }}>
                            <Link href="/sign-up" style={{ color: "var(--violet)", fontWeight: 500 }}>Create a free profile</Link>
                            {" "}to see match scores and tailor a resume in one click.
                        </p>
                    )}
                </div>
                <JobsBoard basePath="/jobs" />
            </main>
        </div>
    );
}
