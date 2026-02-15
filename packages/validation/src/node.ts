import { z } from "zod";

// ============================================
// ENUMS (matching Prisma schema)
// ============================================

export const NodeTypeEnum = z.enum([
	"NOTE",
	"TASK",
	"JOURNAL",
	"LINK",
	"FILE",
	"AUDIO",
	"TWEET",
]);

export const StudioStateEnum = z.enum([
	"ACTIVE",
	"INCUBATING",
	"DONE",
	"ARCHIVED",
]);

export const CollectionTypeEnum = z.enum([
	"PROJECT",
	"AREA",
	"RESOURCE",
	"ARCHIVE",
]);

// ============================================
// EDITOR BLOCK SCHEMA
// ============================================

export const BlockTypeEnum = z.enum([
	"paragraph",
	"heading",
	"bulletList",
	"orderedList",
	"listItem",
	"taskList",
	"taskItem",
	"blockquote",
	"codeBlock",
]);

const markSchema = z.object({
	type: z.string(),
	attrs: z.record(z.string(), z.any()).optional(),
});

const textNodeSchema = z.object({
	type: z.literal("text"),
	text: z.string(),
	marks: z.array(markSchema).optional(),
});

const hardBreakSchema = z.object({
	type: z.literal("hardBreak"),
});

const horizontalRuleSchema = z.object({
	type: z.literal("horizontalRule"),
});

export const blockNodeSchema: z.ZodType<unknown> = z.lazy(() =>
	z.union([
		textNodeSchema,
		hardBreakSchema,
		horizontalRuleSchema,
		z.object({
			type: BlockTypeEnum,
			attrs: z.record(z.string(), z.any()).optional(),
			content: z.array(blockNodeSchema).optional(),
			text: z.string().optional(),
			marks: z.array(markSchema).optional(),
		}),
	])
);

export const blockDocumentSchema = z.object({
	type: z.literal("doc"),
	content: z.array(blockNodeSchema).optional(),
});

export type BlockDocument = z.infer<typeof blockDocumentSchema>;

// ============================================
// NODE SCHEMAS
// ============================================

export const createNodeSchema = z.object({
	title: z.string().min(1, "Title is required").max(500),
	type: NodeTypeEnum.default("NOTE"),
	studioState: StudioStateEnum.optional(),
	collectionId: z.string().cuid().optional().nullable(),
	contentJson: blockDocumentSchema.optional().nullable(),
	contentHtml: z.string().optional().nullable(),
	url: z.string().url().optional().nullable(),
	metadata: z.record(z.string(), z.any()).optional().nullable(),
	labelIds: z.array(z.string().cuid()).optional(),
});

export const updateNodeSchema = z.object({
	title: z.string().min(1).max(500).optional(),
	contentJson: blockDocumentSchema.optional().nullable(),
	contentHtml: z.string().optional().nullable(),
	studioState: StudioStateEnum.optional(),
	collectionId: z.string().cuid().optional().nullable(),
	isPinned: z.boolean().optional(),
	metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export const moveNodeSchema = z.object({
	collectionId: z.string().cuid().nullable(),
});

export const pinNodeSchema = z.object({
	isPinned: z.boolean(),
});

export const changeStateSchema = z.object({
	studioState: StudioStateEnum,
});

// ============================================
// COLLECTION SCHEMAS
// ============================================

export const createCollectionSchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	description: z.string().max(1000).optional().nullable(),
	type: CollectionTypeEnum,
	parentId: z.string().cuid().optional().nullable(),
});

export const updateCollectionSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(1000).optional().nullable(),
	type: CollectionTypeEnum.optional(),
	parentId: z.string().cuid().optional().nullable(),
});

// ============================================
// LABEL SCHEMAS
// ============================================

export const createLabelSchema = z.object({
	name: z.string().min(1).max(50),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
});

// ============================================
// SEARCH SCHEMA
// ============================================

export const searchSchema = z.object({
	q: z.string().min(1).max(200),
	type: NodeTypeEnum.optional(),
	collection: z.string().cuid().optional(),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ============================================
// SHARE SCHEMA
// ============================================

export const createShareSchema = z.object({
	expiresAt: z.string().datetime().optional().nullable(),
});

// ============================================
// TELEMETRY SCHEMA
// ============================================

export const EventActionEnum = z.enum([
	"DASHBOARD_VIEWED",
	"NODE_CREATED",
	"NODE_OPENED",
	"NODE_UPDATED",
	"NODE_MOVED",
	"NODE_PINNED",
	"NODE_UNPINNED",
	"NODE_ARCHIVED",
	"NODE_DELETED",
	"SEARCH_PERFORMED",
	"CAPTURE_OPENED",
	"ASSET_UPLOADED",
]);

export const logEventSchema = z.object({
	action: EventActionEnum,
	nodeId: z.string().cuid().optional(),
	meta: z.record(z.string(), z.any()).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type MoveNodeInput = z.infer<typeof moveNodeSchema>;
export type PinNodeInput = z.infer<typeof pinNodeSchema>;
export type ChangeStateInput = z.infer<typeof changeStateSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type CreateShareInput = z.infer<typeof createShareSchema>;
export type LogEventInput = z.infer<typeof logEventSchema>;
export type NodeType = z.infer<typeof NodeTypeEnum>;
export type StudioState = z.infer<typeof StudioStateEnum>;
export type CollectionType = z.infer<typeof CollectionTypeEnum>;
