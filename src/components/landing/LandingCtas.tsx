"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingCtas({
    primaryHref = "/sign-up",
    inverted = false,
}: {
    primaryHref?: string;
    inverted?: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-3">
            <Button
                nativeButton={false}
                render={<Link href={primaryHref} />}
                size="lg"
                className={
                    inverted
                        ? "h-10 bg-background px-4 text-foreground hover:bg-background/90"
                        : "h-10 px-4"
                }
            >
                Get matched
            </Button>
            <Button
                nativeButton={false}
                render={<Link href="/jobs" />}
                variant="outline"
                size="lg"
                className={
                    inverted
                        ? "h-10 border-background/30 bg-transparent px-4 text-background hover:bg-background/10 hover:text-background"
                        : "h-10 px-4"
                }
            >
                Browse jobs
            </Button>
        </div>
    );
}
