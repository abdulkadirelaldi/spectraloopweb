import { requireApiRole } from "@/lib/auth/guard";
import { createPresignedUpload } from "@/lib/utils/r2";
import {
  uploadRequestSchema,
  buildUploadKey,
  firstErrorMessage,
} from "@/lib/validation";

/**
 * Panel uploads — /api/panel/uploads
 *
 * POST — issue a short-lived presigned PUT URL so the client uploads a file
 *        DIRECTLY to Cloudflare R2 (never through this server). The returned
 *        `fileUrl` is then stored on a document (3.B5 / 3.F4).
 *
 * RBAC: admin + lead (the roles that may add documents). member → 403.
 *
 * Validation is authoritative (Security & QA, task 3.S1): `uploadRequestSchema`
 * checks contentType (shared allow-list), per-type + global size caps, and a
 * strict fileName (no path separators / traversal / dangerous extensions);
 * `buildUploadKey` produces the safe, unguessable object key. The upload
 * allow-list + size constants live in `@/lib/utils/r2` — the single source both
 * this route (via R2) and the schema import.
 *
 * See ./README.md for the full flow + response contract.
 */

export async function POST(request: Request): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = uploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  // Authoritative key building (path-traversal-safe, uuid-prefixed).
  const key = buildUploadKey(parsed.data.fileName);

  try {
    const result = await createPresignedUpload({
      key,
      contentType: parsed.data.contentType,
    });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    // Log server-side (may include missing-env names, never secret values);
    // return a generic message to the client.
    console.error("[panel/uploads] Failed to presign:", err);
    return Response.json(
      { ok: false, error: "Could not create upload URL." },
      { status: 500 },
    );
  }
}
