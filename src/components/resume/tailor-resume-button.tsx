"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { FileTextIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { pickPrimary, resumeKind } from "@/lib/resume-model";
import { generatedWriteFields, requestResumeGenerate } from "./resume-api";

export function TailorResumeButton({
    jobId,
    title,
    company,
    descriptionText,
    variant = "outline",
    size = "default",
}: {
    jobId: string;
    title: string;
    company: string;
    descriptionText: string;
    variant?: "default" | "outline" | "secondary";
    size?: "default" | "sm";
}) {
    const { user } = useUser();
    const router = useRouter();
    const resumes = useQuery(api.resumes.getResumesByUser, user?.id ? {} : "skip");
    const createResume = useMutation(api.resumes.createResume);
    const [working, setWorking] = useState(false);

    const primary = pickPrimary(resumes);
    const existing = resumes?.find(
        (resume) => resume.jobId === jobId && resumeKind(resume) === "tailored",
    );

    if (!user) {
        return (
            <Button
                nativeButton={false}
                render={<Link href="/sign-up" />}
                variant={variant}
                size={size}
            >
                Get matched
            </Button>
        );
    }

    if (resumes === undefined) {
        return (
            <Button variant={variant} size={size} disabled>
                <Spinner data-icon="inline-start" />
                Tailor resume
            </Button>
        );
    }

    if (!primary) {
        return (
            <Button
                nativeButton={false}
                render={<Link href={`/dashboard/new?job=${jobId}`} />}
                variant={variant}
                size={size}
            >
                <FileTextIcon data-icon="inline-start" />
                Add resume to tailor
            </Button>
        );
    }

    if (existing && !working) {
        return (
            <Button
                nativeButton={false}
                render={<Link href={`/resume/${existing._id}`} />}
                variant={variant}
                size={size}
            >
                <FileTextIcon data-icon="inline-start" />
                Open tailored resume
            </Button>
        );
    }

    const tailor = async () => {
        setWorking(true);
        try {
            const data = await requestResumeGenerate({
                mode: "tailor",
                resumeData: primary.resumeData,
                jobDescription: descriptionText,
                jobTitle: title,
                company,
            });
            const id = await createResume({
                title: data.suggestedTitle || `${title} · ${company}`,
                rawInput: primary.rawInput || "",
                kind: "tailored",
                parentId: primary._id as Id<"resumes">,
                jobId: jobId as Id<"jobs">,
                targetCompany: company,
                targetTitle: title,
                isPrimary: false,
                jobDescription: descriptionText,
                ...generatedWriteFields(data),
            });
            toast.success("Tailored copy ready");
            router.push(`/resume/${id}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not tailor this resume");
        } finally {
            setWorking(false);
        }
    };

    return (
        <Button variant={variant} size={size} onClick={tailor} disabled={working}>
            {working ? <Spinner data-icon="inline-start" /> : <FileTextIcon data-icon="inline-start" />}
            {working ? "Tailoring…" : "Tailor resume"}
        </Button>
    );
}
