/**
 * Seed script — inserts representative sample announcements into MongoDB.
 *
 * Run with:  npm run seed:announcements
 *
 * - Loads env (`MONGODB_URI`) from `.env.local` via `@next/env`.
 * - Idempotent: upserts by `title`, so re-running does not duplicate.
 * - Mix of `publishedToPublic: true` and `false` records to demonstrate that
 *   the public GET endpoint returns ONLY the published ones.
 * - Data is PLACEHOLDER/representative, not real announcements.
 *
 * See seedSponsors.ts for notes on the direct-connect / import-hoisting choice.
 */
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

// Load .env / .env.local into process.env.
loadEnvConfig(process.cwd());

import { Announcement } from "../../models/Announcement";

interface SeedAnnouncement {
  title: string;
  body: string;
  audience: "all" | "leads" | "admins";
  authorId: string;
  publishedToPublic: boolean;
}

// Placeholder author id (a real User id once auth/users land in Faz 2).
const AUTHOR_ID = "000000000000000000000000";

const SAMPLE_ANNOUNCEMENTS: SeedAnnouncement[] = [
  {
    title: "Spectraloop 2026 sezonuna başladı",
    body: "Yeni sezon hazırlıklarımız tüm hızıyla devam ediyor. Ekibimiz büyüyor!",
    audience: "all",
    authorId: AUTHOR_ID,
    publishedToPublic: true,
  },
  {
    title: "Yeni aracımızın tasarımı tamamlandı",
    body: "Aylardır üzerinde çalıştığımız aracın tasarım fazını bitirdik. Üretim başlıyor.",
    audience: "all",
    authorId: AUTHOR_ID,
    publishedToPublic: true,
  },
  {
    title: "Basında yer aldık",
    body: "Takımımız ulusal basında geniş yer buldu. Haberin tamamı için tıklayın.",
    audience: "all",
    authorId: AUTHOR_ID,
    publishedToPublic: true,
  },
  {
    // Panel-only — must NOT appear on the public endpoint.
    title: "Birim liderleri toplantısı (dahili)",
    body: "Perşembe 19:00'da tüm birim liderleriyle sezon planlaması toplantısı.",
    audience: "leads",
    authorId: AUTHOR_ID,
    publishedToPublic: false,
  },
  {
    // Draft — must NOT appear on the public endpoint.
    title: "Sponsorluk duyurusu (taslak)",
    body: "Yeni ana sponsorumuzu yakında açıklayacağız. Taslak — henüz yayında değil.",
    audience: "all",
    authorId: AUTHOR_ID,
    publishedToPublic: false,
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
  for (const announcement of SAMPLE_ANNOUNCEMENTS) {
    await Announcement.updateOne(
      { title: announcement.title },
      { $set: announcement },
      { upsert: true },
    );
    upserted += 1;
  }

  const publicCount = SAMPLE_ANNOUNCEMENTS.filter(
    (a) => a.publishedToPublic,
  ).length;
  console.log(
    `Seeded ${upserted} announcements (${publicCount} public, ` +
      `${upserted - publicCount} panel-only/draft).`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Announcement seed failed:", err);
  process.exitCode = 1;
});
