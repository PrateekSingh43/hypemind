import { Router } from "express";
import { createQuickNoteController, getQuickNotesController, updateQuickNoteController, duplicateQuickNoteController } from "./quicknote.controller";
import { validateSchema } from "../middlewares/middleware.validate";
import { createQuickNoteSchema } from "@repo/validation";
import { authMiddleware } from "../middlewares/middleware.auth";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";


const router: Router = Router();



router.get("/:workspaceId/item/quick-note", authMiddleware, workspaceMemberMiddleware, getQuickNotesController);
router.patch("/:workspaceId/item/quick-note/:itemId", authMiddleware, workspaceMemberMiddleware, updateQuickNoteController);
router.post("/:workspaceId/item/quick-note", authMiddleware , workspaceMemberMiddleware,  validateSchema(createQuickNoteSchema) , createQuickNoteController );
router.post("/:workspaceId/item/quick-note/:itemId/duplicate", authMiddleware, workspaceMemberMiddleware, duplicateQuickNoteController);

export default router;