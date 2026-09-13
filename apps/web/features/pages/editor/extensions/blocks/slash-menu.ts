import { Extension } from "@tiptap/core";
import type { Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import { searchBlocks } from "../../../blocks/registry";
import type { BlockDefinition } from "../../../blocks/registry";
import {
  insertBlocksAfter,
  turnInto,
  findBlockById,
  findTopLevelAncestorId,
  replaceRangeWithBlocks,
} from "../../commands/block-commands";
import {
  slashCommandStore,
  type BlockMenuContext,
} from "../../../components/menus/block-command-menu-store";

const debug = () => process.env.NEXT_PUBLIC_DEBUG_BLOCK_IDS === "true";

/**
 * Validates the captured slash range against the live document.
 * Returns a clamped, still-sane range or null when unusable.
 */
function resolveContextRange(
  editor: Parameters<typeof findBlockById>[0],
  ctx: BlockMenuContext,
): { from: number; to: number } | null {
  if (!ctx.range) return null;
  const size = editor.state.doc.content.size;
  const from = Math.max(0, Math.min(ctx.range.from, size));
  const to = Math.max(0, Math.min(ctx.range.to, size));
  return to > from ? { from, to } : null;
}

/**
 * Slash trigger for the shared Block Command Menu.
 *
 * Execution contract (spec §35): validate stored context against the
 * live doc → run the transaction → restore focus → close. The menu is
 * closed LAST; clicks never depend on editor selection at click time.
 */
export const SlashMenu = Extension.create({
  name: "slashMenu",

  addProseMirrorPlugins() {
    const editor = this.editor;

    let activeRange: Range | null = null;
    let query = "";

    function anchorRectOf(props: {
      clientRect?: (() => DOMRect | null) | null;
    }) {
      const rect = props.clientRect?.();
      if (!rect) return null;
      return { left: rect.left, top: rect.top, bottom: rect.bottom };
    }

    /**
     * Executes the item at `index` using ONLY the store-persisted
     * context — never live editor selection.
     *
     * `index` is the flat index into `state.items` — the EXACT array
     * the menu rendered — so display grouping can never desync from
     * execution (grouped category order ≠ registry order).
     */
    const execute = (index: number): boolean => {
      const st = slashCommandStore.getState();
      const ctx = st.context;
      const def = st.items[index];

      if (!def) return false;

      // ---- Validate context --------------------------------------
      if (!activeRange && !ctx.range) {
        if (debug()) console.warn("[slash] no captured range");
        return false;
      }

      let handled = false;

      if (activeRange || ctx.range) {
        const rawRange = activeRange ?? ctx.range!;
        const range = resolveContextRange(editor, {
          ...ctx,
          range: { from: rawRange.from, to: rawRange.to },
        });

        if (range) {
          const result = applySlashCommand(editor, range, ctx.query, def);
          handled = result;
          if (debug() && !result) console.warn("[slash] apply failed", def.key);
        }
      }

      if (!handled) return false;

      // ---- Contract: transaction first, focus, close last ---------
      requestAnimationFrame(() => {
        if (!editor.isDestroyed) editor.commands.focus();
      });
      slashCommandStore.close();
      return true;
    };
    slashCommandStore.setExecutor(execute);

    return [
      Suggestion({
        editor,
        pluginKey: new PluginKey("slashCommand"),
        char: "/",
        startOfLine: false,
        allowSpaces: false,

        items: ({ query: q }) => searchBlocks(q),

        command: ({ range, props }) => {
          // Programmatic path shares the same semantics.
          const built = props.buildContent();
          replaceRangeWithBlocks(
            editor,
            range,
            Array.isArray(built) ? built : [built],
            { restoreFocus: true },
          );
        },

        render: () => ({
          onStart: (props) => {
            activeRange = props.range;
            query = props.query ?? "";
            slashCommandStore.open(anchorRectOf(props), {
              mode: "slash",
              range: { from: props.range.from, to: props.range.to },
              anchorBlockId: null,
              query,
            });
          },
          onUpdate: (props) => {
            activeRange = props.range;
            query = props.query ?? "";
            const context: BlockMenuContext = {
              mode: "slash",
              range: { from: props.range.from, to: props.range.to },
              anchorBlockId: null,
              query,
            };
            slashCommandStore.updateQuery(query, anchorRectOf(props), context);
          },
          onExit: () => {
            activeRange = null;
            query = "";
            slashCommandStore.close();
          },
          onKeyDown: ({ event }) => {
            switch (event.key) {
              case "ArrowDown":
                event.preventDefault();
                slashCommandStore.moveSelection(1);
                return true;
              case "ArrowUp":
                event.preventDefault();
                slashCommandStore.moveSelection(-1);
                return true;
              case "Home":
                slashCommandStore.moveSelection(
                  -slashCommandStore.getState().selectedIndex,
                );
                return true;
              case "End": {
                const count = slashCommandStore.getState().items.length;
                if (count > 0) {
                  slashCommandStore.moveSelection(
                    count - 1 - slashCommandStore.getState().selectedIndex,
                  );
                }
                return true;
              }
              case "Enter":
              case "Tab": {
                event.preventDefault();
                return execute(slashCommandStore.getState().selectedIndex);
              }
              case "Escape":
                event.preventDefault();
                slashCommandStore.close();
                // Escape must not leave "/query" half-alive; suggestion
                // exits naturally on the next caret/keystroke change.
                return true;
              default:
                return false;
            }
          },
        }),
      }),
    ];
  },
});

/* ------------------------------------------------------------------ */
/* Slash command application                                           */
/* ------------------------------------------------------------------ */

type SlashEditor = Parameters<typeof findBlockById>[0];
type SlashDef = ReturnType<typeof searchBlocks>[number];

/**
 * Applies a chosen block definition relative to the slash query.
 *
 * Semantics:
 * - If the query is the paragraph's ONLY content, the whole paragraph
 *   becomes the chosen block (no split artifacts).
 * - Otherwise the query text is removed; when the definition supports
 *   transformation the containing block transforms in place, else new
 *   blocks are inserted after it.
 */
export function applySlashCommand(
  editor: SlashEditor,
  range: { from: number; to: number },
  query: string,
  def: SlashDef,
): boolean {
  const { state } = editor;
  const $from = state.doc.resolve(range.from);

  const inParagraph = $from.parent.type.name === "paragraph";
  const triggerText = `/${query}`;
  const isQueryOnly =
    inParagraph && $from.parent.textContent.trim() === triggerText.trim();

  if (isQueryOnly) {
    // Whole-paragraph replacement — one clean transaction, no splits.
    const start = $from.before($from.depth);
    const end = $from.after($from.depth);
    return replaceRangeWithBlocks(
      editor,
      { from: start, to: end },
      toBlockArray(def),
      { restoreFocus: true },
    );
  }

  // Mixed content: strip the query, then transform or append.
  const ancestorId = findTopLevelAncestorId(editor, range.from);

  const removeTr = state.tr.delete(range.from, range.to);
  editor.view.dispatch(removeTr);

  if (!ancestorId) return false;

  if (def.turnInto) {
    return turnInto(editor, ancestorId, def.turnInto);
  }

  const blocks = toBlockArray(def);
  return insertBlocksAfter({
    editor,
    afterBlockId: ancestorId,
    blocks,
    focus: true,
  });
}

function toBlockArray(def: BlockDefinition) {
  const built = def.buildContent();
  return Array.isArray(built) ? built : [built];
}
