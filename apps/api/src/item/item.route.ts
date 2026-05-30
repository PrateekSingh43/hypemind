import { Router } from "express";
import { getInboxItemsController, updateItemController, getPagesController, duplicateItemController } from "./item.controller";
import { authMiddleware } from "../middlewares/middleware.auth";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";

const router: Router = Router();

router.get("/:workspaceId/item/inbox", authMiddleware, workspaceMemberMiddleware, getInboxItemsController);
router.get("/:workspaceId/item/page", authMiddleware, workspaceMemberMiddleware, getPagesController);
router.patch("/:workspaceId/item/:itemId", authMiddleware, workspaceMemberMiddleware, updateItemController);
router.post("/:workspaceId/item/:itemId/duplicate", authMiddleware, workspaceMemberMiddleware, duplicateItemController);

export default router;
