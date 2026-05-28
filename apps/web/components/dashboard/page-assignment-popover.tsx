import React, { useState, useRef, useEffect } from 'react';
import { X, Search, FileText, CheckCircle } from 'lucide-react';

export type PageItem = {
  id: string;
  title: string;
};

export type PageAssignmentPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  pages: PageItem[];
  onAssign: (pageId: string, pageTitle: string) => void;
};

export function PageAssignmentPopover({
  isOpen,
  onClose,
  pages,
  onAssign,
}: PageAssignmentPopoverProps) {
  const [pageSearch, setPageSearch] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const pageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && pageInputRef.current) pageInputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPageSearch('');
      setSelectedPageId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPages = pages.filter(p => p.title.toLowerCase().includes(pageSearch.toLowerCase()));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-[420px] bg-[#151618] border border-[#27282B] rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#27282B] flex items-center justify-between shrink-0">
            <h3 className="text-[14px] font-semibold text-[#EEEEEE]">
              Add to Page
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-[#27282B]/50 shrink-0">
            <div className="flex items-center gap-2.5 bg-[#0E0F11] border border-[#27282B] rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-[#8A8F98] shrink-0" />
              <input
                ref={pageInputRef}
                type="text"
                value={pageSearch}
                onChange={(e) => setPageSearch(e.target.value)}
                placeholder="Search pages..."
                className="w-full bg-transparent text-[13px] text-[#EEEEEE] placeholder:text-[#5A5D66] border-none focus:outline-none focus:ring-0"
              />
              {pageSearch && (
                <button onClick={() => setPageSearch('')} className="text-[#8A8F98] hover:text-[#EEEEEE]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 max-h-[260px] overflow-y-auto py-2 px-3 scrollbar-thin">
            {filteredPages.length > 0 ? (
              <div className="space-y-[2px]">
                {filteredPages.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPageId(p.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-colors ${
                      selectedPageId === p.id 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-[#EEEEEE] hover:bg-[#26272B]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`w-4 h-4 shrink-0 ${selectedPageId === p.id ? 'text-primary' : 'text-[#8A8F98]'}`} />
                      <span className="truncate">{p.title || 'Untitled'}</span>
                    </div>
                    {selectedPageId === p.id && (
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center flex flex-col items-center">
                <p className="text-[13px] text-[#EEEEEE] font-medium mb-1">No matching pages</p>
                <p className="text-[12px] text-[#8A8F98] mb-4">You have no pages yet or none match your search.</p>
              </div>
            )}
          </div>
          
          <div className="px-5 py-4 border-t border-[#27282B] flex items-center justify-end shrink-0 bg-[#0E0F11]">
            <button 
              className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={!selectedPageId}
              onClick={() => {
                const p = pages.find(x => x.id === selectedPageId);
                if (p) onAssign(p.id, p.title || 'Untitled');
              }}
            >
              Add to page
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
