"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Inbox,
  Plus,
  Search,
  Settings,
  PanelLeft,
  Trash,
  Check,
  FileText,
  FilePenLine,
  Loader2,
  Folder,
  Pin,
  PenLine,
  MoreHorizontal,
  Copy,
  CopyPlus,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

import { SearchModal } from "./search-modal";
import { NewProjectDialog } from "./new-project-dialog";
import { AreaProjectAssignmentPopover } from "./area-project-assignment-popover";
import { ProjectAreaAssignmentPopover } from "./project-area-assignment-popover";
import { PinnedAssignmentPopover } from "./pinned-assignment-popover";
import { NewAreaDialog } from "./new-area-dialog";
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
  DropdownMenuSeparator,
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
  rightElement,
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
  rightElement?: React.ReactNode;
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
      className={`group flex items-center py-1.25 mx-2 rounded-[5px] cursor-pointer select-none ${
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
          <span className="text-[13px] font-medium truncate leading-5 flex-1">
            {label}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-auto text-[11px] font-normal text-muted-foreground shrink-0">
              {badge}
            </span>
          )}
          {rightElement && (
            <div
              className="ml-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-75"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {rightElement}
            </div>
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

type QuickNoteSummary = {
  id: string;
  title?: string | null;
  contentString?: string | null;
  tags?: string[];
  updatedAt?: string;
};

type SidebarTreeItem = {
  id: string;
  title: string;
};

type AreaTreeItem = {
  id: string;
  title: string;
  projects: SidebarTreeItem[];
};

type AuthMeResponse = {
  data?: {
    user?: {
      name?: string | null;
      email?: string | null;
      workspaceId?: string | null;
    };
    name?: string | null;
    email?: string | null;
  };
  name?: string | null;
  email?: string | null;
};

export function LeftSidebar({
  isCollapsed = false,
  onToggleCollapse,
}: LeftSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const [isMounted, setIsMounted] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    pages: false,
    quickNote: false,
    area: false,
    projects: false,
    pinned: false,
  });
  const [areas, setAreas] = useState<AreaTreeItem[]>([]);
  const [projects, setProjects] = useState<SidebarTreeItem[]>([]);
  const [pinnedItems, setPinnedItems] = useState<{ areas: any[], projects: any[], items: any[] }>({ areas: [], projects: [], items: [] });
  const [areasLoading, setAreasLoading] = useState(true);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
  const [quickNotes, setQuickNotes] = useState<QuickNoteSummary[]>([]);
  const [quickNotesLoading, setQuickNotesLoading] = useState(false);
  const [isCreatingQuickNote, setIsCreatingQuickNote] = useState(false);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isNewAreaDialogOpen, setIsNewAreaDialogOpen] = useState(false);
  const [isAreaProjectPopoverOpen, setIsAreaProjectPopoverOpen] = useState(false);
  const [isProjectAreaPopoverOpen, setIsProjectAreaPopoverOpen] = useState(false);
  const [activeProjectIdForArea, setActiveProjectIdForArea] = useState<string | undefined>();
  const [projectToEdit, setProjectToEdit] = useState<{ id: string; title: string; description?: string; tags?: string[] } | null>(null);
  const [areaToEdit, setAreaToEdit] = useState<{ id: string; title: string; description?: string; tags?: string[] } | null>(null);
  const [isPinnedPopoverOpen, setIsPinnedPopoverOpen] = useState(false);
  const [activeAreaIdForProject, setActiveAreaIdForProject] = useState<string | undefined>();
  const [globalPages, setGlobalPages] = useState<{ id: string; title: string; isPinned?: boolean }[]>([]);
  const [selectedGlobalPageId, setSelectedGlobalPageId] = useState<string | null>(null);
  const [isGlobalPagesListCollapsed, setIsGlobalPagesListCollapsed] = useState(true);

  const currentWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    workspaces[0] ??
    null;

  const fetchQuickNotes = useCallback(async () => {
    setQuickNotesLoading(true);
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;
      const res = await api.get<{ data: QuickNoteSummary[] }>(
        `/workspaces/${workspaceId}/item/quick-note`,
      );
      setQuickNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch quick notes for sidebar:", err);
    } finally {
      setQuickNotesLoading(false);
    }
  }, [activeWorkspaceId]);

  const fetchProjects = useCallback(async () => {
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;
      const res = await api.get<{ data: any[] }>(`/workspaces/${workspaceId}/project`);
      setProjects(res.data.map((p) => ({ id: p.id, title: p.title })));
    } catch (err) {
      console.error("Failed to fetch projects for sidebar:", err);
    }
  }, [activeWorkspaceId]);

  const fetchPinnedItems = useCallback(async () => {
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;
      const res = await api.get<{ data: { areas: any[], projects: any[], items: any[] } }>(`/workspaces/${workspaceId}/pinned`);
      setPinnedItems(res.data || { areas: [], projects: [], items: [] });
    } catch (err) {
      console.error("Failed to fetch pinned items:", err);
    }
  }, [activeWorkspaceId]);

  const fetchAreas = useCallback(async () => {
    setAreasLoading(true);
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;
      const res = await api.get<{ data: any[] }>(`/workspaces/${workspaceId}/area`);
      setAreas(res.data.map((a) => ({ id: a.id, title: a.title, projects: a.projects })));
    } catch (err) {
      console.error("Failed to fetch areas for sidebar:", err);
    } finally {
      setAreasLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (pathname.startsWith("/dashboard/quick-note")) {
      setExpanded((prev) =>
        prev.quickNote ? prev : { ...prev, quickNote: true },
      );
    }
  }, [pathname]);

  useEffect(() => {
    if (expanded.quickNote) {
      void fetchQuickNotes();
    }
  }, [expanded.quickNote, fetchQuickNotes]);

  useEffect(() => {
    const handleQuickNoteUpdated = (event: Event) => {
      const note = (event as CustomEvent<Partial<QuickNoteSummary>>).detail;
      if (!note?.id) return;
      const noteId = note.id;

      setQuickNotes((prev) => {
        const existing = prev.some((current) => current.id === noteId);
        if (!existing) {
          return [{ ...note, id: noteId }, ...prev];
        }

        return prev.map((current) =>
          current.id === noteId ? { ...current, ...note, id: noteId } : current,
        );
      });
    };

    window.addEventListener("hm:quick-note-updated", handleQuickNoteUpdated);
    return () =>
      window.removeEventListener(
        "hm:quick-note-updated",
        handleQuickNoteUpdated,
      );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000;

    const fetchSessionAndWorkspaces = async (attempt = 0) => {
      if (cancelled) return;
      setIsWorkspaceLoading(true);
      try {
        const res = await api.get<AuthMeResponse>("/auth/me");
        if (cancelled) return;

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
        if (cancelled) return;

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
        setIsWorkspaceLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.warn(
          `[sidebar] fetchSessionAndWorkspaces failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
          err,
        );
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          await new Promise((r) => globalThis.setTimeout(r, delay));
          if (!cancelled) {
            return fetchSessionAndWorkspaces(attempt + 1);
          }
        } else {
          setUserName("User");
          setIsWorkspaceLoading(false);
        }
      }
    };
    fetchSessionAndWorkspaces();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAreas([]);
    void fetchProjects();
    void fetchAreas();
    void fetchPinnedItems();
  }, [activeWorkspaceId, fetchProjects, fetchAreas, fetchPinnedItems]);

  useEffect(() => {
    return subscribeToWorkspaceChange((workspaceId) => {
      setActiveWorkspaceId(workspaceId);
      setQuickNotes([]);
      setAreas([]);
      void fetchProjects();
      void fetchAreas();
      void fetchPinnedItems();
    });
  }, [fetchProjects, fetchAreas, fetchPinnedItems]);

  useEffect(() => {
    window.addEventListener('hm:pinned-items-updated', fetchPinnedItems);
    return () => window.removeEventListener('hm:pinned-items-updated', fetchPinnedItems);
  }, [fetchPinnedItems]);

  const { setTheme, resolvedTheme } = useTheme();

  const handleCreateQuickNote = useCallback(async () => {
    if (isCreatingQuickNote) return;

    setIsCreatingQuickNote(true);
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;

      const res = await api.post<{ data: QuickNoteSummary }>(
        `/workspaces/${workspaceId}/item/quick-note`,
        {
          content: " ",
          contentJson: {
            type: "doc",
            content: [{ type: "paragraph" }],
          },
        },
      );

      setExpanded((prev) => ({ ...prev, quickNote: true }));
      setQuickNotes((prev) => [
        res.data,
        ...prev.filter((note) => note.id !== res.data.id),
      ]);
      router.push(`/dashboard/quick-note?id=${res.data.id}`);
    } catch (err) {
      console.error("Failed to create quick note:", err);
    } finally {
      setIsCreatingQuickNote(false);
    }
  }, [activeWorkspaceId, isCreatingQuickNote, router]);

  const loadGlobalPages = useCallback(async () => {
    try {
      if (!activeWorkspaceId) return;
      const res = await api.get<{ data: any[] }>(`/workspaces/${activeWorkspaceId}/item/page`);
      setGlobalPages(res.data.map(page => ({ id: page.id, title: page.title || 'Untitled', isPinned: !!page.isPinned })));
    } catch (err) {
      console.error("Failed to load global pages", err);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (expanded.pages) {
      loadGlobalPages();
    }
    
    window.addEventListener('hm:global-pages-updated', loadGlobalPages);
    return () => window.removeEventListener('hm:global-pages-updated', loadGlobalPages);
  }, [expanded.pages, loadGlobalPages]);

  useEffect(() => {
    setSelectedGlobalPageId(localStorage.getItem('hm_global_selected_page'));
    setIsGlobalPagesListCollapsed(localStorage.getItem('hm_global_pages_sidebar_collapsed') !== 'false');
    
    const handleGlobalPageSelected = () => {
      setSelectedGlobalPageId(localStorage.getItem('hm_global_selected_page'));
      setIsGlobalPagesListCollapsed(localStorage.getItem('hm_global_pages_sidebar_collapsed') !== 'false');
    };
    
    window.addEventListener('storage', handleGlobalPageSelected);
    window.addEventListener('hm:global-pages-sidebar-toggled', handleGlobalPageSelected);
    window.addEventListener('hm:global-page-selected', handleGlobalPageSelected);
    return () => {
        window.removeEventListener('storage', handleGlobalPageSelected);
        window.removeEventListener('hm:global-pages-sidebar-toggled', handleGlobalPageSelected);
        window.removeEventListener('hm:global-page-selected', handleGlobalPageSelected);
    };
  }, [pathname]);

  const handleCreateGlobalPage = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!activeWorkspaceId) return;
      const res = await api.post<{ data: any }>(`/workspaces/${activeWorkspaceId}/item/page`, {
        title: 'Untitled Page',
        contentJson: { type: 'doc', content: [{ type: 'paragraph' }] }
      });
      
      const newPageId = res.data.id;
      localStorage.setItem(`hm_global_selected_page`, newPageId);
      window.dispatchEvent(new Event('hm:global-page-selected'));
      setSelectedGlobalPageId(newPageId);
      
      setExpanded((prev) => ({ ...prev, pages: true }));
      await loadGlobalPages();
      router.push('/dashboard/pages');
    } catch (err) {
      console.error("Failed to create global page:", err);
    }
  }, [router, loadGlobalPages, activeWorkspaceId]);

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
        e.stopPropagation();
        void handleCreateQuickNote();
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
  }, [handleCreateQuickNote, resolvedTheme, setTheme]);

  const toggle = (section: string) =>
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));

  const handleCreateProject = (e: React.MouseEvent, areaId?: string) => {
    e.stopPropagation();
    if (areaId) {
      setActiveAreaIdForProject(areaId);
      setIsAreaProjectPopoverOpen(true);
    } else {
      setActiveAreaIdForProject(undefined);
      setIsNewProjectDialogOpen(true);
    }
  };

  const handleCreateArea = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveProjectIdForArea(undefined);
    setIsNewAreaDialogOpen(true);
  };

  const handleNewProjectSubmit = async ({ title, description, tags, areaId }: { title: string; description: string; tags: string[]; areaId?: string }) => {
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;

      const res = await api.post<{ data: any }>(`/workspaces/${workspaceId}/project`, {
        title,
        description,
        tags,
        areaId,
      });

      const newProject = res.data;
      if (areaId) {
        setAreas((prev) =>
          prev.map((a) =>
            a.id === areaId
              ? { ...a, projects: [{ id: newProject.id, title: newProject.title }, ...a.projects] }
              : a
          )
        );
        setExpanded((prev) => ({ ...prev, area: true }));
        setOpenAreas((prev) => ({ ...prev, [areaId]: true }));
      } else {
        setProjects((prev) => [
          { id: newProject.id, title: newProject.title },
          ...prev.filter((p) => p.id !== newProject.id),
        ]);
        setExpanded((prev) => ({ ...prev, projects: true }));
      }
      router.push(Navigator.project(newProject.id));
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleEditProjectSubmit = async ({ title, description, tags }: { title: string; description: string; tags: string[] }) => {
    if (!projectToEdit) return;
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;

      await api.patch<{ data: any }>(`/workspaces/${workspaceId}/project/${projectToEdit.id}`, {
        title,
        description,
        tags,
      });

      await fetchProjects();
      await fetchAreas();
      await fetchPinnedItems();
      setProjectToEdit(null);
    } catch (err) {
      console.error("Failed to edit project:", err);
    }
  };

  const handleAssignProjectToArea = async (projectIds: string[]) => {
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId || !activeAreaIdForProject) return;

      await Promise.all(
        projectIds.map((projectId) =>
          api.patch<{ data: any }>(`/workspaces/${workspaceId}/project/${projectId}`, {
            areaId: activeAreaIdForProject,
          })
        )
      );

      // Refresh data
      await Promise.all([fetchProjects(), fetchAreas()]);
      setIsAreaProjectPopoverOpen(false);
      setOpenAreas((prev) => ({ ...prev, [activeAreaIdForProject]: true }));
      setExpanded((prev) => ({ ...prev, area: true }));
    } catch (err) {
      console.error("Failed to assign projects to area:", err);
    }
  };

  const handleAssignAreaToProject = async (areaId: string) => {
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId || !activeProjectIdForArea) return;

      await api.patch<{ data: any }>(`/workspaces/${workspaceId}/project/${activeProjectIdForArea}`, {
        areaId: areaId,
      });

      // Refresh data
      await Promise.all([fetchProjects(), fetchAreas()]);
      setIsProjectAreaPopoverOpen(false);
      setOpenAreas((prev) => ({ ...prev, [areaId]: true }));
      setExpanded((prev) => ({ ...prev, area: true }));
    } catch (err) {
      console.error("Failed to assign area to project:", err);
    }
  };

  const handlePinItems = async (areaIds: string[], projectIds: string[], pageIds: string[]) => {
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;

      const promises: Promise<any>[] = [];

      for (const areaId of areaIds) {
        promises.push(api.patch(`/workspaces/${workspaceId}/area/${areaId}`, { isPinned: true }));
      }
      for (const projectId of projectIds) {
        promises.push(api.patch(`/workspaces/${workspaceId}/project/${projectId}`, { isPinned: true }));
      }
      for (const pageId of pageIds) {
        promises.push(api.patch(`/workspaces/${workspaceId}/item/${pageId}`, { isPinned: true }));
      }

      await Promise.all(promises);

      await fetchPinnedItems();
      setIsPinnedPopoverOpen(false);
      setExpanded((prev) => ({ ...prev, pinned: true }));
    } catch (err) {
      console.error("Failed to pin items:", err);
    }
  };

  const handleNewAreaSubmit = async ({ title, description }: { title: string; description: string }) => {
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;

      const res = await api.post<{ data: any }>(`/workspaces/${workspaceId}/area`, {
        title,
        description,
      });

      const newArea = res.data;
      
      if (activeProjectIdForArea) {
        await api.patch<{ data: any }>(`/workspaces/${workspaceId}/project/${activeProjectIdForArea}`, {
          areaId: newArea.id,
        });
        await fetchProjects();
      }

      setAreas((prev) => {
        const projectsForNewArea = [];
        if (activeProjectIdForArea) {
           const p = projects.find(proj => proj.id === activeProjectIdForArea);
           if (p) projectsForNewArea.push({ id: p.id, title: p.title });
        }
        return [
          { id: newArea.id, title: newArea.title, projects: projectsForNewArea },
          ...prev.filter((a) => a.id !== newArea.id),
        ];
      });
      setExpanded((prev) => ({ ...prev, area: true }));
      if (activeProjectIdForArea) {
        setOpenAreas((prev) => ({ ...prev, [newArea.id]: true }));
        setActiveProjectIdForArea(undefined);
      }
    } catch (err) {
      console.error("Failed to create area:", err);
    }
  };

  const handleEditAreaSubmit = async ({ title, description }: { title: string; description: string }) => {
    if (!areaToEdit) return;
    try {
      const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
      if (!workspaceId) return;

      const res = await api.patch<{ data: any }>(`/workspaces/${workspaceId}/area/${areaToEdit.id}`, {
        title,
        description,
      });

      const updatedArea = res.data;
      setAreas((prev) =>
        prev.map((a) =>
          a.id === updatedArea.id ? { ...a, title: updatedArea.title } : a
        )
      );
      setAreaToEdit(null);
    } catch (err) {
      console.error("Failed to edit area:", err);
    }
  };

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

  const renderProjectOptions = (projectId: string, isPinned: boolean) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 border-border bg-surface shadow-xl rounded-[8px] p-1.5 overflow-hidden z-[100]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              if (!activeWorkspaceId) return;
              try {
                await api.patch(`/workspaces/${activeWorkspaceId}/project/${projectId}`, { isPinned: !isPinned });
                await fetchProjects();
                await fetchAreas();
                await fetchPinnedItems();
              } catch (err) {}
            }}
          >
            <Pin className="w-4 h-4" />
            {isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              setActiveProjectIdForArea(projectId);
              setIsProjectAreaPopoverOpen(true);
            }}
          >
            <Folder className="w-4 h-4" />
            Add to area
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/50 my-1.5" />
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/dashboard/project/${projectId}`);
            }}
          >
            <Copy className="w-4 h-4" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/dashboard/project/${projectId}`, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4" />
            Open in a new tab
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
                if (!workspaceId) return;
                await api.post(`/workspaces/${workspaceId}/project/${projectId}/duplicate`);
                await fetchProjects();
                await fetchAreas();
              } catch (err) {
                console.error("Failed to duplicate project", err);
              }
            }}
          >
            <CopyPlus className="w-4 h-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
                const res = await api.get<{ data: any }>(`/workspaces/${workspaceId}/project/${projectId}`);
                setProjectToEdit(res.data);
              } catch (err) {
                const proj = projects.find(p => p.id === projectId) || areas.flatMap(a => a.projects).find(p => p.id === projectId);
                setProjectToEdit({ id: projectId, title: proj?.title || "Untitled" });
              }
            }}
          >
            <PenLine className="w-4 h-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-red-500/80 focus:text-red-500 focus:bg-red-500/10 rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
                if (!workspaceId) return;
                await api.patch(`/workspaces/${workspaceId}/project/${projectId}`, { deletedAt: new Date() });
                await fetchProjects();
                await fetchAreas();
              } catch (err) {
                console.error("Failed to move to trash", err);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            Move to trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderAreaOptions = (areaId: string, isPinned: boolean) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 border-border bg-surface shadow-xl rounded-[8px] p-1.5 overflow-hidden z-[100]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              if (!activeWorkspaceId) return;
              try {
                await api.patch(`/workspaces/${activeWorkspaceId}/area/${areaId}`, { isPinned: !isPinned });
                await fetchAreas();
                await fetchPinnedItems();
              } catch (err) {
                console.error("Failed to pin area", err);
              }
            }}
          >
            <Pin className="w-4 h-4" />
            {isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
          </DropdownMenuItem>
          <div className="h-[1px] bg-border my-1" />
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/dashboard`);
              // Actually Area doesn't have a dedicated page, but we add copy link for consistency
            }}
          >
            <LinkIcon className="w-4 h-4" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/dashboard`, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4" />
            Open in a new tab
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              if (!activeWorkspaceId) return;
              try {
                const res = await api.post<{ data: any }>(`/workspaces/${activeWorkspaceId}/area/${areaId}/duplicate`);
                const newArea = res.data;
                setAreas((prev) => [
                  { id: newArea.id, title: newArea.title, projects: [] },
                  ...prev
                ]);
              } catch (err) {
                console.error("Failed to duplicate area", err);
              }
            }}
          >
            <CopyPlus className="w-4 h-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              const area = areas.find(a => a.id === areaId) || pinnedItems.areas.find(a => a.id === areaId);
              setAreaToEdit({ id: areaId, title: area?.title || "Untitled" });
            }}
          >
            <PenLine className="w-4 h-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-red-500/80 focus:text-red-500 focus:bg-red-500/10 rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
                if (!workspaceId) return;
                await api.patch(`/workspaces/${workspaceId}/area/${areaId}`, { deletedAt: new Date() });
                await fetchAreas();
                await fetchProjects();
                await fetchPinnedItems();
              } catch (err) {
                console.error("Failed to move to trash", err);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            Move to trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderQuickNoteOptions = (noteId: string) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 border-border bg-surface shadow-xl rounded-[8px] p-1.5 overflow-hidden z-[100]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/dashboard/quick-note?id=${noteId}`);
            }}
          >
            <Copy className="w-4 h-4" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
                if (!workspaceId) return;
                const res = await api.post<{ data: QuickNoteSummary }>(`/workspaces/${workspaceId}/item/quick-note/${noteId}/duplicate`);
                setQuickNotes((prev) => [
                  res.data,
                  ...prev,
                ]);
              } catch (err) {
                console.error("Failed to duplicate quick note", err);
              }
            }}
          >
            <CopyPlus className="w-4 h-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-red-500/80 focus:text-red-500 focus:bg-red-500/10 rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const workspaceId = activeWorkspaceId ?? (await resolveWorkspaceId());
                if (!workspaceId) return;
                await api.patch(`/workspaces/${workspaceId}/item/quick-note/${noteId}`, { deletedAt: new Date() });
                setQuickNotes((prev) => prev.filter(n => n.id !== noteId));
                // If we are currently on this note, we could redirect, but let's keep it simple
              } catch (err) {
                console.error("Failed to move to trash", err);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            Move to trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderGlobalPageOptions = (pageId: string, isPinned: boolean) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="start"
          sideOffset={-10}
          className="w-56 border-border bg-surface shadow-xl rounded-[8px] p-1.5 overflow-hidden z-[100]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (!activeWorkspaceId) return;
                await api.patch(`/workspaces/${activeWorkspaceId}/item/${pageId}`, { isPinned: !isPinned });
                loadGlobalPages();
                window.dispatchEvent(new Event('hm:global-pages-updated'));
                window.dispatchEvent(new Event('hm:pinned-items-updated'));
              } catch (err) {
                console.error("Failed to pin page:", err);
              }
            }}
          >
            <Pin className="w-4 h-4" />
            {isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/50 my-1.5" />
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/dashboard/pages`);
            }}
          >
            <Copy className="w-4 h-4" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open('/dashboard/pages', '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4" />
            Open in a new tab
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (!activeWorkspaceId) return;
                await api.post(`/workspaces/${activeWorkspaceId}/item/${pageId}/duplicate`);
                loadGlobalPages();
                window.dispatchEvent(new Event('hm:global-pages-updated'));
              } catch (err) {
                console.error("Failed to duplicate page:", err);
              }
            }}
          >
            <CopyPlus className="w-4 h-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-red-500/80 focus:text-red-500 focus:bg-red-500/10 rounded-[6px] flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (!activeWorkspaceId) return;
                await api.patch(`/workspaces/${activeWorkspaceId}/item/${pageId}`, { deletedAt: new Date().toISOString() });
                
                if (localStorage.getItem('hm_global_selected_page') === pageId) {
                  const activeKeys = globalPages.filter(p => p.id !== pageId);
                  const firstKey = activeKeys[0]?.id;
                  if (firstKey) {
                    localStorage.setItem('hm_global_selected_page', firstKey);
                  }
                }
                
                loadGlobalPages();
                window.dispatchEvent(new Event('hm:global-pages-updated'));
              } catch (err) {
                console.error("Failed to move page to trash:", err);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            Move to trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col border-r border-border bg-surface w-full h-full font-sans antialiased text-foreground">
        <div className="h-10 flex items-center px-1 mx-2 mt-3 mb-3 rounded-md">
          <div className="w-5 h-5 bg-primary rounded-[4px] flex items-center justify-center shrink-0 ml-1">
            <div className="w-2.5 h-2.5 bg-primary-foreground rounded-sm" />
          </div>
          {!isCollapsed && (
            <div className="flex items-center ml-2 gap-1 flex-1 min-w-0 px-1.5 py-1">
              <span className="text-[14px] font-medium truncate text-foreground">
                HypeMind
              </span>
            </div>
          )}
        </div>
        <div className="flex-1" />
      </div>
    );
  }

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

            <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-75 shrink-0 pr-1 gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSearchOpen(true);
                }}
                className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded-[4px] text-muted-foreground hover:text-foreground transition-colors outline-none"
                title="Search (⌘K)"
              >
                <Search className="w-4 h-4" />
              </button>
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
        {/* SECTION 2: HOME, INBOX, PINNED */}
        <div className="space-y-0.5">
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

          {!isCollapsed && (
            <>
              <div
                className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2 hover:bg-muted transition-colors duration-75 select-none"
                style={{ paddingLeft: "8px" }}
              >
                <div
                  className="flex items-center gap-0 flex-1 min-w-0"
                  onClick={() => toggle("pinned")}
                >
                  <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                    <Pin className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-75 leading-5 flex-1 truncate">
                    Pinned
                  </span>
                  <div className="w-5 flex shrink-0 items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                    {expanded["pinned"] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75 ml-1">
                  <div
                    className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                    title="Pin item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPinnedPopoverOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              {expanded["pinned"] && (
                <div className="mt-1 space-y-0.5 max-h-[40vh] overflow-y-auto scrollbar-thin">
                  {pinnedItems.areas.length === 0 && pinnedItems.projects.length === 0 && pinnedItems.items.length === 0 ? (
                    <div className="text-[13px] text-muted-foreground px-8 py-1">
                      No pinned items.
                    </div>
                  ) : (
                    <>
                      {pinnedItems.areas.map(area => (
                        <SidebarItem
                          key={area.id}
                          icon={Folder}
                          label={area.title}
                          href={`/dashboard/area/${area.id}`}
                          active={isRouteActive(pathname, `/dashboard/area/${area.id}`)}
                          level={1}
                        />
                      ))}
                      {pinnedItems.projects.map(project => (
                        <SidebarItem
                          key={project.id}
                          icon={Folder}
                          label={project.title}
                          href={`/dashboard/project/${project.id}`}
                          active={isRouteActive(pathname, `/dashboard/project/${project.id}`)}
                          level={1}
                          rightElement={renderProjectOptions(project.id, true)}
                        />
                      ))}
                      {pinnedItems.items.map(item => {
                        let href = "";
                        let onClick = undefined;
                        let icon = FileText;
                        let active = false;

                        if (item.type === "QUICK_NOTE") {
                          href = `/dashboard/quick-note?id=${item.id}`;
                          icon = FilePenLine;
                          active = pathname.includes("/dashboard/quick-note") && searchParams.get("id") === item.id;
                        } else if (item.projectId) {
                          href = `/dashboard/project/${item.projectId}`;
                          if (item.type === "PAGE") {
                              active = pathname.includes(`/dashboard/project/${item.projectId}`);
                              onClick = (e: React.MouseEvent) => {
                                  localStorage.setItem(`hm_project_${item.projectId}_page`, item.id);
                                  localStorage.setItem(`hm_project_${item.projectId}_sidebar_collapsed`, 'true');
                                  localStorage.setItem(`hm_project_${item.projectId}_sidebar_mode`, 'pages');
                                  window.dispatchEvent(new Event('hm:project-item-selected'));
                              };
                          } else {
                              active = pathname.includes(`/dashboard/project/${item.projectId}`);
                              onClick = (e: React.MouseEvent) => {
                                  localStorage.setItem(`hm_project_${item.projectId}_resource`, item.id);
                                  localStorage.setItem(`hm_project_${item.projectId}_sidebar_collapsed`, 'true');
                                  localStorage.setItem(`hm_project_${item.projectId}_sidebar_mode`, 'resources');
                                  window.dispatchEvent(new Event('hm:project-item-selected'));
                              };
                          }
                        } else {
                          href = `/dashboard/pages`;
                          active = pathname === "/dashboard/pages" && selectedGlobalPageId === item.id;
                          onClick = (e: React.MouseEvent) => {
                              localStorage.setItem('hm_global_selected_page', item.id);
                              localStorage.setItem('hm_global_pages_sidebar_collapsed', 'true');
                              window.dispatchEvent(new Event('hm:global-page-selected'));
                              window.dispatchEvent(new Event('hm:global-pages-sidebar-toggled'));
                              setSelectedGlobalPageId(item.id);
                          };
                        }

                        return (
                          <SidebarItem
                            key={`pinned-item-${item.id}`}
                            icon={icon}
                            label={item.title || "Untitled"}
                            href={href}
                            onClick={onClick}
                            active={active}
                            level={1}
                            rightElement={renderGlobalPageOptions(item.id, true)}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="h-5" />

        {/* SECTION 3: PAGES, QUICK NOTE */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            {/* Quick Note Section */}
            <div
              className={`group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2 transition-colors duration-75 select-none ${
                pathname.startsWith("/dashboard/quick-note")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              style={{ paddingLeft: "8px" }}
              onClick={() => toggle("quickNote")}
            >
              <div className="flex items-center gap-0 flex-1 min-w-0">
                <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  <FilePenLine className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-medium transition-colors duration-75 leading-5 flex-1 truncate">
                  Quick Notes
                </span>
                <div className="w-5 flex shrink-0 items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  <div
                    className="flex items-center justify-center transition-transform duration-200"
                    style={{
                      transform: expanded["quickNote"]
                        ? "rotate(90deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                  <div className="relative group/tooltip flex items-center">
                    <button
                      type="button"
                      disabled={isCreatingQuickNote}
                      className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleCreateQuickNote();
                      }}
                    >
                      {isCreatingQuickNote ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
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
            </div>

            {expanded["quickNote"] && (
              <div className="mt-1 space-y-0.5 max-h-[40vh] overflow-y-auto scrollbar-thin">
                {quickNotesLoading && (
                  <div className="px-8 py-1 text-[12px] text-muted-foreground">
                    Loading notes...
                  </div>
                )}
                {!quickNotesLoading && quickNotes.length === 0 && (
                  <div className="px-8 py-1 text-[12px] text-muted-foreground">
                    No quick notes yet.
                  </div>
                )}
                {quickNotes.map((note) => (
                  <SidebarItem
                    key={note.id}
                    icon={FilePenLine}
                    label={
                      note.title ||
                      note.contentString?.slice(0, 20) ||
                      "Untitled Note"
                    }
                    href={`/dashboard/quick-note?id=${note.id}`}
                    active={
                      pathname.includes("/dashboard/quick-note") &&
                      searchParams.get("id") === note.id
                    }
                    level={1}
                    rightElement={renderQuickNoteOptions(note.id)}
                  />
                ))}
              </div>
            )}

            {/* Pages Section */}
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2 hover:bg-muted transition-colors duration-75 select-none"
              style={{ paddingLeft: "8px" }}
            >
              <div
                className="flex items-center gap-0 flex-1 min-w-0"
                onClick={() => toggle("pages")}
              >
                <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                    <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-75 leading-5 flex-1 truncate">
                  Pages
                </span>
                <div className="w-5 flex shrink-0 items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  {expanded["pages"] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75 ml-1">
                <div
                  className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                  title="New page"
                  onClick={handleCreateGlobalPage}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {expanded["pages"] && (
              <div className="mt-1 flex flex-col max-h-[40vh]">
                <div className="overflow-y-auto scrollbar-thin flex-1 space-y-0.5 pb-1">
                  {globalPages.length === 0 && (
                    <div className="px-8 py-1 text-[12px] text-muted-foreground">
                      No pages yet.
                    </div>
                  )}
                  {globalPages.map((page) => (
                    <SidebarItem
                      key={page.id}
                      icon={FileText}
                      label={page.title}
                      href={`/dashboard/pages`}
                      active={pathname === "/dashboard/pages" && selectedGlobalPageId === page.id}
                      level={1}
                      onClick={() => {
                          localStorage.setItem('hm_global_selected_page', page.id);
                          window.dispatchEvent(new Event('hm:global-page-selected'));
                          setSelectedGlobalPageId(page.id);
                      }}
                      rightElement={renderGlobalPageOptions(page.id, !!page.isPinned)}
                    />
                  ))}
                </div>
                <div className="shrink-0 mt-0.5">
                  <SidebarItem
                    label={isGlobalPagesListCollapsed ? "Show All Pages →" : "Hide All Pages"}
                    href={`/dashboard/pages`}
                    level={1}
                    onClick={() => {
                        const newState = isGlobalPagesListCollapsed ? 'false' : 'true';
                        localStorage.setItem('hm_global_pages_sidebar_collapsed', newState);
                        window.dispatchEvent(new Event('hm:global-pages-sidebar-toggled'));
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-5" />

        {/* SECTION 4: AREAS AND PROJECTS */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            {/* Projects Section */}
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2 hover:bg-muted transition-colors duration-75 select-none"
              style={{ paddingLeft: "8px" }}
            >
              <div
                className="flex items-center gap-0 flex-1 min-w-0"
                onClick={() => toggle("projects")}
              >
                <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  <Folder className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-75 leading-5 flex-1 truncate">
                  Projects
                </span>
                <div className="w-5 flex shrink-0 items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  {expanded["projects"] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75 ml-1">
                <div
                  className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Create project"
                  onClick={handleCreateProject}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {expanded["projects"] && (
              <div className="mt-1 space-y-0.5 max-h-[40vh] overflow-y-auto scrollbar-thin">
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
                      rightElement={renderProjectOptions(project.id, false)}
                    />
                  ))}
              </div>
            )}

            {/* Areas Section */}
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2 hover:bg-muted transition-colors duration-75 select-none"
              style={{ paddingLeft: "8px" }}
            >
              <div
                className="flex items-center gap-0 flex-1 min-w-0"
                onClick={() => toggle("area")}
              >
                <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  <Folder className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-75 leading-5 flex-1 truncate">
                  Areas
                </span>
                <div className="w-5 flex shrink-0 items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  {expanded["area"] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75 ml-1">
                <div
                  className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Create area"
                  onClick={handleCreateArea}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {expanded["area"] && (
              <div className="mt-1 space-y-0.5 max-h-[40vh] overflow-y-auto scrollbar-thin">
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
                    <div key={area.id} className="flex flex-col">
                      <div
                        className="group/area flex items-center mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-75 select-none"
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
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/area:opacity-100 transition-opacity duration-75 ml-1">
                          {renderAreaOptions(area.id, false)}
                          <div
                            className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                            title="Add a project in area"
                            onClick={(e) => handleCreateProject(e, area.id)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                      
                      {openAreas[area.id] && (
                        <div className="mt-0.5 space-y-0.5">
                          {area.projects.length === 0 && (
                            <div className="px-8 py-1 text-[12px] text-muted-foreground" style={{ paddingLeft: `${8 + 2 * 16}px` }}>
                              No projects in this area.
                            </div>
                          )}
                          {area.projects.map((project) => (
                            <SidebarItem
                              key={project.id}
                              label={project.title}
                              level={2}
                              href={Navigator.project(project.id)}
                              active={isRouteActive(pathname, Navigator.project(project.id))}
                              rightElement={renderProjectOptions(project.id, false)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
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
      <NewProjectDialog
        isOpen={isNewProjectDialogOpen || !!projectToEdit}
        onClose={() => {
          setIsNewProjectDialogOpen(false);
          setProjectToEdit(null);
        }}
        initialData={projectToEdit}
        onSubmit={(data) => {
          if (projectToEdit) {
            handleEditProjectSubmit(data);
          } else {
            handleNewProjectSubmit({ ...data, areaId: activeAreaIdForProject });
          }
        }}
      />
      <AreaProjectAssignmentPopover
        isOpen={isAreaProjectPopoverOpen}
        onClose={() => setIsAreaProjectPopoverOpen(false)}
        projects={Array.from(new Map([...projects, ...areas.flatMap((a) => a.projects)].map(p => [p.id, p])).values())}
        onAssign={handleAssignProjectToArea}
        onCreateAndAssign={(title, description, tags) => {
          handleNewProjectSubmit({ title, description, tags, areaId: activeAreaIdForProject });
          setIsAreaProjectPopoverOpen(false);
        }}
      />
      <NewAreaDialog
        isOpen={isNewAreaDialogOpen || !!areaToEdit}
        onClose={() => {
          setIsNewAreaDialogOpen(false);
          setAreaToEdit(null);
          setActiveProjectIdForArea(undefined);
        }}
        initialData={areaToEdit}
        onSubmit={(data) => {
          if (areaToEdit) {
            handleEditAreaSubmit(data);
          } else {
            handleNewAreaSubmit(data);
          }
        }}
      />
      <ProjectAreaAssignmentPopover
        isOpen={isProjectAreaPopoverOpen}
        onClose={() => {
          setIsProjectAreaPopoverOpen(false);
          setActiveProjectIdForArea(undefined);
        }}
        areas={areas}
        onAssign={handleAssignAreaToProject}
        onCreateNewArea={() => {
          setIsProjectAreaPopoverOpen(false);
          setIsNewAreaDialogOpen(true);
        }}
      />
      <PinnedAssignmentPopover
        isOpen={isPinnedPopoverOpen}
        onClose={() => setIsPinnedPopoverOpen(false)}
        onPin={handlePinItems}
      />
    </div>
  );
}
