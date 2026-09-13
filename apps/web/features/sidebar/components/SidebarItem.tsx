import type { MouseEvent, ReactNode } from "react";

import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";

import Link from "next/link";


interface SidebarItemProps {
  icon?: LucideIcon;
  label: string;
  active?: boolean;
  level?: number;
  isExpandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  href?: string;
  onClick?: (e: MouseEvent) => void;
  isCollapsed?: boolean;
  badge?: number;
  rightElement?: ReactNode;
}

export function SidebarItem({
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
}: SidebarItemProps) {
  const paddingLeft = isCollapsed ? " 0px " : `${8 + level * 16}px`;

  const hasSplitTargets = href && isExpandable && !isCollapsed;

  const handleContainerClick = (e: MouseEvent) => {
    if (onClick) onClick(e);
    else if (isExpandable && onToggle && !hasSplitTargets) {
      e.preventDefault();
      onToggle();
    }
  };

  const handleChevronClick = (e: MouseEvent) => {
    if (isExpandable && onToggle) {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }
  };

  const content = (
    <div
    onClick={handleContainerClick}
      className={`  group flex items-center py-1.25 mx-2 rounded-[5px] cursor-pointer select-none  
   ${
     active
       ? "bg-muted text-foreground "
       : "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-75"
   }
    ${isCollapsed ? "justify-center px-0 " : "pr-2"}`}
      style={{ paddingLeft: isCollapsed ? undefined : paddingLeft }}
      title={isCollapsed ? label : undefined}
    >
      {isExpandable && !isCollapsed ? (
        <div className="w-5 flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75"
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
          className={`flex shrink-0 items-center justify-start text-muted-foreground group-hover:text-foreground transition-colors duration-75 
          ${isCollapsed ? "" : "w-5"}`}
        >
          <Icon
            className={`w-3.5 h-3.5  
            ${active ? "text-foreground" : ""}`}
          />
        </div>
      ) : (
        <div className={`${isCollapsed ? "" : "w-5 shrink-0"}`}></div>
      )}

      {/* label */}

      {!isCollapsed && (
        <span className="   text-[13px] font-medium truncate leading-5 flex-1">
          {label}
        </span>
      )}

      {badge !== undefined && badge > 0 && (
        <span className="ml-auto text-[11px] font-normal text-muted-foreground shrink-0">
          {badge}
        </span>
      )}
      {rightElement && (
        <div
          className="ml-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-75 "
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {rightElement}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block"> {content}</Link>;
  }
  return content;
}
