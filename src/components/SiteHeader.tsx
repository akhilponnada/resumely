"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
    const { isSignedIn } = useAuth();

    return (
        <header className="sticky top-0 z-20 border-b bg-background pt-[env(safe-area-inset-top)]">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 md:px-12">
                <Link href="/" className="flex items-center gap-2.5">
                    <BrandMark />
                    <span className="font-heading text-lg">Resumely</span>
                </Link>
                <nav aria-label="Primary" className="flex items-center gap-1.5">
                    <Button nativeButton={false} render={<Link href="/jobs" />} variant="ghost">
                        Jobs
                    </Button>
                    {isSignedIn ? (
                        <Button nativeButton={false} render={<Link href="/dashboard" />}>
                            Dashboard
                        </Button>
                    ) : (
                        <>
                            <Button nativeButton={false} render={<Link href="/sign-in" />} variant="ghost">
                                Sign in
                            </Button>
                            <Button nativeButton={false} render={<Link href="/sign-up" />}>
                                Get matched
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
