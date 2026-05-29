import { Router } from "express";
import { getInboxItemsController, updateItemController } from "./item.controller";
import { authMiddleware } from "../middlewares/middleware.auth";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";

const router: Router = Router();

router.get("/:workspaceId/item/inbox", authMiddleware, workspaceMemberMiddleware, getInboxItemsController);
router.patch("/:workspaceId/item/:itemId", authMiddleware, workspaceMemberMiddleware, updateItemController);

export default router;
