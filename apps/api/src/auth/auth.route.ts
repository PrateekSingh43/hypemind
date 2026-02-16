import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
	registerController,
	loginController,
	refreshController,
	logoutController,
	meController,
	verifyEmailController,
	resendVerificationController,
	forgotPasswordController,
	resetPasswordController,
} from "./auth.controller";
import { authMiddleware } from "../middlewares/middleware.auth";

const router: Router = Router();

// Rate limiters
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 15,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: "Too many attempts. Try again later." },
});

const refreshLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: "Too many refresh attempts." },
});

// Routes
router.post("/register", authLimiter, registerController);
router.post("/login", authLimiter, loginController);
router.post("/refresh", refreshLimiter, refreshController);
router.post("/logout", logoutController);
router.get("/me", authMiddleware, meController);
router.post("/verify-email", verifyEmailController);
router.post("/resend-verification", authLimiter, resendVerificationController);
router.post("/forgot-password", authLimiter, forgotPasswordController);
router.post("/reset-password", authLimiter, resetPasswordController);

export default router;

