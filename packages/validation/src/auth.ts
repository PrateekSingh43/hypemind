// packages/validation/src/auth.ts
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    "Password must contain uppercase letter"
  )
  .refine(
    (pwd) => /[a-z]/.test(pwd),
    "Password must contain lowercase letter"
  )
  .refine(
    (pwd) => /\d/.test(pwd),
    "Password must contain number"
  );


export const signupSchema = z.object({
  fullName: z.string("name is requried").min(3).max(20).toLowerCase(),
  email: z.email("Invalid email address").toLowerCase(),
  password: passwordSchema

});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token required"),
});

export const resendEmailSchema = z.object({
  email: z.email("Invalid email address")
})




export const loginSchema = z.object({
  email: z.email("Invalid email").toLowerCase(),
  password: passwordSchema

});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid token"),
  newPassword: passwordSchema

});

// refreshTokenSchema removed — refresh uses httpOnly cookie, no body needed



// Export types for frontend use
export type SignupSchema = z.infer<typeof signupSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type VerifyEmailSchema = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type resendEmailSchema = z.infer<typeof resendEmailSchema>;

export { z, type ZodType } from "zod";