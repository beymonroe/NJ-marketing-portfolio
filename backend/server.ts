import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { securityMiddlewares, generalLimiter } from "./middleware/security.js";
import contactRoutes from "./routes/contactRoutes.js";
import geminiRoutes from "./routes/geminiRoutes.js";
import { connectDB } from "./config/db.js";

const app = express();

// 1. JSON & URL-encoded parsing with size limits to prevent body buffer exhaustion attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 2. Security Middlewares (Helmet + CORS)
app.use(securityMiddlewares);

// 3. Connect to Database
connectDB()
  .then(() => {
    console.log("Database initialized successfully at startup.");
  })
  .catch((err) => {
    console.error("Database connection failed during startup. Running in degraded mode:", err.message);
  });

// 4. API Health Check Endpoint
app.get("/api/health", generalLimiter, (req, res) => {
  res.json({
    status: "ok",
    database: mongooseConnectionState(),
    aiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Helper to check connection state
function mongooseConnectionState(): string {
  try {
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    return states[mongoose.connection.readyState] || "unknown";
  } catch {
    return "unknown";
  }
}

// 5. Mount Modular API Routes
app.use("/api/contact", contactRoutes);
app.use("/api/ai", geminiRoutes);

// 6. Global Error-Handling Middleware for Safe Error Responses
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled Backend Error:", err);
  const status = typeof err.status === "number" ? err.status : 500;
  res.status(status).json({
    success: false,
    error: status === 400 ? (err.message || "Invalid request payload.") : "An unexpected server error occurred. Please try again later.",
  });
});

export default app;
