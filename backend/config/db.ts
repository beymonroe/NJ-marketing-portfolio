import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  const mongoUrl = process.env.MONGODB_URL;

  if (!mongoUrl) {
    throw new Error(
      "MONGODB_URL environment variable is missing. Please set your MongoDB Atlas connection string in your Environment Variables."
    );
  }

  if (isConnected) {
    console.log("Using existing MongoDB connection");
    return mongoose;
  }

  try {
    const db = await mongoose.connect(mongoUrl, {
      maxPoolSize: 10, // Recommended connection pooling
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("Successfully connected to MongoDB Atlas via Mongoose");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
