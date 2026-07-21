import { Router } from "express";
import { askAIPortfolioAgent } from "../controllers/geminiController.js";
import { generalLimiter } from "../middleware/security.js";

const router = Router();

// POST /api/ai/ask - Ask Natalia's professional AI Copilot a question
router.post("/ask", generalLimiter, askAIPortfolioAgent);

export default router;
