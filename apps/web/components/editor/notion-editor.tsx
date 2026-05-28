import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';

import { SlashCommand, suggestionOptions } from './slash-command';
import { Callout } from './extensions/callout';
import { ToggleList } from './extensions/toggle-list';
import { MediaPlaceholder } from './extensions/media-placeholder';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import { BlockAddHandle } from './block-add-handle';

export type NotionEditorProps = {
  initialContent?: any;
  onUpdate?: (content: any) => void;
};

export const NotionEditor = ({ initialContent, onUpdate }: NotionEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
      ToggleList,
      MediaPlaceholder,
      SlashCommand.configure({
        suggestion: suggestionOptions,
      }),
      GlobalDragHandle.configure({
        dragHandleWidth: 20,
        scrollTreshold: 100,
      }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-p:text-[15px] prose-p:leading-relaxed prose-headings:font-semibold prose-h1:text-[32px] prose-h2:text-[24px] prose-h3:text-[20px] prose-h4:text-[16px] max-w-none focus:outline-none min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getJSON());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && initialContent && editor.isEmpty) {
      editor.commands.setContent(initialContent, false);
    }
  }, [editor, initialContent]);

  if (!editor) return null;

  return (
    <div className="notion-editor-wrapper w-full pb-32 relative">
      <BlockAddHandle editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
