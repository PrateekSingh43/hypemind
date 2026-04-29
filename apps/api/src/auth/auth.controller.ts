import { Response, Request, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { signupService, loginService, verifyEmailService, resendEmailService, forgotPasswordService, resetPasswordService, logoutService, refreshTokenService, } from "./auth.service";
import { UnauthorizedError } from "../errors/httpErrors";
import { REFRESH_COOKIE_NAME } from "../config/env";
import type { AuthenticatedRequest } from "../types/auth.types";
import { prisma } from "@repo/db";




// signupController now returns a simple message, not tokens.
export const signupController = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const payload = res.locals.validated;
		const result = await signupService(payload);
		res.status(201).json({ message: "Signup successful, please verify your email", data: result });
	} catch (err) {
		next(err)
	}

});

export const loginController = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const payload = res.locals.validated;

		const result = await loginService(payload, res);
		res.status(200).json({
			message: "Login successful",
			data: result,
		})
	} catch (err) {
		next(err)

	}




})


export const refreshTokenController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

	try {
		const rawToken = req.cookies[REFRESH_COOKIE_NAME];
		if (!rawToken) {
			return res.status(401).json({ message: "No refresh token provided" })
		}

		const userId = rawToken.split(".")[0];
		if (!userId) {
			return res.status(401).json({ message: "Invalid refresh token" })
		}

		const result = await refreshTokenService(rawToken, userId, res)
		res.status(200).json({ message: "Token refreshed", data: result })

	} catch (err) {
		next(err)

	}


})

export const verifyEmailController = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {

	const payload = res.locals.validated;
	if (!payload.token) {
		throw new UnauthorizedError("Invalid or expired Token")
	}
	const { user, accessToken } = await verifyEmailService(payload.token, res);
	res.status(200).json(
		{
			msg: "success",
			user,
			accessToken

		})

}


);

export const resendEmailController = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {

	try {

		const { email } = res.locals.validated;

		const result = await resendEmailService(email);
		res.status(200).json(result);
	} catch (err) {
		next(err)

	}


});



export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
	try {
		const { email } = res.locals.validated;
		const rawIp = req.headers["x-forwarded-for"] || req.ip;

		const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp || null;

		if (!ip) {
			throw new Error("ip was provided.");
		}

		await forgotPasswordService(email, ip);

		res.status(200).json({ message: "If that email address is in our system, we have sent a password reset link." });
	} catch (err) {
		next(err);
	}
}



export const resetPasswordController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
	const ip = req.ip;
	if (!ip) {
		throw Error("there was some error");
	}

	const payload = res.locals.validated;

	await resetPasswordService(payload.token, payload.newPassword, ip, res);

	res.status(201).json({
		msg: "success."
	})

})


export const logoutController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	const user = (req as AuthenticatedRequest).user;
	await logoutService(user.id, res);

	res.status(200).json({ message: "Logged out" })

});

export const meController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	const user = (req as AuthenticatedRequest).user;

	const membership = await prisma.workspaceMember.findFirst({
		where: { userId: user.id },
		select: { workspaceId: true },
	});

	res.status(200).json({
		success: true,
		data: {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				workspaceId: membership?.workspaceId ?? null,
			},
		},
	});
});