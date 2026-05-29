import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';

const CalloutComponent = () => {
  return (
    <NodeViewWrapper className="flex gap-3 p-4 my-4 rounded-lg bg-[#26272B]/50 border border-[#27282B] text-[#EEEEEE]">
      <div contentEditable={false} className="select-none text-[18px] leading-none mt-0.5">
        💡
      </div>
      <NodeViewContent className="flex-1 min-w-0 prose-p:my-0 prose-p:leading-relaxed" />
    </NodeViewWrapper>
  );
};

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  
  parseHTML() {
    return [
      { tag: 'div[data-type="callout"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },
});
