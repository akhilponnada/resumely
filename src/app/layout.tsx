import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { AppProviders } from "@/components/providers";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Resumely - AI-Powered Resume Builder",
  description: "Create ATS-optimized resumes powered by Claude AI",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={cn("font-sans", fraunces.variable, plexSans.variable, plexMono.variable)}
        suppressHydrationWarning
      >
        <body className="min-h-svh antialiased" suppressHydrationWarning>
          <AppProviders>
            <ConvexClientProvider>
              {children}
            </ConvexClientProvider>
          </AppProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
