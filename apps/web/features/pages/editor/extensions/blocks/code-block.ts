import CodeBlockLowlightBase from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { lowlight } from "./code-block-languages";
import { CodeBlockView } from "../../../components/blocks/code-block-view";

/**
 * HypeMind code block: lowlight highlighting over the full grammar
 * set (~190 languages) with a Notion-style language picker + copy
 * button rendered through a React NodeView.
 */
export const PageCodeBlock = CodeBlockLowlightBase.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
}).configure({
  lowlight,
  defaultLanguage: "plaintext",
});
