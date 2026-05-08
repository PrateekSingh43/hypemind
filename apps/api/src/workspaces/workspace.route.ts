import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.auth";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";
import {
  createWorkspaceController,
  getWorkspaceBootstrapController,
  listWorkspacesController,
} from "./workspace.controller";

const router: Router = Router();

router.get("/", authMiddleware, listWorkspacesController);
router.post("/", authMiddleware, createWorkspaceController);
router.get(
  "/:workspaceId/bootstrap",
  authMiddleware,
  workspaceMemberMiddleware,
  getWorkspaceBootstrapController,
);

export default router;
