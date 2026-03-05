import { prisma } from "@repo/db"
import { BadRequestError, ConflictError } from "../errors/httpErrors"
import { hash } from "../utils/hash"
import { createVerifyEmailToken, sendVerificationEmailToken } from "../utils/email/email"







export const signupService = async (payload: { email: string, password: string, name: string }) => {

	if (!payload) {
		throw new BadRequestError(
			"User data is missing"
		)
	}

	const { email, password, name } = payload

	// cleaning the email . 

	const cleanEmail = email.trim().toLowerCase();

	const exitingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

	if (exitingUser) {
		throw new ConflictError("user Exits Please login");

	}


	const hashPassword = await hash(password);

	if (!hashPassword) {
		throw new ConflictError("NOt able to store user data , Try again");


	}

	const user = await prisma.$transaction(async (tx) => {
		const newUser = await tx.user.create({


			data: {
				email: cleanEmail,
				passwordHash: hashPassword,
				emailVerified: false,
				name: null, // deliberilty did that to add on the onboarding time.
				avatarUrl: null // same as the name.
			}


		}
		)

		await tx.userSetting.create({
			data: {
				userId: newUser.id,
				onboardingCompleted: false,
				settings: {} // it refers to the user prefrestaion that we will store 
			}
		})

		return newUser;

	})




	// send verification email 
	const rawToken = await createVerifyEmailToken(user.id) ; 

	 sendVerificationEmailToken(user.email, rawToken).catch(() =>{
		throw new ConflictError("There was Problem sending email , Try again.")
	 })



return {
	message:"signup succeful . Verify Your email"
}


}