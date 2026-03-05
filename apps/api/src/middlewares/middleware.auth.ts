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
		// 1) Read the Authorization header. Expected format: "Bearer <JWT>"
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			// If the header is missing OR doesn't start with "Bearer ", the client didn't authenticate properly.
			throw new UnauthorizedError("Missing or malformed authorization header");
		}

		// 2) Extract the raw token string after "Bearer "
		const token = authHeader.slice(7);

		// 3) Verify the JWT signature (and expiry) using your server secret.
		// jwt.verify() throws on invalid/expired tokens, which we convert into 401s below.
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

		// 4) Load the user from DB using the userId claim from the token.
		// Keep the query minimal by selecting only what this middleware needs.
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: { id: true, email: true, name: true, emailVerified: true, isActive: true },
		});

		if (!user) {
			// Token might be valid, but the user no longer exists.
			throw new UnauthorizedError("User not found");
		}

		if (!user.isActive) {
			// Business rule: block deactivated accounts.
			throw new UnauthorizedError("Account is deactivated");
		}

		if (!user.emailVerified) {
			// Business rule: require verified email before allowing access.
			throw new UnauthorizedError("Email not verified");
		}

		// 5) Attach the authenticated user info to the request object so downstream handlers can use it.
		(req as AuthenticatedRequest).user = {
			id: user.id,
			email: user.email,
			name: user.name ?? "",
		};

		// 6) Continue to the next middleware/route handler.
		next();
	} catch (err) {
		// 7) Convert known auth errors into consistent 401 responses via your error handler.
		if (err instanceof UnauthorizedError) {
			next(err);
		} else if (err instanceof jwt.TokenExpiredError) {
			// NOTE: TokenExpiredError is a subclass of JsonWebTokenError, so this check must come first.
			next(new UnauthorizedError("Token expired"));
		} else if (err instanceof jwt.JsonWebTokenError) {
			next(new UnauthorizedError("Invalid token"));
		} else {
			next(new UnauthorizedError("Authentication failed"));
		}
	}
};
