import { Router } from "express";
import { register, loginUser, getMe, logoutUser } from "../controllers/auth.controller.js";
import { refreshToken } from "../utils/refreshToken.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, loginUser);
router.post("/refresh", authLimiter, refreshToken);
router.get("/me", getMe);
router.post("/logout", logoutUser);

export default router;