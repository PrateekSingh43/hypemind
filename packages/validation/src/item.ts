import { z } from "zod";

const ItemTypeEnum = z.enum([
  "NOTE",
  "TASK",
  "JOURNAL",
  "LINK",
  "TWEET",
  "FILE",
  "AUDIO",
]);

const ItemStatusEnum = z.enum([
  "ACTIVE",
  "INCUBATING",
  "DONE",
  "ARCHIVED",
]);

export const createItemSchema = z.object({
  // ❌ userId REMOVED — comes from auth middleware

  sectionId: z.string().optional(),

  title: z.string().min(1, "Title is required"),

  type: ItemTypeEnum.optional(),

  status: ItemStatusEnum.optional(),

  // Content
  contentText: z.string().max(4000).optional().nullable(),
  contentHtml: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),

  // Thinking Studio
  isPinned: z.boolean().optional(),

  metadata: z.record(z.string(), z.any()).optional().nullable(),

  progressiveSummary: z.string().optional().nullable(),

  // Relations — handled later, not on capture MVP
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  shares: z.array(z.string()).optional(),
  embeddings: z.array(z.string()).optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
