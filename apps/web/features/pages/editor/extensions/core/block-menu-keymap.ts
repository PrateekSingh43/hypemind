import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { plusCommandStore } from "../../../components/menus/block-command-menu-store";

/**
 * Keyboard support for the "+" insert menu.
 *
 * While the plus-command store is open, arrow/enter/escape are routed
 * to the menu instead of the document — identical semantics to the
 * slash trigger so both entry points feel like one system.
 */
export const BlockMenuKeymap = Extension.create({
  name: "blockMenuKeymap",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("blockMenuKeymap"),
        props: {
          handleKeyDown(_view: EditorView, event: KeyboardEvent) {
            const store = plusCommandStore;
            if (!store.getState().isOpen) return false;

            switch (event.key) {
              case "ArrowDown":
                event.preventDefault();
                store.moveSelection(1);
                return true;
              case "ArrowUp":
                event.preventDefault();
                store.moveSelection(-1);
                return true;
              case "Home":
                event.preventDefault();
                store.moveSelection(-store.getState().selectedIndex);
                return true;
              case "End": {
                event.preventDefault();
                const count = store.getState().items.length;
                if (count > 0) {
                  store.moveSelection(
                    count - 1 - store.getState().selectedIndex,
                  );
                }
                return true;
              }
              case "Enter":
              case "Tab":
                event.preventDefault();
                return store.executeAt(store.getState().selectedIndex);
              case "Escape":
                event.preventDefault();
                store.close();
                return true;
              default:
                return false;
            }
          },
        },
      }),
    ];
  },
});
