import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";
import {
  createWorkspaceService,
  getWorkspaceBootstrapService,
  listWorkspacesService,
  getPinnedItemsService,
} from "./workspace.service";

export const listWorkspacesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }

    const result = await listWorkspacesService(userId);
    res.status(200).json({ success: true, data: result });
  },
);

export const createWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }

    const name = typeof req.body?.name === "string" ? req.body.name : "";
    if (!name.trim()) {
      throw new BadRequestError("Workspace name is required");
    }

    const result = await createWorkspaceService(userId, name);
    res.status(201).json({ success: true, data: result });
  },
);

export const getWorkspaceBootstrapController = asyncHandler(
  async (req: Request, res: Response) => {
    const { workspaceId } = req.params;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const result = await getWorkspaceBootstrapService(workspaceId);
    res.status(200).json({ success: true, data: result });
  },
);

export const getPinnedItemsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { workspaceId } = req.params;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const result = await getPinnedItemsService(workspaceId);
    res.status(200).json({ success: true, data: result });
  },
);
