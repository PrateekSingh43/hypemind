"use client";

import { useState } from "react";
import {
  FileText,
  Layout,
  Book,
  MoreHorizontal,
  Star,
  FolderGit2,
  GripVertical,
  Activity,
  AlertCircle,
  EyeOff
} from "lucide-react";

// Mock Data Models
const CONTINUE_ITEMS = [
  { id: "c1", title: "Product Direction Canvas", type: "canvas", context: "Product Development", time: "42m ago" },
  { id: "c2", title: "API edge cases", type: "note", context: "HypeMind Dashboard", time: "1h ago" },
  { id: "c3", title: "Meeting notes: Data flow", type: "journal", context: "Backend Architecture", time: "3h ago" },
  { id: "c4", title: "Landing Page Copy", type: "note", context: "Q3 Campaign", time: "Yesterday" },
  { id: "c5", title: "State sync requirements", type: "note", context: "HypeMind Dashboard", time: "2d ago" },
];

const PINNED_PROJECTS = [
  { id: "p1", title: "HypeMind Dashboard", area: "Product Development", count: 12, lastActive: "2h ago" },
  { id: "p2", title: "Backend Architecture", area: "Engineering", count: 24, lastActive: "2d ago" },
];

const FOCUS_DATA = [
  { id: "f1", area: "Product Development", percentage: 65 },
  { id: "f2", area: "Engineering", percentage: 25 },
  { id: "f3", area: "Marketing", percentage: 10 },
];

const DRIFT_ALERTS = [
  { id: "d1", message: "3 items in Unsorted queue.", severity: "normal" },
  { id: "d2", message: "Project 'Q3 Campaign' untouched for 14 days.", severity: "warning" },
];

const SAVED_AI_CHATS = [
  { id: "ai1", title: "State management refactoring plan", snippet: "Analyzing the transition from Redux to Jotai for the canvas...", time: "2d ago" },
  { id: "ai2", title: "PostgreSQL schema for real-time sync", snippet: "Designing the conflict resolution layer for offline edits...", time: "1w ago" },
];

const getIcon = (type: string) => {
  switch (type) {
    case "canvas": return Layout;
    case "journal": return Book;
    case "note":
    default: return FileText;
  }
};

// Reusable Draggable Block Wrapper
function DraggableBlock({ id, title, onHide, children }: { id: string, title: string, onHide: (id: string) => void, children: React.ReactNode }) {
  return (
    <section className="group relative flex flex-col gap-3 mb-12">
      <div className="absolute -left-10 top-0 opacity-0 group-hover:opacity-100 flex items-center justify-center w-8 h-6 cursor-grab text-[#5A5D66] hover:text-[#EEEEEE] transition-colors">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5A5D66]">{title}</h2>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={() => onHide(id)}
            className="p-1 hover:bg-[#26272B] rounded text-[#8A8F98] hover:text-[#EEEEEE] transition-colors"
            title="Hide Block"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-[#26272B] rounded text-[#8A8F98] hover:text-[#EEEEEE] transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>{children}</div>
    </section>
  );
}

export default function DashboardOverview() {
  const [blocks, setBlocks] = useState([
    { id: "continue", title: "Continue", visible: true },
    { id: "focus", title: "Focus Snapshot", visible: true },
    { id: "pinned", title: "Pinned Projects", visible: true },
    { id: "drift", title: "Cognitive Drift", visible: true },
    { id: "ai", title: "Saved AI Conversations", visible: true }
  ]);

  const handleHideBlock = (id: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, visible: false } : b));
  };

  const visibleBlocks = blocks.filter(b => b.visible);

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#0E0F11] text-[#EEEEEE] font-sans antialiased scrollbar-hide">
      <div className="max-w-[840px] mx-auto py-16 px-12 relative">

        {/* Home Header */}
        <div className="mb-14 flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-tight text-[#EEEEEE]">Home</h1>
          {blocks.some(b => !b.visible) && (
            <button
              onClick={() => setBlocks(blocks.map(b => ({ ...b, visible: true })))}
              className="text-[12px] font-medium text-[#5A5D66] hover:text-[#EEEEEE] transition-colors"
            >
              Restore hidden blocks
            </button>
          )}
        </div>

        <div className="flex flex-col">
          {visibleBlocks.map((block) => {
            switch (block.id) {
              case "continue":
                return (
                  <DraggableBlock key={block.id} id={block.id} title={block.title} onHide={handleHideBlock}>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
                      {CONTINUE_ITEMS.map((item, index) => {
                        const Icon = getIcon(item.type);
                        const isFirst = index === 0;
                        return (
                          <div key={item.id} className="group relative flex flex-col w-[160px] shrink-0 rounded-xl bg-[#1C1D21] hover:bg-[#26272B] transition-colors cursor-pointer shadow-sm overflow-hidden">
                            {/* Icon / Thumbnail area */}
                            <div className={`flex items-center justify-center h-[100px] ${isFirst ? 'bg-gradient-to-br from-[#F5A623] to-[#E8951A]' : 'bg-[#27282B]'}`}>
                              <Icon className={`w-7 h-7 ${isFirst ? 'text-[#1C1D21]' : 'text-[#5A5D66]'}`} />
                            </div>
                            {/* Content */}
                            <div className="flex flex-col justify-between flex-1 px-3 pt-2.5 pb-3">
                              <h3 className="text-[13px] font-medium text-[#EEEEEE] leading-snug line-clamp-2 mb-2">{item.title}</h3>
                              <div className="flex items-center gap-1.5 mt-auto">
                                <span className="text-[11px] font-medium text-[#5A5D66]">P</span>
                                <span className="text-[11px] text-[#5A5D66]">{item.time}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DraggableBlock>
                );

              case "focus":
                return (
                  <DraggableBlock key={block.id} id={block.id} title={block.title} onHide={handleHideBlock}>
                    <div className="p-4 rounded-lg border border-[#27282B] bg-[#151618]">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-[#8A8F98]" />
                        <span className="text-[12px] text-[#A0A5B0]">Attention Distribution (Last 7 Days)</span>
                      </div>
                      <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-[#27282B] mb-3">
                        <div className="bg-[#EEEEEE]" style={{ width: `${FOCUS_DATA[0].percentage}%` }} />
                        <div className="bg-[#8A8F98]" style={{ width: `${FOCUS_DATA[1].percentage}%` }} />
                        <div className="bg-[#5A5D66]" style={{ width: `${FOCUS_DATA[2].percentage}%` }} />
                      </div>
                      <div className="flex gap-6">
                        {FOCUS_DATA.map((data, i) => (
                          <div key={data.id} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[#EEEEEE]' : i === 1 ? 'bg-[#8A8F98]' : 'bg-[#5A5D66]'}`} />
                            <span className="text-[11px] text-[#A0A5B0]">{data.area}</span>
                            <span className="text-[11px] font-medium text-[#EEEEEE]">{data.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DraggableBlock>
                );

              case "pinned":
                return (
                  <DraggableBlock key={block.id} id={block.id} title={block.title} onHide={handleHideBlock}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PINNED_PROJECTS.map((project) => (
                        <div key={project.id} className="group relative flex flex-col p-4 rounded-lg border border-[#27282B] bg-[#151618] hover:bg-[#26272B]/50 transition-colors cursor-pointer shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="pr-6">
                              <h3 className="text-[13px] font-medium text-[#EEEEEE] truncate leading-tight">{project.title}</h3>
                              <p className="text-[12px] text-[#5A5D66] mt-1 truncate">{project.area}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#27282B]/50">
                            <div className="flex items-center gap-1.5 text-[#8A8F98]">
                              <FolderGit2 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-medium">{project.count}</span>
                            </div>
                            <span className="text-[11px] text-[#5A5D66]">{project.lastActive}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DraggableBlock>
                );

              case "drift":
                return (
                  <DraggableBlock key={block.id} id={block.id} title={block.title} onHide={handleHideBlock}>
                    <div className="space-y-1">
                      {DRIFT_ALERTS.map((alert) => (
                        <div key={alert.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-[#27282B] bg-[#151618]">
                          <AlertCircle className={`w-4 h-4 shrink-0 ${alert.severity === 'warning' ? 'text-[#A0A5B0]' : 'text-[#5A5D66]'}`} />
                          <span className="text-[12px] text-[#A0A5B0]">{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  </DraggableBlock>
                );

              case "ai":
                return (
                  <DraggableBlock key={block.id} id={block.id} title={block.title} onHide={handleHideBlock}>
                    <div className="space-y-0.5">
                      {SAVED_AI_CHATS.map((chat) => (
                        <div key={chat.id} className="group flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-[#26272B]/50 transition-colors cursor-pointer -mx-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Star className="w-4 h-4 shrink-0 text-[#5E6AD2]" fill="currentColor" />
                            <span className="text-[13px] font-medium text-[#EEEEEE] shrink-0">{chat.title}</span>
                            <span className="text-[12px] text-[#5A5D66] truncate hidden sm:block">
                              — {chat.snippet}
                            </span>
                          </div>
                          <div className="flex items-center justify-end shrink-0 w-24">
                            <span className="text-[11px] text-[#5A5D66] group-hover:hidden">{chat.time}</span>
                            <button className="hidden group-hover:flex items-center justify-center p-1 hover:bg-[#34353A] rounded text-[#8A8F98] hover:text-[#EEEEEE] transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DraggableBlock>
                );

              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
}