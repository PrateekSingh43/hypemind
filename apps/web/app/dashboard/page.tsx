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
  EyeOff,
  Inbox
} from "lucide-react";

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

// Reusable Empty State Component
function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-[#27282B] border-dashed bg-[#151618]/50">
      <Icon className="w-6 h-6 text-[#5A5D66] mb-3" />
      <p className="text-[12px] text-[#A0A5B0]">{message}</p>
    </div>
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
                    <EmptyState icon={FileText} message="No recent files or notes to continue." />
                  </DraggableBlock>
                );

              case "focus":
                return (
                  <DraggableBlock key={block.id} id={block.id} title={block.title} onHide={handleHideBlock}>
                    <EmptyState icon={Activity} message="Not enough activity to generate a focus snapshot yet." />
                  </DraggableBlock>
                );

              case "pinned":
                return (
                  <DraggableBlock key={block.id} id={block.id} title={block.title} onHide={handleHideBlock}>
                     <EmptyState icon={FolderGit2} message="You haven't pinned any projects yet." />
                  </DraggableBlock>
                );

              case "drift":
                return (
                  <DraggableBlock key={block.id} id={block.id} title={block.title} onHide={handleHideBlock}>
                     <EmptyState icon={AlertCircle} message="No cognitive drift detected. Everything is sorted." />
                  </DraggableBlock>
                );

              case "ai":
                return (
                  <DraggableBlock key={block.id} id={block.id} title={block.title} onHide={handleHideBlock}>
                     <EmptyState icon={Star} message="No saved AI conversations." />
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