"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <TooltipProvider delay={200}>
                {children}
                <Toaster />
            </TooltipProvider>
        </ThemeProvider>
    );
}
