import { WorkspaceSummary } from "../types/sidebar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { useState, type FormEvent } from "react";

import { Check, ChevronDown, Loader2, Plus } from "lucide-react";

interface WorkspaceSwitcherProps {
  // server/domain data
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;
  activeWorkspaceId: string | null;

  //user display data

  userName: string;
  userEmail: string;

  // Layout
  isCollapsed: boolean;

  // UI / loading state supplied by parent for now

  isWorkspaceLoading: boolean;
  isCreatingWorkspace: boolean;

  //user intentions

  onSwitchWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: (name: string) => void;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
  activeWorkspaceId,
  isCollapsed,
  userName,
  userEmail,
  isWorkspaceLoading,
  isCreatingWorkspace,
  onSwitchWorkspace,
  onCreateWorkspace,
}: WorkspaceSwitcherProps) {
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>("");

  const handleCreateWorkspaceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newWorkspaceName.trim();

    if (!trimmedName) return;

    onCreateWorkspace(trimmedName);
    setNewWorkspaceName("");
  };

  if (isCollapsed) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex  items-center ml-2 gap-1 flex-1 min-w-0 hover:bg-muted px-1.5 py-1 rounded-md transition-colors cursor-pointer group/logo ">
          <span className="text-[14px] font-medium truncate text-foreground">
            {currentWorkspace?.name ?? userName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover/logo:opacity-100 transition-opacity" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-75 border-border bg-surface shadow-xl rounded-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-3">
          {/* Parent container for the Header */}
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-foreground font-medium text-lg shrink-0 border border-border/50">
            {(currentWorkspace?.name ?? userName).charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col min-w-0">
            {/* information container  */}
            <span className="text-[14px] font-semibold text-foreground truncate">
              {currentWorkspace?.name ?? "Loading workspace"}
            </span>
            <span className="text-[12px] text-muted-foreground truncate">
              {currentWorkspace
                ? `${currentWorkspace.role.toLowerCase()} -
                         ${currentWorkspace.memberCount} 
                         member${currentWorkspace.memberCount === 1 ? "" : "s"}`
                : "Syncing..."}
            </span>
          </div>
        </div>

        {/* divider div */}

        <div className="h-px bg-border/50 w-full" />

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
        </div>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            className="cursor-pointer py-1.5 px-2 gap-3 focus:bg-muted focus:text-foreground rounded-md"
            onClick={() => onSwitchWorkspace(workspace.id)}
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
            onSubmit={(event) => handleCreateWorkspaceSubmit(event)}
            className="flex items-center gap-2"
          >
            <input
              value={newWorkspaceName}
              onChange={(event) => setNewWorkspaceName(event.target.value)}
              placeholder="New workspace"
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
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

        <div className="h-px bg-border/50 w-full" />

        <div className="p-1 mb-1">
          <DropdownMenuItem className="cursor-pointer py-1.5 px-3 text-[13px] text-muted-foreground focus:text-foreground rounded-md">
            Add another account
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer py-1.5 px-3 text-[13px] text-muted-foreground focus:text-foreground rounded-md">
            Log out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
