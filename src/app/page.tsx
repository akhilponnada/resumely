"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { FileText, ArrowRight, Shield, Zap, Sparkles, Briefcase } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <SiteHeader />

      {/* Hero */}
      <main style={{ padding: "80px 48px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "rgba(124, 58, 237, 0.1)",
            borderRadius: "100px",
            marginBottom: "24px",
            color: "var(--violet)"
          }}>
            <Sparkles size={16} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Resume + live job matching</span>
          </div>

          <h1 style={{
            fontSize: "56px",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: "24px",
            background: "linear-gradient(135deg, var(--geist-foreground) 0%, var(--accents-5) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            The job hunt,<br />with AI on your side
          </h1>

          <p style={{
            fontSize: "20px",
            color: "var(--accents-5)",
            maxWidth: "600px",
            margin: "0 auto 40px"
          }}>
            Build an ATS-ready resume, then get matched to live roles from real company
            career pages — with a score for every posting.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" className="btn btn-primary" style={{ height: "52px", padding: "0 32px", fontSize: "16px" }}>
              Start Building Free <ArrowRight size={18} />
            </Link>
            <Link href="/jobs" className="btn" style={{ height: "52px", padding: "0 32px", fontSize: "16px" }}>
              <Briefcase size={18} /> Browse live jobs
            </Link>
          </div>
        </div>

        {/* Features */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "32px",
          marginTop: "80px"
        }}>
          <div style={{
            padding: "32px",
            background: "var(--geist-background)",
            border: "1px solid var(--accents-2)",
            borderRadius: "16px"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: "rgba(124, 58, 237, 0.1)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px"
            }}>
              <Zap size={24} color="var(--violet)" />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
              AI-Powered Writing
            </h3>
            <p style={{ color: "var(--accents-5)", lineHeight: 1.6 }}>
              AI turns your raw experience into polished bullets with measurable impact,
              then tailors them to a specific posting.
            </p>
          </div>

          <div style={{
            padding: "32px",
            background: "var(--geist-background)",
            border: "1px solid var(--accents-2)",
            borderRadius: "16px"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px"
            }}>
              <Shield size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
              ATS Optimization
            </h3>
            <p style={{ color: "var(--accents-5)", lineHeight: 1.6 }}>
              Beat applicant tracking systems with real-time scoring and keyword
              optimization based on job descriptions.
            </p>
          </div>

          <div style={{
            padding: "32px",
            background: "var(--geist-background)",
            border: "1px solid var(--accents-2)",
            borderRadius: "16px"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px"
            }}>
              <FileText size={24} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
              Export Anywhere
            </h3>
            <p style={{ color: "var(--accents-5)", lineHeight: 1.6 }}>
                Download DOCX or PDF, then apply on the company site with a resume
              already scored against that posting.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: "32px 48px",
        borderTop: "1px solid var(--accents-2)",
        textAlign: "center",
        color: "var(--accents-4)",
        fontSize: "14px"
      }}>
        © 2026 Resumely. Build better resumes.
      </footer>
    </div>
  );
}
