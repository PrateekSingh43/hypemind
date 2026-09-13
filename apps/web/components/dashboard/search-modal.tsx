"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FileText,
  FilePenLine,
  BookOpen,
  CheckSquare,
  Link2,
  File,
  Share2,
  Clock,
  TrendingUp,
  Loader2,
  SearchX,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { api, getWorkspaceId, resolveWorkspaceId } from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SearchItem = {
  id: string;
  title: string | null;
  type: string;
  contentString: string | null;
  updatedAt: string;
  createdAt: string;
  isPinned: boolean;
  projectId: string | null;
};

type Suggestions = {
  trending: SearchItem[];
  recent: SearchItem[];
};

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ITEM_TYPE_MAP: Record<string, { icon: LucideIcon; label: string }> =
  {
    QUICK_NOTE: { icon: FilePenLine, label: "Quick Note" },
    PAGE: { icon: FileText, label: "Page" },
    JOURNAL: { icon: BookOpen, label: "Journal" },
    TASK: { icon: CheckSquare, label: "Task" },
    LINK: { icon: Link2, label: "Link" },
    FILE: { icon: File, label: "File" },
    SOCIAL_CLIP: { icon: Share2, label: "Clip" },
  };

function getItemMeta(type: string) {
  return ITEM_TYPE_MAP[type] ?? { icon: FileText, label: type };
}

function getItemRoute(item: SearchItem) {
  switch (item.type) {
    case "QUICK_NOTE":
      return `/dashboard/quick-note?id=${item.id}`;
    case "PAGE":
      return `/dashboard/page/${item.id}`;
    case "JOURNAL":
      return `/dashboard/journal/${item.id}`;
    default:
      return `/dashboard/item/${item.id}`;
  }
}

function truncate(text: string | null | undefined, maxLen = 80) {
  if (!text) return "";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function formatRelativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-primary/20 text-foreground rounded-xs px-px"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  Debounce hook                                                      */
/* ------------------------------------------------------------------ */

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/* ------------------------------------------------------------------ */
/*  Result Item Component                                              */
/* ------------------------------------------------------------------ */

function ResultRow({
  item,
  query,
  isSelected,
  onSelect,
  onMouseEnter,
}: {
  item: SearchItem;
  query: string;
  isSelected: boolean;
  onSelect: (item: SearchItem) => void;
  onMouseEnter: () => void;
}) {
  const meta = getItemMeta(item.type);
  const Icon = meta.icon;
  const displayTitle = item.title || "Untitled";

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      onMouseEnter={onMouseEnter}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
        transition-colors duration-75 cursor-pointer group/row outline-none
        ${
          isSelected
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
      `}
    >
      <div
        className={`
        w-8 h-8 rounded-md flex items-center justify-center shrink-0
        transition-colors duration-75
        ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover/row:bg-primary/10 group-hover/row:text-primary"}
      `}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium leading-5 truncate text-foreground">
          {highlightMatch(displayTitle, query)}
        </div>
        {item.contentString && (
          <div className="text-[12px] text-muted-foreground leading-4 truncate mt-0.5">
            {highlightMatch(truncate(item.contentString, 60), query)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-muted-foreground font-medium px-1.5 py-0.5 rounded-[4px] bg-muted/60">
          {meta.label}
        </span>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          {formatRelativeTime(item.updatedAt)}
        </span>
        <ArrowRight
          className={`w-3.5 h-3.5 transition-opacity duration-75 ${isSelected ? "opacity-60" : "opacity-0 group-hover/row:opacity-60"}`}
        />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: typeof Clock;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Search Modal                                                  */
/* ------------------------------------------------------------------ */

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setHasSearched(false);
      // Focus after animation frame for smooth UX
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Fetch suggestions when modal opens (initial state)
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const fetchSuggestions = async () => {
      setIsSuggestionsLoading(true);
      try {
        const workspaceId =
          getWorkspaceId() ?? (await resolveWorkspaceId());
        if (!workspaceId || cancelled) return;
        const res = await api.get<{ data: Suggestions }>(
          `/workspaces/${workspaceId}/search/suggestions`,
        );
        if (!cancelled) {
          setSuggestions(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch search suggestions:", err);
      } finally {
        if (!cancelled) setIsSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Execute search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    let cancelled = false;

    const doSearch = async () => {
      setIsSearching(true);
      try {
        const workspaceId =
          getWorkspaceId() ?? (await resolveWorkspaceId());
        if (!workspaceId || cancelled) return;
        const res = await api.get<{ data: SearchItem[] }>(
          `/workspaces/${workspaceId}/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`,
        );
        if (!cancelled) {
          setResults(res.data);
          setHasSearched(true);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Search failed:", err);
        if (!cancelled) {
          setResults([]);
          setHasSearched(true);
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    doSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // All displayable items (for keyboard navigation)
  const allItems = useMemo(() => {
    if (debouncedQuery.trim() && hasSearched) {
      return results;
    }
    if (!suggestions) return [];
    return [...suggestions.trending, ...suggestions.recent];
  }, [debouncedQuery, hasSearched, results, suggestions]);

  // Navigate to item
  const handleSelect = useCallback(
    (item: SearchItem) => {
      onClose();
      router.push(getItemRoute(item));
    },
    [router, onClose],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allItems.length ? (prev + 1) % allItems.length : 0,
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allItems.length
            ? (prev - 1 + allItems.length) % allItems.length
            : 0,
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          handleSelect(allItems[selectedIndex]);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, allItems, selectedIndex, handleSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(
      `[data-result-index="${selectedIndex}"]`,
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const isShowingSearch = !!debouncedQuery.trim();
  const isShowingResults = isShowingSearch && hasSearched;
  const noResults = isShowingResults && results.length === 0;

  // Compute indices for each section (for keyboard navigation mapping)
  let globalIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-200 bg-background/60 backdrop-blur-sm search-backdrop-animate"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-201 flex items-start justify-center pt-[15vh] px-4">
        <div
          className="
            w-full max-w-140
            bg-surface border border-border
            rounded-xl shadow-2xl shadow-black/20
            overflow-hidden
            search-modal-animate
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, pages, tasks…"
              className="
                flex-1 bg-transparent text-[14px] text-foreground
                placeholder:text-muted-foreground
                outline-none border-none
                font-medium
              "
              autoComplete="off"
              spellCheck={false}
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
            )}
            {query && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-[4px] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-[5px] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results Area */}
          <div
            ref={listRef}
            className="max-h-95 overflow-y-auto overflow-x-hidden scrollbar-hide"
          >
            {/* Loading state for suggestions */}
            {!isShowingSearch && isSuggestionsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            )}

            {/* Suggestions (initial state - no query) */}
            {!isShowingSearch && !isSuggestionsLoading && suggestions && (
              <div className="py-1">
                {suggestions.trending.length > 0 && (
                  <>
                    <SectionHeader icon={TrendingUp} label="Recently Active" />
                    {suggestions.trending.map((item) => {
                      const idx = globalIndex++;
                      return (
                        <div key={item.id} className="px-2" data-result-index={idx}>
                          <ResultRow
                            item={item}
                            query=""
                            isSelected={selectedIndex === idx}
                            onSelect={handleSelect}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          />
                        </div>
                      );
                    })}
                  </>
                )}

                {suggestions.recent.length > 0 && (
                  <>
                    <SectionHeader icon={Clock} label="Recently Created" />
                    {suggestions.recent.map((item) => {
                      const idx = globalIndex++;
                      return (
                        <div key={item.id} className="px-2" data-result-index={idx}>
                          <ResultRow
                            item={item}
                            query=""
                            isSelected={selectedIndex === idx}
                            onSelect={handleSelect}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          />
                        </div>
                      );
                    })}
                  </>
                )}

                {suggestions.trending.length === 0 &&
                  suggestions.recent.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <Search className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-[13px] text-muted-foreground">
                        Start typing to search your workspace
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Searching indicator (typing but debounce hasn't fired yet) */}
            {isShowingSearch && !hasSearched && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            )}

            {/* Search results */}
            {isShowingResults && !noResults && (
              <div className="py-1">
                <SectionHeader icon={Search} label={`Results for "${truncate(debouncedQuery, 30)}"`} />
                {(() => {
                  globalIndex = 0;
                  return results.map((item) => {
                    const idx = globalIndex++;
                    return (
                      <div key={item.id} className="px-2" data-result-index={idx}>
                        <ResultRow
                          item={item}
                          query={debouncedQuery}
                          isSelected={selectedIndex === idx}
                          onSelect={handleSelect}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        />
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* No results */}
            {noResults && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <SearchX className="w-6 h-6 text-muted-foreground/60" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-medium text-foreground">
                    Nothing found
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    No results for &ldquo;{truncate(debouncedQuery, 40)}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <kbd className="px-1 py-0.5 rounded-[3px] bg-muted border border-border/50 text-[10px] font-medium">↑</kbd>
                <kbd className="px-1 py-0.5 rounded-[3px] bg-muted border border-border/50 text-[10px] font-medium">↓</kbd>
                <span>navigate</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded-[3px] bg-muted border border-border/50 text-[10px] font-medium">↵</kbd>
                <span>open</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded-[3px] bg-muted border border-border/50 text-[10px] font-medium">Esc</kbd>
              <span>close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
