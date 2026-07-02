# `src/lib/db` — Database (Mongoose) connection

A single, cached MongoDB/Mongoose connection helper for use from API Route
Handlers.

## Why a cache?

Next.js re-evaluates modules on hot-reload (dev) and may run each request in a
fresh serverless invocation (prod). Opening a new connection per request would
exhaust the MongoDB connection pool. `connectToDatabase()` stores the
connection (and the in-flight connection promise) on `globalThis`, so it is
created once and reused everywhere.

## Environment

Requires **`MONGODB_URI`** in the environment (read from `process.env`).

- Put the real value in `.env.local` (gitignored).
- A placeholder lives in `.env.example` (owned by the Security & QA agent).

If `MONGODB_URI` is missing, `connectToDatabase()` throws a descriptive error.

## Usage

```ts
import { connectToDatabase } from "@/lib/db/connect";

// Example: a route handler at src/app/api/health/route.ts
export async function GET() {
  await connectToDatabase();
  // ...run Mongoose model queries here...
  return Response.json({ ok: true });
}
```

Route Handlers run on the Node.js runtime by default, which Mongoose requires —
no extra runtime config needed. Call `connectToDatabase()` at the start of any
handler (or shared data-access function) that touches the database; repeated
calls are cheap because the connection is cached.

## Models

Mongoose models live in `src/models/`. They are added in task 0.4 alongside the
shared types in `src/types/` (coordinated through the chief). Import a model and
call `connectToDatabase()` before querying it.
