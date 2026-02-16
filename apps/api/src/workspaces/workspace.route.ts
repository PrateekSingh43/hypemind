import { Router } from "express";
import rateLimit from "express-rate-limit";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";
import {
	bootstrapController,
	getAreasController,
	getItemsController,
	createItemController,
	updateWorkspaceItemController,
	seedController,
	getInboxController,
	getProjectsController,
	createAreaController,
} from "./workspace.controller";

const router: Router = Router();

const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Rate limit exceeded." },
});

router.use("/:workspaceId", apiLimiter, workspaceMemberMiddleware);

router.get("/:workspaceId/inbox", getInboxController);
router.get("/:workspaceId/projects", getProjectsController);
router.get("/:workspaceId/areas", getAreasController);
router.post("/:workspaceId/areas", createAreaController);

router.get("/:workspaceId/bootstrap", bootstrapController);
router.get("/:workspaceId/items", getItemsController);
router.post("/:workspaceId/items", createItemController);
router.patch("/:workspaceId/items/:itemId", updateWorkspaceItemController);
router.post("/:workspaceId/seed", seedController);

export default router;
