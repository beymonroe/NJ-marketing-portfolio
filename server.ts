import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./backend/server.js";

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  // 1. Configure Dev Server (Vite Middleware) vs Production Server (Static assets)
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Vite middleware serves HTML, JS, and client-side assets under dev mode
    app.use(vite.middlewares);
  } else {
    console.log("Running in production mode with static asset serving");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files compiled inside /dist
    app.use(express.static(distPath));
    
    // Catch-all route to serve index.html for Single Page Applications
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 2. Listen on port 3000 on all network interfaces
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Production-ready full-stack server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to launch server:", err);
  process.exit(1);
});
