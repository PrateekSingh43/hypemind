import { z } from "zod";

/* 1. schema for the post one meaning there will 
        a. content , 
        b. title (optional)
        c 
*/

export const createQuickNoteSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(1).max(2500),
  contentJson: z.unknown().optional(),
  metadata: z.string().min(1).max(500).optional(),
  tags: z.array(z.string().min(1).max(60)).max(20).optional(),
});

export type createQuickNoteSchema = z.infer<typeof createQuickNoteSchema>;

export { z, type ZodType } from "zod";
