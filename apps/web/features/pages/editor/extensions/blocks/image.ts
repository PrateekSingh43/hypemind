import ImageBase from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageBlockView } from "../../../components/blocks/image-block-view";
/**
 * HypeMind image block.
 *
 * Extends the stock Tiptap Image with a React NodeView that supports
 * URL entry inline in the document and graceful failure states.
 */
export const PageImage = ImageBase.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
}).configure({ inline: false, allowBase64: false });
