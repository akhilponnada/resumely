"use client";

import { use } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { ResumeChat } from "@/components/assistant-ui/resume-chat";
import { convexToThreadMessages } from "@/lib/chat-messages";
import { Spinner } from "@/components/ui/spinner";

export default function ChatDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const chatId = id as Id<"chats">;
    const { user } = useUser();
    const messages = useQuery(api.messages.getMessages, { chatId });

    if (messages === undefined) {
        return (
            <div
                className="flex flex-1 items-center justify-center"
                aria-busy="true"
                aria-label="Loading conversation"
            >
                <Spinner />
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <ResumeChat
                chatId={chatId}
                initialMessages={convexToThreadMessages(messages)}
                firstName={user?.firstName ?? undefined}
            />
        </div>
    );
}
