"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Sparkles, ArrowUp, Copy, ThumbsUp, ThumbsDown, Paperclip, Check, FileText, Wand2, BookOpen, Code, GraduationCap, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const CATEGORY_BUTTONS = [
    { icon: Wand2, label: "Create", prompt: "Help me create a new resume from scratch" },
    { icon: BookOpen, label: "Explore", prompt: "What can you help me with?" },
    { icon: Code, label: "Tech Resume", prompt: "Help me build a strong tech resume" },
    { icon: GraduationCap, label: "Learn", prompt: "Teach me resume best practices" },
];

const SUGGESTED_PROMPTS = [
    "How do I tailor my resume for a specific job?",
    "What makes a resume ATS-friendly?",
    "How should I format my work experience?",
    "What skills are most in-demand right now?"
];

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface UploadedFile {
    name: string;
    content: string;
}

export default function ChatPage() {
    const { user } = useUser();
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [streamingContent, setStreamingContent] = useState("");
    const [chatId, setChatId] = useState<Id<"chats"> | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mutations
    const createChat = useMutation(api.chats.createChat);
    const addMessage = useMutation(api.messages.addMessage);

    // Auto-focus input on mount and after sending
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

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

    // Handle file upload
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/parse-file", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to upload file");
            }

            const { text, fileName } = await response.json();
            setUploadedFile({ name: fileName, content: text });
        } catch (error) {
            console.error("File upload error:", error);
            alert(error instanceof Error ? error.message : "Failed to upload file");
        } finally {
            setIsUploading(false);
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, []);

    const removeUploadedFile = useCallback(() => {
        setUploadedFile(null);
    }, []);

    const handleSubmit = useCallback(async (messageContent?: string) => {
        let content = (messageContent || input).trim();
        if ((!content && !uploadedFile) || isLoading || !user?.id) return;

        // If there's an uploaded file, prepend its content
        let fullContent = content;
        if (uploadedFile) {
            const fileContext = `[Uploaded File: ${uploadedFile.name}]\n\n${uploadedFile.content}`;
            fullContent = content
                ? `${fileContext}\n\n---\n\nUser message: ${content}`
                : `Please analyze this file and help me with my resume:\n\n${fileContext}`;
            content = content || `Analyze my uploaded file: ${uploadedFile.name}`;
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: uploadedFile ? `📎 ${uploadedFile.name}\n\n${content}` : content
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setUploadedFile(null); // Clear the uploaded file after sending
        setIsLoading(true);
        setStreamingContent("");

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }

        try {
            let currentChatId = chatId;

            // Create new chat if this is the first message
            if (!currentChatId) {
                const title = content.split(" ").slice(0, 5).join(" ") + (content.split(" ").length > 5 ? "..." : "");
                currentChatId = await createChat({
                    userId: user.id,
                    title: title
                });
                setChatId(currentChatId);
            }

            // Add user message to DB
            await addMessage({ chatId: currentChatId, role: "user", content: fullContent });

            // Prepare message history for AI
            const messageHistory = messages.map(m => ({
                role: m.role,
                content: m.content
            }));
            messageHistory.push({ role: "user", content: fullContent });

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
            let responseContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                responseContent += chunk;
                setStreamingContent(responseContent);
            }

            // Add assistant message to state
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: responseContent
            };
            setMessages(prev => [...prev, assistantMessage]);
            setStreamingContent("");

            // Add assistant message to DB
            await addMessage({ chatId: currentChatId, role: "assistant", content: responseContent });

        } catch (error) {
            console.error("Chat error:", error);
            // Add error message to chat
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: `Sorry, there was an error: ${error instanceof Error ? error.message : "Failed to send message"}. Please try again.`
            }]);
        } finally {
            setIsLoading(false);
            // Focus will be restored by the useEffect
        }
    }, [input, isLoading, user?.id, chatId, messages, createChat, addMessage, uploadedFile]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    const hasMessages = messages.length > 0 || streamingContent;

    return (
        <DashboardLayout>
            <div style={{
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 64px)",
                background: "linear-gradient(180deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)"
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
                                minHeight: "50vh",
                                paddingTop: "60px"
                            }}>
                                <h1 style={{
                                    fontSize: "28px",
                                    fontWeight: 600,
                                    color: "#831843",
                                    marginBottom: "24px"
                                }}>
                                    How can I help you, {user?.firstName || "there"}?
                                </h1>

                                {/* Category Buttons */}
                                <div style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                    gap: "12px",
                                    marginBottom: "40px"
                                }}>
                                    {CATEGORY_BUTTONS.map((cat, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSubmit(cat.prompt)}
                                            disabled={isLoading}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "10px 20px",
                                                background: "#ffffff",
                                                border: "1px solid #f9a8d4",
                                                borderRadius: "24px",
                                                fontSize: "14px",
                                                fontWeight: 500,
                                                color: "#9d174d",
                                                cursor: isLoading ? "not-allowed" : "pointer",
                                                transition: "all 0.2s ease",
                                                opacity: isLoading ? 0.5 : 1,
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isLoading) {
                                                    e.currentTarget.style.background = "#fdf2f8";
                                                    e.currentTarget.style.borderColor = "#ec4899";
                                                    e.currentTarget.style.transform = "translateY(-1px)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "#ffffff";
                                                e.currentTarget.style.borderColor = "#f9a8d4";
                                                e.currentTarget.style.transform = "translateY(0)";
                                            }}
                                        >
                                            <cat.icon size={18} />
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Suggested Prompts */}
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1px",
                                    width: "100%",
                                    maxWidth: "500px",
                                    background: "#fce7f3",
                                    borderRadius: "12px",
                                    overflow: "hidden"
                                }}>
                                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSubmit(prompt)}
                                            disabled={isLoading}
                                            style={{
                                                padding: "14px 20px",
                                                background: "rgba(255,255,255,0.7)",
                                                border: "none",
                                                fontSize: "14px",
                                                color: "#9d174d",
                                                cursor: isLoading ? "not-allowed" : "pointer",
                                                transition: "all 0.15s ease",
                                                opacity: isLoading ? 0.5 : 1,
                                                textAlign: "left"
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isLoading) {
                                                    e.currentTarget.style.background = "rgba(255,255,255,0.9)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.7)";
                                            }}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((msg) => (
                            <div key={msg.id} style={{ marginBottom: "24px" }}>
                                {msg.role === "user" ? (
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        marginBottom: "8px"
                                    }}>
                                        <div style={{
                                            background: "#ec4899",
                                            color: "white",
                                            padding: "12px 18px",
                                            borderRadius: "20px 20px 4px 20px",
                                            maxWidth: "70%",
                                            fontSize: "15px",
                                            lineHeight: 1.5,
                                            whiteSpace: "pre-wrap",
                                            boxShadow: "0 2px 8px rgba(236, 72, 153, 0.2)"
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{
                                            display: "flex",
                                            gap: "12px",
                                            alignItems: "flex-start",
                                            background: "rgba(255,255,255,0.7)",
                                            padding: "16px",
                                            borderRadius: "20px 20px 20px 4px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                                        }}>
                                            <div style={{
                                                width: "28px",
                                                height: "28px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                background: "#fdf2f8",
                                                borderRadius: "50%"
                                            }}>
                                                <Sparkles size={16} color="#ec4899" />
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
                                                <div style={{
                                                    display: "flex",
                                                    gap: "4px",
                                                    marginTop: "12px"
                                                }}>
                                                    <button
                                                        onClick={() => copyToClipboard(msg.content, msg.id)}
                                                        style={{
                                                            padding: "6px",
                                                            background: "transparent",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            color: copiedId === msg.id ? "#22c55e" : "var(--accents-4)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--accents-1)"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        {copiedId === msg.id ? <Check size={16} /> : <Copy size={16} />}
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
                                    alignItems: "flex-start",
                                    background: "rgba(255,255,255,0.7)",
                                    padding: "16px",
                                    borderRadius: "20px 20px 20px 4px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                                }}>
                                    <div style={{
                                        width: "28px",
                                        height: "28px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        background: "#fdf2f8",
                                        borderRadius: "50%"
                                    }}>
                                        <Sparkles size={16} color="#ec4899" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {streamingContent ? (
                                            <div className="markdown-content" style={{
                                                lineHeight: 1.7,
                                                fontSize: "15px",
                                                color: "#1f2937"
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
                                                color: "#9d174d",
                                                fontSize: "15px"
                                            }}>
                                                <div className="loader" style={{ width: "14px", height: "14px", borderWidth: "2px", borderColor: "#f9a8d4", borderTopColor: "#ec4899" }} />
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
                    padding: "16px 24px 32px",
                    background: "transparent"
                }}>
                    <div style={{
                        maxWidth: "800px",
                        margin: "0 auto"
                    }}>
                        {/* Uploaded File Preview */}
                        {uploadedFile && (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                background: "rgba(253, 242, 248, 0.95)",
                                borderRadius: "8px 8px 0 0",
                                border: "1px solid #f9a8d4",
                                borderBottom: "none"
                            }}>
                                <FileText size={16} color="#9d174d" />
                                <span style={{ fontSize: "13px", color: "#9d174d", flex: 1 }}>{uploadedFile.name}</span>
                                <button
                                    onClick={removeUploadedFile}
                                    style={{
                                        padding: "4px",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#9d174d",
                                        display: "flex"
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div style={{
                            background: "rgba(253, 242, 248, 0.95)",
                            borderRadius: uploadedFile ? "0 0 16px 16px" : "16px",
                            border: "1px solid #f9a8d4",
                            overflow: "hidden",
                            boxShadow: "0 4px 12px rgba(157, 23, 77, 0.1)"
                        }}>
                            <div style={{
                                display: "flex",
                                alignItems: "flex-end",
                                padding: "16px",
                                gap: "12px"
                            }}>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your message here..."
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
                                        color: "#1f2937"
                                    }}
                                />
                            </div>

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 16px",
                                background: "#fdf2f8"
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px"
                                }}>
                                    {/* Model Selector */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "6px 12px",
                                        background: "#fff",
                                        borderRadius: "20px",
                                        fontSize: "13px",
                                        color: "#9d174d",
                                        fontWeight: 500
                                    }}>
                                        <Sparkles size={14} color="#ec4899" />
                                        <span>GPT-5 mini</span>
                                    </div>

                                    {/* File Upload Button */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".pdf,.docx,.txt,.md"
                                        style={{ display: "none" }}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading || isLoading}
                                        style={{
                                            padding: "8px",
                                            background: "#fff",
                                            border: "none",
                                            borderRadius: "50%",
                                            cursor: isUploading || isLoading ? "not-allowed" : "pointer",
                                            color: "#9d174d",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity: isUploading || isLoading ? 0.5 : 1,
                                            transition: "all 0.15s ease"
                                        }}
                                        title="Upload resume (PDF, DOCX, TXT)"
                                    >
                                        {isUploading ? (
                                            <div className="loader" style={{ width: "18px", height: "18px", borderWidth: "2px" }} />
                                        ) : (
                                            <Paperclip size={18} />
                                        )}
                                    </button>
                                </div>

                                {/* Send Button */}
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={(!input.trim() && !uploadedFile) || isLoading}
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        background: (input.trim() || uploadedFile) && !isLoading ? "#ec4899" : "#f9a8d4",
                                        border: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: (input.trim() || uploadedFile) && !isLoading ? "pointer" : "not-allowed",
                                        transition: "all 0.15s ease"
                                    }}
                                >
                                    <ArrowUp size={18} color="white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
