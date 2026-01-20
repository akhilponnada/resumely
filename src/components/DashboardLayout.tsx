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
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="loader" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div>
            <Sidebar />
            <main className="main-content">{children}</main>
        </div>
    );
}
