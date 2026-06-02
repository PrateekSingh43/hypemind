import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";
import { createProjectService, getProjectsService, getProjectByIdService, updateProjectService, duplicateProjectService } from "./project.service";

export const getProjectsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    const { all } = req.query;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const isAll = all === "true";
    const projects = await getProjectsService(workspaceId, isAll);
    res.status(200).json({ success: true, data: projects });
  }
);

export const getProjectByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId, projectId } = req.params;
    if (!workspaceId || !projectId) {
      throw new BadRequestError("Workspace ID and Project ID are required");
    }

    const project = await getProjectByIdService(workspaceId, projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }
    res.status(200).json({ success: true, data: project });
  }
);

export const createProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId } = req.params;
    if (!workspaceId) {
      throw new BadRequestError("Workspace ID is required");
    }

    const { title, description, tags, areaId } = req.body;
    if (!title || typeof title !== "string") {
      throw new BadRequestError("Project title is required");
    }

    const newProject = await createProjectService({
      userId,
      workspaceId,
      title,
      description: description ?? null,
      tags: Array.isArray(tags) ? tags : [],
      areaId: areaId ?? null,
    });

    res.status(201).json({ success: true, data: newProject });
  }
);

export const updateProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId, projectId } = req.params;
    if (!workspaceId || !projectId) {
      throw new BadRequestError("Workspace ID and Project ID are required");
    }

    const { areaId, isPinned, title, description, tags, deletedAt } = req.body;
    
    const updatedProject = await updateProjectService(workspaceId, projectId, {
      areaId: areaId === undefined ? undefined : areaId,
      isPinned: isPinned === undefined ? undefined : isPinned,
      pinnedAt: isPinned ? new Date() : isPinned === false ? null : undefined,
      title: title,
      description: description,
      tags: tags,
      deletedAt: deletedAt ? new Date(deletedAt) : deletedAt === null ? null : undefined,
    });

    if (!updatedProject) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    res.status(200).json({ success: true, data: updatedProject });
  }
);

export const duplicateProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new UnauthorizedError("You are not logged in");
    }
    const { workspaceId, projectId } = req.params;
    if (!workspaceId || !projectId) {
      throw new BadRequestError("Workspace ID and Project ID are required");
    }

    try {
      const duplicatedProject = await duplicateProjectService(userId, workspaceId, projectId);
      res.status(201).json({ success: true, data: duplicatedProject });
    } catch (error: any) {
      if (error.message === "Project not found") {
        res.status(404).json({ success: false, message: "Project not found" });
        return;
      }
      throw error;
    }
  }
);
