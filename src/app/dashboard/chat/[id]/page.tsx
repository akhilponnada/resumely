"use client";

import { useState, useRef, useEffect, useCallback, use } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowUp, Sparkles, Copy, ThumbsUp, ThumbsDown, Paperclip, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface ChatPageProps {
    params: Promise<{ id: string }>;
}

export default function ChatDetailPage({ params }: ChatPageProps) {
    const resolvedParams = use(params);
    const chatId = resolvedParams.id as Id<"chats">;

    const { user } = useUser();
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Queries & Mutations
    const messages = useQuery(api.messages.getMessages, { chatId });
    const addMessage = useMutation(api.messages.addMessage);

    // Auto-focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px";
        }
    }, [input]);

    // Focus input after loading completes
    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);

    const copyToClipboard = useCallback((text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading || !user?.id) return;

        const content = input.trim();
        setInput("");
        setIsLoading(true);
        setStreamingContent("");

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }

        try {
            // Add user message to DB
            await addMessage({ chatId, role: "user", content });

            // Prepare message history for AI
            const messageHistory = messages
                ? [...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content }]
                : [{ role: "user", content }];

            // Call AI API with streaming
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: messageHistory }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to get response");
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let fullContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;
                setStreamingContent(fullContent);
            }

            // Add assistant message to DB
            await addMessage({ chatId, role: "assistant", content: fullContent });

        } catch (error) {
            console.error("Chat error:", error);
            alert(error instanceof Error ? error.message : "Failed to send message");
        } finally {
            setIsLoading(false);
            setStreamingContent("");
            // Focus will be restored by the useEffect
        }
    }, [input, isLoading, user?.id, chatId, messages, addMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    return (
        <DashboardLayout>
            <div style={{
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 64px)",
                background: "#ffffff"
            }}>
                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "24px"
                }}>
                    <div style={{
                        maxWidth: "800px",
                        margin: "0 auto"
                    }}>
                        {/* Messages */}
                        {messages ? (
                            messages.map((m) => (
                                <div key={m._id} style={{ marginBottom: "24px" }}>
                                    {m.role === "user" ? (
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            marginBottom: "8px"
                                        }}>
                                            <div style={{
                                                background: "#2563eb",
                                                color: "white",
                                                padding: "10px 16px",
                                                borderRadius: "20px",
                                                maxWidth: "70%",
                                                fontSize: "15px",
                                                lineHeight: 1.5,
                                                whiteSpace: "pre-wrap"
                                            }}>
                                                {m.content}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{
                                                display: "flex",
                                                gap: "12px",
                                                alignItems: "flex-start"
                                            }}>
                                                <div style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                    marginTop: "2px"
                                                }}>
                                                    <Sparkles size={18} color="var(--accents-5)" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div className="markdown-content" style={{
                                                        lineHeight: 1.7,
                                                        fontSize: "15px",
                                                        color: "var(--geist-foreground)"
                                                    }}>
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {m.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                    <div style={{
                                                        display: "flex",
                                                        gap: "4px",
                                                        marginTop: "12px"
                                                    }}>
                                                        <button
                                                            onClick={() => copyToClipboard(m.content, m._id)}
                                                            style={{
                                                                padding: "6px",
                                                                background: "transparent",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                color: copiedId === m._id ? "#22c55e" : "var(--accents-4)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center"
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--accents-1)"}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                        >
                                                            {copiedId === m._id ? <Check size={16} /> : <Copy size={16} />}
                                                        </button>
                                                        <button
                                                            style={{
                                                                padding: "6px",
                                                                background: "transparent",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                color: "var(--accents-4)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center"
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--accents-1)"}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                        >
                                                            <ThumbsUp size={16} />
                                                        </button>
                                                        <button
                                                            style={{
                                                                padding: "6px",
                                                                background: "transparent",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                color: "var(--accents-4)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center"
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--accents-1)"}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                        >
                                                            <ThumbsDown size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                padding: "48px"
                            }}>
                                <div className="loader" />
                            </div>
                        )}

                        {/* Streaming Response */}
                        {(isLoading || streamingContent) && (
                            <div style={{ marginBottom: "24px" }}>
                                <div style={{
                                    display: "flex",
                                    gap: "12px",
                                    alignItems: "flex-start"
                                }}>
                                    <div style={{
                                        width: "24px",
                                        height: "24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        marginTop: "2px"
                                    }}>
                                        <Sparkles size={18} color="var(--accents-5)" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {streamingContent ? (
                                            <div className="markdown-content" style={{
                                                lineHeight: 1.7,
                                                fontSize: "15px"
                                            }}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {streamingContent}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                color: "var(--accents-5)",
                                                fontSize: "15px"
                                            }}>
                                                <div className="loader" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                                                <span>Thinking...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div style={{
                    padding: "12px 24px 24px",
                    background: "#ffffff"
                }}>
                    <div style={{
                        maxWidth: "800px",
                        margin: "0 auto"
                    }}>
                        <div style={{
                            border: "1px solid var(--accents-2)",
                            borderRadius: "12px",
                            overflow: "hidden"
                        }}>
                            <div style={{
                                display: "flex",
                                alignItems: "flex-end",
                                padding: "12px 16px",
                                gap: "12px"
                            }}>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Send a message..."
                                    disabled={isLoading}
                                    rows={1}
                                    style={{
                                        flex: 1,
                                        border: "none",
                                        background: "transparent",
                                        fontSize: "15px",
                                        resize: "none",
                                        outline: "none",
                                        fontFamily: "inherit",
                                        lineHeight: 1.5,
                                        maxHeight: "200px",
                                        padding: "4px 0",
                                        color: "var(--geist-foreground)"
                                    }}
                                />
                            </div>

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                borderTop: "1px solid var(--accents-2)",
                                background: "#fafafa"
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px"
                                }}>
                                    <button
                                        style={{
                                            padding: "6px",
                                            background: "transparent",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            color: "var(--accents-4)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        fontSize: "13px",
                                        color: "var(--accents-5)"
                                    }}>
                                        <Sparkles size={14} />
                                        <span>Claude Opus 4.5</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={!input.trim() || isLoading}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "8px",
                                        background: input.trim() && !isLoading ? "var(--geist-foreground)" : "var(--accents-2)",
                                        border: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                                        transition: "all 0.15s ease"
                                    }}
                                >
                                    <ArrowUp size={16} color={input.trim() && !isLoading ? "white" : "var(--accents-4)"} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
