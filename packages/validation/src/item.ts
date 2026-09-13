import { z } from "zod";

/**
 * Item validation schemas.
 *
 * Aligned with the Prisma `Item` model enums (ItemType / ItemStatus).
 * Document payloads get light structural validation here — full
 * schema-fitting is ProseMirror's job on the client.
 */

export const ItemTypeEnum = z.enum([
  "QUICK_NOTE",
  "PAGE",
  "JOURNAL",
  "TASK",
  "LINK",
  "FILE",
  "SOCIAL_CLIP",
]);

export const ItemStatusEnum = z.enum([
  "ACTIVE",
  "ARCHIVED",
  "COMPLETED",
  "TRASH",
]);

/** Light structural check for a Tiptap document JSON payload. */
const tiptapDocJson = z
  .object({
    type: z.string().min(1),
    content: z.array(z.unknown()).optional(),
  })
  .passthrough();

const projectIdField = z
  .union([z.string().min(1), z.literal(null)])
  .optional();

const deletedAtField = z
  .union([z.string(), z.date(), z.literal(null)])
  .optional();

/** POST /workspaces/:wid/item/page */
export const createPageSchema = z.object({
  title: z.string().max(512).optional(),
  contentJson: tiptapDocJson.optional().nullable(),
  contentString: z.string().max(2_000_000).optional(),
  projectId: projectIdField,
});

/** PATCH /workspaces/:wid/item/:itemId — all fields optional. */
export const updateItemSchema = z.object({
  title: z.string().max(512).optional(),
  contentJson: tiptapDocJson.optional().nullable(),
  contentString: z.string().max(2_000_000).optional(),
  isPinned: z.boolean().optional(),
  projectId: projectIdField,
  deletedAt: deletedAtField,
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
