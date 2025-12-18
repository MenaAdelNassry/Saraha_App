import { protect } from './../middlewares/auth.middleware';
import { Router } from "express";
import { forgotPassword, login, loginWithGoogle, logout, logoutAll, refreshToken, resendCode, resetPassword, signup, verifyEmail } from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import { loginSchema, signupSchema } from "../validation/auth.schema";
import { forgotPasswordSchema, resetPasswordSchema } from "../validation/forgotPassword.schema";
import { logoutSchema } from "../validation/logout.schema";

const router = Router();

// POST /api/auth/signup
router.post("/signup", validate(signupSchema), signup);

// POST /api/auth/login
router.post("/login", validate(loginSchema), login);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/auth/verify-email
router.post('/verify-email', verifyEmail);

// POST /api/auth/resend-code
router.post('/resend-code', resendCode);

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// POST /api/auth/logout
router.post('/logout', protect, validate(logoutSchema), logout);

// POST /api/auth/logout-all
router.post('/logout-all', protect, logoutAll);

// POST /api/auth/google
router.post('/google', loginWithGoogle);

export default router;