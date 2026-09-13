import { all, createLowlight } from "lowlight";

/**
 * Shared syntax-highlighting instance for page code blocks.
 *
 * Registers the full highlight.js grammar set (~190 languages,
 * Notion-parity "100+ languages" requirement) into ONE lowlight
 * instance reused by every CodeBlockLowlight extension instance.
 *
 * Bundle note: grammars live behind the editor chunk; if payload ever
 * becomes a concern, swap `all` for a curated subset registered from
 * `highlight.js/lib/languages/*` — the public surface below is stable.
 */
export const lowlight = createLowlight(all);

/** Friendly display names for the common ids; others derive mechanically. */
const PRETTY_LABELS: Record<string, string> = {
  plaintext: "Plain text",
  bash: "Bash",
  shell: "Shell",
  csharp: "C#",
  cpp: "C++",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  golang: "Go",
  graphql: "GraphQL",
  javascript: "JavaScript",
  typescript: "TypeScript",
  json: "JSON",
  xml: "HTML / XML",
  markdown: "Markdown",
  "python-repl": "Python REPL",
  objectivec: "Objective-C",
  dockerfile: "Dockerfile",
  vbnet: "VB.NET",
  wasm: "WebAssembly",
};

function prettify(id: string): string {
  const known = PRETTY_LABELS[id];
  if (known) return known;
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Picker options: every registered language, alphabetically by label.
 * Derived from the grammar map so the list can never drift from what
 * highlighting actually supports.
 */
export const CODE_LANGUAGES: ReadonlyArray<{ id: string; label: string }> =
  Object.keys(all)
    .map((id) => ({ id, label: prettify(id) }))
    .sort((a, b) => a.label.localeCompare(b.label));
