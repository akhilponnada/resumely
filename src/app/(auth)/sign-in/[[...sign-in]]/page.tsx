"use client";

import { SignIn } from "@clerk/nextjs";
import { FileText } from "lucide-react";

export default function SignInPage() {
    return (
        <div style={{ minHeight: "100vh", display: "flex" }}>
            {/* Left - Sign In Form */}
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "48px",
            }}>
                <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        background: "var(--violet)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <FileText size={20} color="white" />
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 600 }}>Resumely</span>
                </div>

                <SignIn
                    appearance={{
                        elements: {
                            formButtonPrimary: {
                                backgroundColor: "var(--violet)",
                                "&:hover": {
                                    backgroundColor: "var(--violet-dark)"
                                }
                            },
                            card: {
                                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                                border: "1px solid var(--accents-2)"
                            }
                        }
                    }}
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    forceRedirectUrl="/dashboard"
                />
            </div>

            {/* Right - Hero */}
            <div style={{
                flex: 1,
                background: "linear-gradient(135deg, var(--violet) 0%, var(--violet-dark) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px"
            }}>
                <div style={{ maxWidth: "400px", color: "white", textAlign: "center" }}>
                    <h2 style={{ fontSize: "36px", fontWeight: 600, marginBottom: "16px" }}>
                        Welcome back
                    </h2>
                    <p style={{ fontSize: "18px", opacity: 0.9 }}>
                        Sign in to continue building your AI-powered resumes
                    </p>
                </div>
            </div>
        </div>
    );
}
