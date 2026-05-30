import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";
import { getInboxItemsService, updateItemService, getPagesService, duplicateItemService } from "./item.service";

export const getInboxItemsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const items = await getInboxItemsService(workspaceId);
    res.status(200).json({ success: true, data: items });
  }
);

export const updateItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId, itemId } = req.params;
    if (!workspaceId || !itemId) {
      throw new BadRequestError("Workspace ID and Item ID are required");
    }

    const payload = req.body;
    const updatedItem = await updateItemService(itemId, workspaceId, payload);

    res.status(200).json({ success: true, data: updatedItem });
  }
);

export const getPagesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const pages = await getPagesService(workspaceId);
    res.status(200).json({ success: true, data: pages });
  }
);

export const duplicateItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId, itemId } = req.params;
    if (!workspaceId || !itemId) {
      throw new BadRequestError("Workspace ID and Item ID are required");
    }

    const duplicatedItem = await duplicateItemService(userId, workspaceId, itemId);
    res.status(201).json({ success: true, data: duplicatedItem });
  }
);
