"use client";

import { useUser } from "@clerk/nextjs";
import { ResumeChat } from "@/components/assistant-ui/resume-chat";

export default function ChatPage() {
    const { user } = useUser();

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <ResumeChat firstName={user?.firstName ?? undefined} />
        </div>
    );
}
