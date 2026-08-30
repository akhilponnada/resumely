"use client";

import { SignUp } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/AuthShell";

export default function SignUpPage() {
    return (
        <main id="main">
            <AuthShell
                title="Get matched to live roles"
                description="Build an ATS-ready resume, then see a ranked list from real company career pages."
            >
                <SignUp
                    appearance={clerkAppearance}
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    forceRedirectUrl="/dashboard"
                />
            </AuthShell>
        </main>
    );
}
