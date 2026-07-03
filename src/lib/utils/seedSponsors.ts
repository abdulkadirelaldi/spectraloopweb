/**
 * Seed script — inserts representative sample sponsors into MongoDB.
 *
 * Run with:  npm run seed:sponsors
 *
 * - Loads env (`MONGODB_URI`) from `.env.local` via `@next/env`, exactly like
 *   the Next.js runtime does.
 * - Idempotent: upserts by sponsor `name`, so re-running does not duplicate.
 * - The data below is PLACEHOLDER/representative (fake names + placeholder logo
 *   URLs), not real Spectraloop sponsors.
 *
 * Notes:
 * - Uses relative imports (not the `@/` alias) so it runs standalone via tsx.
 * - Connects directly rather than reusing the cached request-path helper in
 *   `src/lib/db/connect.ts`: that module reads `MONGODB_URI` at import time, and
 *   ESM hoists imports above `loadEnvConfig()`, so it would see an unset env.
 *   A one-shot script also has no need for the hot-reload connection cache.
 */
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

// Load .env / .env.local into process.env.
loadEnvConfig(process.cwd());

import { Sponsor } from "../../models/Sponsor";

interface SeedSponsor {
  name: string;
  logoUrl: string;
  tier: "gold" | "silver" | "bronze";
  website?: string;
  active: boolean;
}

const SAMPLE_SPONSORS: SeedSponsor[] = [
  {
    name: "Acme Robotics",
    logoUrl: "https://placehold.co/240x120?text=Acme+Robotics",
    tier: "gold",
    website: "https://example.com/acme",
    active: true,
  },
  {
    name: "Vega Aerospace",
    logoUrl: "https://placehold.co/240x120?text=Vega+Aerospace",
    tier: "gold",
    website: "https://example.com/vega",
    active: true,
  },
  {
    name: "Nimbus Energy",
    logoUrl: "https://placehold.co/240x120?text=Nimbus+Energy",
    tier: "silver",
    website: "https://example.com/nimbus",
    active: true,
  },
  {
    name: "Orbit Materials",
    logoUrl: "https://placehold.co/240x120?text=Orbit+Materials",
    tier: "bronze",
    website: "https://example.com/orbit",
    active: true,
  },
  {
    // Inactive sponsor — should NOT appear in the /api/sponsors response.
    name: "Legacy Sponsor (inactive)",
    logoUrl: "https://placehold.co/240x120?text=Legacy",
    tier: "bronze",
    active: false,
  },
];

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Set it in .env.local (see .env.example).",
    );
  }

  await mongoose.connect(uri);

  let upserted = 0;
  for (const sponsor of SAMPLE_SPONSORS) {
    await Sponsor.updateOne(
      { name: sponsor.name },
      { $set: sponsor },
      { upsert: true },
    );
    upserted += 1;
  }

  console.log(`Seeded ${upserted} sponsors (idempotent upsert by name).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Sponsor seed failed:", err);
  process.exitCode = 1;
});
