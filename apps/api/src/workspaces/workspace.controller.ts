import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as workspaceService from "./workspace.service";
import type { AuthenticatedRequest } from "../types/auth.types";
import { BadRequestError } from "../errors/httpErrors";

export const bootstrapController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { workspaceId } = req.params;

	const data = await workspaceService.getBootstrap(workspaceId!, authReq.user.id);
	res.json({ success: true, data });
});

export const getAreasController = asyncHandler(async (req: Request, res: Response) => {
	const { workspaceId } = req.params;
	const data = await workspaceService.getAreas(workspaceId!);
	res.json({ success: true, data });
});

export const getItemsController = asyncHandler(async (req: Request, res: Response) => {
	const { workspaceId } = req.params;
	const { type, projectId, isPinned, limit, cursor } = req.query;

	const data = await workspaceService.getItems(workspaceId!, {
		type: typeof type === "string" ? type : undefined,
		projectId: typeof projectId === "string" ? projectId : undefined,
		isPinned: isPinned === "true" ? true : isPinned === "false" ? false : undefined,
		limit: typeof limit === "string" ? Number(limit) : undefined,
		cursor: typeof cursor === "string" ? cursor : undefined,
	});

	res.json({ success: true, data });
});

export const createItemController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { workspaceId } = req.params;
	const { title, type, contentJson, projectId, url, metadata, description, source, tags } = req.body;

	if (!type || typeof type !== "string") {
		throw new BadRequestError("Item type is required");
	}

	const data = await workspaceService.createItem(workspaceId!, authReq.user.id, {
		title,
		type,
		contentJson,
		projectId,
		url,
		metadata,
		description,
		source,
		tags,
	});

	res.status(201).json({ success: true, data });
});

export const updateWorkspaceItemController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { workspaceId, itemId } = req.params;
	const { title, isPinned, projectId, contentJson, metadata, url, tags } = req.body;

	const data = await workspaceService.updateItem(
		workspaceId!,
		itemId!,
		authReq.user.id,
		{
			title,
			isPinned,
			projectId,
			contentJson,
			metadata,
			url,
			tags,
		}
	);

	res.json({ success: true, data });
});

export const updateItemController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { id } = req.params;
	const { title, isPinned, projectId, contentJson, metadata, url, tags } = req.body;

	const data = await workspaceService.updateItemById(id!, authReq.user.id, {
		title,
		isPinned,
		projectId,
		contentJson,
		metadata,
		url,
		tags,
	});

	res.json({ success: true, data });
});

export const seedController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { workspaceId } = req.params;

	const data = await workspaceService.seedWorkspace(workspaceId!, authReq.user.id);
	res.json({ success: true, data });
});

export const getInboxController = asyncHandler(async (req: Request, res: Response) => {
	const { workspaceId } = req.params;
	const { limit, cursor } = req.query;

	const data = await workspaceService.getInbox(workspaceId!, {
		limit: typeof limit === "string" ? Number(limit) : undefined,
		cursor: typeof cursor === "string" ? cursor : undefined,
	});

	res.json({ success: true, data });
});

export const getProjectsController = asyncHandler(async (req: Request, res: Response) => {
	const { workspaceId } = req.params;
	const data = await workspaceService.getProjects(workspaceId!);
	res.json({ success: true, data });
});

export const getProjectController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { projectId } = req.params;
	const data = await workspaceService.getProject(projectId!, authReq.user.id);
	res.json({ success: true, data });
});

export const getAreaController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { areaId } = req.params;
	const data = await workspaceService.getArea(areaId!, authReq.user.id);
	res.json({ success: true, data });
});

export const getItemController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { id } = req.params;
	const data = await workspaceService.getItem(id!, authReq.user.id);
	res.json({ success: true, data });
});

export const pinItemController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { id } = req.params;
	const { isPinned } = req.body;

	if (typeof isPinned !== "boolean") {
		throw new BadRequestError("isPinned must be boolean");
	}

	const data = await workspaceService.pinItem(id!, authReq.user.id, isPinned);
	res.json({ success: true, isPinned: data.isPinned });
});

export const archiveItemController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { id } = req.params;
	const data = await workspaceService.archiveItem(id!, authReq.user.id);
	res.json({ success: true, data });
});

export const createAreaController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { workspaceId } = req.params;
	const { title, slug, description } = req.body;

	if (!title || typeof title !== "string") {
		throw new BadRequestError("Area title is required");
	}

	const data = await workspaceService.createArea(workspaceId!, authReq.user.id, {
		title,
		slug,
		description,
	});

	res.status(201).json({ success: true, data });
});

export const createProjectController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { areaId } = req.params;
	const { title, slug, description } = req.body;

	if (!title || typeof title !== "string") {
		throw new BadRequestError("Project title is required");
	}

	const data = await workspaceService.createProject(areaId!, authReq.user.id, {
		title,
		slug,
		description,
	});

	res.status(201).json({ success: true, data });
});

export const getAreaProjectsController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { areaId } = req.params;
	const data = await workspaceService.getAreaProjects(areaId!, authReq.user.id);
	res.json({ success: true, data });
});

export const getProjectItemsController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const { projectId } = req.params;
	const data = await workspaceService.getProjectItems(projectId!, authReq.user.id);
	res.json({ success: true, data });
});
