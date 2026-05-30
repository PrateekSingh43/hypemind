import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Folder, CheckCircle } from 'lucide-react';

export type AreaItem = {
  id: string;
  title: string;
};

export type ProjectAreaAssignmentPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaItem[];
  onAssign: (areaId: string) => void;
  onCreateNewArea: () => void;
};

export function ProjectAreaAssignmentPopover({
  isOpen,
  onClose,
  areas,
  onAssign,
  onCreateNewArea,
}: ProjectAreaAssignmentPopoverProps) {
  const [areaSearch, setAreaSearch] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const areaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && areaInputRef.current) areaInputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setAreaSearch('');
      setSelectedAreaId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredAreas = areas.filter(a => a.title.toLowerCase().includes(areaSearch.toLowerCase()));

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-[420px] bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
            <h3 className="text-[14px] font-semibold text-foreground">Add to Area</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2.5 bg-background border border-border rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={areaInputRef}
                type="text"
                value={areaSearch}
                onChange={(e) => setAreaSearch(e.target.value)}
                placeholder="Search areas..."
                className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-0"
              />
              {areaSearch && (
                <button onClick={() => setAreaSearch('')} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="min-h-0 max-h-[260px] overflow-y-auto py-2 px-3 scrollbar-thin">
            {filteredAreas.length > 0 ? (
              <div className="space-y-[2px]">
                {filteredAreas.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAreaId(prev => prev === a.id ? null : a.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-colors ${
                      selectedAreaId === a.id
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className={`w-4 h-4 shrink-0 ${selectedAreaId === a.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="truncate">{a.title}</span>
                    </div>
                    {selectedAreaId === a.id && (
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center flex flex-col items-center">
                <p className="text-[13px] text-foreground font-medium mb-1">No existing areas</p>
                <p className="text-[12px] text-muted-foreground mb-4">You have no areas yet or none match your search.</p>
                <button 
                  className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-[12px] font-medium" 
                  onClick={() => onCreateNewArea()}
                >
                  Create an area
                </button>
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0 bg-muted/30">
            <button 
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors" 
              onClick={() => onCreateNewArea()}
            >
              Create new area
            </button>
            <button 
              className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={!selectedAreaId}
              onClick={() => {
                if (selectedAreaId) onAssign(selectedAreaId);
              }}
            >
              Add to area
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
