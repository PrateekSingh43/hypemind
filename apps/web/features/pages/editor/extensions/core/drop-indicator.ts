import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type DropIndicatorState = {
  /** Absolute doc position of the block boundary the drop would land at. */
  pos: number;
} | null;

export const dropIndicatorPluginKey = new PluginKey<DropIndicatorState>(
  "dropIndicator",
);

type BlockBoundary = { blockStart: number; node: PMNode | null };

/** Resolves any doc position to its containing top-level block. */
function topLevelBlockAt(view: EditorView, pos: number): BlockBoundary | null {
  const $pos = view.state.doc.resolve(pos);

  if ($pos.depth === 0) {
    return { blockStart: $pos.pos, node: $pos.nodeAfter };
  }

  const start = $pos.before(1);
  const $start = view.state.doc.resolve(start);
  return { blockStart: start, node: $start.nodeAfter };
}

/**
 * Resolves a pointer position to the nearest top-level block boundary.
 *
 * Returns the absolute position where an insertion line should render.
 * Snapping to depth-0 boundaries keeps the indicator honest with what
 * ProseMirror's native drop will do for whole-block drags.
 */
function resolveDropTarget(
  view: EditorView,
  coords: { left: number; top: number },
): DropIndicatorState {
  const result = view.posAtCoords(coords);
  if (!result || !view.state.doc.resolve(result.pos)) {
    return null;
  }

  const boundary = topLevelBlockAt(view, result.pos);
  if (!boundary?.node) {
    return null;
  }

  const element = view.nodeDOM(boundary.blockStart);
  if (!(element instanceof Element)) {
    return null;
  }

  // Use the outermost rendered wrapper so list/quote containers measure
  // their full footprint rather than the first text line.
  const host = element.closest<HTMLElement>(
    "[data-type='taskList'], li, blockquote, .hym-callout, p, h1, h2, h3, pre",
  );
  const rect = (host ?? element).getBoundingClientRect();

  const before = coords.top < rect.top + rect.height / 2;
  return {
    pos: before ? boundary.blockStart : boundary.blockStart + boundary.node.nodeSize,
  };
}

/**
 * Renders a horizontal insertion line while dragging blocks.
 *
 * The actual content move is performed by ProseMirror's native drag &
 * drop once the DragHandle selects the dragged range — this extension
 * only communicates where the drop will land.
 */
export const DropIndicator = Extension.create({
  name: "dropIndicator",

  addProseMirrorPlugins() {
    return [
      new Plugin<DropIndicatorState>({
        key: dropIndicatorPluginKey,
        view(editorView) {
          // Drags can end outside the editor surface (Esc cancel, drop
          // into another app) where editor-DOM events never fire. These
          // window-level listeners guarantee the line is removed.
          const clear = () => {
            editorView.dispatch(
              editorView.state.tr.setMeta(dropIndicatorPluginKey, null),
            );
          };
          window.addEventListener("dragend", clear);
          window.addEventListener("drop", clear);
          return {
            destroy() {
              window.removeEventListener("dragend", clear);
              window.removeEventListener("drop", clear);
            },
          };
        },
        state: {
          init: () => null,
          apply(tr, value) {
            const meta = tr.getMeta(dropIndicatorPluginKey);
            if (meta !== undefined) {
              return meta as DropIndicatorState;
            }
            if (tr.docChanged) {
              return null;
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            const target = dropIndicatorPluginKey.getState(state);
            if (!target) {
              return DecorationSet.empty;
            }

            const widget = Decoration.widget(
              target.pos,
              () => {
                const el = document.createElement("div");
                el.className = "hym-drop-indicator";
                el.setAttribute("aria-hidden", "true");
                return el;
              },
              { side: -10, ignoreSelection: true },
            );

            return DecorationSet.create(state.doc, [widget]);
          },
          handleDOMEvents: {
            dragover(view, event) {
              const coords = { left: event.clientX, top: event.clientY };
              const next = resolveDropTarget(view, coords);
              const current = dropIndicatorPluginKey.getState(view.state);

              const changed =
                (next?.pos ?? -1) !== (current?.pos ?? -1) ||
                (!!next !== !!current);

              if (changed) {
                view.dispatch(
                  view.state.tr.setMeta(dropIndicatorPluginKey, next),
                );
              }
              // Let ProseMirror continue handling the native drag flow.
              return false;
            },
            dragleave(view, event) {
              // Only clear when genuinely leaving the editor surface.
              if (
                event.target instanceof Node &&
                view.dom.contains(event.relatedTarget as Node | null)
              ) {
                return false;
              }
              view.dispatch(
                view.state.tr.setMeta(dropIndicatorPluginKey, null),
              );
              return false;
            },
            drop(view) {
              view.dispatch(
                view.state.tr.setMeta(dropIndicatorPluginKey, null),
              );
              return false;
            },
            dragend(view) {
              view.dispatch(
                view.state.tr.setMeta(dropIndicatorPluginKey, null),
              );
              return false;
            },
          },
        },
      }),
    ];
  },
});
