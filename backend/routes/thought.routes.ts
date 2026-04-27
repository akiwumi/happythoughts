import { Router } from "express";
import { 
    createThought, 
    getThoughts, 
    editThought, 
    deleteThought, 
    likeThought 
} from "../controllers/thought.controller.js";
import { authenticateToken } from "../utils/verifyToken.js";
import { thoughtsLimiter, createThoughtLimiter } from "../middleware/rateLimiter.js";
import { validateThoughtInput } from "../middleware/security.js";

const router = Router();

// Public routes
router.get("/", thoughtsLimiter, getThoughts);
router.post("/:id/like", thoughtsLimiter, likeThought);

// Protected routes (require authentication)
router.post("/", authenticateToken, createThoughtLimiter, validateThoughtInput, createThought);
router.put("/:id", authenticateToken, thoughtsLimiter, validateThoughtInput, editThought);
router.delete("/:id", authenticateToken, thoughtsLimiter, deleteThought);

export default router;
