
import { type Response } from "express";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors/httpErrors";
import { Prisma, prisma, PrismaClient } from "@repo/db";
import crypto from "crypto"
import { hash, verifyPassword } from "../utils/hash"

import { EMAIL_SECRET, REFRESH_COOKIE_NAME } from "../config/env";
import { createPasswordResetToken, generateAccessToken, generateRefreshToken, generateRefreshTokenTx, hmac, setRefreshToken, verifyPasswordResetToken, verifyRefreshToken } from "../utils/token";
import { createVerifyEmailToken, sendVerificationEmailToken, sendPasswordResetEmail, } from "../utils/email/email";



export const signupService = async (payload: { email: string, password: string, name: string }) => {

	// check if the data has come or not 

	if (!payload) {
		throw new NotFoundError("email and password is missing");

	}

	const { email, password, name } = payload;



	const cleanEmail = email.trim().toLowerCase();


	// check user is present in the db or not 

	const user = await prisma.user.findUnique({ where: { email: cleanEmail } })

	if (user) {
		throw new ConflictError("User already exits please log in ");
	}

	// hashing password 

	const hashPassword = await hash(password)

	// create new user with workspace in a transaction
	const newUser = await prisma.$transaction(async (tx: { user: { create: (arg0: { data: { email: string; passwordHash: string; name: string; }; }) => any; }; workspace: { create: (arg0: { data: { name: string; slug: string; members: { create: { userId: any; role: string; }; }; settings: { create: { prefs: { onboardingStep: number; theme: string; }; }; }; }; }) => any; }; collection: { createMany: (arg0: { data: { workspaceId: any; title: string; type: string; description: string; }[]; }) => any; }; node: { create: (arg0: { data: { workspaceId: any; title: string; type: string; studioState: string; contentHtml: string; isPinned: boolean; lastOpenedAt: Date; } | { workspaceId: any; title: string; type: string; studioState: string; metadata: { date: string; }; lastOpenedAt: Date; }; }) => any; }; }) => {
		// Create user
		const createdUser = await tx.user.create({
			data: {
				email: cleanEmail,
				passwordHash: hashPassword,
				name
			}
		});

		// Generate workspace slug
		const slugBase = (name || cleanEmail.split("@")[0])
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "-")
			.replace(/-+/g, "-")
			.slice(0, 20);
		const slug = `${slugBase}-${createdUser.id.slice(0, 6)}`;

		// Create workspace with PARA collections
		const workspace = await tx.workspace.create({
			data: {
				name: "Personal",
				slug,
				members: {
					create: {
						userId: createdUser.id,
						role: "OWNER",
					},
				},
				settings: {
					create: {
						prefs: {
							onboardingStep: 1,
							theme: "system",
						},
					},
				},
			},
		});

		// Seed PARA collections
		await tx.collection.createMany({
			data: [
				{ workspaceId: workspace.id, title: "Projects", type: "PROJECT", description: "Active goals with deadlines" },
				{ workspaceId: workspace.id, title: "Areas", type: "AREA", description: "Ongoing responsibilities" },
				{ workspaceId: workspace.id, title: "Resources", type: "RESOURCE", description: "Reference material" },
				{ workspaceId: workspace.id, title: "Archive", type: "ARCHIVE", description: "Completed and dormant items" },
			],
		});

		// Create welcome note
		await tx.node.create({
			data: {
				workspaceId: workspace.id,
				title: "Welcome to HypeMind!",
				type: "NOTE",
				studioState: "ACTIVE",
				contentHtml: `<h1>Welcome to HypeMind! 👋</h1>
<p>HypeMind is your second brain — a place to capture, organize, and connect your thoughts.</p>
<h2>Quick Start</h2>
<ul>
<li>Press <code>⌘N</code> to capture a new thought</li>
<li>Use <strong>Projects</strong> for active goals with deadlines</li>
<li>Use <strong>Areas</strong> for ongoing responsibilities</li>
<li>Use <strong>Resources</strong> for reference material</li>
</ul>
<p>Feel free to delete this note once you're ready to begin!</p>`,
				isPinned: true,
				lastOpenedAt: new Date(),
			},
		});

		// Create today's journal
		const today = new Date();
		const journalTitle = today.toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		});

		await tx.node.create({
			data: {
				workspaceId: workspace.id,
				title: journalTitle,
				type: "JOURNAL",
				studioState: "ACTIVE",
				metadata: { date: today.toISOString().split("T")[0] },
				lastOpenedAt: new Date(),
			},
		});

		return createdUser;
	});


	const rawToken = await createVerifyEmailToken(newUser.id);
	sendVerificationEmailToken(newUser.email, rawToken)

	return {
		message: "Signup successful. Please verify your email.",
	};

}




export const verifyEmailService = async (rawToken: string, res: Response) => {
	const tokenHash = crypto.createHmac("sha-256", EMAIL_SECRET).update(rawToken).digest("hex");

	const tokenRecord = await prisma.emailVerification.findUnique({
		where: { tokenHash }
	})

	if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
		throw new ConflictError("Token is wrong , user was not able to verified .Try Again");


	}
	const updateUser = await prisma.user.update({ where: { id: tokenRecord.userId }, data: { emailVerified: true } });

	// after the use delete the token 
	await prisma.emailVerification.delete({
		where: { tokenHash }
	});



	if (!updateUser) {
		throw new NotFoundError("User was not found")
	}

	const accessToken = generateAccessToken(updateUser.id);
	const refreshToken = await generateRefreshToken(updateUser.id);
	setRefreshToken(res, refreshToken.raw, refreshToken.expiresAt)

	// i reall did not understand why we are returning the update user here as in the db this has been completed
	return {
		updateUser: {
			id: updateUser.id,
			email: updateUser.email,
			name: updateUser.email

		},

		accessToken

	}

}


// login services 

export const loginService = async (payload: { email: string, password: string }, res: Response) => {
	if (!payload) {
		throw new ForbiddenError("email and password is not there")
	}

	const { email, password } = payload;

	/// normalise email 
	const cleanEmail = email.trim().toLowerCase();


	// user exit or not 

	const exitingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

	if (!exitingUser || !exitingUser.passwordHash) {
		throw new BadRequestError(" Invalid credential ");

	}

	// isActive and deletedAt check 

	if (!exitingUser.isActive || exitingUser.deletedAt) {
		throw new ForbiddenError("Account disabled");
	}


	// password check 
	const passwordCheck = await verifyPassword(password, exitingUser.passwordHash);


	if (!passwordCheck) {
		throw new BadRequestError("wrong Password");

	}

	if (!exitingUser.emailVerified) {
		// should we send a email as we get the email is not verified
		throw new ForbiddenError("Please verify your email before login")
	}


	const accessToken = generateAccessToken(exitingUser.id);
	const refreshToken = await generateRefreshToken(exitingUser.id);
	setRefreshToken(res, refreshToken.raw, refreshToken.expiresAt)

	// does the user will be also be returned if yes then why and if not then why . 

	return {
		accessToken,
		user: {
			id: exitingUser.id,
			email: exitingUser.email,
			name: exitingUser.name,

		},
	};




}




export const refreshTokenServices = async (rawToken: string, res: Response) => {
	const tokenVerify = await verifyRefreshToken(rawToken);
	if (!tokenVerify) {
		throw new ForbiddenError("Token invalid. Try again.");
	}

	const user = await prisma.user.findUnique({
		where: { id: tokenVerify.userId },
	});

	if (!user || !user.isActive || user.deletedAt) {
		throw new ForbiddenError("Account disabled");
	}

	let newRefresh: { raw: string; expiresAt: Date };

	await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		await tx.refreshToken.delete({
			where: { tokenHash: hmac(rawToken) },
		});

		newRefresh = await generateRefreshTokenTx(tx, user.id);

		setRefreshToken(res, newRefresh.raw, newRefresh.expiresAt);
	});

	const accessToken = generateAccessToken(user.id);

	return {
		accessToken,
		user: { id: user.id, name: user.name, email: user.email },
	};
};



export const logoutService = async (userId: string, res: Response) => {
	await prisma.user.findUnique({ where: { id: userId } })
	res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" })



}




export const forgotPasswordService = async (email: string) => {
	const clean = email.trim().toLowerCase();
	const user = await prisma.user.findUnique({ where: { email: clean } });

	if (!user || !user.isActive || user.deletedAt) {

		return { message: "If an account exists with that email, we sent password reset instructions." };
	}

	// rate limit check should be here (e.g., redis counter). Not shown.

	// create token and send email
	const rawToken = await createPasswordResetToken(user.id);
	await sendPasswordResetEmail(rawToken, user.email);

	return { message: "If an account exists with that email, we sent password reset instructions." };
};





export const resetPasswordService = async (
	rawToken: string,
	res: Response,
	newPassword: string
) => {
	const tokenRecord = await verifyPasswordResetToken(rawToken);
	if (!tokenRecord) throw new ForbiddenError("Invalid or expired token.");

	// find user
	const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });
	if (!user || !user.isActive || user.deletedAt) {
		throw new ForbiddenError("Account disabled or not found.");
	}

	// Optional: check emailVerified depending on your policy.
	// If you require email verification to change passwords, keep that check.
	// Otherwise, you may omit it.

	// Hash the new password
	const newPasswordHash = await hash(newPassword);

	// Use a transaction: update user password + delete token +
	await prisma.$transaction([
		prisma.user.update({
			where: { id: user.id },
			data: {
				passwordHash: newPasswordHash,
				updatedAt: new Date(),
			},
		}),
		prisma.passwordResetToken.delete({
			where: { tokenHash: tokenRecord.tokenHash },
		}),
		// revoke all refresh tokens to force re-login everywhere
		prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
		// clear the cookie
		res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth/" })
	]);

	// Generate new tokens and set cookie
	const accessToken = generateAccessToken(user.id);
	const { raw, expiresAt } = await generateRefreshToken(user.id);
	setRefreshToken(res, raw, expiresAt);

	return {
		accessToken,
		user: { id: user.id, name: user.name, email: user.email },
	};

};




