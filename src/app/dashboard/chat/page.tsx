"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Sparkles, ArrowUp, Copy, ThumbsUp, ThumbsDown, Paperclip } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";

const SUGGESTED_PROMPTS = [
    "Paste a job description to tailor my resume",
    "Help me write a strong resume summary",
    "What skills should I highlight for a tech role?",
    "How can I optimize my resume for ATS?"
];

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatPage() {
    const { user } = useUser();
    const router = useRouter();
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [streamingContent, setStreamingContent] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mutations
    const createChat = useMutation(api.chats.createChat);
    const addMessage = useMutation(api.messages.addMessage);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px";
        }
    }, [input]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleSubmit = async (message?: string) => {
        const content = (message || input).trim();
        if (!content || isLoading || !user?.id) return;

        const userMessage: Message = { role: "user", content };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setStreamingContent("");

        try {
            // Create new chat
            const title = content.split(" ").slice(0, 5).join(" ") + (content.split(" ").length > 5 ? "..." : "");
            const chatId = await createChat({
                userId: user.id,
                title: title
            });

            // Add user message
            await addMessage({ chatId, role: "user", content });

            // Call AI API
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content }]
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to get response");
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader");

            const decoder = new TextDecoder();
            let fullContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;
                setStreamingContent(fullContent);
            }

            // Add assistant message
            setMessages(prev => [...prev, { role: "assistant", content: fullContent }]);
            setStreamingContent("");

            // Add assistant message to DB
            await addMessage({ chatId, role: "assistant", content: fullContent });

            // Navigate to the chat
            router.push(`/dashboard/chat/${chatId}`);

        } catch (error) {
            console.error("Chat error:", error);
            alert(error instanceof Error ? error.message : "Failed to send message");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const hasMessages = messages.length > 0 || streamingContent;

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
                        {/* Welcome State */}
                        {!hasMessages && (
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: "60vh"
                            }}>
                                <h1 style={{
                                    fontSize: "28px",
                                    fontWeight: 600,
                                    color: "var(--geist-foreground)",
                                    marginBottom: "8px"
                                }}>
                                    Hello there!
                                </h1>
                                <p style={{
                                    fontSize: "16px",
                                    color: "var(--accents-5)",
                                    marginBottom: "8px"
                                }}>
                                    How can I help you today?
                                </p>
                                <p style={{
                                    fontSize: "14px",
                                    color: "var(--accents-4)",
                                    marginBottom: "40px"
                                }}>
                                    💡 Tip: Paste a job description to get a tailored resume!
                                </p>

                                {/* Suggested Prompts */}
                                <div style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                    gap: "10px",
                                    maxWidth: "600px"
                                }}>
                                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSubmit(prompt)}
                                            style={{
                                                padding: "10px 16px",
                                                background: "#ffffff",
                                                border: "1px solid var(--accents-2)",
                                                borderRadius: "20px",
                                                fontSize: "13px",
                                                color: "var(--geist-foreground)",
                                                cursor: "pointer",
                                                transition: "all 0.15s ease"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "#f9fafb";
                                                e.currentTarget.style.borderColor = "var(--accents-3)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "#ffffff";
                                                e.currentTarget.style.borderColor = "var(--accents-2)";
                                            }}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((msg, i) => (
                            <div key={i} style={{ marginBottom: "24px" }}>
                                {msg.role === "user" ? (
                                    // User message - right aligned bubble
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
                                            lineHeight: 1.5
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : (
                                    // Assistant message - left aligned with icon
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
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                                {/* Action buttons */}
                                                <div style={{
                                                    display: "flex",
                                                    gap: "4px",
                                                    marginTop: "12px"
                                                }}>
                                                    <button
                                                        onClick={() => copyToClipboard(msg.content)}
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
                                                        <Copy size={16} />
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
                        ))}

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

                {/* Input Area - Pinned to bottom */}
                <div style={{
                    padding: "12px 24px 0",
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
                            {/* Input Row */}
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

                            {/* Bottom Row - Model & Send */}
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
