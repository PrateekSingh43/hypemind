import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as authService from "./auth.service";
import { REFRESH_COOKIE_NAME, NODE_ENV } from "../config/env";
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors";
import type { AuthenticatedRequest } from "../types/auth.types";

const REFRESH_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: NODE_ENV === "production",
	sameSite: "lax" as const,
	maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
	path: "/api/v1/auth",
};

export const registerController = asyncHandler(async (req: Request, res: Response) => {
	const { email, password, name } = req.body;

	if (
		typeof email !== "string" ||
		typeof password !== "string" ||
		typeof name !== "string" ||
		!email.trim() ||
		!password ||
		!name.trim()
	) {
		throw new BadRequestError("Email, password, and name are required");
	}

	if (password.length < 8) {
		throw new BadRequestError("Password must be at least 8 characters");
	}

	const result = await authService.register(email.trim().toLowerCase(), password, name.trim());

	res.status(201).json({
		success: true,
		message: "Account created. Check your email to verify.",
		data: {
			userId: result.userId,
			workspaceId: result.workspaceId,
			...(result.devVerificationToken ? { devVerificationToken: result.devVerificationToken } : {}),
		},
	});
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (
		typeof email !== "string" ||
		typeof password !== "string" ||
		!email.trim() ||
		!password
	) {
		throw new BadRequestError("Email and password are required");
	}

	const result = await authService.login(email.trim().toLowerCase(), password);

	res.cookie(REFRESH_COOKIE_NAME, result.refreshTokenRaw, {
		...REFRESH_COOKIE_OPTIONS,
		maxAge: result.refreshExpiresAt.getTime() - Date.now(),
	});

	res.json({
		success: true,
		data: {
			accessToken: result.accessToken,
			user: result.user,
		},
	});
});

export const refreshController = asyncHandler(async (req: Request, res: Response) => {
	const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

	if (!rawRefreshToken) {
		throw new UnauthorizedError("No refresh token");
	}

	const result = await authService.refreshTokens(rawRefreshToken);

	res.cookie(REFRESH_COOKIE_NAME, result.refreshTokenRaw, {
		...REFRESH_COOKIE_OPTIONS,
		maxAge: result.refreshExpiresAt.getTime() - Date.now(),
	});

	res.json({
		success: true,
		data: {
			accessToken: result.accessToken,
			user: result.user,
		},
	});
});

export const meController = asyncHandler(async (req: Request, res: Response) => {
	const authReq = req as AuthenticatedRequest;
	const result = await authService.getCurrentUser(authReq.user.id);

	res.json({
		success: true,
		data: result,
	});
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
	const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

	if (rawRefreshToken) {
		await authService.logout(rawRefreshToken);
	}

	res.clearCookie(REFRESH_COOKIE_NAME, {
		httpOnly: true,
		secure: NODE_ENV === "production",
		sameSite: "lax",
		path: "/api/v1/auth",
	});

	res.json({ success: true, message: "Logged out" });
});

export const verifyEmailController = asyncHandler(async (req: Request, res: Response) => {
	const { token } = req.body;

	if (typeof token !== "string" || !token.trim()) {
		throw new BadRequestError("Verification token is required");
	}

	const result = await authService.verifyEmail(token.trim());

	res.cookie(REFRESH_COOKIE_NAME, result.refreshTokenRaw, {
		...REFRESH_COOKIE_OPTIONS,
		maxAge: result.refreshExpiresAt.getTime() - Date.now(),
	});

	res.json({
		success: true,
		message: "Email verified",
		data: {
			accessToken: result.accessToken,
			user: result.user,
		},
	});
});

export const resendVerificationController = asyncHandler(async (req: Request, res: Response) => {
	const { email } = req.body;

	if (typeof email !== "string" || !email.trim()) {
		throw new BadRequestError("Email is required");
	}

	await authService.resendVerification(email.trim().toLowerCase());

	// Always return success to prevent email enumeration
	res.json({
		success: true,
		message: "If the email exists and is unverified, a new verification link has been sent.",
	});
});

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
	const { email } = req.body;

	if (typeof email !== "string" || !email.trim()) {
		throw new BadRequestError("Email is required");
	}

	await authService.forgotPassword(email.trim().toLowerCase());

	// Always return success to prevent email enumeration
	res.json({
		success: true,
		message: "If an account with that email exists, a password reset link has been sent.",
	});
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
	const { token, password } = req.body;

	if (
		typeof token !== "string" ||
		typeof password !== "string" ||
		!token.trim() ||
		!password
	) {
		throw new BadRequestError("Token and new password are required");
	}

	if (password.length < 8) {
		throw new BadRequestError("Password must be at least 8 characters");
	}

	await authService.resetPassword(token.trim(), password);

	res.json({
		success: true,
		message: "Password has been reset. You can now sign in.",
	});
});

