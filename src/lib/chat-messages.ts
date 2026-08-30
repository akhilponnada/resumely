import type { ThreadMessage, ThreadMessageLike } from "@assistant-ui/react";

export function convexToThreadMessages(
  messages: { _id: string; role: string; content: string }[],
): ThreadMessageLike[] {
  return messages.map((message) => ({
    id: message._id,
    role: message.role as "user" | "assistant",
    content: message.content,
  }));
}

export function threadMessageText(message: {
  content: ThreadMessage["content"] | string;
}): string {
  if (typeof message.content === "string") return message.content.trim();
  return message.content
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function chatTitleFromText(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "New chat";
  const title = words.slice(0, 5).join(" ");
  return words.length > 5 ? `${title}…` : title;
}
