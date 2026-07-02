import mongoose, { type Mongoose } from "mongoose";

/**
 * Cached MongoDB/Mongoose connection helper for Next.js.
 *
 * In a serverless / hot-reloading environment (Next.js dev, Vercel functions),
 * module state can be re-evaluated frequently. Without caching, every request
 * would open a brand-new connection and quickly exhaust the database's
 * connection pool. We therefore stash the connection promise on `globalThis`
 * so it survives module re-evaluation and is shared across all invocations.
 *
 * Usage (from a Route Handler):
 *
 *   import { connectToDatabase } from "@/lib/db/connect";
 *
 *   export async function GET() {
 *     await connectToDatabase();
 *     // ...run Mongoose queries here...
 *     return Response.json({ ok: true });
 *   }
 *
 * See `src/lib/db/README.md` for more detail.
 */

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Reuse a single cache object across hot-reloads / serverless invocations.
const globalWithMongoose = globalThis as typeof globalThis & {
  _mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose._mongoose ?? {
  conn: null,
  promise: null,
};

globalWithMongoose._mongoose = cached;

/**
 * Connect to MongoDB via Mongoose, reusing an existing connection when one is
 * already open (or in-flight). Safe to call on every request.
 *
 * @throws if `MONGODB_URI` is not defined in the environment.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined. Set it in your .env.local file " +
        "(see .env.example for the expected keys).",
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      // Fail fast instead of buffering queries when no connection is available.
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset the in-flight promise so a later call can retry the connection.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
