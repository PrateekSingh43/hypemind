// apps/api/src/config/env.ts
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { z } from "@repo/validation";

const envSchema = z.object({
  PORT: z.string().optional().transform((val: string | undefined) => Number(val) || 5000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  PASSWORD_RESET_SECRET:z.string(),
  NODE_ENV:z.string(),
  REFRESH_SECRET: z.string(),
  EMAIL_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().optional().default("7d"),
  CLIENT_URL: z.string(),
  RESEND_API_KEY: z.string(),
  VOYAGE_API_KEY:z.string(),
  OAUTH_SECRET: z.string(),
  STATE_COOKIE_NAME: z.string(),
  STATE_COOKIE_PATH:z.string(),
  PKCE_COOKIE_NAME: z.string(),
  RESEND_EMAIL_VERIFICATION_ID: z.string(),
  RESEND_PASSWORD_RESET_ID: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GOOGLE_OAUTH_ALLOWED_ORIGINS: z.string(),
  REFRESH_COOKIE_NAME:z.string(),
  REDIS_DEV_URL: z.string()
});


const parsedEnv = envSchema.parse(process.env);

// General important stuff
export const port: number = parsedEnv.PORT;
export const databaseUrl: string = parsedEnv.DATABASE_URL;
export const JWT_SECRET: string = parsedEnv.JWT_SECRET;
export const PASSWORD_RESET_SECRET:string = parsedEnv.PASSWORD_RESET_SECRET
export const NODE_ENV:string = parsedEnv.NODE_ENV;
export const REFRESH_SECRET: string = parsedEnv.REFRESH_SECRET;
export const EMAIL_SECRET: string = parsedEnv.EMAIL_SECRET;
export const VOYAGE_API_KEY:string = parsedEnv.VOYAGE_API_KEY;
export const JWT_EXP: string = parsedEnv.JWT_EXPIRES_IN;
export const CLIENT_URL: string = parsedEnv.CLIENT_URL;


// Google Related stuff  
export const GOOGLE_CLIENT_ID: string = parsedEnv.GOOGLE_CLIENT_ID.trim();
export const GOOGLE_CLIENT_SECRET: string = parsedEnv.GOOGLE_CLIENT_SECRET.trim();
export const OAUTH_SECRET: string = parsedEnv.OAUTH_SECRET.trim();
export const GOOGLE_OAUTH_ALLOWED_ORIGINS: string = parsedEnv.GOOGLE_OAUTH_ALLOWED_ORIGINS.trim();
export const GOOGLE_REDIRECT_URI: string = parsedEnv.GOOGLE_REDIRECT_URI.trim();
export const STATE_COOKIE_NAME: string = parsedEnv.STATE_COOKIE_NAME.trim();
export const STATE_COOKIE_PATH:string = parsedEnv.STATE_COOKIE_PATH.trim();
export const PKCE_COOKIE_NAME: string = parsedEnv.PKCE_COOKIE_NAME.trim();
export const REFRESH_COOKIE_NAME: string = parsedEnv.REFRESH_COOKIE_NAME.trim();

// ReSend Email part 
export const RESEND_API_KEY: string = parsedEnv.RESEND_API_KEY;
export const RESEND_EMAIL_VERIFICATION_ID: string = parsedEnv.RESEND_EMAIL_VERIFICATION_ID;
export const RESEND_PASSWORD_RESET_ID: string = parsedEnv.RESEND_PASSWORD_RESET_ID;

// worker related
export const REDIS_DEV_URL: string = parsedEnv.REDIS_DEV_URL.trim();
