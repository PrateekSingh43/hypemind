"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  SquarePen,
  PanelLeft,
  Trash,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Navigator } from "../../lib/navigator";
import { api, resolveWorkspaceId } from "../../lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { QuickNoteModal } from "./quick-note-modal";

type BootstrapResponse = {
  success: boolean;
  data?: {
    areas?: Array<{
      id: string;
      title: string;
      projects?: Array<{
        id: string;
        title: string;
      }>;
    }>;
  };
};

type SidebarArea = {
  id: string;
  title: string;
  projects: Array<{ id: string; title: string }>;
};

const WORKSPACE_REFRESH_EVENT = "hm:workspace-data/refresh";

const isRouteActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

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
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
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
          <span className="text-[13px] font-medium truncate leading-5">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-auto text-[11px] font-normal text-muted-foreground shrink-0">{badge}</span>
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

export function LeftSidebar({ isCollapsed = false, onToggleCollapse }: LeftSidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [isThemeMounted, setIsThemeMounted] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ journal: false, area: false, pinned: false, pages: false, quickNote: false });
  const [areas, setAreas] = useState<SidebarArea[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);

  useEffect(() => {
    setIsThemeMounted(true);
  }, []);

  useEffect(() => {
    setAreas([
      {
        id: "1",
        title: "Product Development",
        projects: [
          { id: "p1", title: "HypeMind Dashboard" },
          { id: "p2", title: "AI Assistant Core" },
          { id: "p3", title: "Landing Page" },
        ],
      },
      {
        id: "2",
        title: "Marketing",
        projects: [
          { id: "p4", title: "Q3 Campaign" },
          { id: "p5", title: "Social Media Strategy" },
        ],
      },
      {
        id: "3",
        title: "Design Operations",
        projects: [
          { id: "p6", title: "Brand Assets v2" },
          { id: "p7", title: "Icon Library" },
          { id: "p8", title: "Design Tokens" },
          { id: "p9", title: "Figma Plugin" },
          { id: "p10", title: "Component Library" },
          { id: "p11", title: "Style Guide" },
          { id: "p12", title: "Motion Design" },
        ],
      },
    ]);
    setAreasLoading(false);
  }, []);

  const [showAllProjects, setShowAllProjects] = useState<Record<string, boolean>>({});
  const PROJECT_VISIBLE_LIMIT = 5;

  const toggle = (section: string) => setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));

  const toggleArea = (id: string) => {
    setOpenAreas((prev) => {
      const isCurrentlyOpen = !!prev[id];
      if (isCurrentlyOpen) {
        return { ...prev, [id]: false };
      }
      const newState: Record<string, boolean> = {};
      for (const key in prev) newState[key] = false;
      newState[id] = true;
      return newState;
    });
  };

  const openQuickCreate = () => {
    window.dispatchEvent(new Event("hm:quick-create/open"));
  };

  return (
    <div className="flex flex-col border-r border-border bg-surface w-full h-full font-sans antialiased text-foreground">
      <div
        className={`h-10 flex items-center px-2 hover:bg-muted mx-2 mt-3 mb-3 rounded-md cursor-pointer transition-colors duration-75 group ${
          isCollapsed ? "justify-center px-0" : ""
        }`}
        onClick={isCollapsed ? onToggleCollapse : undefined}
        title={isCollapsed ? "Expand sidebar" : undefined}
      >
        <div className="w-5 h-5 bg-primary rounded-[4px] flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 bg-primary-foreground rounded-sm" />
        </div>

        {!isCollapsed && (
          <>
            <div className="flex items-center ml-2.5 gap-1 flex-1 min-w-0">
              <span className="text-[14px] font-medium truncate text-foreground">HypeMind</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.();
                }}
                className="p-1 hover:bg-muted rounded-[4px] text-muted-foreground hover:text-foreground"
                title="Collapse Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-1">
        <div className="space-y-0.5">
          <SidebarItem icon={Search} label="Search" isCollapsed={isCollapsed} onClick={() => {}} />
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

        {!isCollapsed && (
          <div className="space-y-0.5">
            <SidebarItem
              icon={Inbox}
              label="Pinned"
              isExpandable
              expanded={expanded["pinned"]}
              onToggle={() => toggle("pinned")}
            />
            {expanded["pinned"] && (
              <>
                <SidebarItem label="Design System Tokens" level={1} href={Navigator.pinned()} />
                <SidebarItem label="Q3 OKRs" level={1} href={Navigator.pinned()} />
              </>
            )}
          </div>
        )}

        <div className="h-1" />

        {!isCollapsed && (
          <div className="space-y-0.5">
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2"
              style={{ paddingLeft: "8px" }}
            >
              <div className="flex items-center gap-0" onClick={() => toggle("journal")}>
                <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                  {expanded["journal"] ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-75 leading-5">
                  Journal
                </span>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                <div
                  className="p-0.5 hover:bg-muted rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                  title="New journal entry"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {expanded["journal"] && (
              <>
                {[
                  { label: "Today", key: "j-today" },
                  { label: "Yesterday", key: "j-yesterday" },
                  { label: "Sat, 28 Feb", key: "j-feb28" },
                ].map((entry) => (
                  <SidebarItem key={entry.key} label={entry.label} level={1} href={Navigator.journal()} active={false} />
                ))}
              </>
            )}
          </div>
        )}

        <div className="h-1" />

        {!isCollapsed && (
          <div className="space-y-0.5">
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2"
              style={{ paddingLeft: "8px" }}
            >
              <div className="flex items-center gap-0" onClick={() => toggle("pages")}>
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

            {expanded["pages"] && (
              <>
                <SidebarItem label="Product Vision" level={1} href="/dashboard/pages" active={isRouteActive(pathname, "/dashboard/pages")} />
              </>
            )}
          </div>
        )}

        <div className="h-1" />

        {!isCollapsed && (
          <div className="space-y-0.5">
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2"
              style={{ paddingLeft: "8px" }}
            >
              <div className="flex items-center gap-0" onClick={() => toggle("quickNote")}>
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
                <div
                  className="p-0.5 hover:bg-muted rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
                  title="New quick note"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {expanded["quickNote"] && (
              <>
                <SidebarItem label="Recent Note" level={1} href="/dashboard/quick-note" active={isRouteActive(pathname, "/dashboard/quick-note")} />
              </>
            )}
          </div>
        )}

        <div className="h-1" />

        {!isCollapsed && (
          <div className="space-y-0.5">
            <div
              className="group flex items-center justify-between mx-2 rounded-[5px] cursor-pointer py-1.25 pr-2"
              style={{ paddingLeft: "8px" }}
            >
              <div className="flex items-center gap-0" onClick={() => toggle("area")}>
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
                {areas.map((area) => {
                  const projects = area.projects;
                  const isShowingAll = showAllProjects[area.id];
                  const visibleProjects = isShowingAll ? projects : projects.slice(0, PROJECT_VISIBLE_LIMIT);
                  const hiddenCount = projects.length - PROJECT_VISIBLE_LIMIT;

                  return (
                    <React.Fragment key={area.id}>
                      <div
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
                        <span className="text-[13px] font-medium truncate leading-5 flex-1">{area.title}</span>
                        <div
                          className="opacity-0 group-hover/area:opacity-100 p-0.5 hover:bg-muted rounded-[3px] text-muted-foreground hover:text-foreground transition-all shrink-0 ml-1"
                          title="Create project in this area"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-normal text-muted-foreground shrink-0 ml-1 group-hover/area:hidden">
                          {projects.length}
                        </span>
                      </div>

                      {openAreas[area.id] && (
                        <>
                          {visibleProjects.map((project) => (
                            <SidebarItem
                              key={project.id}
                              label={project.title}
                              level={2}
                              href={Navigator.project(project.id)}
                              active={isRouteActive(pathname, Navigator.project(project.id))}
                            />
                          ))}
                          {!isShowingAll && hiddenCount > 0 && (
                            <div
                              onClick={() => setShowAllProjects((prev) => ({ ...prev, [area.id]: true }))}
                              className="mx-2 rounded-[5px] cursor-pointer py-1 text-[12px] font-medium text-primary hover:text-primary transition-colors"
                              style={{ paddingLeft: `${8 + 2 * 16}px` }}
                            >
                              + {hiddenCount} more
                            </div>
                          )}
                          {isShowingAll && hiddenCount > 0 && (
                            <div
                              onClick={() => setShowAllProjects((prev) => ({ ...prev, [area.id]: false }))}
                              className="mx-2 rounded-[5px] cursor-pointer py-1 text-[12px] font-medium text-primary hover:text-primary transition-colors"
                              style={{ paddingLeft: `${8 + 2 * 16}px` }}
                            >
                              Show less
                            </div>
                          )}
                        </>
                      )}
                    </React.Fragment>
                  );
                })}

                {areasLoading && <div className="px-8 py-2 text-[13px] text-muted-foreground">Loading areas...</div>}
                {!areasLoading && areas.length === 0 && (
                  <div className="px-8 py-2 text-[13px] text-muted-foreground">No areas found.</div>
                )}
              </>
            )}
          </div>
        )}
      </div>

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

      <QuickNoteModal open={quickNoteOpen} onOpenChange={setQuickNoteOpen} />
    </div>
  );
}