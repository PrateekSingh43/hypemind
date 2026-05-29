import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Plus } from 'lucide-react';

export const BlockAddHandle = ({ editor }: { editor: Editor }) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [hoveredPos, setHoveredPos] = useState<number | null>(null);

  useEffect(() => {
    if (!editor || !editor.view) return;

    const handleMouseMove = (e: MouseEvent) => {
      const view = editor.view;
      const coords = { left: e.clientX, top: e.clientY };
      const posAtCoords = view.posAtCoords(coords);

      if (posAtCoords) {
        const { pos } = posAtCoords;
        const resolvedPos = view.state.doc.resolve(pos);
        if (resolvedPos.depth > 0) {
          const blockPos = resolvedPos.before(1);
          const domNode = view.nodeDOM(blockPos) as HTMLElement;
          if (domNode) {
            const rect = domNode.getBoundingClientRect();
            const editorRect = view.dom.parentElement?.getBoundingClientRect();
            
            if (editorRect) {
              setPos({
                top: rect.top - editorRect.top + (view.dom.parentElement?.offsetTop || 0),
                left: -32, // Position to the left of the editor content
              });
              setHoveredPos(blockPos);
              return;
            }
          }
        }
      }
      // If we move out of a valid block
      if (e.target instanceof Element && !e.target.closest('.ProseMirror') && !e.target.closest('.block-add-handle')) {
        setPos(null);
      }
    };

    const container = editor.view.dom.parentElement;
    container?.addEventListener('mousemove', handleMouseMove);

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [editor]);

  if (!pos || hoveredPos === null) return null;

  const handleAddClick = () => {
    if (!editor) return;
    
    // Insert empty paragraph below the hovered block
    const resolvedPos = editor.view.state.doc.resolve(hoveredPos);
    const node = editor.view.state.doc.nodeAt(hoveredPos);
    
    if (node) {
      const insertPos = hoveredPos + node.nodeSize;
      editor.chain().insertContentAt(insertPos, { type: 'paragraph' }).focus(insertPos + 1).insertContent('/').run();
    }
  };

  return (
    <div 
      className="block-add-handle absolute z-10 flex items-center justify-center w-6 h-6 rounded hover:bg-[#26272B] cursor-pointer text-[#8A8F98] hover:text-[#EEEEEE] transition-colors"
      style={{ top: pos.top, left: pos.left }}
      onClick={handleAddClick}
      title="Click to add below"
    >
      <Plus className="w-4 h-4" />
    </div>
  );
};
