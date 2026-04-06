import { Prisma, prisma } from "@repo/db"
import { BadRequestError, ConflictError, ForbiddenError, UnauthorizedError } from "../errors/httpErrors"
import { hash, verifyPassword } from "../utils/hash"
import { createVerifyEmailToken, sendVerificationEmailToken } from "../utils/email/email"
import { generateUniqueSlug, generateWorkspaceData } from "../utils/workspace"

import { generateAccessToken, generateRefreshToken, setRefreshToken } from "../utils/token"
import { onboardingSchema } from "@repo/validation"
import crypto from "crypto"
import { EMAIL_SECRET } from "../config/env"
import { access } from "fs"







export const signupService = async (payload: { email: string, password: string }) => {

	if (!payload) {
		throw new BadRequestError(
			"User data is missing"
		)
	}

	const { email, password } = payload

	// cleaning the email . 

	const cleanEmail = email.trim().toLowerCase();

	const exitingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

	if (exitingUser) {
		throw new ConflictError("user Exits Please login");

	}

	if (!password || password.length < 7) {
		throw new BadRequestError("Either password is not there or wrong");

	}

	const hashPassword = await hash(password);

	if (!hashPassword) {
		throw new ConflictError("NOt able to store user data , Try again");


	}
	/*
 Create user
Create workspace
Create workspace member (admin)
Create userSettings
Send verification email */

	const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const newUser = await tx.user.create({


			data: {
				email: cleanEmail,
				passwordHash: hashPassword,
				emailVerified: false,
			}
		})

		const { name, baseSlug } = await generateWorkspaceData(newUser.email);
		const slug = await generateUniqueSlug(tx, baseSlug);


		const workspace = await tx.workspace.create({
			data: {
				name,
				slug,
				createdById: newUser.id
			}

		})
		const workspaceMember = await tx.workspaceMember.create({
			data: {
				workspaceId: workspace.id,
				userId: newUser.id

			}
		})

		const workspaceSetting = await tx.workspaceSetting.create({
			data: {
				workspaceId: workspace.id,
				prefs: {}
				/*// for now it is good but later nened to be changes so for that->
				1. migrate to explicit defaults (e.g., locale, timezone, darkMode) when you know needed fields eg:prefs: { locale: "en-US", timezone: "UTC", darkMode: false }
				2.if prefs expands to user-controlled values, validate to prevent invalid injection/overwrite*/
			}
		})


		const userSetting = await tx.userSetting.create({
			data: {
				userId: newUser.id,
				onboardingCompleted: false,
				settings: {} // it refers to the user prefrestaion that we will store and adde on the onboariding time or may be automatically .
			}
		})

		return {
			userId: newUser.id,
			email: newUser.email,
			emailVerified: newUser.emailVerified,
			onboardingCompleted: userSetting.onboardingCompleted
		}

	})




	// send verification email 
	const rawToken = await createVerifyEmailToken(user.userId);

	await sendVerificationEmailToken(user.email, rawToken)

	return {
		emailverify: user.emailVerified,
		onboardingVerify: user.onboardingCompleted,
		id: user.userId,
		email: user.email,
		message: "signup succeful . Verify Your email"
	}





}

export async function verifyEmailService(rawToken: string, res: any) {
	const emailTokenHash = crypto.createHmac("sha-256", EMAIL_SECRET).update(rawToken).digest("hex");


	const verifyEmail = await prisma.emailVerification.findUnique({ where: { tokenHash: emailTokenHash } })

	if (!verifyEmail || verifyEmail.expiresAt < new Date()) {
		throw new ConflictError("InvalidToken or expried Token ");
	}

	const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const updatedUser = await tx.user.update({
			where: { id: verifyEmail.userId },
			data: {
				emailVerified: true
			}

		})
		await tx.emailVerification.delete({ where: { id: verifyEmail.id } });

		return tx.user.findUnique({
			where: { id: updatedUser.id },

		});

	})

	if (!user || !user.isActive) {
		throw new ConflictError("User does not exits")
	}

	const accessToken = generateAccessToken(user.id);
	const { raw, expiresAt } = await generateRefreshToken(user.id)

	setRefreshToken(res, raw, expiresAt)

	return {
		user: {
			id: user.id,
			email: user.email,
			emailVerified: user.emailVerified

		},
		accessToken,
	};

}


export async function resendEmailService(email: string) {

	if (!email) {
		throw new BadRequestError("User not found")
	};

	// is this cleaning of the email is unncessary step or not. 
	const cleanEmail = email.trim().toLowerCase()

	const user = await prisma.user.findUnique({ where: { email: cleanEmail } })

	if (!user || !user.isActive || user.createdAt < new Date()) {
		throw new UnauthorizedError("User not exit please create Account")

	}

	const token = await createVerifyEmailToken(user.email);

	await sendVerificationEmailToken(user.email, token)

	return { message: "Email Sent Succefully " }

}


export async function loginService(payload: { email: string, password: string }, res: any) {
	if (!payload) {
		throw new BadRequestError("Enter Email and Password");

	}
	const { email, password } = payload;
	const cleanEmail = email.trim().toLowerCase();

	const exitingUser = await prisma.user.findUnique({ where: { email: cleanEmail }, include: { userSetting: true } });

	if (!exitingUser || !exitingUser.passwordHash) {
		throw new ConflictError("user does  Exits Please Signup");

	}

	// password check and length check. 

	if (!password || password.length < 7) {
		throw new BadRequestError("Either password is not there or wrong");

	}

	// compare password 
	/* above i have added a comparisoon so exitingUser.password null part is removed and becomes mandotroy filed and also it has become but and we have to make the passwordhash as the optional filed as oAuth does not have that so what i did is a good thing or not */
	const PasswrodVerify = await verifyPassword(exitingUser.passwordHash, password)

	if (!PasswrodVerify) {
		throw new ForbiddenError(

			"Password is wrong try again"
		)
	}

	// access token generation i guess also the generatation of the refersh token and saving of that as well . 

	const accessToken = generateAccessToken(exitingUser.id)

	const { raw, expiresAt } = await generateRefreshToken(exitingUser.id)

	setRefreshToken(res, raw, expiresAt)

	return {
		accessToken, user: { id: exitingUser.id, email: exitingUser.email, emailVerified: exitingUser.emailVerified, onboardingCompleted: exitingUser.userSetting?.onboardingCompleted }
	}
}



