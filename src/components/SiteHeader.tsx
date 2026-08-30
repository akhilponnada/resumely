"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Briefcase, FileText } from "lucide-react";

export function SiteHeader() {
    const { isSignedIn } = useAuth();

    return (
        <header style={{
            padding: "16px 48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--accents-2)",
            position: "sticky",
            top: 0,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            zIndex: 20,
        }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                    width: "36px",
                    height: "36px",
                    background: "var(--violet)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <FileText size={18} color="white" />
                </div>
                <span style={{ fontSize: "18px", fontWeight: 600 }}>Resumely</span>
            </Link>
            <nav style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link href="/jobs" className="btn btn-ghost" style={{ gap: 8 }}>
                    <Briefcase size={16} /> Jobs
                </Link>
                {isSignedIn ? (
                    <Link href="/dashboard" className="btn btn-primary">
                        Dashboard <ArrowRight size={16} />
                    </Link>
                ) : (
                    <>
                        <Link href="/sign-in" className="btn btn-secondary">Sign In</Link>
                        <Link href="/sign-up" className="btn btn-primary">
                            Get Started <ArrowRight size={16} />
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
