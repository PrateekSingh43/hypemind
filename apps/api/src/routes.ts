import { Router } from "express";
import { prisma } from "@repo/db";

import authRoute from "./auth/auth.route";
import quickNoteRoute from "./quicknote/quicknote.route";
import workspaceRoute from "./workspaces/workspace.route";
import searchRoute from "./search/search.route";
import projectRoute from "./project/project.route";
import itemRoute from "./item/item.route";
import areaRoute from "./area/area.route";
import trashRoute from "./trash/trash.route";

const router: Router = Router();

router.use("/api/v1/auth", authRoute);

router.use("/api/v1/workspaces", workspaceRoute);
router.use("/api/v1/workspaces", quickNoteRoute);
router.use("/api/v1/workspaces", searchRoute);
router.use("/api/v1/workspaces", projectRoute);
router.use("/api/v1/workspaces", itemRoute);
router.use("/api/v1/workspaces", areaRoute);
router.use("/api/v1/workspaces", trashRoute);

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

export default router;
