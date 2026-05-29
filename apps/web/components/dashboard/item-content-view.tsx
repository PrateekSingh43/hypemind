import React from 'react';
import { Tag, MoreVertical, ExternalLink, Info } from 'lucide-react';

export type ItemContentViewProps = {
  title: string;
  content: string;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
  
  // Slots for dynamic content/buttons
  tagsCount?: number;
  onTagsClick?: () => void;
  tagsPopover?: React.ReactNode; // To mount the popover absolute to the tag button if needed
  
  onInfoClick?: () => void;
  infoPopover?: React.ReactNode;
  
  onMoreClick?: () => void;
  
  bottomStatusText?: string;
  bottomActions?: React.ReactNode;
  
  placeholderTitle?: string;
  placeholderContent?: string;
};

export function ItemContentView({
  title,
  content,
  onUpdateTitle,
  onUpdateContent,
  tagsCount = 0,
  onTagsClick,
  tagsPopover,
  onInfoClick,
  infoPopover,
  onMoreClick,
  bottomStatusText,
  bottomActions,
  placeholderTitle = "Untitled Resource",
  placeholderContent = "Write a description or paste content here..."
}: ItemContentViewProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#0E0F11]">
      <div className="max-w-[760px] w-full mx-auto p-8 md:p-12 flex-1 flex flex-col group/content min-h-0">
        
        {/* 1. Top Utility / Meta Section */}
        <div className="flex items-center justify-between pb-5 border-b border-[#27282B]/50 group-hover/content:border-[#383A40] transition-colors duration-300 mb-8">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={onTagsClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#151618] border border-[#27282B] text-[11px] font-medium text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
              >
                <Tag className="w-3 h-3" />
                Tags <span className="text-[#5A5D66] bg-[#0E0F11] px-1 rounded-[3px] ml-0.5">{tagsCount}</span>
              </button>
              {tagsPopover}
            </div>
            <button 
              onClick={onMoreClick}
              className="flex items-center justify-center w-7 h-7 rounded-md bg-[#151618] border border-[#27282B] text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#151618] border border-[#27282B] text-[11px] font-medium text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors">
            Open Source
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* 2. Title Section - Fixed */}
        <div className="flex items-center gap-3 mb-4 shrink-0 max-w-full">
          <div className="grid min-w-0 flex-1">
            <div className="invisible whitespace-pre col-start-1 row-start-1 text-[24px] font-semibold overflow-hidden">
              {(title || '') + ' '}
              {!title ? placeholderTitle + ' ' : ''}
            </div>
            <input
              type="text"
              size={1}
              value={title || ''}
              onChange={(e) => onUpdateTitle(e.target.value)}
              className="col-start-1 row-start-1 w-full bg-transparent text-[24px] font-semibold text-[#EEEEEE] placeholder:text-[#5A5D66] outline-none border-none focus:ring-0 p-0 m-0 min-w-0"
              placeholder={placeholderTitle}
            />
          </div>
          <div className="relative shrink-0 flex items-center h-full">
            <button 
              onClick={onInfoClick}
              className="flex items-center justify-center w-6 h-6 rounded-md text-[#5A5D66] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors shrink-0"
            >
              <Info className="w-4 h-4" />
            </button>
            {infoPopover}
          </div>
        </div>

        {/* 3. Main Body Content - Scrollable when overflowing */}
        <div className="flex flex-col min-h-0 shrink overflow-y-auto scrollbar-hide">
          <div className="grid w-full pb-2">
            <div className="invisible whitespace-pre-wrap col-start-1 row-start-1 break-words text-[14px] leading-[1.6]">
              {(content || '') + ' '}
            </div>
            <textarea
              value={content || ''}
              onChange={(e) => onUpdateContent(e.target.value)}
              className="col-start-1 row-start-1 w-full h-full bg-transparent text-[14px] leading-[1.6] text-[#A0A5B0] placeholder:text-[#5A5D66] outline-none border-none focus:ring-0 resize-none p-0 m-0 overflow-hidden"
              placeholder={placeholderContent}
            />
          </div>
        </div>
        
        {/* 4. Bottom Action / Status Section */}
        <div className="mt-8 pt-6 border-t border-[#27282B]/50 group-hover/content:border-[#383A40] transition-colors duration-300 flex justify-end shrink-0">
          <div className="flex flex-col items-end gap-2.5">
            {bottomStatusText && (
              <span className="text-[11px] font-medium text-[#5A5D66]">
                {bottomStatusText}
              </span>
            )}
            {bottomActions}
          </div>
        </div>
      </div>
    </div>
  );
}
