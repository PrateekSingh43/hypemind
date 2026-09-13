/**
 * PHASE 0 DIAGNOSTIC — reproduce "NodeType.create can't construct text nodes"
 *
 * Builds the REAL Pages schema (StarterKit v3 + task/code/image/callout stand-ins)
 * via @tiptap/core getSchema(), then replays the exact StableBlockId plugin logic
 * through a faithful simulation of prosemirror-view's appendTransaction passes.
 *
 * Run:  node scripts/diag-block-id.mjs   (from apps/web)
 */
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { Node, Extension } from "@tiptap/core";
import { common, createLowlight } from "lowlight";
import {
  EditorState,
  Plugin,
  PluginKey,
} from "@tiptap/pm/state";

/* ------------------------------------------------------------------ */
/* Stand-ins matching our TS extensions' schema contribution exactly    */
/* ------------------------------------------------------------------ */

const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      icon: { default: "💡", parseHTML: (el) => el.getAttribute("data-icon") ?? "💡", renderHTML: (a) => ({ "data-icon": a.icon ?? "💡" }) },
    };
  },
  parseHTML() { return [{ tag: 'div[data-type="callout"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "callout" }, ["div", { "data-callout-icon": "" }], ["div", { "data-callout-content": "" }, 0]];
  },
});

/** Mirror of StableBlockId.addGlobalAttributes so attrs exist on nodes. */
const BlockIdAttrs = Extension.create({
  name: "blockIdAttrs",
  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          blockId: { default: null, parseHTML: (el) => el.getAttribute("data-block-id"), renderHTML: () => ({}) },
        },
      },
    ];
  },
});

// Mirror TOP_LEVEL_BLOCK_TYPES from editor-extensions.ts
const BLOCK_TYPES = [
  "paragraph", "heading", "bulletList", "orderedList", "taskList",
  "blockquote", "codeBlock", "horizontalRule", "image", "callout",
];

/* ------------------------------------------------------------------ */
/* Faithful replica of StableBlockId plugin (FIXED implementation)      */
/* ------------------------------------------------------------------ */

let idCounter = 0;
const generateBlockId = () => `block_diag${String(++idCounter).padStart(4, "0")}`;

function makeStableBlockIdPlugin(log = () => {}) {
  return new Plugin({
    key: new PluginKey("stableBlockId"),
    appendTransaction(transactions, _oldState, newState) {
      const docHasChanged = transactions.some((tr) => tr.docChanged);
      if (!docHasChanged) return null;

      const seenIds = new Set();
      const targets = [];

      newState.doc.forEach((node, offset) => {
        log(`scan child type=${node.type.name} offset=${offset}`);
        if (node.isText || node.isInline) return;
        if (!node.isBlock) return;
        if (!BLOCK_TYPES.includes(node.type.name)) return;

        const existing = node.attrs.blockId ?? null;
        if (existing && !seenIds.has(existing)) {
          seenIds.add(existing);
          return;
        }
        let nextId = generateBlockId();
        while (seenIds.has(nextId)) nextId = generateBlockId();
        seenIds.add(nextId);
        targets.push({ pos: offset, node, nextId });
      });

      if (targets.length === 0) return null;

      const tr = newState.tr;
      let mutated = false;
      for (const { pos, node, nextId } of targets) {
        const current = tr.doc.nodeAt(pos);
        if (!current || current !== node || current.isText || current.type.name !== node.type.name) {
          log(`  skip at pos=${pos}: expected ${node.type.name}, found ${current ? current.type.name : "null"}`);
          continue;
        }
        log(`  assign ${nextId} at pos=${pos} (${current.type.name})`);
        tr.setNodeMarkup(pos, undefined, { ...current.attrs, blockId: nextId });
        mutated = true;
      }
      if (!mutated) return null;
      tr.setMeta("__uniqueIDTransaction", true);
      return tr;
    },
  });
}

/** Faithful-enough TrailingNode replica (runs BEFORE stable id, like StarterKit order). */
function makeTrailingNodePlugin() {
  return new Plugin({
    key: new PluginKey("trailingNodeDiag"),
    state: {
      init: (_, state) => state.tr.doc.lastChild?.type.name !== "paragraph",
      apply: (tr, value) => (!tr.docChanged ? value : (tr.getMeta("__uniqueIDTransaction") ? value : tr.doc.lastChild?.type.name !== "paragraph")),
    },
    appendTransaction(_transactions, _old, state) {
      const last = state.doc.lastChild;
      if (!last || last.type.name === "paragraph") return null;
      return state.tr.insert(state.doc.content.size, state.schema.nodes.paragraph.create());
    },
  });
}

/* ------------------------------------------------------------------ */
/* Multi-pass dispatch simulation (mirrors prosemirror-view)            */
/* ------------------------------------------------------------------ */

const lowlight = createLowlight(common);
const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
  CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Image.configure({ inline: false, allowBase64: false }),
  Highlight.configure({ multicolor: false }),
  Placeholder.configure({ placeholder: "x" }),
  Callout,
  BlockIdAttrs,
];
const schema = getSchema(extensions);
console.log("schema nodes:", Object.keys(schema.nodes).join(", "));

function dispatchLoop(state, userTr, { verbose = true } = {}) {
  const plugins = [makeTrailingNodePlugin(), makeStableBlockIdPlugin(verbose ? console.log : () => {})];
  let transactions = [userTr];
  let newState = state.apply(userTr);
  let appendedThisDispatch = [];

  for (let pass = 0; pass < 12; pass++) {
    let anyAppend = false;
    for (const plugin of plugins) {
      const appendTx = plugin.spec.appendTransaction(
        [...transactions],
        state,
        newState,
      );
      if (appendTx) {
        if (verbose) console.log(`  pass ${pass}: ${plugin.spec.key} appended (${appendTx.steps.length} steps)`);
        appendedThisDispatch.push(appendTx);
        transactions = [...transactions, appendTx];
        newState = newState.apply(appendTx);
        anyAppend = true;
      }
    }
    if (!anyAppend) break;
  }
  return { newState, appendedThisDispatch };
}

/* ------------------------------------------------------------------ */
/* Cases                                                                */
/* ------------------------------------------------------------------ */

function runCase(label, docJson, mutate) {
  console.log("\n==============================");
  console.log("CASE:", label);
  idCounter = 0;
  const doc = schema.nodeFromJSON(docJson);
  let state = EditorState.create({ schema, doc });
  const baseTr = state.tr;
  mutate(baseTr, state);
  try {
    const { newState } = dispatchLoop(state, baseTr);
    const kids = [];
    newState.doc.forEach((n) => kids.push(`${n.type.name}${n.attrs.blockId ? "#" + n.attrs.blockId.slice(-4) : "#NONE"}`));
    console.log("RESULT:", kids.join(" | "));
  } catch (err) {
    console.log("\n*** CRASH:", err.message);
  }
}

const t = (s) => ({ type: "text", text: s });
const P = (text, attrs) => ({ type: "paragraph", ...(attrs ? { attrs } : {}), ...(text ? { content: [t(text)] } : {}) });

/* ------------------------------------------------------------------ */
/* SEMANTICS PROBE — pin down forEach-offset ↔ nodeAt ↔ resolve mapping */
/* ------------------------------------------------------------------ */
{
  console.log("\n===== SEMANTICS PROBE =====");
  const d = schema.nodeFromJSON({ type: "doc", content: [P("hi"), { type: "horizontalRule" }, P("two")] });
  d.forEach((n, o, i) => console.log(`forEach[${i}] ${n.type.name} offset=${o} nodeSize=${n.nodeSize}`));
  console.log("doc.content.size =", d.content.size);
  for (const p of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const r = d.resolve(p);
    const na = d.nodeAt(p);
    console.log(
      `abs p=${p} -> resolve depth=${r.depth} nodeAfter=${r.nodeAfter ? `${r.nodeAfter.type.name}@${r.pos}` : "-"} | nodeAt=${na ? na.type.name : "-"}`,
    );
  }
}

// 1. Fresh default page, then typing "/" into it
runCase("fresh page -> type /", { type: "doc", content: [P()] }, (tr) => {
  tr.insertText("/", 1 + 1); // inside first paragraph
});

// 2. Text paragraph, press Enter-ish split (insert new empty para after)
runCase("text para -> Enter (new block)", { type: "doc", content: [P("hello world")] }, (tr, st) => {
  const endOfPara = 1 + st.doc.firstChild.content.size + 1;
  tr.insert(endOfPara, st.schema.nodes.paragraph.create());
});

// 3. Legacy mixed doc, hr + heading + list, no ids anywhere, type /
runCase("legacy rich doc no ids -> type /", {
  type: "doc",
  content: [
    { type: "horizontalRule" },
    { type: "heading", attrs: { level: 2 }, content: [t("Title")] },
    P("body"),
    { type: "bulletList", content: [{ type: "listItem", content: [P("item")] }] },
    { type: "callout", content: [P("note"), { type: "heading", attrs: { level: 3 }, content: [t("inner")] }] },
    { type: "codeBlock", content: [t("const x = 1")] },
  ],
}, (tr) => tr.insertText("/", 2));

// 4. Doc WITH ids already (steady-state typing — must be zero-mutation)
runCase("ids present steady state -> type x", {
  type: "doc",
  content: [P("abc", { blockId: "block_1" }), P("", { blockId: "block_2" })],
}, (tr) => tr.insertText("x", 2));

// 5. Duplicate-id healing path
runCase("duplicate ids heal", {
  type: "doc",
  content: [P("one", { blockId: "block_dup" }), P("two", { blockId: "block_dup" })],
}, (tr) => tr.insertText("!", 3));

// 6. Trailing-node interaction: doc ending with codeBlock -> type /
runCase("ends w/ codeBlock (trailing appends) -> type /", {
  type: "doc",
  content: [{ type: "codeBlock", content: [t("hi")] }],
}, (tr) => tr.insertText("/", 2));

console.log("\nDIAG COMPLETE");
