import { EMPTY_DOCUMENT, type EditorDocument } from "../domain/page";

/**
 * Validates an untrusted value as a Tiptap document.
 *
 * Invalid or legacy content must never crash the editor — pages recover
 * to a writable empty document instead. `null`/`undefined` and plain
 * strings are treated as empty documents.
 */
export function normalizeDocument(value: unknown): EditorDocument {
  if (value === null || value === undefined) {
    return EMPTY_DOCUMENT;
  }

  if (typeof value === "string") {
    // Legacy string content is not parseable Tiptap JSON; start clean.
    return EMPTY_DOCUMENT;
  }

  if (
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as { type?: unknown }).type !== "doc"
  ) {
    return EMPTY_DOCUMENT;
  }

  const doc = value as EditorDocument;

  // A doc with no content array renders as nothing editable.
  if (!Array.isArray(doc.content)) {
    return EMPTY_DOCUMENT;
  }

  // An explicitly empty doc still gets one empty paragraph so the
  // caret has somewhere to land on first open.
  if (doc.content.length === 0) {
    return EMPTY_DOCUMENT;
  }

  return doc;
}

/**
 * Parses an untrusted raw value that CLAIMS to be serialized Tiptap
 * JSON (e.g. list-endpoint fields that may contain plain text from
 * legacy `contentString`). Never throws; invalid input becomes an
 * empty document.
 */
export function parseRawDocument(raw: unknown): EditorDocument {
  if (typeof raw !== "string") {
    return normalizeDocument(raw);
  }

  if (raw.trim() === "") {
    return EMPTY_DOCUMENT;
  }

  try {
    return normalizeDocument(JSON.parse(raw));
  } catch {
    // Plain-text or truncated payloads are not documents.
    return EMPTY_DOCUMENT;
  }
}

