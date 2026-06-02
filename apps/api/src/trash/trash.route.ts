import { Router } from "express";
import { getTrashController, restoreTrashItemController, permanentDeleteTrashItemController } from "./trash.controller";
import { authMiddleware } from "../middlewares/middleware.auth";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";

const router: Router = Router();

router.get("/:workspaceId/trash", authMiddleware, workspaceMemberMiddleware, getTrashController);
router.post("/:workspaceId/trash/restore", authMiddleware, workspaceMemberMiddleware, restoreTrashItemController);
router.post("/:workspaceId/trash/permanent", authMiddleware, workspaceMemberMiddleware, permanentDeleteTrashItemController);

export default router;
