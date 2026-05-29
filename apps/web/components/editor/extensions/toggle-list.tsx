import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const ToggleListComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NodeViewWrapper className="flex gap-2 my-2 text-[#EEEEEE]">
      <div 
        contentEditable={false} 
        className="mt-1 cursor-pointer w-5 h-5 flex items-center justify-center hover:bg-[#26272B] rounded transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </div>
      <div className="flex-1 min-w-0">
        <NodeViewContent 
          className="prose-p:m-0" 
          as="div"
        />
        {isOpen && (
          <div className="mt-2 pl-4 border-l border-[#27282B] min-h-[24px]">
            {/* Ideally this would be nested nodes, but for simplicity we just rely on the user adding content below it or we render a sub-editor. 
                For a true TipTap toggle, we need complex node schemas. 
                Here we just mock the visual expand/collapse. */}
             <div className="text-[14px] text-[#8A8F98] italic p-2">Nested content here...</div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ToggleList = Node.create({
  name: 'toggleList',
  group: 'block',
  content: 'inline*',
  
  parseHTML() {
    return [
      { tag: 'div[data-type="toggle-list"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle-list' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleListComponent);
  },
});
