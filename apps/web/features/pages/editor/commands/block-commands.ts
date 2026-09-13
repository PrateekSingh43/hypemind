import type { Editor } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import {
  Fragment,
  Node as PMNode,
  type Node as PMNodeType,
} from "@tiptap/pm/model";
import { NodeSelection, Selection } from "@tiptap/pm/state";
import type { TurnIntoSpec } from "../../blocks/registry";

/**
 * HypeMind block command layer.
 *
 * All document manipulation exposed to product features goes through
 * these functions. They translate stable block ids into ProseMirror
 * positions internally so callers (menus, AI, automation, tests) never
 * need raw positions or DOM access.
 */

export type BlockHandle = {
  /** Absolute position before the block node. */
  from: number;
  /** Absolute position after the block node. */
  to: number;
  node: PMNodeType;
};

export function findBlockById(
  editor: Editor,
  blockId: string,
): BlockHandle | null {
  let found: BlockHandle | null = null;
  editor.state.doc.forEach((node, offset) => {
    if (found) return;
    const id = node.attrs.blockId as string | null | undefined;
    if (id === blockId) {
      found = { from: offset, to: offset + node.nodeSize, node };
    }
  });
  return found;
}

export function getBlockText(editor: Editor, blockId: string): string {
  const handle = findBlockById(editor, blockId);
  if (!handle) return "";
  return handle.node.textBetween(0, handle.node.content.size, "\n");
}

/**
 * Stable id of the top-level block containing `pos`. Used to capture
 * slash-menu context while the editor is guaranteed consistent.
 */
export function findTopLevelAncestorId(
  editor: Editor,
  pos: number,
): string | null {
  const $pos = editor.state.doc.resolve(pos);
  const start = $pos.depth > 0 ? $pos.before(1) : $pos.pos;
  const node =
    editor.state.doc.nodeAt(start) ??
    editor.state.doc.childBefore(Math.max(0, start)).node;
  return (node?.attrs.blockId as string | null | undefined) ?? null;
}

function firstCaretPos(node: PMNodeType, start: number): number | null {
  if (node.isAtom || node.isLeaf) return null;
  if (node.isTextblock) return start + 1;

  let childStart = start + 1;
  for (let i = 0; i < node.childCount; i += 1) {
    const child = node.child(i);
    const found =
      child.isTextblock || child.isLeaf
        ? child.isTextblock
          ? childStart + 1
          : null
        : firstCaretPos(child, childStart);
    if (found !== null && found >= 0) return found;
    childStart += child.nodeSize;
  }
  return start + 1;
}

function selectNear(editor: Editor, pos: number): void {
  const { doc } = editor.state;
  const clamped = Math.max(0, Math.min(pos, doc.content.size));
  const sel = Selection.near(doc.resolve(clamped), 1);
  editor.view.dispatch(editor.state.tr.setSelection(sel).scrollIntoView());
}

function focusInsideBlock(editor: Editor, nodeStart: number, node: PMNodeType): void {
  const caret = firstCaretPos(node, nodeStart);
  editor.commands.focus();
  if (caret === null) {
    const sel = NodeSelection.create(editor.state.doc, nodeStart);
    editor.view.dispatch(editor.state.tr.setSelection(sel).scrollIntoView());
  } else {
    selectNear(editor, caret);
  }
}

export type InsertBlocksOptions = {
  editor: Editor;
  afterBlockId?: string;
  blocks: JSONContent[];
  focus?: boolean;
};

export function insertBlocksAfter({
  editor,
  afterBlockId,
  blocks,
  focus = true,
}: InsertBlocksOptions): boolean {
  if (blocks.length === 0) return false;

  const { state } = editor;
  let insertAt = state.doc.content.size;

  if (afterBlockId) {
    const anchor = findBlockById(editor, afterBlockId);
    if (!anchor) return false;
    insertAt = anchor.to;
  }

  const nodes = blocks.map((json) =>
    PMNode.fromJSON(state.schema, json as never),
  );

  const tr = state.tr.insert(insertAt, Fragment.from(nodes));
  tr.setMeta("addToHistory", true);
  editor.view.dispatch(tr);

  if (focus) {
    focusInsideBlock(editor, insertAt, nodes[0]);
  }
  return true;
}

export function deleteBlock(editor: Editor, blockId: string): boolean {
  const handle = findBlockById(editor, blockId);
  if (!handle) return false;

  const { state } = editor;
  const tr = state.tr.delete(handle.from, handle.to);

  if (tr.doc.childCount === 0) {
    tr.insert(0, state.schema.nodes.paragraph.create());
  }

  editor.view.dispatch(tr);
  return true;
}

export function duplicateBlock(editor: Editor, blockId: string): boolean {
  const handle = findBlockById(editor, blockId);
  if (!handle) return false;

  const { state } = editor;
  const json = handle.node.toJSON() as JSONContent;
  delete json.attrs?.blockId;

  const clone = PMNode.fromJSON(state.schema, json);
  const tr = state.tr.insert(handle.to, clone);
  editor.view.dispatch(tr);
  return true;
}

export function moveBlockByOffset(
  editor: Editor,
  blockId: string,
  offset: 1 | -1,
): boolean {
  const handle = findBlockById(editor, blockId);
  if (!handle) return false;

  const { state } = editor;
  const { doc } = state;

  if (offset === -1 && handle.from === 0) return false;
  if (offset === 1 && handle.to === doc.content.size) return false;

  let targetPos = -1;
  if (offset === -1) {
    const $pos = doc.resolve(handle.from);
    const prev = $pos.nodeBefore;
    if (!prev) return false;
    targetPos = handle.from - prev.nodeSize;
  } else {
    targetPos = handle.to;
  }

  const tr = state.tr;
  const slice = tr.doc.slice(handle.from, handle.to);
  tr.delete(handle.from, handle.to);

  const insertPos =
    offset === -1 ? targetPos : targetPos - (handle.to - handle.from);
  tr.insert(insertPos, slice.content);

  editor.view.dispatch(tr);
  return true;
}

/**
 * Converts any block into a toggle block.
 *
 * - Textblocks carry their inline content into the toggle title.
 * - Existing toggles keep their title (level changes only).
 * - Everything else starts with an empty title.
 */
function turnIntoToggle(
  editor: Editor,
  blockId: string,
  level: number,
): boolean {
  const handle = findBlockById(editor, blockId);
  if (!handle) return false;
  const { state } = editor;

  let inlineContent: Fragment | null = null;
  if (handle.node.type.name === "toggleBlock") {
    inlineContent = handle.node.child(0).content;
  } else if (handle.node.isTextblock && handle.node.content.size > 0) {
    inlineContent = handle.node.content;
  }

  const title = state.schema.nodes.toggleTitle.create(
    null,
    inlineContent ?? undefined,
  );
  const body = state.schema.nodes.toggleContent.create(null, [
    state.schema.nodes.paragraph.create(),
  ]);
  const toggle = state.schema.nodes.toggleBlock.create(
    {
      level,
      open: true,
      ...(handle.node.attrs.blockId
        ? { blockId: handle.node.attrs.blockId as string }
        : {}),
    },
    [title, body],
  );

  const tr = state.tr.replaceWith(handle.from, handle.to, toggle);
  editor.view.dispatch(tr);

  // Caret at the end of the preserved title text.
  selectNear(editor, handle.from + 2 + title.content.size);
  return true;
}

export function turnInto(
  editor: Editor,
  blockId: string,
  spec: TurnIntoSpec,
): boolean {
  const handle = findBlockById(editor, blockId);
  if (!handle) return false;

  if (spec.kind === "toggle") {
    return turnIntoToggle(editor, blockId, spec.level);
  }

  // Deterministic caret: transformations must run against THIS block
  // regardless of where focus/selection drifted (menu clicks blur the
  // editor), so place it inside the block's first text slot first.
  const caret = firstCaretPos(handle.node, handle.from);
  const anchorPos = caret ?? handle.from + 1;

  const chain = editor.chain().setTextSelection(anchorPos);
  switch (spec.kind) {
    case "paragraph": chain.setParagraph(); break;
    case "heading": chain.setHeading({ level: spec.level }); break;
    case "bulletList": chain.toggleBulletList(); break;
    case "orderedList": chain.toggleOrderedList(); break;
    case "taskList": chain.toggleTaskList(); break;
    case "quote": chain.toggleBlockquote(); break;
    case "codeBlock": chain.toggleCodeBlock(); break;
    // Registered by our Callout extension (wrapIn-based).
    case "callout": chain.wrapIn("callout"); break;
    case "divider": chain.setHorizontalRule(); break;
  }
  return chain.run();
}

type ReplaceRangeOptions = {
  /** Restore editor focus into the first inserted block afterwards. */
  restoreFocus?: boolean;
};

/**
 * Replaces `range` with the given blocks.
 *
 * When the enclosing block has no meaningful text left after the
 * replacement range is removed (the common "/query-only paragraph"
 * slash case), the WHOLE block is replaced — preventing the split/
 * duplicate artifacts of inline-range fitting. Otherwise the blocks
 * are inserted at the range position.
 */
export function replaceRangeWithBlocks(
  editor: Editor,
  range: { from: number; to: number },
  blocks: JSONContent[],
  options: ReplaceRangeOptions = {},
): boolean {
  if (blocks.length === 0) return false;

  const { state } = editor;
  const tr = state.tr.delete(range.from, range.to);

  // Locate the enclosing top-level block in the POST-delete doc.
  const $pos = tr.doc.resolve(Math.min(range.from, tr.doc.content.size));
  const blockStart =
    $pos.depth > 0 ? $pos.before(1) : $pos.pos - ($pos.nodeBefore?.nodeSize ?? 0);
  const blockNode = blockStart >= 0 ? tr.doc.nodeAt(blockStart) : null;

  const remainingText = blockNode ? blockNode.textContent.trim() : "";
  const replacedWholeBlock =
    !!blockNode && remainingText === "" && !blockNode.isAtom;

  if (replacedWholeBlock && blockNode) {
    // Replace the entire block with the new nodes; carry identity over.
    const nodes = blocks.map((json, i) => {
      const clone: JSONContent = { ...json };
      if (i === 0 && blockNode.attrs.blockId) {
        clone.attrs = {
          ...(clone.attrs ?? {}),
          blockId: blockNode.attrs.blockId as string,
        };
      }
      return PMNode.fromJSON(state.schema, clone as never);
    });
    tr.replaceWith(
      blockStart,
      blockStart + blockNode.nodeSize,
      Fragment.from(nodes),
    );
    editor.view.dispatch(tr);

    if (options.restoreFocus) {
      focusInsideBlock(editor, blockStart, nodes[0]);
    }
    return true;
  }

  editor.view.dispatch(tr);
  editor.commands.insertContentAt(range.from, blocks);

  if (options.restoreFocus) {
    requestAnimationFrame(() => {
      if (!editor.isDestroyed) {
        selectNear(editor, range.from);
        editor.commands.focus();
      }
    });
  }
  return true;
}

