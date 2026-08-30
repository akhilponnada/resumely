"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";

function headerTitle(pathname: string) {
  if (pathname.startsWith("/dashboard/chat")) return "AI Chat";
  if (pathname.startsWith("/dashboard/jobs")) return "Jobs";
  if (pathname.startsWith("/dashboard/new")) return "Create resume";
  if (pathname.startsWith("/dashboard/resumes") || pathname.startsWith("/resume/")) {
    return "Resumes";
  }
  if (pathname === "/dashboard") return "Dashboard";
  return "Resumely";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isChat = pathname.startsWith("/dashboard/chat");

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div
        className="flex min-h-svh items-center justify-center"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset id="main">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" />
          <p className="truncate text-sm text-muted-foreground">
            {headerTitle(pathname)}
          </p>
        </header>
        <div
          className={
            isChat
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "flex min-h-0 flex-1 flex-col"
          }
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
