import { randomUUID } from "node:crypto";

import { z } from "zod";

import {
  UPLOAD_ALLOWED_CONTENT_TYPES,
  UPLOAD_KEY_PREFIX,
  UPLOAD_MAX_BYTES,
} from "@/lib/utils/r2";

/**
 * Authoritative validation for the panel upload request (task 3.S1).
 *
 * ARCHITECTURE: the file is uploaded directly client→R2 via a presigned PUT, so
 * the server NEVER sees the bytes — magic-byte sniffing at request time is
 * impossible. Defence therefore lives in the request contract + key hygiene:
 *   1. contentType must be in the shared allow-list (@/lib/utils/r2) — one
 *      source of truth, imported here (no drift).
 *   2. size must be >0, an integer, within the global cap AND a per-type cap.
 *   3. fileName is strictly validated (no path separators / traversal / control
 *      chars / dangerous or double extensions) and additionally sanitised when
 *      the storage key is built — the client name never dictates the path.
 *
 * NOTE: a presigned PUT cannot enforce a *hard* byte cap (only the declared
 * `size` is checked). See the 3.S1 audit report for the presigned-POST
 * recommendation and the content-type-spoofing / bucket-exposure findings.
 *
 * Backend binds `uploadRequestSchema` + `buildUploadKey` in task 3.B6.
 */

/** Stricter per-type size caps (bytes). Images are capped below the global max. */
const IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** The maximum allowed size for a given (already allow-listed) content type. */
export function maxBytesForContentType(contentType: string): number {
  return IMAGE_CONTENT_TYPES.has(contentType)
    ? IMAGE_MAX_BYTES
    : UPLOAD_MAX_BYTES;
}

/**
 * File-name extensions that must never be accepted, even as an inner segment of
 * a double extension (e.g. "invoice.php.pdf"). The declared content type is
 * separately restricted, but rejecting these names is defence in depth against
 * a mis-served / publicly-listed object.
 */
const DANGEROUS_EXTENSIONS = new Set([
  "exe",
  "msi",
  "msp",
  "dll",
  "so",
  "dylib",
  "com",
  "cpl",
  "scr",
  "pif",
  "gadget",
  "bat",
  "cmd",
  "sh",
  "bash",
  "zsh",
  "ps1",
  "psm1",
  "vbs",
  "vbe",
  "wsf",
  "wsh",
  "hta",
  "reg",
  "lnk",
  "jar",
  "app",
  "dmg",
  "pkg",
  "deb",
  "rpm",
  "js",
  "mjs",
  "cjs",
  "jse",
  "php",
  "php3",
  "php4",
  "php5",
  "phtml",
  "phar",
  "py",
  "pyc",
  "rb",
  "pl",
  "cgi",
  "asp",
  "aspx",
  "jsp",
  "jspx",
  "htaccess",
  "html",
  "htm",
  "xhtml",
  "shtml",
  "svg",
]);

// Control characters (incl. NUL) and DEL — never valid in a file name.
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/** Validate a client-supplied file name, adding issues for anything unsafe. */
function checkFileName(name: string, ctx: z.RefinementCtx): void {
  const trimmed = name.trim();
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });

  if (trimmed.length === 0) return fail("fileName is required.");
  if (trimmed.length > 255) return fail("fileName is too long.");
  if (CONTROL_CHARS.test(trimmed))
    return fail("fileName contains invalid characters.");
  if (/[\\/]/.test(trimmed))
    return fail("fileName must not contain path separators.");
  if (trimmed === "." || trimmed === "..") return fail("fileName is invalid.");
  if (trimmed.startsWith("."))
    return fail("fileName must not start with a dot.");

  // Reject a dangerous extension in ANY segment (catches double extensions).
  const segments = trimmed.toLowerCase().split(".");
  if (segments.length > 1) {
    const exts = segments.slice(1);
    if (exts.some((e) => DANGEROUS_EXTENSIONS.has(e))) {
      return fail("fileName has a disallowed file extension.");
    }
  }
}

export const uploadRequestSchema = z
  .object({
    fileName: z
      .string()
      .superRefine((v, ctx) => checkFileName(v, ctx))
      .transform((v) => v.trim()),
    contentType: z.enum(UPLOAD_ALLOWED_CONTENT_TYPES),
    size: z
      .number()
      .int("size must be an integer number of bytes.")
      .positive("size must be greater than 0.")
      .max(UPLOAD_MAX_BYTES, `size must not exceed ${UPLOAD_MAX_BYTES} bytes.`),
  })
  .superRefine((data, ctx) => {
    const cap = maxBytesForContentType(data.contentType);
    if (data.size > cap) {
      ctx.addIssue({
        code: "custom",
        path: ["size"],
        message: `size for ${data.contentType} must not exceed ${cap} bytes.`,
      });
    }
  });

/** Validated upload request (the shape Backend acts on in 3.B6). */
export type UploadRequest = z.infer<typeof uploadRequestSchema>;

/* -------------------------------------------------------------------------- */
/* Key hygiene — the authoritative sanitiser + key builder (Backend 3.B6).     */
/* -------------------------------------------------------------------------- */

/**
 * Reduce a client file name to a safe key component. Even though
 * `uploadRequestSchema` already rejects unsafe names, this is applied when
 * building the storage key as belt-and-braces:
 *  - strips any directory portion ("../", "a/b", "C:\x") — path-traversal defence
 *  - restricts to `[a-zA-Z0-9._-]`
 *  - collapses runs of separators and strips leading/trailing dots & dashes
 *  - caps length and guarantees a non-empty result
 */
export function sanitizeUploadFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/\.+/g, ".")
    .replace(/^[.\-]+/, "")
    .replace(/[.\-]+$/, "")
    .slice(0, 100);
  return cleaned.length > 0 ? cleaned : "file";
}

/**
 * Build the R2 object key `documents/<uuid>-<sanitizedName>`. The `<uuid>` makes
 * the key collision-resistant AND unguessable (blocks enumeration/IDOR of the
 * public URL). `uuid` is injectable for tests; defaults to a random v4.
 */
export function buildUploadKey(
  fileName: string,
  uuid: string = randomUUID(),
): string {
  return `${UPLOAD_KEY_PREFIX}/${uuid}-${sanitizeUploadFileName(fileName)}`;
}
