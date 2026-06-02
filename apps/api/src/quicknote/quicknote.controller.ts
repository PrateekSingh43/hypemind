import { type Request, type Response, type NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createQuickNoteService, getQuickNotesService, updateQuickNoteService, duplicateQuickNoteService } from "./quicknote.service";
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";

export const getQuickNotesController = asyncHandler(async (req: Request, res: Response) => {
	const { workspaceId } = req.params;

	if (!workspaceId) {
		throw new BadRequestError("Workspace ID is required");
	}

	const result = await getQuickNotesService(workspaceId);

	res.status(200).json({ msg: "Quick Notes Fetched", data: result, success: true })
});

export const updateQuickNoteController = asyncHandler(async (req: Request, res: Response) => {
	const authId = req as AuthenticatedRequest;
	const userId = authId.user?.id;
	const { workspaceId, itemId } = req.params;
	const payload = req.body;

	if (!userId) {
		throw new UnauthorizedError("You are not logged in");
	}

	if (!workspaceId || !itemId) {
		throw new BadRequestError("Missing Workspace ID or Item ID");
	}

	const result = await updateQuickNoteService(userId, itemId, workspaceId, payload);

	res.status(200).json({ msg: "Quick Note Updated", data: result, success: true })
});

export const createQuickNoteController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {

	const authId = req as AuthenticatedRequest;
	const userId = authId.user?.id;
	const { workspaceId } = req.params;

	if (!userId || !workspaceId) {
		throw new UnauthorizedError("You are not logged in")
	}

	const payload = res.locals.validated;


	const result = await createQuickNoteService({ ...payload, userId, workspaceId })

	res.status(201).json({ msg: "Quick Note Created", data: result, success: true })





})

export const duplicateQuickNoteController = asyncHandler(async (req: Request, res: Response) => {
	const authId = req as AuthenticatedRequest;
	const userId = authId.user?.id;
	const { workspaceId, itemId } = req.params;

	if (!userId) {
		throw new UnauthorizedError("You are not logged in");
	}

	if (!workspaceId || !itemId) {
		throw new BadRequestError("Missing Workspace ID or Item ID");
	}

	try {
		const duplicatedNote = await duplicateQuickNoteService(userId, workspaceId, itemId);
		res.status(201).json({ success: true, data: duplicatedNote });
	} catch (error: any) {
		if (error.message === "Item not found") {
			res.status(404).json({ success: false, message: "Note not found" });
			return;
		}
		throw error;
	}
});