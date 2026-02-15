import  { type Response, type Request, type NextFunction } from "express"

import { signupService, loginService, verifyEmailService, forgotPasswordService, refreshTokenServices, resetPasswordService, logoutService } from "./auth.service"
import { asyncHandler } from "../utils/asyncHandler"
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors"
import { REFRESH_COOKIE_NAME } from "../config/env"
import { AuthenticatedRequest } from "../types/auth.types"




/* 
  1. controller work is to get the email and  password fro the req.body then pass it to the singupServices

*/

export const signupController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {


	const result = await signupService(req.body)
	if (result) {
		res.status(201).json({
			status: "successful",

		})
	}


})


export const verifyEmailController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {

	const { token } = req.body
	if (!token) {
		throw new UnauthorizedError("token invalid");
	}

	const { updateUser, accessToken } = await verifyEmailService(token, res)


	res.status(200).json({
		message: "succefull",
		updateUser,
		accessToken
	})





})

export const loginController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

	const { user, accessToken } = await loginService(req.body, res);

	res.status(200).json({
		message: "success",
		user,
		accessToken
	})
})


export const refreshTokenController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
	const token = req.cookies[REFRESH_COOKIE_NAME];

	if (!token) throw new UnauthorizedError("Missing refresh token");

	if (!token) {
		throw new BadRequestError(
			"token invalid"
		)
	}

	const { user, accessToken } = await refreshTokenServices(token, res);

	res.status(200).json({
		msg: "Successful",
		user,
		accessToken
	})
})


export const logoutController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {


	const userId = (req as AuthenticatedRequest).user.id;
	if (!userId) throw new UnauthorizedError('Userid is not defined');
	await logoutService(userId, res);


	res.status(200).json({
		msg: "Succefully logout"
	})

})

// me route 

export const meController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	const user = (req as AuthenticatedRequest).user;
	return res.json({ user });
})


export const forgotPasswordController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

	const email = req.body.email;

	if (!email) {
		throw new BadRequestError("email now found");

	}

	await forgotPasswordService(email)

	res.status(201).send("success")
})



export const resetPasswordController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

	const { token, newPassword } = req.body;

	const { user, accessToken } = await resetPasswordService(
		token,
		res,
		newPassword
	);

	res.status(200).json({
		msg: "success",
		user,
		res,
		accessToken
	})
})




