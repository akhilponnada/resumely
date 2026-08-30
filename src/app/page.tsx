import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SignedInHomeRedirect } from "@/components/SignedInHomeRedirect";
import { MatchLedger } from "@/components/landing/MatchLedger";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingCtas } from "@/components/landing/LandingCtas";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const STEPS = [
    {
        n: "1",
        title: "Add a resume",
        body: "Build one in the editor or upload what you already have. That file is what every role is scored against.",
    },
    {
        n: "2",
        title: "Get a ranked list",
        body: "Live jobs from Greenhouse, Lever, and Ashby show up with a match percentage — not a search box you have to babysit.",
    },
    {
        n: "3",
        title: "Tailor, then apply",
        body: "Rewrite bullets for that posting, save or hide roles, and apply on the company’s own career page.",
    },
] as const;

const BENEFITS = [
    {
        score: "87%",
        title: "Ranked, not searched",
        body: "Stop paging through boards. Every live role gets a score against your resume so the shortlist is already sorted.",
    },
    {
        score: "ATS",
        title: "Tailored for the parser",
        body: "Match the posting’s skills and seniority in the resume you actually send — without inventing experience.",
    },
    {
        score: "→",
        title: "Apply where they hire",
        body: "Open the company career page, not a fake inbox. Save and hide stay on your device.",
    },
] as const;

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    description: SITE_DESCRIPTION,
};

export default function LandingPage() {
    return (
        <div className="flex min-h-svh flex-col bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <SignedInHomeRedirect />
            <SiteHeader />
            <main id="main" className="flex-1">
                <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
                    <div>
                        <p className="font-mono text-xs text-muted-foreground">
                            Resume in. Ranked jobs out.
                        </p>
                        <h1 className="mt-4 font-heading text-4xl font-medium text-balance md:text-6xl">
                            Stop searching. Get matched.
                        </h1>
                        <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
                            Live roles from real company career pages, ranked against your resume.
                            Tailor the bullets, then apply on their site.
                        </p>
                        <div className="mt-8">
                            <LandingCtas />
                        </div>
                        <p className="mt-6 font-mono text-xs text-muted-foreground">
                            Free to start · Greenhouse, Lever, Ashby · No LinkedIn scrape
                        </p>
                    </div>
                    <MatchLedger />
                </section>

                <section className="border-t">
                    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-12">
                        <h2 className="font-heading text-3xl font-medium text-balance">How it works</h2>
                        <div className="mt-10 grid gap-10 md:grid-cols-3">
                            {STEPS.map((step) => (
                                <div key={step.n}>
                                    <p className="font-mono text-sm tabular-nums text-muted-foreground">
                                        {step.n}
                                    </p>
                                    <h3 className="mt-3 font-heading text-2xl font-medium text-balance">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-pretty text-muted-foreground">{step.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-t">
                    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-12">
                        <h2 className="font-heading text-3xl font-medium text-balance">
                            Built around the score
                        </h2>
                        <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
                            The number on the right of every job is the product. Everything else stays quiet.
                        </p>
                        <ul className="mt-10 divide-y ring-1 ring-foreground/10 rounded-xl bg-card">
                            {BENEFITS.map((item) => (
                                <li
                                    key={item.title}
                                    className="grid gap-3 px-5 py-6 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-baseline"
                                >
                                    <p className="font-mono text-2xl tabular-nums">{item.score}</p>
                                    <div className="min-w-0">
                                        <h3 className="font-heading text-xl font-medium">{item.title}</h3>
                                        <p className="mt-1 text-pretty text-muted-foreground">{item.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="border-t">
                    <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:px-12">
                        <div>
                            <h2 className="font-heading text-3xl font-medium text-balance">
                                Questions, answered
                            </h2>
                            <p className="mt-2 text-pretty text-muted-foreground">
                                If it is not on a company career page, it is not on this board.
                            </p>
                        </div>
                        <LandingFaq />
                    </div>
                </section>

                <section className="bg-foreground text-background">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-end md:justify-between md:px-12">
                        <div>
                            <h2 className="font-heading text-3xl font-medium text-balance md:text-4xl">
                                Put your resume on the board.
                            </h2>
                            <p className="mt-3 max-w-xl text-pretty text-background/70">
                                Create a resume, get a ranked list, and apply on the company site.
                            </p>
                        </div>
                        <LandingCtas inverted />
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
