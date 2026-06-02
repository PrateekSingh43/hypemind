import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";
import { createAreaService, getAreasService, updateAreaService, duplicateAreaService } from "./area.service";

export const getAreasController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const areas = await getAreasService(workspaceId);
    res.status(200).json({ success: true, data: areas });
  }
);

export const createAreaController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const { title, description } = req.body;
    if (!title || typeof title !== "string") {
      throw new BadRequestError("Area title is required");
    }

    const newArea = await createAreaService({
      userId,
      workspaceId,
      title,
      description: description ?? null,
    });

    res.status(201).json({ success: true, data: newArea });
  }
);

export const updateAreaController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId, areaId } = req.params;
    if (!workspaceId || !areaId) {
      throw new BadRequestError("Workspace ID and Area ID are required");
    }

    const { title, isPinned, deletedAt } = req.body;
    
    const updatedArea = await updateAreaService(workspaceId, areaId, {
      title,
      isPinned: isPinned === undefined ? undefined : isPinned,
      pinnedAt: isPinned ? new Date() : isPinned === false ? null : undefined,
      deletedAt: deletedAt ? new Date(deletedAt) : deletedAt === null ? null : undefined,
    });

    if (!updatedArea) {
      res.status(404).json({ success: false, message: "Area not found" });
      return;
    }

    res.status(200).json({ success: true, data: updatedArea });
  }
);

export const duplicateAreaController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId, areaId } = req.params;
    if (!workspaceId || !areaId) {
      throw new BadRequestError("Workspace ID and Area ID are required");
    }

    const duplicatedArea = await duplicateAreaService(userId, workspaceId, areaId);
    res.status(201).json({ success: true, data: duplicatedArea });
  }
);
