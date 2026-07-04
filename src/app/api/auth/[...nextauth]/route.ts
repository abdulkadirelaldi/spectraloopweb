/**
 * Auth.js (NextAuth v5) catch-all route handler.
 *
 * Exposes the auth REST endpoints (sign-in, sign-out, session, csrf, callback)
 * under /api/auth/*. The GET/POST handlers are built in `@/lib/auth`; we just
 * re-export them here per the v5 App Router pattern. Runs on the Node.js runtime
 * (default) because `authorize()` uses Mongoose + bcryptjs.
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
