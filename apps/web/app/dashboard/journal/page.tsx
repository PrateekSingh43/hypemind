"use client";

import React, { useState, useEffect } from 'react';
import {
  Search, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  Sparkles, Filter, MoreHorizontal, PanelLeftClose,
  PanelLeft, Image as ImageIcon, CheckCircle2, X,
  List, CalendarDays, Book, Hash
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type JournalEntry = {
  id: string;
  date: string;
  day: string;
  title: string;
  snippet: string;
  time: string;
  hasMedia: boolean;
  content: string;
};

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    date: 'March 2, 2026',
    day: 'Monday',
    title: 'API Edge Cases & pgvector',
    snippet: 'Refactoring the API edge cases. Need to handle 404s gracefully without showing red banners on the frontend. Ensure the fetch wrapper...',
    time: '11:21 PM',
    hasMedia: false,
    content: `Refactoring the API edge cases. Need to handle 404s gracefully without showing red banners on the frontend. Ensure the fetch wrapper is correctly passing the error boundary state.

* Talked to Sarah about the [[Brand Assets v2]] deployment.
* AI suggested optimizing the pgvector query for the semantic search.

/ai summarize last week's blockers

Task generated:
[ ] Update Prisma schema to include embedding vector column for Journal Items.`,
  },
  {
    id: '2',
    date: 'March 1, 2026',
    day: 'Sunday',
    title: 'Placement Panel Design',
    snippet: 'Thinking about how the placement panel should work. It needs to be instant. No dropdowns if we can avoid it. Context menus are better.',
    time: '10:45 PM',
    hasMedia: true,
    content: `Thinking about how the placement panel should work. It needs to be instant. No dropdowns if we can avoid it. Context menus are better. Needs to mirror the Linear command palette speed.`,
  },
  {
    id: '3',
    date: 'February 28, 2026',
    day: 'Saturday',
    title: 'Design System Audit',
    snippet: 'Review all color tokens across the design system. Several components are using hardcoded values instead of semantic variables.',
    time: '09:12 AM',
    hasMedia: false,
    content: `Review all color tokens across the design system. Several components are using hardcoded values instead of semantic variables. [[Design Token Audit]] initiated.`,
  },
  {
    id: '4',
    date: 'February 27, 2026',
    day: 'Friday',
    title: 'Sprint Retro & Planning',
    snippet: 'Team velocity is stable. Main concern is tech debt around the inbox module. Consider dedicating a sprint to cleanup.',
    time: '04:30 PM',
    hasMedia: false,
    content: `Team velocity is stable. Main concern is tech debt around the inbox module. Consider dedicating a sprint to cleanup.

* Discussed [[HypeMind Dashboard]] priorities for next sprint.
* Backend blockers around auth flow are now resolved.

[ ] Create cleanup ticket for inbox module tech debt.
[ ] Schedule 1:1 with design team on sidebar improvements.`,
  },
  {
    id: '5',
    date: 'February 26, 2026',
    day: 'Thursday',
    title: 'Sidebar Navigation Refactor',
    snippet: 'Refactored the sidebar navigation component to support dynamic entries. Used accordion behavior for area expansion.',
    time: '08:15 PM',
    hasMedia: false,
    content: `Refactored the sidebar navigation component to support dynamic entries. Used accordion behavior for area expansion. The [[Component Library]] now has a reusable SidebarItem component.`,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getEntryDateNumber(entry: JournalEntry): string {
  return entry.date.split(' ')[1]?.replace(',', '') ?? '';
}

// ── Storage ────────────────────────────────────────────────────────────────────
const LIST_COLLAPSED_KEY = "hm:journal:list-collapsed:v1";

function readListCollapsed(): boolean {
  try {
    return window.localStorage.getItem(LIST_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeListCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(LIST_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // ignore
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const [activeEntry, setActiveEntry] = useState<JournalEntry>(MOCK_ENTRIES[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'media' | 'calendar'>('list');
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    setIsSidebarOpen(!readListCollapsed());
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      writeListCollapsed(!next);
      return next;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSearchOpen) return;
      const currentIndex = MOCK_ENTRIES.findIndex(entry => entry.id === activeEntry.id);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < MOCK_ENTRIES.length - 1 ? currentIndex + 1 : currentIndex;
        setActiveEntry(MOCK_ENTRIES[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        setActiveEntry(MOCK_ENTRIES[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeEntry, isSearchOpen]);

  // Filter entries by search
  const filteredEntries = MOCK_ENTRIES.filter(entry => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.snippet.toLowerCase().includes(q) ||
      entry.date.toLowerCase().includes(q)
    );
  });

  // Word count
  const wordCount = activeEntry.content.split(/\s+/).filter(Boolean).length;

  // ── Render content based on line type ─────────────────────────────────
  const renderContentLine = (line: string, i: number) => {
    // Bullet points with backlinks
    if (line.startsWith('*')) {
      const parts = line.split(/(\[\[.*?\]\])/);
      return (
        <div key={i} className="flex gap-3 mb-2 items-start">
          <span className="text-[#5E6AD2] mt-1 text-lg leading-none">•</span>
          <p className="m-0 text-[15px] text-[#B4B8C0]">
            {parts.map((part, j) => {
              if (part.startsWith('[[') && part.endsWith(']]')) {
                return (
                  <span key={j} className="text-[#5E6AD2] cursor-pointer hover:underline underline-offset-2 font-medium">
                    {part.slice(2, -2)}
                  </span>
                );
              }
              return part.substring(part.startsWith('* ') || part.startsWith('*') ? 1 : 0);
            })}
          </p>
        </div>
      );
    }

    // AI command
    if (line.startsWith('/ai')) {
      return (
        <div key={i} className="my-6 p-3.5 bg-[#5E6AD2]/[0.07] border border-[#5E6AD2]/20 rounded-lg flex items-center gap-3 text-[#8D99F2] font-mono text-sm">
          <Sparkles size={16} className="text-[#5E6AD2] shrink-0" />
          <span className="flex-1">{line}</span>
        </div>
      );
    }

    // Task item
    if (line.startsWith('[ ]')) {
      return (
        <div key={i} className="my-2 p-3 bg-[#151618] border border-[#27282B] rounded-lg flex items-start gap-3 hover:border-[#3E4046] transition-colors group cursor-pointer">
          <div className="w-4 h-4 border-[1.5px] border-[#5E6AD2] rounded mt-0.5 shrink-0 flex items-center justify-center group-hover:bg-[#5E6AD2]/10 transition-colors" />
          <span className="text-[#B4B8C0] text-[15px]">{line.substring(4)}</span>
        </div>
      );
    }

    // Task generated label
    if (line === 'Task generated:') {
      return (
        <div key={i} className="flex items-center gap-2 mt-8 mb-3">
          <CheckCircle2 size={14} className="text-[#5E6AD2]" />
          <p className="text-[10px] text-[#8A8F98] uppercase tracking-wider font-semibold m-0">{line}</p>
        </div>
      );
    }

    // Empty line
    if (line === '') return <div key={i} className="h-4" />;

    // Regular text with backlinks
    const parts = line.split(/(\[\[.*?\]\])/);
    return (
      <p key={i} className="mb-4 text-[15px] text-[#B4B8C0] leading-relaxed">
        {parts.map((part, j) => {
          if (part.startsWith('[[') && part.endsWith(']]')) {
            return (
              <span key={j} className="text-[#5E6AD2] cursor-pointer hover:underline underline-offset-2 font-medium">
                {part.slice(2, -2)}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  };

  // ── Calendar View ─────────────────────────────────────────────────────
  const renderCalendarView = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-8">
      {['January 2026', 'February 2026', 'March 2026'].map((month, mIdx) => (
        <div key={month}>
          <h3 className="text-[12px] font-semibold text-[#EEEEEE] mb-4 uppercase tracking-wider">{month}</h3>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-[10px] text-[#5A5D66] uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: 31 }).map((_, i) => {
              const isToday = mIdx === 2 && i === 1;
              const hasEntry = mIdx === 2 && (i === 1 || i === 0) || mIdx === 1 && (i === 27 || i === 26 || i === 25);
              return (
                <div
                  key={i}
                  className={`p-2 text-[13px] rounded-md cursor-pointer flex flex-col items-center justify-center relative transition-all duration-100 ${isToday
                    ? 'bg-[#5E6AD2] text-white font-medium shadow-sm shadow-[#5E6AD2]/20'
                    : hasEntry
                      ? 'text-[#EEEEEE] hover:bg-[#26272B]'
                      : 'text-[#5A5D66] hover:bg-[#26272B]/50'
                    }`}
                >
                  {i + 1}
                  {hasEntry && !isToday && (
                    <div className="w-1 h-1 bg-[#5E6AD2] rounded-full absolute bottom-1" />
                  )}
                  {hasEntry && isToday && (
                    <div className="w-1 h-1 bg-white rounded-full absolute bottom-1 opacity-70" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Media View ────────────────────────────────────────────────────────
  const renderMediaView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#27282B] text-[11px] font-medium text-[#8A8F98] shrink-0">
        <span className="text-[#5E6AD2] border-b-2 border-[#5E6AD2] pb-2 -mb-2.5 cursor-pointer">All</span>
        <span className="cursor-pointer hover:text-[#EEEEEE] pb-2 -mb-2.5 transition-colors">Photos</span>
        <span className="cursor-pointer hover:text-[#EEEEEE] pb-2 -mb-2.5 transition-colors">Videos</span>
        <span className="cursor-pointer hover:text-[#EEEEEE] pb-2 -mb-2.5 transition-colors">Audio</span>
        <span className="cursor-pointer hover:text-[#EEEEEE] pb-2 -mb-2.5 transition-colors">PDF</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="relative group cursor-pointer overflow-hidden rounded-lg border border-[#27282B] aspect-video bg-[#1C1D21] transition-all hover:border-[#3E4046] hover:scale-[1.01]">
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent z-10" />
          <div className="absolute bottom-3 right-3 z-20 text-right">
            <div className="text-3xl font-bold text-white leading-none">02</div>
            <div className="text-[10px] uppercase tracking-widest text-[#B4B8C0] mt-1">March 2026</div>
          </div>
          <div className="absolute top-3 left-3 z-20">
            <ImageIcon size={14} className="text-white/60" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-[#3E4268]/50 via-[#1C1D21] to-[#151618]" />
        </div>
      </div>
    </div>
  );

  // ── List View ─────────────────────────────────────────────────────────
  const renderListView = () => (
    <div className="flex-1 overflow-y-auto">
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <Search className="w-5 h-5 text-[#5A5D66] mb-2" />
          <span className="text-[13px] text-[#8A8F98] mb-1">No entries match your search.</span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-[12px] text-[#5E6AD2] hover:text-[#7B83EB] transition-colors font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        filteredEntries.map((entry) => (
          <div
            key={entry.id}
            onClick={() => setActiveEntry(entry)}
            className={`p-4 border-b border-[#27282B] cursor-pointer transition-colors duration-75 group flex gap-4 ${activeEntry.id === entry.id ? 'bg-[#1C1D21]' : 'hover:bg-[#1C1D21]/50'
              }`}
          >
            {/* Date column */}
            <div className="flex flex-col items-center shrink-0 w-11 pt-0.5">
              <span className={`text-xl font-semibold leading-tight ${activeEntry.id === entry.id ? 'text-[#5E6AD2]' : 'text-[#EEEEEE]'
                }`}>
                {getEntryDateNumber(entry)}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#5A5D66] mt-0.5">
                {entry.day.slice(0, 3)}
              </span>
            </div>

            {/* Content area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className={`text-[13px] font-medium truncate pr-2 ${activeEntry.id === entry.id ? 'text-[#EEEEEE]' : 'text-[#A0A5B0]'
                  }`}>
                  {entry.title}
                </h4>
                <span className="text-[11px] text-[#5A5D66] shrink-0">{entry.time}</span>
              </div>
              <p className="text-[12px] text-[#8A8F98] line-clamp-2 leading-relaxed">
                {entry.snippet}
              </p>
              {entry.hasMedia && (
                <div className="flex items-center gap-1.5 mt-2">
                  <ImageIcon size={11} className="text-[#5A5D66]" />
                  <span className="text-[10px] text-[#5A5D66]">1 attachment</span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex h-full w-full text-[#EEEEEE] font-sans antialiased overflow-hidden relative">

      {/* ═══ PANE 1: JOURNAL INDEX ═══════════════════════════════════════ */}
      <section
        className="shrink-0 border-r border-[#27282B] flex flex-col transition-[width] duration-200 ease-out bg-[#151618] overflow-hidden"
        style={{ width: isSidebarOpen ? 340 : 0 }}
      >
        {/* View toggle & actions header */}
        <div className="h-12 px-3 border-b border-[#27282B]/50 flex items-center justify-between shrink-0">
          <div className="flex items-center bg-[#1C1D21] rounded-md p-0.5 border border-[#27282B]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-[4px] transition-all ${viewMode === 'list'
                ? 'bg-[#26272B] text-[#EEEEEE] shadow-sm'
                : 'text-[#8A8F98] hover:text-[#EEEEEE]'
                }`}
              title="List view"
            >
              <List size={13} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode('media')}
              className={`p-1.5 rounded-[4px] transition-all ${viewMode === 'media'
                ? 'bg-[#26272B] text-[#EEEEEE] shadow-sm'
                : 'text-[#8A8F98] hover:text-[#EEEEEE]'
                }`}
              title="Media view"
            >
              <ImageIcon size={13} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-[4px] transition-all ${viewMode === 'calendar'
                ? 'bg-[#26272B] text-[#EEEEEE] shadow-sm'
                : 'text-[#8A8F98] hover:text-[#EEEEEE]'
                }`}
              title="Calendar view"
            >
              <CalendarDays size={13} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-1.5 rounded-md transition-colors ${isSearchOpen
                ? 'text-[#5E6AD2] bg-[#5E6AD2]/10'
                : 'text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B]'
                }`}
              title="Search entries"
            >
              <Search size={14} />
            </button>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
              title="Collapse list panel"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>
        </div>

        {/* Search bar (collapsible) */}
        {isSearchOpen && (
          <div className="px-3 py-2.5 border-b border-[#27282B]/50 bg-[#131416]">
            <div className="flex items-center gap-2 bg-[#0E0F11] border border-[#27282B] rounded-md px-2.5 py-1.5">
              <Search size={13} className="text-[#5A5D66] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="w-full bg-transparent text-[12px] text-[#EEEEEE] placeholder:text-[#5A5D66] border-none focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#5A5D66] hover:text-[#EEEEEE]">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Month filter (list mode only) */}
        {viewMode === 'list' && (
          <div className="px-3 py-2.5 border-b border-[#27282B]/50 flex items-center justify-between shrink-0">
            <div className="relative">
              <button
                onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-[#EEEEEE] hover:text-white transition-colors"
              >
                <Calendar size={13} className="text-[#5E6AD2]" />
                March 2026
                <ChevronDown size={13} className="text-[#5A5D66]" />
              </button>

              {monthDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMonthDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-1.5 w-44 bg-[#1C1D21] border border-[#27282B] rounded-lg shadow-2xl z-50 overflow-hidden py-1">
                    {['March 2026', 'February 2026', 'January 2026'].map((month) => (
                      <div
                        key={month}
                        onClick={() => setMonthDropdownOpen(false)}
                        className={`px-3 py-2 text-[12px] cursor-pointer transition-colors ${month === 'March 2026'
                          ? 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
                          : 'text-[#8A8F98] hover:bg-[#26272B] hover:text-[#EEEEEE]'
                          }`}
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <span className="text-[11px] text-[#5A5D66]">{filteredEntries.length} entries</span>
          </div>
        )}

        {/* Dynamic view renderer */}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'calendar' && renderCalendarView()}
        {viewMode === 'media' && renderMediaView()}
      </section>

      {/* ═══ PANE 2: ACTIVE EDITOR WORKSPACE ═════════════════════════════ */}
      <main className="flex-1 flex flex-col bg-[#1F2023] min-w-0 relative">
        {/* Editor header */}
        <header className="h-12 border-b border-[#2A2B2F] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#8A8F98]">
            {!isSidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors mr-1"
                title="Expand list panel"
              >
                <PanelLeft size={14} />
              </button>
            )}
            <Book size={14} className="text-[#5E6AD2]" />
            <span>Journal</span>
            <ChevronRight size={14} />
            <span className="text-[#EEEEEE]">{activeEntry.day}, {activeEntry.date.split(',')[0]?.split(' ').slice(0, 2).join(' ')}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#5A5D66]">
            <span>{wordCount} words</span>
            <div className="w-px h-3 bg-[#2A2B2F]" />
            <button className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </header>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8 pb-32">
            {/* Immutable date title */}
            <div className="mb-8 pb-6 border-b border-[#2A2B2F]/50">
              <h1 className="text-[28px] font-bold text-[#EEEEEE] tracking-tight leading-tight">
                {activeEntry.title}
              </h1>
              <div className="flex items-center gap-3 mt-2.5 text-[12px] text-[#5A5D66]">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {activeEntry.date}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Hash size={12} />
                  Daily Log
                </span>
                <span>·</span>
                <span>{activeEntry.time}</span>
              </div>
            </div>

            {/* Content body */}
            <div className="space-y-0">
              {activeEntry.content.split('\n').map((line, i) => renderContentLine(line, i))}
            </div>

            {/* Editor prompt / footer */}
            <div className="mt-12 pt-6 border-t border-[#2A2B2F]/50 flex items-center gap-2 text-[#5A5D66] text-[13px]">
              <span className="text-[#5E6AD2]">|</span>
              Type <kbd className="bg-[#1C1D21] border border-[#2A2B2F] px-1.5 py-0.5 rounded text-[11px] text-[#8A8F98] mx-1 font-mono">/</kbd> for AI, or <kbd className="bg-[#1C1D21] border border-[#2A2B2F] px-1.5 py-0.5 rounded text-[11px] text-[#8A8F98] mx-1 font-mono">[[</kbd> to link.
            </div>
          </div>
        </div>
      </main>

      {/* ═══ AI Floating Action Button ═══════════════════════════════════ */}
      <button
        className="fixed bottom-6 right-6 w-11 h-11 bg-[#5E6AD2] hover:bg-[#4B56B2] text-white rounded-full shadow-lg shadow-[#5E6AD2]/20 flex items-center justify-center transition-all duration-150 hover:scale-105 z-40"
        title="Ask AI"
      >
        <Sparkles size={17} />
      </button>
    </div>
  );
}