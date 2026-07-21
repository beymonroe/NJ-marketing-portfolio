import { Router } from "express";
import { submitContactForm } from "../controllers/contactController.js";
import { contactFormLimiter } from "../middleware/security.js";

const router = Router();

// POST /api/contact - Register contact form submission with spam protection rate-limiting
router.post("/", contactFormLimiter, submitContactForm);

export default router;
