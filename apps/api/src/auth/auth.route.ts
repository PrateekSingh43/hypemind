//C:\Users\prate\Hypemind\apps\api\src\auth\auth.route.ts

import { Router } from "express";


import { validateSchema } from "../middlewares/middleware.validate";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema, verifyEmailSchema } from "@repo/validation";
import { forgotPasswordController, loginController, logoutController, meController, refreshTokenController, resetPasswordController, signupController, verifyEmailController } from "./auth.controller";
import { authMiddleware } from "../middlewares/middleware.auth";



const router: Router = Router();
router.get("/me", authMiddleware, meController);

router.post("/signup", validateSchema(signupSchema), signupController);

router.post("/login", validateSchema(loginSchema), loginController);

router.post("/verify-email", validateSchema(verifyEmailSchema), verifyEmailController);
router.post("/refresh", refreshTokenController);
router.post("/forgot-password", validateSchema(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validateSchema(resetPasswordSchema), resetPasswordController);
router.post("/logout", logoutController);

export default router;