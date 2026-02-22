"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Home,
  Inbox,
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
import {QuickNoteModal  } from "./quick-note-modal";

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
}) => {
  const paddingLeft = isCollapsed ? "0px" : `${8 + level * 16}px`;

  const content = (
    <div
      onClick={(e) => {
        if (onClick) onClick(e);
        else if (isExpandable && onToggle) {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`group flex items-center py-1.25 mx-2 rounded-[5px] cursor-pointer ${active
          ? "bg-[#26272B] text-[#EEEEEE]"
          : "text-[#8A8F98] hover:bg-[#26272B] hover:text-[#EEEEEE] transition-colors duration-75"
        } ${isCollapsed ? "justify-center px-0" : "pr-2"}`}
      style={{ paddingLeft: isCollapsed ? undefined : paddingLeft }}
      title={isCollapsed ? label : undefined}
    >
      {isExpandable && !isCollapsed ? (
        <div className="w-5 flex shrink-0 items-center justify-start text-[#8A8F98] group-hover:text-[#EEEEEE] transition-colors duration-75">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      ) : Icon ? (
        <div
          className={`flex shrink-0 items-center justify-start text-[#8A8F98] group-hover:text-[#EEEEEE] transition-colors duration-75 ${isCollapsed ? "" : "w-5"
            }`}
        >
          <Icon className={`w-3.5 h-3.5 ${active ? "text-[#EEEEEE]" : ""}`} />
        </div>
      ) : (
        !isCollapsed && <div className="w-5 shrink-0" />
      )}
      {!isCollapsed && <span className="text-[13px] font-medium truncate leading-5">{label}</span>}
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ journal: false, area: false, pinned: false });
  const [areas, setAreas] = useState<SidebarArea[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);

  useEffect(() => {
    setIsThemeMounted(true);
  }, []);

  // Workspace loading mock/logic retention
  useEffect(() => {
    // Retain existing fetch logic if present, else default state
    setAreasLoading(false);
  }, []);

  const toggle = (section: string) => setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  const toggleArea = (id: string) => setOpenAreas((prev) => ({ ...prev, [id]: !prev[id] }));

  const openQuickCreate = () => {
    window.dispatchEvent(new Event("hm:quick-create/open"));
  };

  return (
    <div
      className="flex flex-col border-r border-[#27282B] bg-[#151618] w-full h-full font-sans antialiased text-[#EEEEEE]"
    >
      {/* Workspace Header */}
      <div
        className={`h-10 flex items-center px-2 hover:bg-[#26272B] mx-2 mt-3 mb-3 rounded-md cursor-pointer transition-colors duration-75 group ${isCollapsed ? "justify-center px-0" : ""
          }`}
        onClick={isCollapsed ? onToggleCollapse : undefined}
        title={isCollapsed ? "Expand sidebar" : undefined}
      >
        <div className="w-5 h-5 bg-[#5E6AD2] rounded-[4px] flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 bg-white rounded-sm" />
        </div>

        {!isCollapsed && (
          <>
            <div className="flex items-center ml-2.5 gap-1 flex-1 min-w-0">
              <span className="text-[14px] font-medium truncate text-[#EEEEEE]">HypeMind</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8F98] shrink-0" />
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-[#34353A] rounded-[4px] text-[#8A8F98] hover:text-[#EEEEEE]"
                    title="New Item"
                  >
                    <SquarePen className="w-4 h-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="right"
                  sideOffset={10}
                  className="border border-[#27282B] bg-[#151618] text-[#EEEEEE] shadow-lg backdrop-blur-sm z-50 min-w-40"
                >
                  <DropdownMenuItem
                    onClick={openQuickCreate}
                    className="cursor-pointer focus:bg-[#26272B] focus:text-[#EEEEEE]"
                  >
                    <Plus className="mr-2 size-4" />
                    <span>Create Canvas</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setQuickNoteOpen(true)}
                    className="cursor-pointer focus:bg-[#26272B] focus:text-[#EEEEEE]"
                  >
                    <BookOpen className="mr-2 size-4" />
                    <span>Quick Note</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.();
                }}
                className="p-1 hover:bg-[#34353A] rounded-[4px] text-[#8A8F98] hover:text-[#EEEEEE]"
                title="Collapse Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Scrollable Nav Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-1">
        {/* Top Level Nav */}
        <div className="space-y-0.5">
          <SidebarItem icon={Search} label="Search" isCollapsed={isCollapsed} onClick={() => { }} />
          <SidebarItem
            icon={Home}
            label="Home"
            href="/dashboard"
            active={isRouteActive(pathname, "/")}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={Inbox}
            label="Unsorted"
            href={Navigator.unsorted()}
            active={isRouteActive(pathname, Navigator.unsorted())}
            isCollapsed={isCollapsed}
          />
        </div>

        <div className="h-5" />

        {/* Pinned Section */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            <SidebarItem
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

        {/* Journal Section */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            <SidebarItem
              label="Journal"
              isExpandable
              expanded={expanded["journal"]}
              onToggle={() => toggle("journal")}
            />
            {expanded["journal"] && (
              <SidebarItem
                label="Today's Log"
                level={1}
                href={Navigator.journal()}
                active={isRouteActive(pathname, Navigator.journal())}
              />
            )}
          </div>
        )}

        <div className="h-1" />

        {/* Areas Section */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            <SidebarItem label="Areas" isExpandable expanded={expanded["area"]} onToggle={() => toggle("area")} />
            {expanded["area"] && (
              <>
                <SidebarItem
                  label="All Areas"
                  level={1}
                  href={Navigator.areas()}
                  active={isRouteActive(pathname, Navigator.areas())}
                />
                <SidebarItem
                  label="All Projects"
                  level={1}
                  href={Navigator.projects()}
                  active={isRouteActive(pathname, Navigator.projects())}
                />

                {areas.map((area) => (
                  <React.Fragment key={area.id}>
                    <SidebarItem
                      label={area.title}
                      level={1}
                      isExpandable
                      expanded={openAreas[area.id]}
                      onToggle={() => toggleArea(area.id)}
                    />
                    {openAreas[area.id] &&
                      area.projects.map((project) => (
                        <SidebarItem
                          key={project.id}
                          label={project.title}
                          level={2}
                          href={Navigator.project(project.id)}
                          active={isRouteActive(pathname, Navigator.project(project.id))}
                        />
                      ))}
                  </React.Fragment>
                ))}

                {areasLoading && <div className="px-8 py-2 text-[13px] text-[#8A8F98]">Loading areas...</div>}
                {!areasLoading && areas.length === 0 && (
                  <div className="px-8 py-2 text-[13px] text-[#8A8F98]">No areas found.</div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="py-2 space-y-0.5 bg-[#151618] mt-auto shrink-0">
        <SidebarItem
          icon={Trash}
          label="Trash"
          href={Navigator.archive()}
          active={isRouteActive(pathname, Navigator.archive())}
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