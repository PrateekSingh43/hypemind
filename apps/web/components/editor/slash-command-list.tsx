import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { 
  Type, Heading1, Heading2, Heading3, Heading4, 
  List, ListOrdered, CheckSquare, ChevronRightSquare, 
  Quote, Lightbulb, Minus, Code, Table, 
  FileText, Link, StickyNote, File, FileUp, 
  Image as ImageIcon, Video, Music, Bookmark 
} from 'lucide-react';

export const COMMAND_ITEMS = [
  { title: 'Basic blocks', type: 'header' },
  { title: 'Text', icon: Type, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setParagraph().run(); } },
  { title: 'Heading 1', icon: Heading1, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(); } },
  { title: 'Heading 2', icon: Heading2, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(); } },
  { title: 'Heading 3', icon: Heading3, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(); } },
  { title: 'Heading 4', icon: Heading4, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHeading({ level: 4 }).run(); } },
  { title: 'Bulleted list', icon: List, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBulletList().run(); } },
  { title: 'Numbered list', icon: ListOrdered, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleOrderedList().run(); } },
  { title: 'To-do list', icon: CheckSquare, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleTaskList().run(); } },
  { title: 'Toggle list', icon: ChevronRightSquare, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'toggleList' }).run(); } },
  { title: 'Quote', icon: Quote, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBlockquote().run(); } },
  { title: 'Callout', icon: Lightbulb, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'callout' }).run(); } },
  { title: 'Divider', icon: Minus, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run(); } },
  { title: 'Code', icon: Code, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleCodeBlock().run(); } },
  { title: 'Table', icon: Table, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); } },
  
  { title: 'Knowledge blocks', type: 'header' },
  { title: 'Page', icon: FileText, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'page' } }).run(); } },
  { title: 'Link to page', icon: Link, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'link' } }).run(); } },
  { title: 'Link', icon: Link, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'link' } }).run(); } },
  { title: 'Notes', icon: StickyNote, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'note' } }).run(); } },
  { title: 'Files', icon: File, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'file' } }).run(); } },
  { title: 'Docs', icon: FileUp, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'doc' } }).run(); } },
  { title: 'Images', icon: ImageIcon, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'image' } }).run(); } },
  
  { title: 'Media', type: 'header' },
  { title: 'Video', icon: Video, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'video' } }).run(); } },
  { title: 'Audio', icon: Music, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'audio' } }).run(); } },
  { title: 'Web bookmark', icon: Bookmark, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'mediaPlaceholder', attrs: { mediaType: 'bookmark' } }).run(); } },
];

export const SlashCommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = props.items;

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item && item.command) {
      item.command(props);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return null;
  }

  return (
    <div className="bg-[#26272B] border border-[#383A40] rounded-lg shadow-xl overflow-hidden w-72 max-h-[320px] overflow-y-auto scrollbar-thin py-1 z-50">
      {items.map((item: any, index: number) => {
        if (item.type === 'header') {
          return (
            <div key={index} className="text-[11px] font-semibold text-[#8A8F98] uppercase tracking-wider px-3 py-1.5 mt-1">
              {item.title}
            </div>
          );
        }

        const Icon = item.icon;
        const isSelected = index === selectedIndex;

        return (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isSelected ? 'bg-[#383A40] text-[#EEEEEE]' : 'text-[#A0A5B0] hover:bg-[#383A40]/50 hover:text-[#EEEEEE]'}`}
            onClick={() => selectItem(index)}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span className="text-[13px] font-medium">{item.title}</span>
          </button>
        );
      })}
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';
