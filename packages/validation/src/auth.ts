// packages/validation/src/auth.ts
import {z } from "zod";

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
    "Password must contain uppercase, lowercase, number, and special character"
  ),
  name: z.string().min(2).max(50).optional(),
  avatarUrl: z.url().optional()
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
    "Password must contain uppercase, lowercase, number, and special character"
  ),
});

export const forgotPasswordSchema=z.object({
  email: z.email(),
});

export const resetPasswordSchema=z.object({ 
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
    "Password must contain uppercase, lowercase, number, and special character"
  ),
});




// Export types for frontend use
export type SignupSchema = z.infer<typeof signupSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type VerifyEmailSchema = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;


export { z , type ZodType } from "zod";