import React, { useState, useRef, useEffect } from 'react';
import { X, Search, CheckCircle, Hash, FolderGit2, FileText } from 'lucide-react';
import { api, getWorkspaceId, resolveWorkspaceId } from '../../lib/api';

export type PinnedItemType = {
  id: string;
  title: string;
};

export type PinnedAssignmentPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  onPin: (areas: string[], projects: string[], pages: string[]) => void;
};

type Mode = 'area' | 'project' | 'page';

export function PinnedAssignmentPopover({
  isOpen,
  onClose,
  onPin,
}: PinnedAssignmentPopoverProps) {
  const [search, setSearch] = useState('');
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>('area');

  const [areas, setAreas] = useState<PinnedItemType[]>([]);
  const [projects, setProjects] = useState<PinnedItemType[]>([]);
  const [pages, setPages] = useState<PinnedItemType[]>([]);
  const [loading, setLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const workspaceId = getWorkspaceId() ?? (await resolveWorkspaceId());
          if (!workspaceId) return;

          const [areasRes, projectsRes, pagesRes] = await Promise.all([
            api.get<{ data: any[] }>(`/workspaces/${workspaceId}/area`),
            api.get<{ data: any[] }>(`/workspaces/${workspaceId}/project?all=true`),
            api.get<{ data: any[] }>(`/workspaces/${workspaceId}/item/page`),
          ]);

          setAreas(areasRes.data || []);
          setProjects(projectsRes.data || []);
          setPages(pagesRes.data || []);
        } catch (err) {
          console.error('Failed to fetch items for pinning:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen, mode]);

  // Reset internal state when popover opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedAreaIds([]);
      setSelectedProjectIds([]);
      setSelectedPageIds([]);
      setMode('area');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentList = mode === 'area' ? areas : mode === 'project' ? projects : pages;
  const filteredItems = currentList.filter(p => (p.title || "Untitled").toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-[420px] bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
            <h3 className="text-[14px] font-semibold text-foreground">
              Pin Items
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-border/50 shrink-0">
            <div className="flex bg-muted/50 p-1 rounded-lg mb-3">
              <button
                className={`flex-1 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  mode === 'area' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMode('area')}
              >
                Areas
              </button>
              <button
                className={`flex-1 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  mode === 'project' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMode('project')}
              >
                Projects
              </button>
              <button
                className={`flex-1 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  mode === 'page' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMode('page')}
              >
                Pages
              </button>
            </div>
            <div className="flex items-center gap-2.5 bg-background border border-border rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${mode}s...`}
                className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-0"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="min-h-0 max-h-[260px] overflow-y-auto py-2 px-3 scrollbar-thin">
            {filteredItems.length > 0 ? (
              <div className="space-y-[2px]">
                {filteredItems.map(p => {
                  const isSelected = mode === 'area' ? selectedAreaIds.includes(p.id) : mode === 'project' ? selectedProjectIds.includes(p.id) : selectedPageIds.includes(p.id);
                  const Icon = mode === 'area' ? Hash : mode === 'project' ? FolderGit2 : FileText;
                  
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (mode === 'area') {
                          setSelectedAreaIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                        } else if (mode === 'project') {
                          setSelectedProjectIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                        } else {
                          setSelectedPageIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                        }
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="truncate">{p.title || "Untitled"}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-8 text-center flex flex-col items-center">
                <p className="text-[13px] text-foreground font-medium mb-1">No {mode}s found</p>
                <p className="text-[12px] text-muted-foreground">You have no {mode}s or none match your search.</p>
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-end shrink-0 bg-muted/30">
            <button 
              className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={selectedAreaIds.length === 0 && selectedProjectIds.length === 0 && selectedPageIds.length === 0}
              onClick={() => {
                onPin(selectedAreaIds, selectedProjectIds, selectedPageIds);
              }}
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
