import { z } from "zod";


export const onboardingSchema = z.object({
	name: z.string().min(2).max(50),// in the userSetting it's user how it will mapped to the name and it won't cause anyProblem or it will map to the model user.name and same for the user.avatarUrl
	avatarUrl: z.url().optional(),
	jobeRole:z.string().min(3).max(100),// it should also be i guess string of array.
	goals:z.string().array().min(3).max(250),
	settings:z.object().optional()
})