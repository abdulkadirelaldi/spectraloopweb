/**
 * Seed script — creates the first admin user.
 *
 * Run with:  npm run seed:admin
 *
 * Credentials are read from the environment (never hard-coded):
 *   SEED_ADMIN_EMAIL     — admin login email
 *   SEED_ADMIN_PASSWORD  — admin plaintext password (hashed before storage)
 *
 * - Loads env from `.env.local` via `@next/env`.
 * - Idempotent: if a user with that email already exists, it is left untouched
 *   (the password is NOT reset) and the script reports "already exists".
 *
 * See seedSponsors.ts for notes on the direct-connect / import-hoisting choice.
 */
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

// Load .env / .env.local into process.env.
loadEnvConfig(process.cwd());

import { User } from "../../models/User";
import { hashPassword } from "./password";

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Set it in .env.local (see .env.example).",
    );
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env.local.",
    );
  }

  await mongoose.connect(uri);

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    console.log(`Admin user already exists: ${email} (no changes made).`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hashPassword(password);
  await User.create({
    name: "Admin",
    email,
    passwordHash,
    role: "admin",
    active: true,
  });

  console.log(`Created admin user: ${email}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Admin seed failed:", err);
  process.exitCode = 1;
});
