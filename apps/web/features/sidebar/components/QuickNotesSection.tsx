import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { QuickNoteSummary } from "../types/sidebar";
import {
  ChevronRight,
  Copy,
  CopyPlus,
  FilePenLine,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { api, resolveWorkspaceId } from "@/lib/api";
import { usePathname, useSearchParams } from "next/navigation";
import { SidebarItem } from "./SidebarItem";

interface QuickNotesSectionProps {
 
  isExpanded: Record<string, boolean>;
  /* Element implicitly has an 'any' type because index expression is not of type 'number'. */
  Toggle: (e: string) => void;
  isCreatingQuickNote: boolean;
  isQuickNotesLoading: boolean;
  isCollapsed: boolean;
  onCreatingQuickNote: () => void;
}

export default function QuickNotesSection({

  isExpanded,
  Toggle,
  isCreatingQuickNote,
  isQuickNotesLoading,
  isCollapsed,
  onCreatingQuickNote,
}: QuickNotesSectionProps) {
  const [quickNotes, setQuickNotes] = useState<QuickNoteSummary[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams() ; 

  return (
    <>
      {!isCollapsed && (
        <div className="space-y-0.5">
          <div
            className={`group flex items-center justify-between mx-2 rounded-[5px]
               cursor-pointer py-1.25 pr-2 
               transition-colors duration-75 select-none ${
                 pathname.startsWith("/dashboard/quick-note")
                   ? "bg-muted text-foreground"
                   : "text-muted-foreground hover:bg-muted hover:text-foreground"
               }`}
            style={{ paddingLeft: "8px" }}
            onClick={() => Toggle("quickNote")}
          >
            <div className="flex items-center gap-0 flex-1 min-w-0">
              <div
                className="w-5 flex shrink-0 items-center
                              justify-start text-muted-foreground 
                              group-hover:text-foreground transition-colors duration-75"
              >
                <FilePenLine className="w-3.5 h-3.5" />
              </div>
              <span className="text-[13px] font-medium transition-colors duration-75 leading-5 flex-1 truncate">
                Quick Notes
              </span>

              <div className="w-5 flex shrink-0 items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors duration-75">
                <div
                  className="flex items-center justify-center transition-transform duration-200"
                  style={{
                    transform: isExpanded["quickNote"]
                      ? "rotate(90deg)"
                      : "rotate(0deg)",
                  }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div
                className="flex items-center gap-0.5 ml-1 
                opacity-0 group-hover:opacity-100 transition-opacity duration-75"
              >
                <div className="relative group/tooltip flex items-center">
                  <button
                    type="button"
                    disabled={isCreatingQuickNote}
                    className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreatingQuickNote();
                      /* may be we will create the handleCreateQuickNote function and import it here and use it.  */
                    }}
                  >
                    {isCreatingQuickNote ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div
                    className="absolute top-[120%] right-0 
                    opacity-0 group-hover/tooltip:opacity-100 
                    pointer-events-none transition-opacity 
                    duration-200 z-100 flex items-center 
                    gap-2 whitespace-nowrap bg-foreground 
                    text-background px-2.5 py-1.5 rounded-md 
                    shadow-lg border border-border/10"
                  >
                    <span className="text-[12px] font-medium">
                      New Quick Note
                    </span>

                    {/* this will be added 
                       <kbd className="text-[10px] font-sans bg-background/20 text-background px-1.5 py-0.5 rounded border border-background/20">
                        N
                      </kbd> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isExpanded["quickNote"] && (
            <div className="mt-1 space-y-0.5 max-h-[40vh] overflow-y-auto scrollbar-thin">
              {isQuickNotesLoading && (
                <div className="px-8 py-1 text-[12px] text-muted-foreground">
                  Loading notes...
                </div>

              )}
              {!isQuickNotesLoading && quickNotes.length === 0 && (
                 <div className="px-8 py-1 text-[12px] text-muted-foreground">
                    No quick notes yet.
                  </div>

              ) }
            </div>
          )}
          
           {quickNotes.map((note) => (
            <SidebarItem 

            key={note.id}
            icon={FilePenLine}
            label={note.title  || note.contentString?.slice(0 , 20) || "Untitled Note"}
            href={`/dashboard/quick-note?id=${note.id}`}
            active={pathname.includes("/dashboard/quick") && 
              searchParams.get("id") === note.id &&
                      !searchParams.get("pinned_id")


            }

            level={1}
                    rightElement={renderQuickNoteOptions(note.id)}
            
            
            />


           ) )}


        </div>
      )}
    </>
  );
}

const renderQuickNoteOptions = (
  noteId: string,
  activeWorkspaceId?: string,
  canMoveToTrash = true,
) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="p-0.5 hover:bg-muted-foreground/20 rounded-[3px] text-muted-foreground hover:text-foreground 
        transition-colors cursor-pointer"
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
        className="w-56 border-border bg-surface shadow-xl  rounded-lg p-1.5 overflow-hidden z-100"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          className="cursor-pointer py-2 px-3 text-[13px] font-medium 
            text-muted-foreground focus:text-foreground focus:bg-muted rounded-md flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(
              `${window.location.origin}/dashboard/quick-note?id=${noteId}`,
            );
          }}
        >
          <Copy className="w-4 h-4" />
          Copy link
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer py-2 px-3 text-[13px] font-medium text-muted-foreground focus:text-foreground focus:bg-muted rounded-md flex items-center gap-2"
          onClick={async (e) => {
            e.stopPropagation();

            try {
              const workspaceId =
                activeWorkspaceId ?? (await resolveWorkspaceId());
              if (!workspaceId) return;

              const res = await api.post<{ data: QuickNoteSummary }>(
                `/workspaces/${workspaceId}/item/quick-note/${noteId}/duplicate`,
              );

              //  setQuickNotes((prev) => [res.data, ...prev]);
              /* how do we make the setQuickNotes appear here from the QuickNotesSection compoment as i don't want to redeclare it here how does the left-sidebar.tsx was able to do it.  */
            } catch (err) {
              console.log("failed to duplicate quick NOtes", err);
              /* we need a ui layer alreat for all the error that only parse a string message to the user and also it will send the error to our setry , graphana or promethus , or from pino to others .  */
            }
          }}
        >
          {/* // render a function i guess to duplicate because i can add a activeWorspaceId but what about the resolveWorkspaceId i guess we could import that one .
           */}
          <CopyPlus className="w-4 h-4" />
          Duplicate
        </DropdownMenuItem>
        {canMoveToTrash && (
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 text-[13px] font-medium text-red-500/80 focus:text-red-500 focus:bg-red-500/10 rounded-md flex items-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const workspaceId =
                  activeWorkspaceId ?? (await resolveWorkspaceId());
                if (!workspaceId) return;
                await api.patch(
                  `/workspaces/${workspaceId}/item/quick-note/${noteId}`,
                  {
                    deletedAt: new Date().toISOString(),
                  },
                );
                /*  setQuickNotes((prev) => prev.filter((note) => note.id !== noteId));
                            await fetchPinnedItems(); 
                            
                            same case for these as one as well */

                /*       window.dispatchEvent(new Event("hm:quick-notes-updated")); 
                      how do i actually remove it then create a file in the hooks section of the sidebar that fix this issue and all the other ones as i want to make the quickNotes section end to end .so 
                      if we build this and project one with the help and rest of the thngs like area , pages , quickNotes can be done by me using my hand no ai only learning .
                      
                      */
              } catch (err) {
                console.error("Failed to move quick note to trash", err);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            Move to trash
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
