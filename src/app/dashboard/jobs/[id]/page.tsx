"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { JobDetailView } from "@/components/jobs/JobDetailView";

export default function DashboardJobDetail({ params }: { params: Promise<{ id: string }> }) {
    return (
        <DashboardLayout>
            <div className="flex min-h-svh flex-col px-6 py-6 md:px-8">
                <JobDetailView params={params} basePath="/dashboard/jobs" />
            </div>
        </DashboardLayout>
    );
}
