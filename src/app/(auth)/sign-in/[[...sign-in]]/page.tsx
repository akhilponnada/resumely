"use client";

import { SignIn } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/AuthShell";

export default function SignInPage() {
    return (
        <main id="main">
            <AuthShell
                title="Welcome back"
                description="Sign in to rank live roles against your resume and pick up where you left off."
            >
                <SignIn
                    appearance={clerkAppearance}
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    forceRedirectUrl="/dashboard"
                />
            </AuthShell>
        </main>
    );
}
