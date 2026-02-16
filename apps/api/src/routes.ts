import { Router } from "express";
import { prisma } from "@repo/db";
import authRouter from "./auth/auth.route";
import workspaceRouter from "./workspaces/workspace.route";
import settingsRouter from "./settings/settings.route";
import { authMiddleware } from "./middlewares/middleware.auth";
import {
	getProjectController,
	getAreaController,
	getItemController,
	pinItemController,
	archiveItemController,
	updateItemController,
	createProjectController,
	getAreaProjectsController,
	getProjectItemsController,
} from "./workspaces/workspace.controller";
import type { AuthenticatedRequest } from "./types/auth.types";
import { BadRequestError, ForbiddenError, NotFoundError } from "./errors/httpErrors";

const router: Router = Router();

router.use("/api/v1/auth", authRouter);

router.get("/api/v1/health/smoke", async (_req, res, next) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		const migrationCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
			SELECT COUNT(*)::bigint AS count
			FROM "_prisma_migrations"
		`;

		res.json({
			status: "ok",
			db: "ok",
			migrations: Number(migrationCount[0]?.count ?? 0),
			ts: Date.now(),
		});
	} catch (error) {
		next(error);
	}
});

router.use("/api/v1/workspaces", authMiddleware, workspaceRouter);
router.use("/api/v1/users", authMiddleware, settingsRouter);

router.get("/api/v1/projects/:projectId", authMiddleware, getProjectController);
router.get("/api/v1/areas/:areaId", authMiddleware, getAreaController);

router.get("/api/v1/items/:id", authMiddleware, getItemController);
router.patch("/api/v1/items/:id", authMiddleware, updateItemController);
router.patch("/api/v1/items/:id/pin", authMiddleware, pinItemController);
router.patch("/api/v1/items/:id/archive", authMiddleware, archiveItemController);

router.get("/api/v1/areas/:areaId/projects", authMiddleware, getAreaProjectsController);
router.post("/api/v1/areas/:areaId/projects", authMiddleware, createProjectController);

router.get("/api/v1/projects/:projectId/items", authMiddleware, getProjectItemsController);

router.post("/api/v1/ai/chat", authMiddleware, async (req, res, next) => {
	try {
		const authReq = req as AuthenticatedRequest;
		const { message, workspaceId, itemId } = req.body as {
			message?: string;
			workspaceId?: string;
			itemId?: string;
		};

		if (!workspaceId || typeof workspaceId !== "string") {
			throw new BadRequestError("workspaceId is required");
		}
		if (!message || typeof message !== "string") {
			throw new BadRequestError("message is required");
		}

		const membership = await prisma.workspaceMember.findUnique({
			where: {
				workspaceId_userId: {
					workspaceId,
					userId: authReq.user.id,
				},
			},
			select: { workspaceId: true },
		});

		if (!membership) {
			throw new ForbiddenError("Not a member of this workspace");
		}

		if (itemId && typeof itemId === "string") {
			const item = await prisma.item.findFirst({
				where: { id: itemId, workspaceId, deletedAt: null },
				select: { id: true },
			});
			if (!item) {
				throw new NotFoundError("Item not found");
			}
		}

		res.json({
			success: true,
			data: {
				reply: "Context received. Assistant routing is connected.",
			},
		});
	} catch (error) {
		next(error);
	}
});

export default router;
