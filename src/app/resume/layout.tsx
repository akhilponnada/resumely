import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
    title: "Resume",
    robots: { index: false, follow: false },
};

export default function ResumeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppShell>{children}</AppShell>;
}
