import { requireApiRole } from "@/lib/auth/guard";
import {
  UPLOAD_ALLOWED_CONTENT_TYPES,
  UPLOAD_MAX_BYTES,
  createPresignedUpload,
  isAllowedContentType,
  type UploadContentType,
} from "@/lib/utils/r2";

/**
 * Panel uploads — /api/panel/uploads
 *
 * POST — issue a short-lived presigned PUT URL so the client uploads a file
 *        DIRECTLY to Cloudflare R2 (never through this server). The returned
 *        `fileUrl` is then stored on a document (3.B5 / 3.F4).
 *
 * RBAC: admin + lead (the roles that may add documents). member → 403.
 *
 * Baseline validation only (content-type allow-list + declared-size cap).
 * TODO(3.S1): Security & QA hardens this — magic-byte sniffing, per-type caps,
 * and a hard server-enforced size limit (presigned POST + content-length-range).
 * The allow-list + size constant live in `@/lib/utils/r2` as the shared source.
 *
 * See ./README.md for the full flow + response contract.
 */

interface UploadRequest {
  fileName: string;
  contentType: UploadContentType;
  size: number;
}

function validate(
  body: unknown,
): { ok: true; data: UploadRequest } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const { fileName, contentType, size } = body as Record<string, unknown>;

  if (typeof fileName !== "string" || fileName.trim().length === 0) {
    return { ok: false, error: "fileName is required." };
  }
  if (fileName.length > 255) {
    return { ok: false, error: "fileName is too long." };
  }
  if (typeof contentType !== "string" || !isAllowedContentType(contentType)) {
    return {
      ok: false,
      error: `Unsupported contentType. Allowed: ${UPLOAD_ALLOWED_CONTENT_TYPES.join(", ")}.`,
    };
  }
  if (
    typeof size !== "number" ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > UPLOAD_MAX_BYTES
  ) {
    return {
      ok: false,
      error: `size must be a number between 1 and ${UPLOAD_MAX_BYTES} bytes.`,
    };
  }

  return { ok: true, data: { fileName, contentType, size } };
}

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

  const parsed = validate(body);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const result = await createPresignedUpload({
      fileName: parsed.data.fileName,
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
