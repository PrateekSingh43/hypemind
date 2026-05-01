

import crypto from "crypto"
import { NODE_ENV, JWT_SECRET, REFRESH_COOKIE_NAME, REFRESH_SECRET, PASSWORD_RESET_SECRET, CLIENT_URL } from "../config/env"
import jwt from "jsonwebtoken"
import { Response } from "express";
import { Prisma, prisma } from '@repo/db';




export const hmac = (raw: string) => {
	return crypto.createHmac("sha-256", REFRESH_SECRET).update(raw).digest("hex");
}


export const generateAccessToken = (userId: string) => {
	return jwt.sign({ userId }, JWT_SECRET, {
		algorithm: 'HS256',            // 2. Explicitly define algorithm all the thigns will go into the .env for safety
		expiresIn: '15m',
		audience: 'my-app-api',        // 3. aud: Who this token is for
		issuer: 'my-auth-service',     // 4. iss: Who issued the token
		jwtid: crypto.randomUUID(),
	})

}

export const generateRefreshToken = async (userId: string) => {
	const random = crypto.randomBytes(48).toString("hex");
	const raw = `${userId}.${random}`;

	const tokenHash = hmac(raw);
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

	await prisma.refreshToken.create({
		data: { tokenHash, userId, expiresAt },
	});

	return { raw, expiresAt };
}

export const generateRefreshTokenTx = async (
	tx: Prisma.TransactionClient,
	userId: string
) => {
	const random = crypto.randomBytes(48).toString("hex");
	const raw = `${userId}.${random}`;

	const tokenHash = hmac(raw);
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

	await tx.refreshToken.create({
		data: { tokenHash, userId, expiresAt },
	});

	return { raw, expiresAt };
};



export const setRefreshToken = (res: Response, raw: string, expiresAt: Date) => {
	const isProd = NODE_ENV === "production";
	
	res.cookie(REFRESH_COOKIE_NAME, raw, {
		httpOnly: true,
		secure: isProd, // Only secure in production
		sameSite: isProd ? "none" : "lax",
		maxAge: expiresAt.getTime() - Date.now(),
		path: "/",
		// On localhost, we don't set a domain to allow port sharing
	});

	// Set a non-httpOnly 'signal' cookie for the frontend middleware
	res.cookie("hm_logged_in", "true", {
		secure: isProd,
		sameSite: isProd ? "none" : "lax",
		maxAge: expiresAt.getTime() - Date.now(),
		path: "/",
	});
}


export const verifyRefreshToken = async (rawToken: string) => {
	const tokenHash = hmac(rawToken);

	const tokenRecord = await prisma.refreshToken.findUnique({ where: { tokenHash } })

	if (!tokenRecord || tokenRecord.expiresAt < new Date()) {

		if (!tokenRecord) {
			return null;
		}
		if (tokenRecord.expiresAt < new Date()) {
			await prisma.refreshToken.delete({ where: { tokenHash } });
		}
		return null;
	}

	return tokenRecord;

}
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

//Single generator: create and store hashed token (raw returned to send)
export const createPasswordResetToken = async (userId: string) => {
	// raw token contains userId to bind token to a user and prevent guessing
	const raw = `${userId}.${crypto.randomBytes(48).toString("hex")}`;
	const tokenHash = crypto
		.createHmac("sha-256", PASSWORD_RESET_SECRET)
		.update(raw)
		.digest("hex");
	const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

	// Optionally delete existing tokens for this user (single active token)
	await prisma.passwordResetToken.deleteMany({ where: { userId } });

	await prisma.passwordResetToken.create({
		data: { userId, tokenHash, expiresAt },
	});

	return raw;
};



export const verifyPasswordResetToken = async (rawToken: string) => {
    const tokenHash = crypto
        .createHmac("sha-256", PASSWORD_RESET_SECRET)  // Fixed: consistent hash
        .update(rawToken)
        .digest("hex");

    const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
    });

    if (!tokenRecord) return null;
    if (tokenRecord.expiresAt < new Date()) return null;
    
    
    if (tokenRecord.usedAt !== null) return null;

    

    return {userId:tokenRecord.userId};
};

