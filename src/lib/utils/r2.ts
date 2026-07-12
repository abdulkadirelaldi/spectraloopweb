import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 (S3-compatible) storage helper — presigned upload URLs.
 *
 * The panel uploads endpoint (3.B4) issues a short-lived presigned PUT URL so the
 * client uploads DIRECTLY to R2 (never through this server — avoids serverless
 * body-size limits). The resulting object's public URL is then stored as a
 * document's `fileUrl`.
 *
 * Env (read from process.env):
 * - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET (required)
 * - R2_PUBLIC_BASE_URL (public bucket / CDN base, e.g. https://cdn.example.com or
 *   https://pub-xxxx.r2.dev) — used to build the final `fileUrl`. See README.
 */

/* -------------------------------------------------------------------------- */
/* Upload constraints — the shared source of truth.                            */
/* Security & QA's authoritative upload validation (`@/lib/validation`, 3.S1)   */
/* IMPORTS these constants (allow-list, size cap, key prefix), so both the      */
/* schema and this R2 client agree. Per-type size caps + strict fileName rules  */
/* live in the schema; the presigned-POST/content-length-range recommendation   */
/* is tracked in the 3.S1 audit.                                                */
/* -------------------------------------------------------------------------- */

/** Allowed upload MIME types (baseline). */
export const UPLOAD_ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export type UploadContentType = (typeof UPLOAD_ALLOWED_CONTENT_TYPES)[number];

/** Max upload size (baseline: 25 MB). */
export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

/** Presigned URL time-to-live (seconds). */
export const UPLOAD_URL_TTL_SECONDS = 300; // 5 minutes

/** Key prefix under which document objects are stored. */
export const UPLOAD_KEY_PREFIX = "documents";

/* -------------------------------------------------------------------------- */
/* R2 client (cached).                                                         */
/* -------------------------------------------------------------------------- */

interface R2Env {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

function readEnv(): R2Env {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  const missing = [
    ["R2_ACCOUNT_ID", accountId],
    ["R2_ACCESS_KEY_ID", accessKeyId],
    ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["R2_BUCKET", bucket],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    // Names only — never echo secret values.
    throw new Error(`Missing R2 env: ${missing.join(", ")}.`);
  }

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
  };
}

// Cache the client across hot-reloads / invocations (see db/connect.ts pattern).
const globalForR2 = globalThis as typeof globalThis & { _r2Client?: S3Client };

function getR2Client(env: R2Env): S3Client {
  if (globalForR2._r2Client) return globalForR2._r2Client;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
  globalForR2._r2Client = client;
  return client;
}

/* -------------------------------------------------------------------------- */
/* Presigning.                                                                 */
/* -------------------------------------------------------------------------- */
/* NOTE: file-name sanitisation + object-key building are OWNED by Security &  */
/* QA in `@/lib/validation` (`sanitizeUploadFileName` / `buildUploadKey`, task  */
/* 3.S1) — the authoritative source. The uploads route builds the key there    */
/* and passes it to `createPresignedUpload` below.                             */

/** Build the public `fileUrl` for a stored object key. */
export function publicFileUrl(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (base) return `${base.replace(/\/$/, "")}/${key}`;
  // Fallback: the S3 API endpoint is NOT public — set R2_PUBLIC_BASE_URL for
  // publicly reachable URLs. Returned so callers still get a stable reference.
  const env = readEnv();
  return `https://${env.accountId}.r2.cloudflarestorage.com/${env.bucket}/${key}`;
}

export interface PresignedUpload {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Create a presigned PUT URL for uploading one object to R2, under the given
 * pre-built `key` (produced by `buildUploadKey` from `@/lib/validation`).
 *
 * The `ContentType` is baked into the signature, so the client MUST send the
 * same `Content-Type` header on its PUT. NOTE: a presigned PUT cannot hard-cap
 * the uploaded byte size — the declared size is validated by the upload schema
 * before issuing the URL, but a true server-enforced cap needs a presigned POST
 * with `content-length-range` (see the 3.S1 audit).
 */
export async function createPresignedUpload(params: {
  key: string;
  contentType: UploadContentType;
}): Promise<PresignedUpload> {
  const env = readEnv();
  const client = getR2Client(env);

  const command = new PutObjectCommand({
    Bucket: env.bucket,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  });

  return {
    uploadUrl,
    fileUrl: publicFileUrl(params.key),
    key: params.key,
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  };
}
