import { Router } from "express";
import { prisma } from "@repo/db";


const router: Router = Router();





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

