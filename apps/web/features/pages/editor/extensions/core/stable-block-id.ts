import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Transaction } from "@tiptap/pm/state";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export const BLOCK_ID_ATTRIBUTE = "data-block-id";
const ID_PREFIX = "block_";

/**
 * Generates a stable block identifier.
 *
 * Format: `block_<32 hex chars>` derived from crypto.randomUUID.
 * The dedupe pass below additionally guarantees uniqueness inside
 * a single document at any point in time.
 */
function generateBlockId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${ID_PREFIX}${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `${ID_PREFIX}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * StableBlockId assigns and preserves unique ids on top-level blocks.
 *
 * Design notes:
 * - Only depth-0 children of the document are addressed. Inline content,
 *   list items and nested structures deliberately have no ids: a "block"
 *   in HypeMind is a top-level content unit.
 * - Ids survive moves, undo/redo, reloads and future AI operations
 *   because they are node attributes inside the canonical document.
 * - Paste/duplication that would create duplicate ids is healed: the
 *   first occurrence keeps its id, later duplicates get fresh ones.
 *
 * Position semantics (verified against prosemirror-model@1.25):
 * `doc.forEach` yields offsets relative to the doc's content start,
 * which for top-level nodes ARE their absolute positions (the first
 * child starts at 0). Text nodes are never touched — assignments only
 * ever go through a validated, non-text target check before
 * `setNodeMarkup` runs, so the plugin can never attempt to construct
 * a text node.
 */
export interface StableBlockIdOptions {
  /** Node type names that receive block ids when they are top-level. */
  types: string[];
}

export const StableBlockId = Extension.create<StableBlockIdOptions>({
  name: "stableBlockId",

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          blockId: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute(BLOCK_ID_ATTRIBUTE) ?? null,
            renderHTML: (attributes) => {
              const blockId = attributes.blockId as string | null;
              if (!blockId) {
                return {};
              }
              return { [BLOCK_ID_ATTRIBUTE]: blockId };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    const blockTypes = this.options.types;

    return [
      new Plugin({
        key: new PluginKey("stableBlockId"),
        appendTransaction: (
          transactions: readonly Transaction[],
          _oldState,
          newState,
        ) => {
          const docHasChanged = transactions.some((tr) => tr.docChanged);
          if (!docHasChanged) {
            return null;
          }

          // Pass 1 — collect targets without mutating anything.
          const seenIds = new Set<string>();
          const targets: Array<{
            pos: number;
            node: ProseMirrorNode;
            nextId: string;
          }> = [];

          newState.doc.forEach(
            (node: ProseMirrorNode, offset: number) => {
              // Structural invariant: text/inline nodes can never be blocks.
              if (node.isText || node.isInline) return;
              if (!node.isBlock) return;
              if (!blockTypes.includes(node.type.name)) return;

              const existing =
                (node.attrs.blockId as string | null | undefined) ?? null;

              // Keep existing identity; heal duplicates only.
              if (existing && !seenIds.has(existing)) {
                seenIds.add(existing);
                return;
              }

              let nextId = generateBlockId();
              while (seenIds.has(nextId)) {
                nextId = generateBlockId();
              }
              seenIds.add(nextId);

              targets.push({ pos: offset, node, nextId });
            },
          );

          if (targets.length === 0) {
            return null;
          }

          // Pass 2 — apply with per-target validation against the live tr
          // doc. The node at `pos` must be the exact block we scanned;
          // anything else is skipped rather than risked.
          const tr = newState.tr;
          let mutated = false;

          for (const { pos, node, nextId } of targets) {
            const current = tr.doc.nodeAt(pos);
            if (
              !current ||
              current !== node ||
              current.isText ||
              current.type.name !== node.type.name
            ) {
              // Opt-in diagnostics for skipped assignments.
              if (process.env.NEXT_PUBLIC_DEBUG_BLOCK_IDS === "true") {
                console.warn(
                  `[StableBlockId] skipped assignment at pos=${pos}: ` +
                    `expected ${node.type.name}, found ${current ? current.type.name : "null"}`,
                );
              }
              continue;
            }

            tr.setNodeMarkup(pos, undefined, {
              ...current.attrs,
              blockId: nextId,
            });
            mutated = true;
          }

          if (!mutated) {
            return null;
          }

          // Mark the transaction so other plugins (e.g. TrailingNode)
          // treat it as bookkeeping rather than user content changes.
          tr.setMeta("__uniqueIDTransaction", true);
          return tr;
        },
      }),
    ];
  },
});

/** Reads the stable id of a node, or null when it has none. */
export function getBlockId(node: ProseMirrorNode): string | null {
  return (node.attrs.blockId as string | null | undefined) ?? null;
}

/** Extracts plain text from a block subtree (used for previews/search). */
export function getNodeText(node: ProseMirrorNode): string {
  return node.textBetween(0, node.content.size, "\n", "");
}
