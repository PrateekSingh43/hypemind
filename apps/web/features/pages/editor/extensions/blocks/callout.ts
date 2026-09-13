import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CalloutBlockView } from "../../../components/blocks/callout-block-view";

/**
 * Callout — a HypeMind block rendering an emphasized container with a
 * configurable emoji icon.
 *
 * Rendering uses a React NodeView because the icon control is genuine
 * application interaction (emoji picker), not document text. The node
 * itself stays schema-first so the document remains portable.
 */
export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Turns the current block into a callout, keeping its content. */
      setCallout: (attributes?: { icon?: string }) => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: "callout",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      icon: {
        default: "💡",
        parseHTML: (element) => element.getAttribute("data-icon") ?? "💡",
        renderHTML: (attributes) => ({
          "data-icon": attributes.icon ?? "💡",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "callout",
      }),
      ["div", { "data-callout-icon": "" }],
      ["div", { "data-callout-content": "" }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) =>
          commands.wrapIn(this.name, attributes),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutBlockView);
  },
});
