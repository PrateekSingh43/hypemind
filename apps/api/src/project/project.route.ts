import { Router } from "express";
import { createProjectController, getProjectsController, getProjectByIdController, updateProjectController } from "./project.controller";
import { authMiddleware } from "../middlewares/middleware.auth";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";

const router: Router = Router();

router.get("/:workspaceId/project", authMiddleware, workspaceMemberMiddleware, getProjectsController);
router.get("/:workspaceId/project/:projectId", authMiddleware, workspaceMemberMiddleware, getProjectByIdController);
router.post("/:workspaceId/project", authMiddleware, workspaceMemberMiddleware, createProjectController);
router.patch("/:workspaceId/project/:projectId", authMiddleware, workspaceMemberMiddleware, updateProjectController);

export default router;
