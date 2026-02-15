// apps/api/src/middlewares/middleware.auth.ts
import { type Request, type Response, type NextFunction } from "express";
import { UnauthorizedError } from "../errors/httpErrors"; // Check this import path
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import { prisma } from "@repo/db";
import { AuthenticatedRequest } from "../types/auth.types";

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    // 1. Check Header
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer")) {
      throw new UnauthorizedError("Access Denied: No token provided");
    }

    // 2. Verify Token
    const token = header.split(" ")[1];
    let payload: JwtPayload & { userId: string };

    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: string };
    } catch (error) {
      throw new UnauthorizedError("Invalid Token");
    }

    // 3. Check User in DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedError("User does not exist or is disabled");
    }

    // 4. Attach User & Next
    (req as AuthenticatedRequest).user = { 
        id: user.id, 
        email: user.email, 
        name: user.name 
    };
    
    next(); // <--- SUCCESS, Move to controller

  } catch (error) {
    next(error); // <--- CRITICAL FIX: Pass error to Express, don't crash Node
  }
}