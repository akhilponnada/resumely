"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
    {
        value: "source",
        question: "Where do the jobs come from?",
        answer:
            "Live postings from company career pages on Greenhouse, Lever, and Ashby, plus a few open remote feeds. Resumely does not scrape LinkedIn.",
    },
    {
        value: "resume",
        question: "Do I need a resume to browse?",
        answer:
            "No. Anyone can browse the board. Sign in and add a resume to rank every role with a match percentage and see why it scored that way.",
    },
    {
        value: "match",
        question: "What does the match percentage mean?",
        answer:
            "It compares skills, seniority, and keywords on your matching resume to the posting. Higher scores mean more overlap — not a guarantee you will get the job.",
    },
    {
        value: "tailor",
        question: "What does tailor do?",
        answer:
            "It copies your matching resume and rewrites bullets and keywords for that posting. The original stays untouched, and nothing is invented.",
    },
    {
        value: "apply",
        question: "Can I apply from Resumely?",
        answer:
            "Apply opens the company’s own posting. Save and hide live on your device. There is no recruiter-email blast.",
    },
    {
        value: "cost",
        question: "Is it free?",
        answer:
            "You can create a resume, browse live jobs, and get matched without paying. No credit card to start.",
    },
] as const;

export function LandingFaq() {
    return (
        <Accordion>
            {FAQS.map((item) => (
                <AccordionItem key={item.value} value={item.value}>
                    <AccordionTrigger className="py-4 text-base">
                        {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-pretty text-muted-foreground">{item.answer}</p>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
