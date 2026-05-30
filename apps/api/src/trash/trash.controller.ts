import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";
import { getTrashService, restoreTrashItemService, permanentDeleteTrashItemService } from "./trash.service";

export const getTrashController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const trashItems = await getTrashService(workspaceId);
    res.status(200).json({ success: true, data: trashItems });
  }
);

export const restoreTrashItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    const { id, type } = req.body;
    
    if (!workspaceId || !id || !type) {
      throw new BadRequestError("Workspace ID, item ID, and item type are required");
    }

    await restoreTrashItemService(workspaceId, id, type);
    res.status(200).json({ success: true, message: "Restored successfully" });
  }
);

export const permanentDeleteTrashItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    const { id, type } = req.body;
    
    if (!workspaceId || !id || !type) {
      throw new BadRequestError("Workspace ID, item ID, and item type are required");
    }

    await permanentDeleteTrashItemService(workspaceId, id, type);
    res.status(200).json({ success: true, message: "Deleted permanently" });
  }
);
