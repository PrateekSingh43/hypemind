

import { Router  } from "express"; 
import { forgotPasswordSchema, loginSchema, resendEmailSchema, resetPasswordSchema, signupSchema, verifyEmailSchema } from "@repo/validation";

import { validateSchema } from "../middlewares/middleware.validate";
import { forgotPasswordController, loginController, logoutController, meController, refreshTokenController, resendEmailController, resetPasswordController, signupController, verifyEmailController } from "./auth.controller";
import { authMiddleware } from "../middlewares/middleware.auth";

const router:Router  = Router() ; 

router.post("/signup"  , validateSchema(signupSchema) , signupController) ; 
router.post("/login" , validateSchema(loginSchema) , loginController) ; 
router.post("/refresh" , refreshTokenController) ; 
router.post("/verify-email" , validateSchema(verifyEmailSchema) , verifyEmailController)
router.post("/resend-verification" , validateSchema(resendEmailSchema) , resendEmailController)
router.post("/forgot-password" , validateSchema(forgotPasswordSchema) , forgotPasswordController)  ;
router.post("/reset-password" , validateSchema(resetPasswordSchema) , resetPasswordController); 


router.post("/logout" , authMiddleware , logoutController);
router.get("/me" , authMiddleware , meController);

export default router;
