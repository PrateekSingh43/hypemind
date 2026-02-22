import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";
import { JWT_SECRET } from "../config/env";
import { UnauthorizedError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";

export const authMiddleware = async (
	req: Request,
	_res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			throw new UnauthorizedError("Missing or malformed authorization header");
		}

		const token = authHeader.slice(7);
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: { id: true, email: true, name: true, emailVerified: true, isActive: true },
		});

		if (!user) {
			throw new UnauthorizedError("User not found");
		}

		if (!user.isActive) {
			throw new UnauthorizedError("Account is deactivated");
		}

		if (!user.emailVerified) {
			throw new UnauthorizedError("Email not verified");
		}

		(req as AuthenticatedRequest).user = {
			id: user.id,
			email: user.email,
			name: user.name ?? "",
		};

		next();
	} catch (err) {
		if (err instanceof UnauthorizedError) {
			next(err);
		} else if (err instanceof jwt.JsonWebTokenError) {
			next(new UnauthorizedError("Invalid token"));
		} else if (err instanceof jwt.TokenExpiredError) {
			next(new UnauthorizedError("Token expired"));
		} else {
			next(new UnauthorizedError("Authentication failed"));
		}
	}
};
