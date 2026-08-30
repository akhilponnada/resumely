"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
  BriefcaseIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  FilePlusIcon,
  FilesIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BrandMark } from "@/components/BrandMark";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { name: "Jobs", href: "/dashboard/jobs", icon: BriefcaseIcon },
  { name: "Create resume", href: "/dashboard/new", icon: FilePlusIcon },
  { name: "My resumes", href: "/dashboard/resumes", icon: FilesIcon },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/resumes") {
    return pathname.startsWith("/dashboard/resumes") || pathname.startsWith("/resume/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const chats = useQuery(api.chats.getChats, user?.id ? {} : "skip");
  const deleteChat = useMutation(api.chats.deleteChat);
  const [deleteId, setDeleteId] = useState<Id<"chats"> | null>(null);
  const isChat = pathname.startsWith("/dashboard/chat");
  const email = user?.emailAddresses[0]?.emailAddress;
  const initials =
    user?.firstName?.[0]?.toUpperCase() ||
    email?.[0]?.toUpperCase() ||
    "U";

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href="/dashboard" />}
                tooltip="Resumely"
              >
                <BrandMark className="size-8" />
                <span className="font-heading text-base">Resumely</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isNavActive(pathname, item.href)}
                      render={<Link href={item.href} />}
                      tooltip={item.name}
                    >
                      <item.icon />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <Collapsible defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuButton
                          isActive={isChat}
                          tooltip="AI Chat"
                        />
                      }
                    >
                      <MessageSquareIcon />
                      <span>AI Chat</span>
                      <ChevronRightIcon className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            render={<Link href="/dashboard/chat" />}
                            isActive={pathname === "/dashboard/chat"}
                          >
                            <PlusIcon />
                            <span>New chat</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        {chats?.map((chat) => {
                          const href = `/dashboard/chat/${chat._id}`;
                          return (
                            <SidebarMenuSubItem key={chat._id}>
                              <SidebarMenuSubButton
                                render={<Link href={href} />}
                                isActive={pathname === href}
                              >
                                <span>{chat.title}</span>
                              </SidebarMenuSubButton>
                              <SidebarMenuAction
                                aria-label={`Delete ${chat.title}`}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setDeleteId(chat._id);
                                }}
                              >
                                <Trash2Icon />
                              </SidebarMenuAction>
                            </SidebarMenuSubItem>
                          );
                        })}
                        {chats?.length === 0 ? (
                          <SidebarMenuSubItem>
                            <span className="px-2 py-1.5 text-xs text-muted-foreground">
                              No chats yet
                            </span>
                          </SidebarMenuSubItem>
                        ) : null}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<SidebarMenuButton size="lg" />}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.firstName || "Account"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="min-w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {email ?? "Signed in"}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => signOut({ redirectUrl: "/" })}
                    >
                      <LogOutIcon />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Messages in this conversation will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!deleteId) return;
                const id = deleteId;
                setDeleteId(null);
                await deleteChat({ id });
                if (pathname === `/dashboard/chat/${id}`) {
                  router.push("/dashboard/chat");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
