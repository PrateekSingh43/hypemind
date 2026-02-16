import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as settingsService from "./settings.service";
import type { AuthenticatedRequest } from "../types/auth.types";
import { ForbiddenError } from "../errors/httpErrors";

const router: Router = Router();

router.get(
	"/me",
	asyncHandler(async (req: Request, res: Response) => {
		const authReq = req as AuthenticatedRequest;
		const data = await settingsService.getMe(authReq.user.id);
		res.json({ success: true, data });
	})
);

router.get(
	"/me/settings",
	asyncHandler(async (req: Request, res: Response) => {
		const authReq = req as AuthenticatedRequest;
		const data = await settingsService.getSettings(authReq.user.id);
		res.json({ success: true, data });
	})
);

router.get(
	"/:userId/settings",
	asyncHandler(async (req: Request, res: Response) => {
		const authReq = req as AuthenticatedRequest;

		if (authReq.user.id !== req.params.userId) {
			throw new ForbiddenError("Cannot access other user's settings");
		}

		const data = await settingsService.getSettings(authReq.user.id);
		res.json({ success: true, data });
	})
);

router.post(
	"/:userId/settings",
	asyncHandler(async (req: Request, res: Response) => {
		const authReq = req as AuthenticatedRequest;

		if (authReq.user.id !== req.params.userId) {
			throw new ForbiddenError("Cannot modify other user's settings");
		}

		const data = await settingsService.updateSettings(authReq.user.id, req.body);
		res.json({ success: true, data });
	})
);

export default router;
