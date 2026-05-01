import { Prisma, prisma } from "@repo/db"
import { BadRequestError, ConflictError, ForbiddenError, UnauthorizedError } from "../errors/httpErrors"
import { hash, verifyPassword } from "../utils/hash"
import { createVerifyEmailToken, sendPasswordResetEmail, sendVerificationEmailToken } from "../utils/email/email"
import { generateUniqueSlug, generateWorkspaceData } from "../utils/workspace"

import { createPasswordResetToken, generateAccessToken, generateRefreshToken, setRefreshToken, verifyPasswordResetToken, verifyRefreshToken } from "../utils/token"

import crypto from "crypto"
import { EMAIL_SECRET, REFRESH_COOKIE_NAME } from "../config/env"

import { logger } from "../utils/logger"


export const signupService = async (payload: { email: string, password: string, fullName: string }) => {

	if (!payload) {
		throw new BadRequestError(
			"Email and Password required"
		);
	}

	const { email, password, fullName } = payload

	// cleaning the email . 
	console.log("o : just before the everything only the getting the payload ", process.hrtime.bigint())
	const cleanEmail = email.trim().toLowerCase();
	console.log("1: just after the cleaningEmail ", process.hrtime.bigint())

	const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

	console.log("2:After the prisma.user.findUnique", process.hrtime.bigint())

	if (existingUser) {
		throw new ConflictError("Email already registered. Please login");
	}


	console.log("time before hashing", process.hrtime.bigint())
	const hashPassword = await hash(password);

	if (!hashPassword) {
		throw new ConflictError("NOt able to store user data , Try again");


	}
	console.log("time after hashing", process.hrtime.bigint());





	console.log(
		"Time before the whole transcation ", process.hrtime.bigint()
	)
	const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const newUser = await tx.user.create({


			data: {
				email: cleanEmail,
				name: fullName,
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
		await tx.workspaceMember.create({
			data: {
				workspaceId: workspace.id,
				userId: newUser.id

			}
		})

		await tx.workspaceSetting.create({
			data: {
				workspaceId: workspace.id,
				prefs: {}

			}
		})


		const userSetting = await tx.userSetting.create({
			data: {
				userId: newUser.id,
				onboardingCompleted: false,
				settings: {}
			}
		})

		return {
			userId: newUser.id,
			email: newUser.email,
			emailVerified: newUser.emailVerified,
			onboardingCompleted: userSetting.onboardingCompleted
		}

	})

	console.log(
		"time after the full transaction", process.hrtime.bigint()
	)


	console.log("3:Before create verify email token", process.hrtime.bigint())
	const rawToken = await createVerifyEmailToken(user.userId);

	console.log("4:After create verifyEmail Token", process.hrtime.bigint())
	await sendVerificationEmailToken(user.email, rawToken)
	console.log("5: after sendverification email token", process.hrtime.bigint())
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
		throw new BadRequestError("Email is required")
	};

	// is this cleaning of the email is unncessary step or not. 
	const cleanEmail = email.trim().toLowerCase()

	const user = await prisma.user.findUnique({ where: { email: cleanEmail } })

	if (!user || !user.isActive) {
		return { message: "If email exists, verification link sent" };

	}
	if (user.emailVerified) {
		throw new ConflictError("Email already verified");
	}


	const token = await createVerifyEmailToken(user.id);

	await sendVerificationEmailToken(user.email, token)

	return { message: "Verification email sent" };

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


	let PasswrodVerify = false;
	try {
		if (exitingUser.passwordHash.startsWith("$argon2")) {
			PasswrodVerify = await verifyPassword(exitingUser.passwordHash, password);
		}
	} catch (e) {
		PasswrodVerify = false;
	}

	if (!PasswrodVerify) {
		throw new ForbiddenError("Password is wrong try again");
	}



	const accessToken = generateAccessToken(exitingUser.id)

	const { raw, expiresAt } = await generateRefreshToken(exitingUser.id)

	setRefreshToken(res, raw, expiresAt)

	return {
		accessToken, user: { id: exitingUser.id, email: exitingUser.email, emailVerified: exitingUser.emailVerified, onboardingCompleted: exitingUser.userSetting?.onboardingCompleted }
	}
}

// forgot Password Service

export async function forgotPasswordService(email: string, ip: string) {

	const cleaned = email.trim().toLowerCase();


	const user = await prisma.user.findUnique({ where: { email: cleaned } })



	if (/[,\n\r;]/.test(cleaned) || cleaned.split(/\s+/).length > 1) {
		// log suspicious input for review
		logger.warn({ ip, input: cleaned }, "forgot-password:  injection attempt");
		throw new BadRequestError("Invalid email format");
	}


	if (!user || !user.isActive || !user.emailVerified || user.createdAt > new Date()) {
		throw new ConflictError("If email exits , password reset Insturuction sent")
	}

	// creating the verifiable email Token 
	const token = await createPasswordResetToken(user.id);

	await sendPasswordResetEmail(token, cleaned);


	return { message: "If email exists, password reset instructions sent" };

}

export async function resetPasswordService(rawToken: string, newPassword: string, ip: string, res: any) {
	// compaines take password multiple time should we also do that if yes then why because i don't see any need for our use case .

	if (!rawToken || !newPassword ) {

		throw new BadRequestError("Token , Password and Email are required");
	}

	const verify = await verifyPasswordResetToken(rawToken);

	if (!verify) {
		logger.warn({ ip }, "Reset-password: invalid token");
		throw new BadRequestError("Invalid or expired reset token");
	}

	const password = await hash(newPassword);

	const updatedUser = await prisma.user.update({ data: { passwordHash: password }, where: { id: verify.userId } })

	if (!updatedUser) {
		throw new BadRequestError("Failed to update password. Try again");
	}


	await prisma.refreshToken.deleteMany({ where: { userId: verify.userId } })


	const accesToken = generateAccessToken(updatedUser.id);

	const { raw, expiresAt } = await generateRefreshToken(updatedUser.id)

	setRefreshToken(res, raw, expiresAt)

	return {
		accesToken,
		user: {
			id: updatedUser.id,
			email: updatedUser.email,
			emailverified: updatedUser.emailVerified,
		}
	}


}



export async function refreshTokenService(rawToken: string, userId: string, res: any) {

	const token = await verifyRefreshToken(rawToken)
	if (!token) {
		throw new ConflictError("Token not match , Try to re login");

	};


	const user = await prisma.user.findUnique({ where: { id: userId } })

	if (!user || !user.isActive || user.createdAt > new Date()) {
		throw new ConflictError("User Did not found Trying Creating an account")
	};

	const accessToken = generateAccessToken(user.id);






	await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const { raw, expiresAt } = await generateRefreshToken(user.id);
		const updateToken = await tx.refreshToken.delete({ where: { id: token.id } });

		if (!updateToken) {
			throw new BadRequestError("Something went wrong");
		}

		setRefreshToken(res, raw, expiresAt)

	});






	return {
		accessToken,
		user: {
			id: user.id,
			email: user.email,
			emailVerified: user.emailVerified,


		}
	}

}


export async function logoutService(userId: string, res: any) {
	await prisma.refreshToken.deleteMany({ where: { userId } })
	res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
	res.clearCookie("hm_logged_in", { path: "/" });
}


