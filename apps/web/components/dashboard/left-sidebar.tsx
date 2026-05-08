"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Inbox,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  PanelLeft,
  Trash,
  Check,
  FileText,
  Loader2,
  type LucideIcon,
} from "lucide-react";

import { SearchModal } from "./search-modal";

import { Navigator } from "../../lib/navigator";
import {
  api,
  getWorkspaceId,
  resolveWorkspaceId,
  storeWorkspaceId,
  subscribeToWorkspaceChange,
  type WorkspaceSummary,
} from "../../lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";


const isRouteActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  level = 0,
  isExpandable,
  expanded,
  onToggle,
  href,
  onClick,
  isCollapsed,
  badge,
}: {
  icon?: LucideIcon;
  label: string;
  active?: boolean;
  level?: number;
  isExpandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  isCollapsed?: boolean;
  badge?: number;
}) => {
  const paddingLeft = isCollapsed ? "0px" : `${8 + level * 16}px`;
  const hasSplitTargets = href && isExpandable && !isCollapsed;

  const handleContainerClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e);
    else if (isExpandable && onToggle && !hasSplitTargets) {
      e.preventDefault();
      onToggle();
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    if (isExpandable && onToggle) {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }
  };

  const content = (
    <div
      onClick={handleContainerClick}
      className={`group flex items-center py-1.25 mx-2 rounded-[5px] cursor-pointer ${
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-75"
      } ${isCollapsed ? "justify-center px-0" : "pr-2"}`}
      style={{ paddingLeft: isCollapsed ? undefined : paddingLeft }}
      title={isCollapsed ? label : undefined}
    >
      {isExpandable && !isCollapsed ? (
        <div
          className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75"
          onClick={hasSplitTargets ? handleChevronClick : undefined}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </div>
      ) : Icon ? (
        <div
          className={`flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75 ${
            isCollapsed ? "" : "w-5"
          }`}
        >
          <Icon className={`w-3.5 h-3.5 ${active ? "text-foreground" : ""}`} />
        </div>
      ) : (
        !isCollapsed && <div className="w-5 shrink-0" />
      )}
      {!isCollapsed && (
        <>
          <span className="text-[13px] font-medium truncate leading-5">
            {label}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-auto text-[11px] font-normal text-muted-foreground shrink-0">
              {badge}
            </span>
          )}
        </>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
};

type LeftSidebarProps = {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function LeftSidebar({
  isCollapsed = false,
  onToggleCollapse,
}: LeftSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    pages: false,
    quickNote: false,
    area: false,
    projects: false,
  });
  const [areas, setAreas] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
  const [quickNotes, setQuickNotes] = useState<any[]>([]);


  const currentWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    workspaces[0] ??
    null;

  useEffect(() => {
    const fetchQuickNotes = async () => {
      try {
        const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
        if (!workspaceId) return;
        const res = await api.get<{ data: any[] }>(
          `/workspaces/${workspaceId}/item/quick-note`,
        );
        setQuickNotes(res.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch quick notes for sidebar:", err);
      }
    };

    if (expanded.quickNote) {
      fetchQuickNotes();
    }
  }, [activeWorkspaceId, expanded.quickNote]);

  useEffect(() => {
    const fetchSessionAndWorkspaces = async () => {
      setIsWorkspaceLoading(true);
      try {
        const res = (await api.get("/auth/me")) as any;
        const rawName = res.data?.user?.name || res.data?.name;
        const rawEmail = res.data?.user?.email || res.data?.email;
        const defaultWorkspaceId = res.data?.user?.workspaceId ?? null;

        if (rawEmail) {
          setUserEmail(rawEmail);
        }

        if (rawName) {
          const formatted = rawName
            .split(" ")
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join("");
          setUserName(formatted);
        }

        const workspaceRes = await api.get<{ data: WorkspaceSummary[] }>(
          "/workspaces",
        );
        setWorkspaces(workspaceRes.data);

        const storedWorkspaceId = getWorkspaceId();
        const storedWorkspace = workspaceRes.data.find(
          (workspace) => workspace.id === storedWorkspaceId,
        );
        const defaultWorkspace = workspaceRes.data.find(
          (workspace) => workspace.id === defaultWorkspaceId,
        );
        const nextWorkspace =
          storedWorkspace ?? defaultWorkspace ?? workspaceRes.data[0] ?? null;

        if (nextWorkspace) {
          setActiveWorkspaceId(nextWorkspace.id);
          if (!storedWorkspaceId || storedWorkspaceId !== nextWorkspace.id) {
            storeWorkspaceId(nextWorkspace.id);
          }
        }
      } catch {
        setUserName("User");
      } finally {
        setIsWorkspaceLoading(false);
      }
    };
    fetchSessionAndWorkspaces();
  }, []);

  useEffect(() => {
    setAreas([]);
    setProjects([]);
    setAreasLoading(false);
  }, [activeWorkspaceId]);

  useEffect(() => {
    return subscribeToWorkspaceChange((workspaceId) => {
      setActiveWorkspaceId(workspaceId);
      setQuickNotes([]);
      setAreas([]);
      setProjects([]);
      setAreasLoading(false);
    });
  }, []);

  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search (works everywhere)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      // N key to open quick note
      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        e.key.toLowerCase() === "n"
      ) {
        e.preventDefault();
        router.push("/dashboard/quick-note/new");
        return;
      }

      // Cmd/Ctrl + Alt + T to toggle theme
      const isT = e.key.toLowerCase() === "t" || e.code === "KeyT";
      if ((e.metaKey || e.ctrlKey) && e.altKey && isT) {
        e.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }
    };

    window.addEventListener("keydown", handleGlobalShortcut, true);
    return () =>
      window.removeEventListener("keydown", handleGlobalShortcut, true);
  }, [resolvedTheme, setTheme]);

  const toggle = (section: string) =>
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));

  const toggleArea = (id: string) => {
    setOpenAreas((prev) => {
      const isCurrentlyOpen = !!prev[id];
      if (isCurrentlyOpen) return { ...prev, [id]: false };
      const newState: Record<string, boolean> = {};
      for (const key in prev) newState[key] = false;
      newState[id] = true;
      return newState;
    });
  };

  const switchWorkspace = (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) return;
    storeWorkspaceId(workspaceId);
    setActiveWorkspaceId(workspaceId);
    setQuickNotes([]);
    setAreas([]);
    setProjects([]);
    setSelectedWorkspaceRoute();
  };

  const setSelectedWorkspaceRoute = () => {
    router.push("/dashboard");
  };

  const createWorkspace = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newWorkspaceName.trim();
    if (!name || isCreatingWorkspace) return;

    setIsCreatingWorkspace(true);
    try {
      const res = await api.post<{ data: WorkspaceSummary }>("/workspaces", {
        name,
      });
      setWorkspaces((prev) => [...prev, res.data]);
      storeWorkspaceId(res.data.id);
      setActiveWorkspaceId(res.data.id);
      setQuickNotes([]);
      setAreas([]);
      setProjects([]);
      setNewWorkspaceName("");
      setSelectedWorkspaceRoute();
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  return (
    <div className="flex flex-col border-r border-border bg-surface w-full h-full font-sans antialiased text-foreground">
      {/* SECTION 1: LOGO */}
      <div
        className={`h-10 flex items-center px-1 mx-2 mt-3 mb-3 rounded-md transition-colors duration-75 group ${
          isCollapsed ? "justify-center px-0 hover:bg-muted cursor-pointer" : ""
        }`}
        onClick={isCollapsed ? onToggleCollapse : undefined}
        title={isCollapsed ? "Expand sidebar" : undefined}
      >
        <div className="w-5 h-5 bg-primary rounded-[4px] flex items-center justify-center shrink-0 ml-1">
          <div className="w-2.5 h-2.5 bg-primary-foreground rounded-sm" />
        </div>

        {!isCollapsed && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center ml-2 gap-1 flex-1 min-w-0 hover:bg-muted px-1.5 py-1 rounded-[6px] transition-colors cursor-pointer group/logo">
                  <span className="text-[14px] font-medium truncate text-foreground">
                    {currentWorkspace?.name ?? `${userName}'s HypeMind`}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[300px] border-border bg-surface shadow-xl rounded-[8px] p-0 overflow-hidden"
              >
                {/* Header Section */}
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-foreground font-medium text-lg shrink-0 border border-border/50">
                    {(currentWorkspace?.name ?? userName)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-semibold text-foreground truncate">
                      {currentWorkspace?.name ?? "Loading workspace"}
                    </span>
                    <span className="text-[12px] text-muted-foreground truncate">
                      {currentWorkspace
                        ? `${currentWorkspace.role.toLowerCase()} - ${currentWorkspace.memberCount} member${currentWorkspace.memberCount === 1 ? "" : "s"}`
                        : "Syncing..."}
                    </span>
                  </div>
                </div>

                <div className="h-[1px] bg-border/50 w-full" />

                {/* Email and Workspace Section */}
                <div className="px-1 py-1.5 mt-1">
                  <div className="flex items-center justify-between px-2 py-1.5 mb-1 group/email">
                    <span className="text-[11px] text-muted-foreground font-medium truncate flex-1 pr-2">
                      {userEmail || "user@example.com"}
                    </span>
                    {isWorkspaceLoading && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      className="cursor-pointer py-1.5 px-2 gap-3 focus:bg-muted focus:text-foreground rounded-[6px]"
                      onClick={() => switchWorkspace(workspace.id)}
                    >
                      <div className="w-5 h-5 rounded-[4px] bg-muted flex items-center justify-center text-foreground text-[11px] font-medium shrink-0 border border-border/50">
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium flex-1 truncate text-foreground">
                        {workspace.name}
                      </span>
                      {workspace.id === activeWorkspaceId && (
                        <Check className="w-4 h-4 text-foreground shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}

                  {/* New Workspace Button */}
                  <div className="px-2 py-2.5">
                    <form
                      onSubmit={createWorkspace}
                      className="flex items-center gap-2"
                    >
                      <input
                        value={newWorkspaceName}
                        onChange={(event) =>
                          setNewWorkspaceName(event.target.value)
                        }
                        placeholder="New workspace"
                        className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      />
                      <button
                        type="submit"
                        disabled={
                          isCreatingWorkspace || !newWorkspaceName.trim()
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-primary transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        title="Create workspace"
                      >
                        {isCreatingWorkspace ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="h-[1px] bg-border/50 w-full" />

                <div className="p-1 mb-1">
                  <DropdownMenuItem className="cursor-pointer py-1.5 px-3 text-[13px] text-muted-foreground focus:text-foreground rounded-[6px]">
                    Add another account
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-1.5 px-3 text-[13px] text-muted-foreground focus:text-foreground rounded-[6px]">
                    Log out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-75 shrink-0 pr-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.();
                }}
                className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded-[4px] text-muted-foreground hover:text-foreground transition-colors outline-none"
                title="Collapse Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-1">
        {/* SECTION 2: SEARCH, HOME, INBOX */}
        <div className="space-y-0.5">
          <div className="relative group/search">
            <SidebarItem
              icon={Search}
              label="Search"
              isCollapsed={isCollapsed}
              onClick={() => setIsSearchOpen(true)}
            />
            <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+4px)] opacity-0 group-hover/search:opacity-100 pointer-events-none transition-opacity duration-200 z-[100] flex items-center gap-2 whitespace-nowrap bg-foreground text-background px-2.5 py-1.5 rounded-md shadow-lg border border-border/10">
              <span className="text-[12px] font-medium">
                Search
              </span>
              <kbd className="text-[10px] font-sans bg-background/20 text-background px-1.5 py-0.5 rounded border border-background/20">
                ⌘K
              </kbd>
            </div>
          </div>
          <SidebarItem
            icon={Home}
            label="Home"
            href="/dashboard"
            active={isRouteActive(pathname, "/")}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={Inbox}
            label="Inbox"
            href={Navigator.inbox()}
            active={isRouteActive(pathname, Navigator.inbox())}
            isCollapsed={isCollapsed}
          />
        </div>

        <div className="h-5" />

        {/* SECTION 3: PAGES, QUICK NOTE */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            {/* Pages Section */}
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2"
              style={{ paddingLeft: "8px" }}
            >
              <div
                className="flex items-center gap-0"
                onClick={() => toggle("pages")}
              >
                <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  {expanded["pages"] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-75 leading-5">
                  Pages
                </span>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                <div
                  className="p-0.5 hover:bg-muted rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                  title="New page"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {expanded["pages"] && <>{/* Empty for now, as requested */}</>}

            {/* Quick Note Section */}
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2"
              style={{ paddingLeft: "8px" }}
            >
              <div
                className="flex items-center gap-0"
                onClick={() => toggle("quickNote")}
              >
                <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  {expanded["quickNote"] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-75 leading-5">
                  Quick Notes
                </span>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                <div className="relative group/tooltip flex items-center">
                  <div
                    className="p-0.5 hover:bg-muted rounded-[3px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/dashboard/quick-note/new");
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute top-[120%] right-0 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity duration-200 z-[100] flex items-center gap-2 whitespace-nowrap bg-foreground text-background px-2.5 py-1.5 rounded-md shadow-lg border border-border/10">
                    <span className="text-[12px] font-medium">
                      New Quick Note
                    </span>
                    <kbd className="text-[10px] font-sans bg-background/20 text-background px-1.5 py-0.5 rounded border border-background/20">
                      N
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            {expanded["quickNote"] && (
              <div className="mt-1">
                {quickNotes.map((note) => (
                  <SidebarItem
                    key={note.id}
                    icon={FileText}
                    label={
                      note.title ||
                      note.contentString?.slice(0, 20) ||
                      "Untitled Note"
                    }
                    href={`/dashboard/quick-note?id=${note.id}`}
                    active={pathname.includes(note.id)}
                    level={1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-5" />

        {/* SECTION 4: AREAS AND PROJECTS */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            {/* Areas Section */}
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2"
              style={{ paddingLeft: "8px" }}
            >
              <div
                className="flex items-center gap-0"
                onClick={() => toggle("area")}
              >
                <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  {expanded["area"] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-75 leading-5">
                  Areas
                </span>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                <div
                  className="p-0.5 hover:bg-muted rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Area options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </div>
                <div
                  className="p-0.5 hover:bg-muted rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Create area"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {expanded["area"] && (
              <>
                {areasLoading && (
                  <div className="px-8 py-2 text-[13px] text-muted-foreground">
                    Loading areas...
                  </div>
                )}
                {!areasLoading && areas.length === 0 && (
                  <div className="px-8 py-2 text-[13px] text-muted-foreground">
                    No areas found.
                  </div>
                )}
                {!areasLoading &&
                  areas.map((area) => (
                    <div
                      key={area.id}
                      className="group/area flex items-center mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-75"
                      style={{ paddingLeft: `${8 + 1 * 16}px` }}
                      onClick={() => toggleArea(area.id)}
                    >
                      <div className="w-5 flex shrink-0 items-center justify-start">
                        {openAreas[area.id] ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-[13px] font-medium truncate leading-5 flex-1">
                        {area.title}
                      </span>
                    </div>
                  ))}
              </>
            )}

            {/* Projects Section */}
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2"
              style={{ paddingLeft: "8px" }}
            >
              <div
                className="flex items-center gap-0"
                onClick={() => toggle("projects")}
              >
                <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  {expanded["projects"] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-75 leading-5">
                  Projects
                </span>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                <div
                  className="p-0.5 hover:bg-muted rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Create project"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {expanded["projects"] && (
              <>
                {areasLoading && (
                  <div className="px-8 py-2 text-[13px] text-muted-foreground">
                    Loading projects...
                  </div>
                )}
                {!areasLoading && projects.length === 0 && (
                  <div className="px-8 py-2 text-[13px] text-muted-foreground">
                    No projects found.
                  </div>
                )}
                {!areasLoading &&
                  projects.map((project) => (
                    <SidebarItem
                      key={project.id}
                      label={project.title}
                      level={1}
                      href={Navigator.project(project.id)}
                      active={isRouteActive(
                        pathname,
                        Navigator.project(project.id),
                      )}
                    />
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* SECTION 5: TRASH, SETTINGS */}
      <div className="py-2 space-y-0.5 bg-surface mt-auto shrink-0">
        <SidebarItem
          icon={Trash}
          label="Trash"
          href={Navigator.trash()}
          active={isRouteActive(pathname, Navigator.trash())}
          isCollapsed={isCollapsed}
        />
        <SidebarItem
          icon={Settings}
          label="Settings"
          href={Navigator.settings()}
          active={isRouteActive(pathname, Navigator.settings())}
          isCollapsed={isCollapsed}
        />
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
