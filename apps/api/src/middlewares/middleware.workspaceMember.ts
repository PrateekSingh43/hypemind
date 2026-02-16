import { type Request, type Response, type NextFunction } from "express";
import { prisma } from "@repo/db";
import { ForbiddenError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";

export interface WorkspaceRequest extends AuthenticatedRequest {
	workspaceMember: {
		role: string;
		workspaceId: string;
	};
}

export const workspaceMemberMiddleware = async (
	req: Request,
	_res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthenticatedRequest;
		const workspaceId = req.params.workspaceId;

		if (!workspaceId) {
			throw new ForbiddenError("Workspace ID is required");
		}

		const membership = await prisma.workspaceMember.findUnique({
			where: {
				workspaceId_userId: {
					workspaceId,
					userId: authReq.user.id,
				},
			},
			select: { role: true, workspaceId: true },
		});

		if (!membership) {
			throw new ForbiddenError("Not a member of this workspace");
		}

		(req as unknown as WorkspaceRequest).workspaceMember = {
			role: membership.role,
			workspaceId: membership.workspaceId,
		};

		next();
	} catch (err) {
		if (err instanceof ForbiddenError) {
			next(err);
		} else {
			next(new ForbiddenError("Workspace access check failed"));
		}
	}
};
