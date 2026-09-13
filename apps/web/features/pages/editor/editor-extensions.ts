import StarterKit from "@tiptap/starter-kit";
import type { Extensions } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { NodeRange } from "@tiptap/extension-node-range";

import { StableBlockId } from "./extensions/core/stable-block-id";
import { DropIndicator } from "./extensions/core/drop-indicator";
import { BlockMenuKeymap } from "./extensions/core/block-menu-keymap";
import { Callout } from "./extensions/blocks/callout";
import { PageImage } from "./extensions/blocks/image";
import { PageCodeBlock } from "./extensions/blocks/code-block";
import {
  ToggleBlock,
  ToggleContent,
  ToggleTitle,
} from "./extensions/blocks/toggle-block";
import { SlashMenu } from "./extensions/blocks/slash-menu";

/**
 * Node types that act as top-level blocks and therefore receive a
 * stable block id. New custom blocks must be added here AND to the
 * block registry (single source of truth for UI).
 */
export const TOP_LEVEL_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "image",
  "callout",
  "toggleBlock",
] as const;

/**
 * Central assembly point for the HypeMind page editor.
 *
 * Everything the document schema understands is registered here exactly
 * once. Components must never assemble their own extension lists.
 */
export function createPageEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Replaced by the lowlight variant below.
      codeBlock: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      },
      trailingNode: {
        // Guarantees an empty paragraph after the last block so users can
        // always click below content and keep writing (endless surface).
        node: "paragraph",
        notAfter: ["paragraph"],
      },
    }),

    PageCodeBlock,
    TaskList,
    TaskItem.configure({ nested: true }),

    ToggleBlock,
    ToggleTitle,
    ToggleContent,

    PageImage,

    Highlight.configure({ multicolor: false }),

    Placeholder.configure({
      placeholder: ({ editor, node }) => {
        if (node.type.name === "heading") {
          const level = node.attrs.level as number;
          return `Heading ${level}`;
        }
        if (editor.isEmpty && editor.isFocused) {
          return "Type '/' for commands…";
        }
        return "Type '/' for commands…";
      },
      showOnlyWhenEditable: true,
    }),

    Callout,

    // Interaction infrastructure
    SlashMenu,
    BlockMenuKeymap,
    NodeRange, // powers multi-block selection ranges used by the drag handle
    DropIndicator,

    StableBlockId.configure({ types: [...TOP_LEVEL_BLOCK_TYPES] }),
  ];
}
