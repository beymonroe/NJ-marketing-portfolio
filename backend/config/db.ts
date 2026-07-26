import mongoose from "mongoose";

// Disable buffering so Mongoose fails fast with a clear error if DB is disconnected rather than timing out
mongoose.set("bufferCommands", false);

export async function connectDB(): Promise<typeof mongoose> {
  const mongoUrl = process.env.MONGODB_URL;

  if (!mongoUrl) {
    throw new Error(
      "MONGODB_URL environment variable is missing. Please configure your MongoDB Atlas connection string in your environment variables."
    );
  }

  // Check connection state (1 = connected)
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const db = await mongoose.connect(mongoUrl, {
      dbName: "portfolio",
      maxPoolSize: 10, // Recommended connection pooling
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if Atlas server not found
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log("Successfully connected to MongoDB Atlas via Mongoose");
    return db;
  } catch (error: any) {
    console.error("MongoDB connection error:", error?.message || error);
    throw new Error(
      `Could not connect to MongoDB Atlas. Please check your MONGODB_URL and ensure MongoDB Atlas Network Access includes 0.0.0.0/0. Details: ${error?.message || error}`
    );
  }
}
