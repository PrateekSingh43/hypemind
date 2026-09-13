import { Router } from "express";
import { getInboxItemsController, updateItemController, getPagesController, getPageController, duplicateItemController, createPageController } from "./item.controller";
import { validateSchema } from "../middlewares/middleware.validate";
import { createPageSchema, updateItemSchema } from "@repo/validation";
import { authMiddleware } from "../middlewares/middleware.auth";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";

const router: Router = Router();

router.get("/:workspaceId/item/inbox", authMiddleware, workspaceMemberMiddleware, getInboxItemsController);
router.get("/:workspaceId/item/page", authMiddleware, workspaceMemberMiddleware, getPagesController);
router.post("/:workspaceId/item/page", authMiddleware, workspaceMemberMiddleware, validateSchema(createPageSchema), createPageController);
router.get("/:workspaceId/item/page/:itemId", authMiddleware, workspaceMemberMiddleware, getPageController);
router.patch("/:workspaceId/item/:itemId", authMiddleware, workspaceMemberMiddleware, validateSchema(updateItemSchema), updateItemController);
router.post("/:workspaceId/item/:itemId/duplicate", authMiddleware, workspaceMemberMiddleware, duplicateItemController);

export default router;
