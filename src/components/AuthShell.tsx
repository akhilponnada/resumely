import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export const clerkAppearance = {
    variables: {
        colorPrimary: "#171A1C",
        colorText: "#171A1C",
        colorBackground: "#ffffff",
        borderRadius: "0.625rem",
        fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif",
    },
    elements: {
        formButtonPrimary: {
            backgroundColor: "#171A1C",
            "&:hover": { backgroundColor: "#2A2F33" },
        },
        card: {
            boxShadow: "none",
            border: "1px solid var(--border)",
        },
        footerActionLink: {
            color: "#171A1C",
        },
    },
};

export function AuthShell({
    children,
    title,
    description,
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="grid min-h-svh md:grid-cols-2">
            <div className="flex flex-col items-center justify-center px-6 py-12">
                <Link href="/" className="mb-8 flex items-center gap-2.5">
                    <BrandMark />
                    <span className="font-heading text-lg">Resumely</span>
                </Link>
                {children}
            </div>
            <aside className="hidden bg-foreground px-12 text-background md:flex md:items-center md:justify-center">
                <div className="max-w-md">
                    <p className="font-mono text-xs text-background/60">Match score</p>
                    <p className="mt-2 font-mono text-7xl tabular-nums leading-none">
                        87<span className="text-3xl text-background/60">%</span>
                    </p>
                    <h1 className="mt-8 font-heading text-3xl font-medium text-balance">{title}</h1>
                    <p className="mt-3 text-pretty text-background/70">{description}</p>
                </div>
            </aside>
        </div>
    );
}
