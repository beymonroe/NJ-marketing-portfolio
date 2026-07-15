import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Lazy-loaded MongoDB Client
let mongoClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is missing. Please set your MongoDB Atlas connection string in the environment settings."
    );
  }

  if (mongoClient) {
    try {
      // Ping the admin database to verify the connection is active
      await mongoClient.db("admin").command({ ping: 1 });
      return mongoClient;
    } catch (error) {
      console.warn("Cached MongoDB connection is inactive or closed. Attempting reconnect...", error);
      try {
        await mongoClient.close();
      } catch (closeErr) {
        // Suppress errors during closing of a already-dead client
      }
      mongoClient = null;
    }
  }

  mongoClient = new MongoClient(uri, {
    // Add recommended connection pooling & timeout options for stability
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  await mongoClient.connect();
  console.log("Successfully connected to MongoDB Atlas");
  return mongoClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse incoming request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API: Health Check
  app.get("/api/health", (req, res) => {
    const uriConfigured = !!process.env.MONGODB_URI;
    res.json({
      status: "ok",
      databaseConfigured: uriConfigured,
      time: new Date().toISOString()
    });
  });

  // API: Process and store contact form submissions
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      // Basic server-side validation
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          error: "All fields are required (name, email, subject, message)."
        });
      }

      // Check configuration beforehand to return a helpful message instead of crashing
      if (!process.env.MONGODB_URI) {
        console.warn("Attempted contact submission, but MONGODB_URI is not set.");
        return res.status(503).json({
          success: false,
          error: "Database connection is not configured. Please add the MONGODB_URI environment variable in your AI Studio settings.",
          isConfigError: true
        });
      }

      const client = await getMongoClient();
      const db = client.db("portfolio");
      const collection = db.collection("contact_submissions");

      const submission = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        submittedAt: new Date()
      };

      const result = await collection.insertOne(submission);
      console.log(`Inserted contact submission with ID: ${result.insertedId}`);

      return res.status(200).json({
        success: true,
        message: "Your message has been received! Thank you for reaching out.",
        id: result.insertedId
      });
    } catch (error: any) {
      console.error("Error in /api/contact:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An unexpected database error occurred. Please check the server logs."
      });
    }
  });

  // Vite middleware for development vs static asset serving for production
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in production mode with static asset serving");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start the server:", err);
  process.exit(1);
});
