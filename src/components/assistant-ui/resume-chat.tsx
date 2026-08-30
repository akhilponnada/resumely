"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { chatTitleFromText, threadMessageText } from "@/lib/chat-messages";

const SUGGESTIONS = [
  {
    title: "Tailor a resume",
    prompt: "How do I tailor my resume for a specific job?",
  },
  {
    title: "ATS-friendly",
    prompt: "What makes a resume ATS-friendly?",
  },
  {
    title: "Work experience",
    prompt: "How should I format my work experience?",
  },
  {
    title: "In-demand skills",
    prompt: "What skills are most in-demand right now?",
  },
] as const;

function ChatWelcome({ firstName }: { firstName?: string }) {
  return (
    <div className="mb-6 flex flex-col items-center px-4 text-center">
      <h1 className="font-heading text-2xl font-medium tracking-tight text-balance">
        How can I help you{firstName ? `, ${firstName}` : ""}?
      </h1>
      <p className="mt-2 max-w-md text-pretty text-muted-foreground">
        Resume writing, ATS checks, and tailoring bullets to a posting. Paste
        resume text or a job description to start.
      </p>
    </div>
  );
}

export function ResumeChat({
  chatId,
  initialMessages = [],
  firstName,
}: {
  chatId?: Id<"chats">;
  initialMessages?: ThreadMessageLike[];
  firstName?: string;
}) {
  const router = useRouter();
  const createChat = useMutation(api.chats.createChat);
  const addMessage = useMutation(api.messages.addMessage);
  const chatIdRef = useRef(chatId);
  const persistedIds = useRef(
    new Set(initialMessages.map((message) => message.id).filter(Boolean) as string[]),
  );
  const depsRef = useRef({ createChat, addMessage, router, chatId });
  depsRef.current = { createChat, addMessage, router, chatId };

  const adapterRef = useRef<ChatModelAdapter>({
    async *run({ messages, abortSignal }) {
      const { createChat: create, addMessage: save, router: nav, chatId: routeChatId } =
        depsRef.current;
      let currentId = chatIdRef.current;
      const last = messages[messages.length - 1];

      if (last?.role === "user" && !persistedIds.current.has(last.id)) {
        const userText = threadMessageText(last);
        if (!currentId) {
          currentId = await create({ title: chatTitleFromText(userText) });
          chatIdRef.current = currentId;
        }
        if (userText) {
          await save({ chatId: currentId, role: "user", content: userText });
          persistedIds.current.add(last.id);
        }
      }

      const payload = messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({
          role: message.role,
          content: threadMessageText(message),
        }))
        .filter((message) => message.content);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          typeof error.error === "string" ? error.error : "Failed to get a response",
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        yield { content: [{ type: "text" as const, text }] };
      }

      const reply = text.trim();
      if (currentId && reply) {
        await save({ chatId: currentId, role: "assistant", content: reply });
      }
      if (!routeChatId && currentId) {
        nav.replace(`/dashboard/chat/${currentId}`);
      }
    },
  });

  const runtime = useLocalRuntime(adapterRef.current, {
    initialMessages,
    adapters: {
      suggestion: {
        generate: async ({ messages }) => (messages.length === 0 ? SUGGESTIONS : []),
      },
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread
        components={{
          Welcome: () => <ChatWelcome firstName={firstName} />,
        }}
      />
    </AssistantRuntimeProvider>
  );
}
