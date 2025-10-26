import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set. Add it to your .env file.");
}

type MongooseConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongoose: MongooseConnectionCache | undefined;
}

const globalWithMongoose = global as typeof globalThis & {
  _mongoose?: MongooseConnectionCache;
};

const cache = globalWithMongoose._mongoose ?? {
  conn: null,
  promise: null,
};

if (!globalWithMongoose._mongoose) {
  globalWithMongoose._mongoose = cache;
}

export async function dbConnect() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      // bufferCommands default is true; leave it on for API cold starts
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
