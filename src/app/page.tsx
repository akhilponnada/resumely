"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { FileText, ArrowRight, Shield, Zap, Sparkles } from "lucide-react";
import Link from "next/link";

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
      {/* Header */}
      <header style={{
        padding: "16px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--accents-2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            background: "var(--violet)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <FileText size={18} color="white" />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 600 }}>Resumely</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/sign-in" className="btn btn-secondary">
            Sign In
          </Link>
          <Link href="/sign-up" className="btn btn-primary">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

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
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Powered by Claude AI</span>
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
            Build ATS-Optimized<br />Resumes in Minutes
          </h1>

          <p style={{
            fontSize: "20px",
            color: "var(--accents-5)",
            maxWidth: "600px",
            margin: "0 auto 40px"
          }}>
            Create professional, job-winning resumes with AI. Get real-time ATS scoring
            and personalized suggestions to land your dream job.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Link href="/sign-up" className="btn btn-primary" style={{ height: "52px", padding: "0 32px", fontSize: "16px" }}>
              Start Building Free <ArrowRight size={18} />
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
              Claude AI transforms your raw input into polished, professional resume content
              with impactful achievements.
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
              Download your resume as PDF or DOCX. Professional formatting
              ready for any application.
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
