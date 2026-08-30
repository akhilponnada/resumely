"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
    LayoutDashboard,
    FilePlus,
    Files,
    Briefcase,
    MessageSquare,
    LogOut,
    ChevronDown,
    Settings,
    Plus,
    Trash2,
    ChevronRight,
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useUser();
    const { signOut } = useClerk();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showChats, setShowChats] = useState(true);
    const menuRef = useRef<HTMLDivElement>(null);

    // The signed-in user is derived from the Clerk token on the backend.
    const chats = useQuery(
        api.chats.getChats,
        user?.id ? {} : "skip"
    );
    const deleteChat = useMutation(api.chats.deleteChat);

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
        { name: "Create Resume", href: "/dashboard/new", icon: FilePlus },
        { name: "My Resumes", href: "/dashboard/resumes", icon: Files },
    ];

    const isOnChatPage = pathname?.startsWith("/dashboard/chat");

    const handleDeleteChat = async (e: React.MouseEvent, id: Id<"chats">) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Delete this chat?")) {
            await deleteChat({ id });
        }
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div style={{ padding: "20px", borderBottom: "1px solid var(--accents-2)" }}>
                <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <rect width="24" height="24" rx="6" fill="var(--violet)" />
                        <path d="M7 8h10M7 12h10M7 16h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.3px" }}>Resumely</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--accents-4)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 12px", marginBottom: "4px" }}>
                    Menu
                </div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: isActive ? 500 : 400,
                                color: isActive ? "var(--geist-foreground)" : "var(--accents-5)",
                                background: isActive ? "var(--geist-background)" : "transparent",
                                marginBottom: "2px",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                            {item.name}
                        </Link>
                    );
                })}

                {/* AI Chat Section with Collapsible Chat History */}
                <div style={{ marginTop: "8px" }}>
                    <button
                        onClick={() => setShowChats(!showChats)}
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: isOnChatPage ? 500 : 400,
                            color: isOnChatPage ? "var(--geist-foreground)" : "var(--accents-5)",
                            background: isOnChatPage && !pathname?.includes("/chat/") ? "var(--geist-background)" : "transparent",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <MessageSquare size={18} strokeWidth={isOnChatPage ? 2 : 1.5} />
                            AI Chat
                        </div>
                        <ChevronRight
                            size={14}
                            style={{
                                transform: showChats ? "rotate(90deg)" : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                                color: "var(--accents-4)"
                            }}
                        />
                    </button>

                    {/* Chat History - Collapsible */}
                    {showChats && (
                        <div style={{ marginLeft: "12px", marginTop: "4px" }}>
                            {/* New Chat Button */}
                            <Link
                                href="/dashboard/chat"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 10px",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    color: "var(--violet)",
                                    background: "rgba(124, 58, 237, 0.08)",
                                    marginBottom: "6px",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <Plus size={14} />
                                New Chat
                            </Link>

                            {/* Chat List */}
                            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                {chats?.map((chat) => {
                                    const chatPath = `/dashboard/chat/${chat._id}`;
                                    const isActive = pathname === chatPath;
                                    return (
                                        <Link
                                            key={chat._id}
                                            href={chatPath}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "8px",
                                                padding: "7px 10px",
                                                borderRadius: "6px",
                                                fontSize: "13px",
                                                color: isActive ? "var(--geist-foreground)" : "var(--accents-5)",
                                                background: isActive ? "rgba(0,0,0,0.04)" : "transparent",
                                                marginBottom: "2px",
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            <span style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                flex: 1,
                                            }}>
                                                {chat.title}
                                            </span>
                                            <button
                                                onClick={(e) => handleDeleteChat(e, chat._id)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "var(--accents-4)",
                                                    padding: "2px",
                                                    opacity: 0.6,
                                                    transition: "opacity 0.15s",
                                                    flexShrink: 0,
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </Link>
                                    );
                                })}
                                {chats?.length === 0 && (
                                    <div style={{ padding: "8px 10px", fontSize: "12px", color: "var(--accents-4)" }}>
                                        No chats yet
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* User Menu */}
            <div style={{ padding: "12px", borderTop: "1px solid var(--accents-2)", position: "relative" }} ref={menuRef}>
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        background: showUserMenu ? "var(--geist-background)" : "transparent",
                        border: "1px solid var(--accents-2)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                    }}
                >
                    <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--violet), var(--violet-light))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 600,
                        flexShrink: 0,
                    }}>
                        {user?.firstName?.[0]?.toUpperCase() || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {user?.firstName || "User"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--accents-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {user?.emailAddresses?.[0]?.emailAddress}
                        </div>
                    </div>
                    <ChevronDown size={16} color="var(--accents-4)" style={{ transform: showUserMenu ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                    <div style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "12px",
                        right: "12px",
                        marginBottom: "8px",
                        background: "var(--geist-background)",
                        border: "1px solid var(--accents-2)",
                        borderRadius: "10px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        overflow: "hidden",
                        zIndex: 100,
                    }}>
                        <button
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px 14px",
                                background: "transparent",
                                border: "none",
                                borderBottom: "1px solid var(--accents-2)",
                                cursor: "pointer",
                                fontSize: "13px",
                                color: "var(--accents-6)",
                            }}
                        >
                            <Settings size={16} />
                            Settings
                        </button>
                        <button
                            onClick={() => signOut()}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px 14px",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                                color: "#e00",
                            }}
                        >
                            <LogOut size={16} />
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
