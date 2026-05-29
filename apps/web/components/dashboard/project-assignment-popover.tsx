import React, { useState, useRef, useEffect } from 'react';
import { X, Search, FolderGit2, CheckCircle } from 'lucide-react';

export type ProjectItem = {
  id: string;
  title: string;
};

export type ProjectAssignmentPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  onAssign: (projectId: string, projectTitle: string) => void;
  onCreateAndAssign: (title: string, desc: string, tags: string[]) => void;
};

export function ProjectAssignmentPopover({
  isOpen,
  onClose,
  projects,
  onAssign,
  onCreateAndAssign,
}: ProjectAssignmentPopoverProps) {
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTags, setNewProjectTags] = useState<string[]>([]);
  const [newProjectTagInput, setNewProjectTagInput] = useState('');

  const projectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && projectInputRef.current) projectInputRef.current.focus();
  }, [isOpen, isCreatingProject]);

  // Reset internal state when popover opens/closes
  useEffect(() => {
    if (!isOpen) {
      setProjectSearch('');
      setIsCreatingProject(false);
      setSelectedProjectId(null);
      setNewProjectTitle('');
      setNewProjectDesc('');
      setNewProjectTags([]);
      setNewProjectTagInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(projectSearch.toLowerCase()));

  const handleCreateAndAssignProject = () => {
    if (!newProjectTitle.trim()) return;
    onCreateAndAssign(newProjectTitle, newProjectDesc, newProjectTags);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-[420px] bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
            <h3 className="text-[14px] font-semibold text-foreground">
              {isCreatingProject ? 'Create New Project' : 'Add to Project'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!isCreatingProject ? (
            <>
              <div className="px-5 py-3 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2.5 bg-background border border-border rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    ref={projectInputRef}
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-0"
                  />
                  {projectSearch && (
                    <button onClick={() => setProjectSearch('')} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="min-h-0 max-h-[260px] overflow-y-auto py-2 px-3 scrollbar-thin">
                {filteredProjects.length > 0 ? (
                  <div className="space-y-[2px]">
                    {filteredProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-colors ${
                          selectedProjectId === p.id 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FolderGit2 className={`w-4 h-4 shrink-0 ${selectedProjectId === p.id ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="truncate">{p.title}</span>
                        </div>
                        {selectedProjectId === p.id && (
                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-8 text-center flex flex-col items-center">
                    <p className="text-[13px] text-foreground font-medium mb-1">No existing projects</p>
                    <p className="text-[12px] text-muted-foreground mb-4">You have no projects yet or none match your search.</p>
                    <button 
                      className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-[12px] font-medium" 
                      onClick={() => setIsCreatingProject(true)}
                    >
                      Create a project
                    </button>
                  </div>
                )}
              </div>
              <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0 bg-muted/30">
                <button 
                  className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors" 
                  onClick={() => setIsCreatingProject(true)}
                >
                  Create new project
                </button>
                <button 
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!selectedProjectId}
                  onClick={() => {
                    const p = projects.find(x => x.id === selectedProjectId);
                    if (p) onAssign(p.id, p.title);
                  }}
                >
                  Add to project
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-5 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-foreground">Project Title</label>
                  <input
                    autoFocus
                    placeholder="e.g. Website Redesign"
                    value={newProjectTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-foreground">Description (optional)</label>
                  <textarea
                    placeholder="What is this project about?"
                    value={newProjectDesc}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProjectDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:border-primary transition-colors min-h-[80px] resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-foreground">Tags (optional)</label>
                  <input
                    placeholder="Type a tag and press Enter"
                    value={newProjectTagInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProjectTagInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = newProjectTagInput.trim();
                        if (val && !newProjectTags.includes(val)) {
                          setNewProjectTags([...newProjectTags, val]);
                          setNewProjectTagInput('');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  {newProjectTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {newProjectTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] text-foreground">
                          {tag}
                          <button
                            onClick={() => setNewProjectTags(newProjectTags.filter(t => t !== tag))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0 bg-muted/30">
                <button 
                  className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors" 
                  onClick={() => setIsCreatingProject(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!newProjectTitle.trim()} 
                  onClick={handleCreateAndAssignProject}
                >
                  Create & Add
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
