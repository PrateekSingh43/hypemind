import crypto from "crypto";
import { prisma } from "@repo/db";
import argon2 from "argon2";
import {
	JWT_SECRET,
	REFRESH_SECRET,
	EMAIL_SECRET,
	NODE_ENV,
	CLIENT_URL,
} from "../config/env";
import jwt from "jsonwebtoken";
import {
	BadRequestError,
	UnauthorizedError,
	ConflictError,
} from "../errors/httpErrors";

// ── Constants ──────────────────────────────────────────

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

// ── Helpers ────────────────────────────────────────────

function hmacRefresh(raw: string): string {
	return crypto.createHmac("sha256", REFRESH_SECRET).update(raw).digest("hex");
}

function hmacEmail(raw: string): string {
	return crypto.createHmac("sha256", EMAIL_SECRET).update(raw).digest("hex");
}

function generateAccessToken(userId: string): string {
	return jwt.sign({ userId }, JWT_SECRET, {
		expiresIn: ACCESS_TOKEN_TTL,
		jwtid: crypto.randomUUID(),
	});
}

async function createRefreshToken(userId: string): Promise<{ raw: string; expiresAt: Date }> {
	const random = crypto.randomBytes(48).toString("hex");
	const raw = `${userId}.${random}`;
	const tokenHash = hmacRefresh(raw);
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

	await prisma.refreshToken.create({
		data: { tokenHash, userId, expiresAt },
	});

	return { raw, expiresAt };
}

async function createEmailVerificationToken(userId: string): Promise<string> {
	const random = crypto.randomBytes(48).toString("hex");
	const raw = `${userId}.${random}`;
	const tokenHash = hmacEmail(raw);
	const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);

	// Delete any existing unused tokens for this user
	await prisma.emailVerification.deleteMany({
		where: { userId, usedAt: null },
	});

	await prisma.emailVerification.create({
		data: { tokenHash, userId, expiresAt },
	});

	return raw;
}

async function getPrimaryWorkspaceId(userId: string): Promise<string | null> {
	const membership = await prisma.workspaceMember.findFirst({
		where: { userId },
		orderBy: { joinedAt: "asc" },
		select: { workspaceId: true },
	});
	return membership?.workspaceId ?? null;
}

async function buildAuthUser(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			name: true,
			isActive: true,
			emailVerified: true,
		},
	});

	if (!user) {
		throw new UnauthorizedError("User not found");
	}

	if (!user.isActive) {
		throw new UnauthorizedError("Account is deactivated");
	}

	if (!user.emailVerified) {
		throw new UnauthorizedError("Email not verified. Check your inbox.");
	}

	const workspaceId = await getPrimaryWorkspaceId(user.id);

	return {
		id: user.id,
		email: user.email,
		name: user.name ?? "",
		workspaceId,
	};
}

// ── Service ────────────────────────────────────────────

export async function register(email: string, password: string, name: string) {
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		throw new ConflictError("Email already registered");
	}

	const passwordHash = await argon2.hash(password);

	const result = await prisma.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: { email, passwordHash, name },
		});

		// Create default workspace
		const slug = email.split("@")[0]!.replace(/[^a-z0-9]/gi, "-").toLowerCase();
		const workspace = await tx.workspace.create({
			data: {
				name: `${name}'s Workspace`,
				slug: `${slug}-${Date.now()}`,
				createdById: user.id,
				members: {
					create: { userId: user.id, role: "OWNER" },
				},
			},
		});

		// Create default user settings
		await tx.userSetting.create({
			data: {
				userId: user.id,
				prefs: {
					themeMode: "system",
					themePalette: "hype-default",
					prefersReducedMotion: false,
					density: "comfortable",
					editorDefaultBlock: "paragraph",
					hotkeys: {
						quickCapture: "q",
						openSearch: "k",
						newJournal: "j",
						newCanvas: "c",
						toggleAssistant: ".",
						toggleTheme: "t",
						openInbox: "i",
					},
					experimental: {
						vectorSearch: false,
						graphLite: true,
						aiInlineRewrite: false,
					},
				},
			},
		});

		return { user, workspace };
	});

	// Create email verification token
	const verifyToken = await createEmailVerificationToken(result.user.id);
	const verifyUrl = `${CLIENT_URL}/verify-email?token=${encodeURIComponent(verifyToken)}`;

	// TODO: Send email via Resend (wire later)
	// For now, log the URL in dev
	if (NODE_ENV === "development") {
		console.log(`[DEV] Email verification URL: ${verifyUrl}`);
	}

	return {
		userId: result.user.id,
		workspaceId: result.workspace.id,
		devVerificationToken: NODE_ENV === "development" ? verifyToken : undefined,
	};
}

export async function login(email: string, password: string) {
	const user = await prisma.user.findUnique({
		where: { email },
		select: {
			id: true,
			email: true,
			name: true,
			passwordHash: true,
			emailVerified: true,
			isActive: true,
		},
	});

	if (!user || !user.passwordHash) {
		throw new UnauthorizedError("Invalid email or password");
	}

	if (!user.isActive) {
		throw new UnauthorizedError("Account is deactivated");
	}

	const validPassword = await argon2.verify(user.passwordHash, password);
	if (!validPassword) {
		throw new UnauthorizedError("Invalid email or password");
	}

	if (!user.emailVerified) {
		throw new UnauthorizedError("Email not verified. Check your inbox.");
	}

	const accessToken = generateAccessToken(user.id);
	const { raw: refreshTokenRaw, expiresAt } = await createRefreshToken(user.id);
	const workspaceId = await getPrimaryWorkspaceId(user.id);

	return {
		accessToken,
		refreshTokenRaw,
		refreshExpiresAt: expiresAt,
		user: { id: user.id, email: user.email, name: user.name ?? "", workspaceId },
	};
}

export async function refreshTokens(rawRefreshToken: string) {
	const tokenHash = hmacRefresh(rawRefreshToken);

	const tokenRecord = await prisma.refreshToken.findUnique({
		where: { tokenHash },
	});

	if (!tokenRecord) {
		throw new UnauthorizedError("Invalid refresh token");
	}

	if (tokenRecord.revokedAt) {
		// Potential reuse attack — revoke ALL tokens for this user
		await prisma.refreshToken.updateMany({
			where: { userId: tokenRecord.userId, revokedAt: null },
			data: { revokedAt: new Date() },
		});
		throw new UnauthorizedError("Refresh token reuse detected — all sessions revoked");
	}

	if (tokenRecord.expiresAt < new Date()) {
		throw new UnauthorizedError("Refresh token expired");
	}

	// Revoke old token
	await prisma.refreshToken.update({
		where: { id: tokenRecord.id },
		data: { revokedAt: new Date() },
	});

	// Issue new pair
	const accessToken = generateAccessToken(tokenRecord.userId);
	const { raw: newRefreshRaw, expiresAt } = await createRefreshToken(tokenRecord.userId);
	const user = await buildAuthUser(tokenRecord.userId);

	return {
		accessToken,
		refreshTokenRaw: newRefreshRaw,
		refreshExpiresAt: expiresAt,
		userId: tokenRecord.userId,
		user,
	};
}

export async function logout(rawRefreshToken: string) {
	const tokenHash = hmacRefresh(rawRefreshToken);

	await prisma.refreshToken.updateMany({
		where: { tokenHash, revokedAt: null },
		data: { revokedAt: new Date() },
	});
}

export async function verifyEmail(rawToken: string) {
	const tokenHash = hmacEmail(rawToken);

	const record = await prisma.emailVerification.findUnique({
		where: { tokenHash },
	});

	if (!record) {
		throw new BadRequestError("Invalid verification token");
	}

	if (record.usedAt) {
		throw new BadRequestError("Verification link already used");
	}

	if (record.expiresAt < new Date()) {
		throw new BadRequestError("Verification link expired");
	}

	await prisma.$transaction([
		prisma.emailVerification.update({
			where: { id: record.id },
			data: { usedAt: new Date() },
		}),
		prisma.user.update({
			where: { id: record.userId },
			data: { emailVerified: true },
		}),
	]);

	// Auto-login after verification: issue tokens
	const accessToken = generateAccessToken(record.userId);
	const { raw: refreshTokenRaw, expiresAt } = await createRefreshToken(record.userId);
	const user = await buildAuthUser(record.userId);

	return {
		accessToken,
		refreshTokenRaw,
		refreshExpiresAt: expiresAt,
		user,
	};
}

export async function getCurrentUser(userId: string) {
	const user = await buildAuthUser(userId);
	return { user };
}

export async function resendVerification(email: string) {
	const user = await prisma.user.findUnique({
		where: { email },
		select: { id: true, emailVerified: true },
	});

	if (!user) {
		// Don't reveal if email exists
		return;
	}

	if (user.emailVerified) {
		throw new BadRequestError("Email already verified");
	}

	// Check cooldown
	const recent = await prisma.emailVerification.findFirst({
		where: { userId: user.id },
		orderBy: { createdAt: "desc" },
	});

	if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
		throw new BadRequestError("Please wait before requesting another verification email");
	}

	const verifyToken = await createEmailVerificationToken(user.id);
	const verifyUrl = `${CLIENT_URL}/verify-email?token=${encodeURIComponent(verifyToken)}`;

	// TODO: Send email via Resend
	if (NODE_ENV === "development") {
		console.log(`[DEV] Email verification URL: ${verifyUrl}`);
	}
}

// ── Forgot Password ──────────────────────────────────

export async function forgotPassword(email: string) {
	const user = await prisma.user.findUnique({ where: { email } });

	// Always succeed silently — no email enumeration
	if (!user) return;

	// Rate limit: 1 reset email per 5 minutes
	const recent = await prisma.passwordResetToken.findFirst({
		where: { userId: user.id },
		orderBy: { createdAt: "desc" },
	});

	if (recent && Date.now() - recent.createdAt.getTime() < 5 * 60 * 1000) {
		return; // Silently ignore — don't reveal timing
	}

	const raw = crypto.randomBytes(32).toString("hex");
	const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");

	await prisma.passwordResetToken.create({
		data: {
			tokenHash,
			userId: user.id,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
		},
	});

	const resetUrl = `${CLIENT_URL}/reset-password?token=${encodeURIComponent(raw)}`;

	// TODO: Send email via Resend
	if (NODE_ENV === "development") {
		console.log(`[DEV] Password reset URL: ${resetUrl}`);
	}
}

// ── Reset Password ────────────────────────────────────

export async function resetPassword(rawToken: string, newPassword: string) {
	const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

	const record = await prisma.passwordResetToken.findUnique({
		where: { tokenHash },
	});

	if (!record) {
		throw new BadRequestError("Invalid or expired reset token");
	}

	if (record.usedAt) {
		throw new BadRequestError("This reset link has already been used");
	}

	if (record.expiresAt < new Date()) {
		throw new BadRequestError("This reset link has expired");
	}

	const passwordHash = await argon2.hash(newPassword);

	await prisma.$transaction([
		prisma.passwordResetToken.update({
			where: { id: record.id },
			data: { usedAt: new Date() },
		}),
		prisma.user.update({
			where: { id: record.userId },
			data: { passwordHash },
		}),
		// Revoke all refresh tokens for security
		prisma.refreshToken.updateMany({
			where: { userId: record.userId, revokedAt: null },
			data: { revokedAt: new Date() },
		}),
	]);
}

