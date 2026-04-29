
//C:\Users\prate\Hypemind\apps\api\src\utils\email\email.ts

import crypto from "crypto"
import { prisma } from "@repo/db";
import { CLIENT_URL, EMAIL_SECRET, RESEND_API_KEY, RESEND_EMAIL_VERIFICATION_ID, RESEND_PASSWORD_RESET_ID, PASSWORD_RESET_SECRET } from "../../config/env";
import { Resend } from "resend";
import { VerifyEmail } from "./template/welcome";
import { PasswordReset } from "./template/PasswordReset";




const resend = new Resend(RESEND_API_KEY)

export const createVerifyEmailToken = async (userId: string) => {
	const rawToken = crypto.randomBytes(48).toString("hex");

	const emailTokenHash = crypto.createHmac("sha-256", EMAIL_SECRET).update(rawToken).digest("hex");
	const expiresAt = new Date(Date.now() + 60 * 10 * 1000);

	await prisma.emailVerification.create({
		data: {
			userId,
			tokenHash: emailTokenHash,
			expiresAt
		}
	})

	return rawToken;


}







export const sendVerificationEmailToken = async (email: string, rawToken: string) => {
	const url = `${CLIENT_URL}/verify-email?token=${rawToken}`;



	await resend.emails.send({
		from: RESEND_EMAIL_VERIFICATION_ID,
		to: email,
		subject: "verify Email",
		react: VerifyEmail({ url })

	})
}



export const sendPasswordResetEmail = async (rawToken: string, email: string) => {
	const url = `${CLIENT_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;

	await resend.emails.send({
		from: process.env.RESEND_PASSWORD_RESET_ID!,
		to: email,
		subject: "Password reset instructions",
		react: PasswordReset({ url }),
	});
};



