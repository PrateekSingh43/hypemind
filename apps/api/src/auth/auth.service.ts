import { Prisma, prisma } from "@repo/db";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "../errors/httpErrors";
import { hash, verifyPassword } from "../utils/hash";
import {
  createVerifyEmailToken,
  sendPasswordResetEmail,
  sendVerificationEmailToken,
} from "../utils/email/email";
import { generateUniqueSlug, generateWorkspaceData } from "../utils/workspace";

import {
  clearAuthCookies,
  createPasswordResetToken,
  generateAccessToken,
  generateRefreshToken,
  generateRefreshTokenTx,
  setRefreshToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
} from "../utils/token";

import crypto from "crypto";
import { EMAIL_SECRET } from "../config/env";

import { logger } from "../utils/logger";

const REFRESH_REUSE_GRACE_MS = 10_000;

export async function getSessionUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      isActive: true,
      userSetting: {
        select: { onboardingCompleted: true },
      },
      memberships: {
        select: { workspaceId: true },
        take: 1,
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Session expired");
  }

  if (!user.emailVerified) {
    throw new UnauthorizedError("Email not verified");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    emailVerified: user.emailVerified,
    onboardingCompleted: user.userSetting?.onboardingCompleted ?? false,
    workspaceId: user.memberships[0]?.workspaceId ?? null,
  };
}

export const signupService = async (payload: {
  email: string;
  password: string;
  fullName: string;
}) => {
  if (!payload) {
    throw new BadRequestError("Email and Password required");
  }

  const { email, password, fullName } = payload;
  const cleanEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    throw new ConflictError("Email already registered. Please login");
  }

  const hashPassword = await hash(password);

  if (!hashPassword) {
    throw new ConflictError("Not able to store user data, Try again");
  }

  const user = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          name: fullName,
          passwordHash: hashPassword,
          emailVerified: false,
        },
      });

      const { name, baseSlug } = await generateWorkspaceData(newUser.email);
      const slug = await generateUniqueSlug(tx, baseSlug);

      const workspace = await tx.workspace.create({
        data: {
          name,
          slug,
          createdById: newUser.id,
        },
      });
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
        },
      });

      await tx.workspaceSetting.create({
        data: {
          workspaceId: workspace.id,
          prefs: {},
        },
      });

      const userSetting = await tx.userSetting.create({
        data: {
          userId: newUser.id,
          onboardingCompleted: false,
          settings: {},
        },
      });

      return {
        userId: newUser.id,
        email: newUser.email,
        emailVerified: newUser.emailVerified,
        onboardingCompleted: userSetting.onboardingCompleted,
      };
    },
  );

  const rawToken = await createVerifyEmailToken(user.userId);
  await sendVerificationEmailToken(user.email, rawToken);

  return {
    emailVerified: user.emailVerified,
    emailverify: user.emailVerified, // Keep typo key for backwards compatibility
    onboardingVerify: user.onboardingCompleted,
    id: user.userId,
    email: user.email,
    message: "signup successful. Verify your email.",
  };
};

export async function verifyEmailService(rawToken: string, res: any) {
  const emailTokenHash = crypto
    .createHmac("sha-256", EMAIL_SECRET)
    .update(rawToken)
    .digest("hex");

  const verifyEmail = await prisma.emailVerification.findUnique({
    where: { tokenHash: emailTokenHash },
  });

  if (!verifyEmail || verifyEmail.expiresAt < new Date()) {
    throw new ConflictError("InvalidToken or expried Token ");
  }

  const user = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const updatedUser = await tx.user.update({
        where: { id: verifyEmail.userId },
        data: {
          emailVerified: true,
        },
      });
      await tx.emailVerification.delete({ where: { id: verifyEmail.id } });

      return tx.user.findUnique({
        where: { id: updatedUser.id },
      });
    },
  );

  if (!user || !user.isActive) {
    throw new ConflictError("User does not exits");
  }

  const accessToken = generateAccessToken(user.id);
  const { raw, expiresAt } = await generateRefreshToken(user.id);

  setRefreshToken(res, raw, expiresAt);

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    },
    accessToken,
  };
}

export async function resendEmailService(email: string) {
  if (!email) {
    throw new BadRequestError("Email is required");
  }

  // is this cleaning of the email is unncessary step or not.
  const cleanEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

  if (!user || !user.isActive) {
    return { message: "If email exists, verification link sent" };
  }
  if (user.emailVerified) {
    throw new ConflictError("Email already verified");
  }

  const token = await createVerifyEmailToken(user.id);

  await sendVerificationEmailToken(user.email, token);

  return { message: "Verification email sent" };
}

export const loginService = async (
  payload: { email: string; password: string },
  res: any,
) => {
  if (!payload) {
    throw new BadRequestError("Enter Email and Password");
  }
  const { email, password } = payload;
  const cleanEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: { userSetting: true },
  });

  if (!existingUser || !existingUser.passwordHash) {
    throw new ConflictError("User does not exist. Please sign up.");
  }

  let passwordVerify = false;
  try {
    if (existingUser.passwordHash.startsWith("$argon2")) {
      passwordVerify = await verifyPassword(existingUser.passwordHash, password);
    }
  } catch (e) {
    passwordVerify = false;
  }

  if (!passwordVerify) {
    throw new ForbiddenError("Password is wrong try again");
  }

  if (!existingUser.emailVerified) {
    throw new ForbiddenError("Email not verified. Please verify your email first");
  }

  const accessToken = generateAccessToken(existingUser.id);

  const { raw, expiresAt } = await generateRefreshToken(existingUser.id);

  setRefreshToken(res, raw, expiresAt);

  return {
    accessToken,
    user: {
      id: existingUser.id,
      email: existingUser.email,
      emailVerified: existingUser.emailVerified,
      onboardingCompleted: existingUser.userSetting?.onboardingCompleted,
    },
  };
}

// forgot Password Service

export async function forgotPasswordService(email: string, ip: string) {
  const cleaned = email.trim().toLowerCase();

  if (/[,\n\r;]/.test(cleaned) || cleaned.split(/\s+/).length > 1) {
    // log suspicious input for review
    logger.warn({ ip, input: cleaned }, "forgot-password:  injection attempt");
    throw new BadRequestError("Invalid email format");
  }

  const user = await prisma.user.findUnique({ where: { email: cleaned } });

  if (
    !user ||
    !user.isActive ||
    !user.emailVerified ||
    user.createdAt > new Date()
  ) {
    throw new ConflictError(
      "If email exists, password reset instructions sent.",
    );
  }

  // creating the verifiable email Token
  const token = await createPasswordResetToken(user.id);

  await sendPasswordResetEmail(token, cleaned);

  return { message: "If email exists, password reset instructions sent" };
}

export async function resetPasswordService(
  rawToken: string,
  newPassword: string,
  ip: string,
  res: any,
) {
  // compaines take password multiple time should we also do that if yes then why because i don't see any need for our use case .

  if (!rawToken || !newPassword) {
    throw new BadRequestError("Token, Password and Email are required");
  }

  const verify = await verifyPasswordResetToken(rawToken);

  if (!verify) {
    logger.warn({ ip }, "Reset-password: invalid token");
    throw new BadRequestError("Invalid or expired reset token");
  }

  const password = await hash(newPassword);

  const updatedUser = await prisma.user.update({
    data: { passwordHash: password },
    where: { id: verify.userId },
  });

  if (!updatedUser) {
    throw new BadRequestError("Failed to update password. Try again");
  }

  // Set the token as used (one-time use lifecycle)
  await prisma.passwordResetToken.update({
    where: { tokenHash: verify.tokenHash },
    data: { usedAt: new Date() },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: verify.userId } });

  const accessToken = generateAccessToken(updatedUser.id);

  const { raw, expiresAt } = await generateRefreshToken(updatedUser.id);

  setRefreshToken(res, raw, expiresAt);

  return {
    accessToken,
    accesToken: accessToken, // Keep typo key for backwards compatibility
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      emailVerified: updatedUser.emailVerified,
      emailverified: updatedUser.emailVerified, // Keep typo key for backwards compatibility
    },
  };
}

export async function refreshTokenService(rawToken: string, res: any) {
  const token = await verifyRefreshToken(rawToken, {
    allowRecentlyRevokedMs: REFRESH_REUSE_GRACE_MS,
  });
  if (!token) {
    throw new UnauthorizedError("Session expired. Please login again");
  }

  const user = await getSessionUser(token.userId);
  const accessToken = generateAccessToken(user.id);

  if (!token.recentlyRevoked) {
    const replacement = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const revokeResult = await tx.refreshToken.updateMany({
          where: { id: token.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });

        if (revokeResult.count === 0) {
          return null;
        }

        return generateRefreshTokenTx(tx, user.id);
      },
    );

    if (replacement) {
      setRefreshToken(res, replacement.raw, replacement.expiresAt);
    }
  }

  return {
    accessToken,
    user,
  };
}

export async function logoutService(userId: string, res: any) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
  clearAuthCookies(res);
}
