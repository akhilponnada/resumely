"use client";

import { JobDetailView } from "@/components/jobs/JobDetailView";

export default function PublicJobDetail({ params }: { params: Promise<{ id: string }> }) {
    return (
        <div className="flex min-h-0 flex-1 flex-col px-4 py-5 md:px-6 md:py-6">
            <JobDetailView params={params} basePath="/jobs" />
        </div>
    );
}
