"use client";

import { useUser } from "@clerk/nextjs";
import { Sidebar } from "./Sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/sign-in");
        }
    }, [user, isLoaded, router]);

    if (!isLoaded) {
        return (
            <div className="flex min-h-svh items-center justify-center" aria-busy="true" aria-label="Loading dashboard">
                <div className="loader" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div>
            <Sidebar />
            <main id="main" className="main-content">{children}</main>
        </div>
    );
}
