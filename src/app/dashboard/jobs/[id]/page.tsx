"use client";

import { JobDetailView } from "@/components/jobs/JobDetailView";

export default function DashboardJobDetail({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col px-6 py-6 md:px-8">
            <JobDetailView params={params} basePath="/dashboard/jobs" />
        </div>
    );
}
