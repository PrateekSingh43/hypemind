import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { FileText, Link as LinkIcon, Video, File, Image as ImageIcon, Music, Bookmark, Upload, Inbox, Layout } from 'lucide-react';

const MediaSelectorModal = ({ type, onSelect, onCancel }: { type: string, onSelect: (data: any) => void, onCancel: () => void }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg p-4">
      <div className="bg-[#151618] border border-[#27282B] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#27282B] flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#EEEEEE] capitalize">Select {type}</h3>
          <button onClick={onCancel} className="text-[#8A8F98] hover:text-[#EEEEEE]">✕</button>
        </div>
        <div className="p-4 flex gap-3">
          <button 
            onClick={() => onSelect({ source: 'project', id: 'mock-id' })}
            className="flex-1 flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-[#27282B] bg-[#0E0F11] hover:bg-[#26272B] hover:border-[#383A40] transition-colors"
          >
            <Layout className="w-6 h-6 text-[#8A8F98]" />
            <span className="text-[13px] font-medium text-[#EEEEEE]">Project Resources</span>
          </button>
          
          <button 
            onClick={() => onSelect({ source: 'inbox', id: 'mock-id' })}
            className="flex-1 flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-[#27282B] bg-[#0E0F11] hover:bg-[#26272B] hover:border-[#383A40] transition-colors"
          >
            <Inbox className="w-6 h-6 text-[#8A8F98]" />
            <span className="text-[13px] font-medium text-[#EEEEEE]">Inbox</span>
          </button>

          {['image', 'video', 'audio', 'file'].includes(type) && (
            <button 
              onClick={() => onSelect({ source: 'upload', url: 'mock-url' })}
              className="flex-1 flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-[#27282B] bg-[#0E0F11] hover:bg-[#26272B] hover:border-[#383A40] transition-colors"
            >
              <Upload className="w-6 h-6 text-[#8A8F98]" />
              <span className="text-[13px] font-medium text-[#EEEEEE]">Upload New</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MediaPlaceholderComponent = (props: NodeViewProps) => {
  const { node, updateAttributes, deleteNode } = props;
  const { mediaType, resolvedData } = node.attrs;

  const [selecting, setSelecting] = useState(!resolvedData);

  const getIcon = () => {
    switch (mediaType) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'doc': return <FileText className="w-4 h-4" />;
      case 'file': return <File className="w-4 h-4" />;
      case 'link': return <LinkIcon className="w-4 h-4" />;
      case 'bookmark': return <Bookmark className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const handleSelect = (data: any) => {
    updateAttributes({ resolvedData: data });
    setSelecting(false);
  };

  return (
    <NodeViewWrapper className="relative my-4" data-drag-handle>
      {selecting && (
        <div className="absolute inset-0 z-10">
          <MediaSelectorModal 
            type={mediaType} 
            onSelect={handleSelect} 
            onCancel={() => deleteNode()} 
          />
        </div>
      )}
      <div className={`flex items-center gap-3 p-4 rounded-lg border border-[#27282B] bg-[#151618] transition-colors ${selecting ? 'opacity-50' : ''}`}>
        <div className="w-10 h-10 rounded bg-[#26272B] flex items-center justify-center text-[#EEEEEE]">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-[#EEEEEE] capitalize">{mediaType}</div>
          <div className="text-[12px] text-[#8A8F98] truncate">
            {resolvedData ? `Source: ${resolvedData.source}` : 'Select a source...'}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const MediaPlaceholder = Node.create({
  name: 'mediaPlaceholder',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      mediaType: {
        default: 'file',
      },
      resolvedData: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="media-placeholder"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'media-placeholder' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaPlaceholderComponent);
  },
});
