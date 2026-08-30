"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRightIcon, BriefcaseIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
    const { isSignedIn } = useAuth();

    return (
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-md">
            <div className="mx-auto flex h-14 items-center justify-between px-6 md:px-12">
                <Link href="/" className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
                        <FileTextIcon />
                    </span>
                    <span className="font-heading text-lg tracking-tight">Resumely</span>
                </Link>
                <nav className="flex items-center gap-1.5">
                    <Button nativeButton={false} render={<Link href="/jobs" />} variant="ghost">
                        <BriefcaseIcon data-icon="inline-start" />
                        Jobs
                    </Button>
                    {isSignedIn ? (
                        <Button nativeButton={false} render={<Link href="/dashboard" />}>
                            Dashboard
                            <ArrowRightIcon data-icon="inline-end" />
                        </Button>
                    ) : (
                        <>
                            <Button nativeButton={false} render={<Link href="/sign-in" />} variant="ghost">
                                Sign in
                            </Button>
                            <Button nativeButton={false} render={<Link href="/sign-up" />}>
                                Get started
                                <ArrowRightIcon data-icon="inline-end" />
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
