import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import {
  signupService,
  loginService,
  verifyEmailService,
  resendEmailService,
  forgotPasswordService,
  resetPasswordService,
  logoutService,
  refreshTokenService,
  getSessionUser,
} from "./auth.service";
import { UnauthorizedError } from "../errors/httpErrors";
import { JWT_SECRET, REFRESH_COOKIE_NAME } from "../config/env";
import type { AuthenticatedRequest } from "../types/auth.types";
import { clearAuthCookies } from "../utils/token";

// signupController now returns a simple message, not tokens.
export const signupController = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = res.locals.validated;
      const result = await signupService(payload);
      res
        .status(201)
        .json({
          message: "Signup successful, please verify your email",
          data: result,
        });
    } catch (err) {
      next(err);
    }
  },
);

export const loginController = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = res.locals.validated;

      const result = await loginService(payload, res);
      res.status(200).json({
        message: "Login successful",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawToken = req.cookies[REFRESH_COOKIE_NAME];
      if (!rawToken) {
        clearAuthCookies(res);
        return res.status(401).json({ message: "No refresh token provided" });
      }

      const result = await refreshTokenService(rawToken, res);
      res.status(200).json({ message: "Token refreshed", data: result });
    } catch (err) {
      clearAuthCookies(res);
      next(err);
    }
  },
);

export const verifyEmailController = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const payload = res.locals.validated;
    if (!payload.token) {
      throw new UnauthorizedError("Invalid or expired Token");
    }
    const { user, accessToken } = await verifyEmailService(payload.token, res);
    res.status(200).json({
      msg: "success",
      user,
      accessToken,
    });
  },
);

export const resendEmailController = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = res.locals.validated;

      const result = await resendEmailService(email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email } = res.locals.validated;
    const rawIp = req.headers["x-forwarded-for"] || req.ip;

    const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp || null;

    if (!ip) {
      throw new Error("ip was provided.");
    }

    await forgotPasswordService(email, ip);

    res
      .status(200)
      .json({
        message:
          "If that email address is in our system, we have sent a password reset link.",
      });
  } catch (err) {
    next(err);
  }
}

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    if (!ip) {
      throw Error("there was some error");
    }

    const payload = res.locals.validated;

    await resetPasswordService(payload.token, payload.newPassword, ip, res);

    res.status(201).json({
      msg: "success.",
    });
  },
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    await logoutService(user.id, res);

    res.status(200).json({ message: "Logged out" });
  },
);

export const meController = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await getSessionUser(decoded.userId);

        return res.status(200).json({
          success: true,
          data: {
            user,
          },
        });
      } catch {
        // Fall through to refresh-cookie bootstrap below.
      }
    }

    const rawToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      clearAuthCookies(res);
      throw new UnauthorizedError("Session expired. Please login again");
    }

    try {
      const result = await refreshTokenService(rawToken, res);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  },
);
