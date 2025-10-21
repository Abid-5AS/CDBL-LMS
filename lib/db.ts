import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set. Create .env.local with MONGODB_URI.");
}

let cached = (global as any)._mongoose;
if (!cached) cached = (global as any)._mongoose = { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn as typeof mongoose;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      // bufferCommands default is true; leave it on for API cold starts
    });
  }
  cached.conn = await cached.promise;
  return cached.conn as typeof mongoose;
}
