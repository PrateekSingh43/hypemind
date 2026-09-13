import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";
import { getInboxItemsService, updateItemService, getPagesService, getPageService, duplicateItemService, createPageService } from "./item.service";

export const getPageController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId, itemId } = req.params;
    if (!workspaceId || !itemId) {
      throw new BadRequestError("Workspace ID and Item ID are required");
    }

    const page = await getPageService(workspaceId, itemId);
    if (!page) {
      throw new NotFoundError("Page not found");
    }

    res.status(200).json({ success: true, data: page });
  }
);

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

    // Validated + stripped payload from validateSchema middleware.
    const payload = res.locals.validated ?? req.body;
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

export const createPageController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const payload = res.locals.validated ?? req.body;
    const page = await createPageService(workspaceId, userId, payload);
    res.status(201).json({ success: true, data: page });
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
