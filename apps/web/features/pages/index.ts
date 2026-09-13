/**
 * HypeMind Pages — public surface.
 *
 * Consumers should import from here only. Internal modules may change;
 * this boundary stays stable.
 */

export type {
  Page,
  PageSummary,
  EditorDocument,
} from "./domain/page";

export { EMPTY_DOCUMENT } from "./domain/page";

export {
  fetchPage,
  createPage,
  savePage,
  documentToPayload,
  type PagePatch,
} from "./persistence/page-repository";

export {
  normalizeDocument,
  parseRawDocument,
} from "./persistence/serialization";

export { usePageEditor } from "./hooks/use-page-editor";
export { usePagePersistence } from "./hooks/use-page-persistence";
export type { SaveStatus } from "./components/page-shell/save-status-store";

export { getAllBlocks, searchBlocks } from "./blocks/registry";
export type { BlockDefinition } from "./blocks/registry";

export { PageWorkspace } from "./components/page-shell/page-workspace";
