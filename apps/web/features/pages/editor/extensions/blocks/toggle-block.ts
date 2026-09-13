import { mergeAttributes, Node } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import { Selection } from "@tiptap/pm/state";
import type { EditorView, ViewMutationRecord } from "@tiptap/pm/view";

/**
 * Toggle blocks — Notion-style collapsible sections.
 *
 * Schema (three cooperating nodes, all schema-first/portable):
 * - toggleBlock    container; carries `level` (0 = toggle list,
 *                  1–4 = toggle heading) and presentation-only `open`.
 * - toggleTitle    the always-visible header line; owns the chevron
 *                  control via its NodeView (decorative DOM, never
 *                  serialized).
 * - toggleContent  the collapsible body; accepts any blocks, including
 *                  nested toggle blocks.
 *
 * Open/closed state lives in the `open` ATTRIBUTE and is flipped via
 * transactions (history-skipped): class-only toggling cannot survive
 * ProseMirror's attribute re-sync on the next selection change.
 * Newly inserted toggles carry `open: true` so users immediately see
 * where their content goes.
 */

const CHEVRON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

export const ToggleBlock = Node.create({
  name: "toggleBlock",

  group: "block",

  content: "toggleTitle toggleContent",

  defining: true,
  isolating: true,

  addAttributes() {
    return {
      level: {
        default: 0,
        parseHTML: (element) => {
          const parsed = Number.parseInt(
            element.getAttribute("data-level") ?? "0",
            10,
          );
          return Number.isFinite(parsed) ? parsed : 0;
        },
        renderHTML: (attributes) => ({
          "data-level": String(attributes.level ?? 0),
        }),
      },
      open: {
        default: true,
        parseHTML: (element) =>
          element.getAttribute("data-open") !== "false",
        renderHTML: (attributes) => ({
          "data-open": attributes.open ? "true" : "false",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggle-block"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const isOpen = node.attrs.open !== false;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "toggle-block",
        class: isOpen ? "hym-toggle hym-open" : "hym-toggle",
      }),
      0,
    ];
  },
});

export const ToggleTitle = Node.create({
  name: "toggleTitle",

  group: "block",

  content: "inline*",

  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="toggle-title"]' }];
  },

  // Clipboard/serialization form stays chrome-free; the chevron exists
  // only in the live NodeView below.
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "toggle-title" }),
      0,
    ];
  },

  addNodeView() {
    /**
     * IMPORTANT: this view must be STABLE. A plain object NodeView
     * without `update` is destroyed and recreated on every view update
     * (e.g. the selection transaction a mousedown can trigger), which
     * detaches the chevron MID-GESTURE and retargets the subsequent
     * click to an ancestor — making the button feel dead. Accepting
     * same-type updates keeps one DOM instance (and its listeners)
     * alive for the node's whole life.
     */
    return ({ view }: { view: EditorView }) => {
      const dom = document.createElement("div");
      dom.setAttribute("data-type", "toggle-title");
      dom.className = "hym-toggle-head";

      const chevron = document.createElement("button");
      chevron.type = "button";
      chevron.className = "hym-toggle-chevron";
      chevron.setAttribute("aria-label", "Toggle section");
      chevron.setAttribute("contenteditable", "false");
      chevron.draggable = false;
      chevron.innerHTML = CHEVRON_SVG;

      // The press must neither move the caret nor reach ProseMirror:
      // stopping it here guarantees no selection transaction fires while
      // the button is being pressed, so the click always lands on THIS
      // element.
      chevron.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      /**
       * Collapse/expand flips the `open` ATTRIBUTE through a real
       * transaction. Presentation-only class toggles are futile here:
       * the very next selection transaction makes PM re-sync wrapper
       * attributes from the node, silently restoring the old class.
       * Skipping history keeps undo focused on content; autosave picks
       * up the new state like any other edit (matches Notion).
       */
      chevron.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = dom.closest<HTMLElement>(
          '[data-type="toggle-block"]',
        );
        if (!wrapper || !view || view.isDestroyed) return;

        const innerPos = view.posAtDOM(wrapper, 0);
        const start = Math.max(0, innerPos - 1);
        const found = view.state.doc.nodeAt(start);
        if (!found || found.type.name !== "toggleBlock") return;

        const isOpen = found.attrs.open !== false;
        const tr = view.state.tr.setNodeMarkup(start, undefined, {
          ...found.attrs,
          open: !isOpen,
        });
        tr.setMeta("addToHistory", false);
        view.dispatch(tr);
      });

      const contentDOM = document.createElement("div");
      contentDOM.className = "hym-toggle-title";
      contentDOM.setAttribute("data-type", "toggle-title-text");

      dom.append(chevron, contentDOM);

      return {
        dom,
        contentDOM,
        update: (node: PMNode) =>
          // Same node type: keep this DOM instance alive.
          node.type.name === "toggleTitle",
        ignoreMutation: (mutation: ViewMutationRecord) => {
          // Decorative chrome never changes; PM manages contentDOM's
          // children itself. Selection mutations are irrelevant here.
          const type = String(mutation.type);
          if (type === "selection") return true;
          return (
            mutation.target !== contentDOM &&
            !contentDOM.contains(mutation.target)
          );
        },
      };
    };
  },

  addKeyboardShortcuts() {
    /** True when the caret sits directly inside a toggle title. */
    const caretInTitle = (state: EditorState): boolean =>
      state.selection.empty &&
      state.selection.$from.parent.type.name === this.name;

    return {
      /**
       * Enter in the title jumps the caret into the body (opening it
       * first if collapsed) instead of splitting the header line. The
       * open flip rides the same transaction — attr-driven, so PM's
       * attribute sync can never revert it.
       */
      Enter: ({ editor }) => {
        const { state } = editor;
        if (!caretInTitle(state)) return false;

        const { $from } = state.selection;
        let titleDepth = -1;
        for (let d = $from.depth; d > 0; d -= 1) {
          if ($from.node(d).type.name === this.name) {
            titleDepth = d;
            break;
          }
        }
        if (titleDepth === -1) return false;

        const blockStart = $from.before(titleDepth - 1);
        const blockNode = state.doc.nodeAt(blockStart);

        // First position inside the body: right after the title node.
        const bodyStart = $from.after(titleDepth);

        const tr = state.tr;
        if (
          blockNode &&
          blockNode.type.name === "toggleBlock" &&
          blockNode.attrs.open === false
        ) {
          tr.setNodeMarkup(blockStart, undefined, {
            ...blockNode.attrs,
            open: true,
          });
        }

        const sel = Selection.near(tr.doc.resolve(bodyStart + 1), 1);
        tr.setSelection(sel).scrollIntoView();
        editor.view.dispatch(tr);
        return true;
      },
    };
  },
});

export const ToggleContent = Node.create({
  name: "toggleContent",

  group: "block",

  content: "block+",

  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="toggle-content"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "toggle-content" }),
      0,
    ];
  },
});
