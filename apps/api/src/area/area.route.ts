import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.auth";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";
import { createAreaController, getAreasController } from "./area.controller";

const router: Router = Router({ mergeParams: true });

router.get("/:workspaceId/area", authMiddleware, workspaceMemberMiddleware, getAreasController);
router.post("/:workspaceId/area", authMiddleware, workspaceMemberMiddleware, createAreaController);

export default router;
