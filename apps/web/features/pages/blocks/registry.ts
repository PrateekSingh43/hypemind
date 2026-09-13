import type { ComponentType } from "react";
import type { JSONContent } from "@tiptap/core";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Lightbulb,
  List,
  ListCollapse,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Type,
} from "lucide-react";

/**
 * HypeMind Block Registry
 *
 * Single source of truth describing every block the product knows
 * about. The slash menu, insert affordances, the block menu ("Turn
 * into") and future AI tooling all read from here — never from
 * per-component lists.
 *
 * This module is pure data: wiring definitions to the command layer or
 * editor instance happens in the interaction components, keeping the
 * registry trivially testable and safe to import anywhere.
 */

export type BlockCategory = "basic" | "toggles" | "lists" | "media" | "advanced";

/** Payload consumed by the command layer's turnInto(). */
export type TurnIntoSpec =
  | { kind: "paragraph" }
  | { kind: "heading"; level: 1 | 2 | 3 }
  | { kind: "bulletList" }
  | { kind: "orderedList" }
  | { kind: "taskList" }
  | { kind: "quote" }
  | { kind: "codeBlock" }
  | { kind: "callout"; icon?: string }
  | { kind: "divider" }
  /** Toggle list (level 0) or toggle heading (levels 1–4). */
  | { kind: "toggle"; level: number };

export interface BlockDefinition {
  /**
   * Registry key. Equals the Tiptap node name for simple blocks; list
   * kinds use synthetic keys ("heading1") that map onto node + attrs.
   */
  key: string;
  /** Tiptap top-level node name this definition produces/targets. */
  nodeType: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  category: BlockCategory;
  aliases: string[];
  /** Document JSON inserted by the slash menu / insert actions. */
  buildContent: () => JSONContent | JSONContent[];
  /** Present when this block is a valid "turn into" destination. */
  turnInto?: TurnIntoSpec;
}

function paragraph(): JSONContent {
  return { type: "paragraph" };
}

/**
 * Document JSON for a toggle block (level 0 = toggle list,
 * 1–4 = toggle heading). Inserted open so users immediately see
 * where their content goes.
 */
function toggleBlock(level: number): JSONContent {
  return {
    type: "toggleBlock",
    attrs: { level, open: true },
    content: [
      { type: "toggleTitle" },
      { type: "toggleContent", content: [paragraph()] },
    ],
  };
}

const DEFINITIONS: BlockDefinition[] = [
  {
    key: "text",
    nodeType: "paragraph",
    label: "Text",
    description: "Start writing with plain text",
    icon: Type,
    category: "basic",
    aliases: ["text", "paragraph", "plain", "body", "p"],
    buildContent: paragraph,
    turnInto: { kind: "paragraph" },
  },
  {
    key: "heading1",
    nodeType: "heading",
    label: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    category: "basic",
    aliases: ["h1", "heading", "title", "large"],
    buildContent: () => ({ type: "heading", attrs: { level: 1 } }),
    turnInto: { kind: "heading", level: 1 },
  },
  {
    key: "heading2",
    nodeType: "heading",
    label: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    category: "basic",
    aliases: ["h2", "heading", "subtitle", "medium"],
    buildContent: () => ({ type: "heading", attrs: { level: 2 } }),
    turnInto: { kind: "heading", level: 2 },
  },
  {
    key: "heading3",
    nodeType: "heading",
    label: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    category: "basic",
    aliases: ["h3", "heading", "small"],
    buildContent: () => ({ type: "heading", attrs: { level: 3 } }),
    turnInto: { kind: "heading", level: 3 },
  },
  {
    key: "bulletList",
    nodeType: "bulletList",
    label: "Bullet list",
    description: "Simple bulleted list",
    icon: List,
    category: "lists",
    aliases: ["bullet", "unordered", "list", "ul"],
    buildContent: () => ({
      type: "bulletList",
      content: [{ type: "listItem", content: [paragraph()] }],
    }),
    turnInto: { kind: "bulletList" },
  },
  {
    key: "orderedList",
    nodeType: "orderedList",
    label: "Numbered list",
    description: "List with ordered numbering",
    icon: ListOrdered,
    category: "lists",
    aliases: ["numbered", "ordered", "list", "ol"],
    buildContent: () => ({
      type: "orderedList",
      content: [{ type: "listItem", content: [paragraph()] }],
    }),
    turnInto: { kind: "orderedList" },
  },
  {
    key: "taskList",
    nodeType: "taskList",
    label: "To-do list",
    description: "Track tasks with checkboxes",
    icon: ListTodo,
    category: "lists",
    aliases: ["todo", "to-do", "task", "checkbox", "check"],
    buildContent: () => ({
      type: "taskList",
      content: [
        { type: "taskItem", attrs: { checked: false }, content: [paragraph()] },
      ],
    }),
    turnInto: { kind: "taskList" },
  },
  {
    key: "quote",
    nodeType: "blockquote",
    label: "Quote",
    description: "Capture a quote or citation",
    icon: Quote,
    category: "basic",
    aliases: ["quote", "citation", "blockquote"],
    buildContent: () => ({ type: "blockquote", content: [paragraph()] }),
    turnInto: { kind: "quote" },
  },
  {
    key: "codeBlock",
    nodeType: "codeBlock",
    label: "Code block",
    description: "Code with syntax highlighting",
    icon: Code2,
    category: "advanced",
    aliases: ["code", "snippet", "programming"],
    buildContent: () => ({
      type: "codeBlock",
      attrs: { language: "plaintext" },
    }),
    turnInto: { kind: "codeBlock" },
  },
  {
    key: "divider",
    nodeType: "horizontalRule",
    label: "Divider",
    description: "Visual separator between sections",
    icon: Minus,
    category: "basic",
    aliases: ["divider", "hr", "line", "separator", "rule"],
    buildContent: () => ({ type: "horizontalRule" }),
    turnInto: { kind: "divider" },
  },
  {
    key: "image",
    nodeType: "image",
    label: "Image",
    description: "Embed an image via URL",
    icon: ImageIcon,
    category: "media",
    aliases: ["image", "picture", "photo", "img", "upload"],
    buildContent: () => ({ type: "image", attrs: { src: "", alt: "" } }),
  },
  {
    key: "callout",
    nodeType: "callout",
    label: "Callout",
    description: "Highlighted note with an emoji",
    icon: Lightbulb,
    category: "advanced",
    aliases: ["callout", "note", "info", "highlight", "aside"],
    buildContent: () => ({ type: "callout", content: [paragraph()] }),
    turnInto: { kind: "callout" },
  },
  {
    key: "toggleList",
    nodeType: "toggleBlock",
    label: "Toggle list",
    description: "Collapsible section of content",
    icon: ListCollapse,
    category: "toggles",
    aliases: ["toggle", "collapse", "accordion", "details", "dropdown"],
    buildContent: () => toggleBlock(0),
    turnInto: { kind: "toggle", level: 0 },
  },
  {
    key: "toggleHeading1",
    nodeType: "toggleBlock",
    label: "Toggle heading 1",
    description: "Collapsible large heading",
    icon: Heading1,
    category: "toggles",
    aliases: ["toggle h1", "th1"],
    buildContent: () => toggleBlock(1),
    turnInto: { kind: "toggle", level: 1 },
  },
  {
    key: "toggleHeading2",
    nodeType: "toggleBlock",
    label: "Toggle heading 2",
    description: "Collapsible medium heading",
    icon: Heading2,
    category: "toggles",
    aliases: ["toggle h2", "th2"],
    buildContent: () => toggleBlock(2),
    turnInto: { kind: "toggle", level: 2 },
  },
  {
    key: "toggleHeading3",
    nodeType: "toggleBlock",
    label: "Toggle heading 3",
    description: "Collapsible small heading",
    icon: Heading3,
    category: "toggles",
    aliases: ["toggle h3", "th3"],
    buildContent: () => toggleBlock(3),
    turnInto: { kind: "toggle", level: 3 },
  },
  {
    key: "toggleHeading4",
    nodeType: "toggleBlock",
    label: "Toggle heading 4",
    description: "Collapsible tiny heading",
    icon: Heading4,
    category: "toggles",
    aliases: ["toggle h4", "th4"],
    buildContent: () => toggleBlock(4),
    turnInto: { kind: "toggle", level: 4 },
  },
];

/* ------------------------------------------------------------------ */
/* Registry API                                                        */
/* ------------------------------------------------------------------ */

export function getAllBlocks(): readonly BlockDefinition[] {
  return DEFINITIONS;
}

/** Resolves a registry entry for an arbitrary document node. */
export function findBlockForNode(nodeTypeName: string): BlockDefinition | null {
  return DEFINITIONS.find((d) => d.nodeType === nodeTypeName) ?? null;
}

/**
 * Resolves the registry key for a live document node. Headings map to
 * level-specific keys (heading1/2/3) so "Turn into" can convert
 * between heading levels; toggle blocks map by their level attr
 * (toggleList / toggleHeading1-4); everything else maps by node type.
 */
export function findBlockKeyForNode(
  nodeTypeName: string,
  attrs?: Record<string, unknown> | null,
): string | null {
  if (nodeTypeName === "heading") {
    const level = Number(attrs?.level ?? 1);
    return `heading${Number.isFinite(level) ? level : 1}`;
  }
  if (nodeTypeName === "toggleBlock") {
    const level = Number(attrs?.level ?? 0);
    return Number.isFinite(level) && level >= 1
      ? `toggleHeading${Math.min(4, Math.floor(level))}`
      : "toggleList";
  }
  const def = DEFINITIONS.find((d) => d.nodeType === nodeTypeName);
  return def?.key ?? null;
}

export function findBlockByKey(key: string): BlockDefinition | null {
  return DEFINITIONS.find((d) => d.key === key) ?? null;
}

/**
 * The "Turn into" destinations for a given current block, identified
 * by its registry key (NOT node type — all headings share the
 * `heading` node but must remain convertible between levels).
 */
export function getTurnIntoOptions(currentKey: string | null): BlockDefinition[] {
  return DEFINITIONS.filter(
    (d) => d.turnInto && d.key !== currentKey,
  );
}

/**
 * Canonical display grouping. Owns BOTH menu section order and the
 * item order within sections — every consumer (slash menu, plus
 * palette, keyboard navigation, execution indices) shares this single
 * ordering, so a row's visual position always equals its index into
 * searchBlocks() results.
 */
export const BLOCK_CATEGORY_ORDER: BlockCategory[] = [
  "basic",
  "toggles",
  "lists",
  "media",
  "advanced",
];

const CATEGORY_RANK: Record<BlockCategory, number> = {
  basic: 0,
  toggles: 1,
  lists: 2,
  media: 3,
  advanced: 4,
};

/**
 * Filters registry entries for the command menus ("/" and "+").
 * Case-insensitive; matches label, key, and aliases as substrings so
 * "/he" finds every heading and "/to" finds to-do lists.
 *
 * Results are returned in canonical display order (stable sort), which
 * guarantees menu flatIndex === result index.
 */
export function searchBlocks(query: string): BlockDefinition[] {
  const q = query.trim().toLowerCase();
  const matches = q
    ? DEFINITIONS.filter((def) => {
        if (def.label.toLowerCase().includes(q)) return true;
        if (def.key.includes(q)) return true;
        return def.aliases.some((alias) => alias.includes(q));
      })
    : [...DEFINITIONS];
  return matches.sort(
    (a, b) => CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category],
  );
}
