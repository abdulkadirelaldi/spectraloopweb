import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authorizeCredentials } from "./authorize";
import { SIGN_IN_PATH } from "./constants";
// Side-effect import: applies the Session/JWT/User module augmentation.
import "./types";

// Re-export so `@/lib/auth` stays the one import site for consumers.
export { SIGN_IN_PATH } from "./constants";

export const authConfig: NextAuthConfig = {
  // JWT sessions are required for the Credentials provider (no DB session row).
  session: { strategy: "jwt" },

  // Custom pages (Frontend builds the UI at SIGN_IN_PATH). Errors surface on the
  // same page via ?error= so we never expose the default Auth.js pages.
  pages: {
    signIn: SIGN_IN_PATH,
    error: SIGN_IN_PATH,
  },

  // Trust the host header (required behind Vercel's / a reverse proxy's TLS
  // termination). AUTH_SECRET is read from the environment automatically and is
  // mandatory in production — Auth.js throws MissingSecretError when unset.
  trustHost: true,

  providers: [
    Credentials({
      // Field metadata (used only by the default page; our UI is custom).
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Parola", type: "password" },
      },
      // Verify email + password against the User collection. Extracted to
      // ./authorize for unit testing; returns null on any failure (no
      // enumeration, no credential logging).
      authorize: (credentials) => authorizeCredentials(credentials),
    }),
  ],

  callbacks: {
    // Persist role/subteam/id onto the JWT at sign-in (user is only set then).
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.subteam = user.subteam;
      }
      return token;
    },
    // Expose the same fields on the client-visible session.
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.subteam = token.subteam;
      }
      return session;
    },
  },
};

/**
 * Auth.js singleton. `auth` is the universal session reader — call `await
 * auth()` in Server Components, Route Handlers, and (2.S2) route protection to
 * get `Session | null`. `handlers` back the /api/auth route; `signIn`/`signOut`
 * are the server actions the login page / panel use.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// RBAC predicates + API authorization guards (consumed by Backend panel APIs).
export * from "./rbac";
export * from "./guard";
