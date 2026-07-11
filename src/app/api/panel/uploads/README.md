# Panel Uploads API — `/api/panel/uploads`

Issues a short-lived **presigned PUT URL** so the client uploads a file
**directly to Cloudflare R2** (S3-compatible). The stored object's public URL is
then used as a document's `fileUrl` (3.B5 / 3.F4). Consumed by the panel document
upload UI (task 3.F4).

> Path pattern: panel APIs under **`/api/panel/*`**.
> Guards: `requireApiRole` from `@/lib/auth/guard`. R2 helper: `@/lib/utils/r2`.

---

## Why presigned (decision)

The file is **not** streamed through this server — the client PUTs it straight to
R2 using the presigned URL. This avoids serverless request-body size limits and
keeps large uploads off the app server. The server only signs a scoped, expiring
URL.

## Flow (for Frontend 3.F4)

```
1. POST /api/panel/uploads  { fileName, contentType, size }
      → { ok, uploadUrl, fileUrl, key, expiresIn }

2. PUT <uploadUrl>          (directly to R2, within `expiresIn` seconds)
      headers: { "Content-Type": <the SAME contentType sent in step 1> }
      body:    <the raw file bytes>
      → 200 from R2 on success

3. Save `fileUrl` on the document:
      POST /api/panel/documents  { title, fileUrl, category, ... }
```

**Important:** the `Content-Type` header on the step-2 PUT **must exactly match**
the `contentType` sent in step 1 — it is baked into the signature, or R2 rejects
the upload. Do not add other signed headers.

---

## RBAC

| Operation | admin | lead | member  |
| --------- | ----- | ---- | ------- |
| `POST`    | ✅    | ✅   | ✗ (403) |

Only roles that may add documents can request an upload URL. No session → **401**.

---

## `POST /api/panel/uploads`

Body:

| Field         | Type     | Required | Notes                                   |
| ------------- | -------- | -------- | --------------------------------------- |
| `fileName`    | `string` | yes      | ≤255; sanitized server-side (see below) |
| `contentType` | `string` | yes      | must be in the allow-list (else 400)    |
| `size`        | `number` | yes      | 1 … `UPLOAD_MAX_BYTES` bytes (else 400) |

**200** →

```json
{
  "ok": true,
  "uploadUrl": "https://<account>.r2.cloudflarestorage.com/<bucket>/documents/<uuid>-<name>?X-Amz-...",
  "fileUrl": "https://cdn.example.com/documents/<uuid>-<name>",
  "key": "documents/<uuid>-<name>",
  "expiresIn": 300
}
```

- `uploadUrl` — presigned PUT target (TTL `UPLOAD_URL_TTL_SECONDS` = 300s).
- `fileUrl` — the object's public URL to persist on the document.
- `key` — the R2 object key.

---

## Security constants — shared source (for QA 3.S1)

Baseline limits live in **`@/lib/utils/r2`** as exported constants so QA /
validation share one source of truth:

| Constant                       | Baseline value                                           |
| ------------------------------ | -------------------------------------------------------- |
| `UPLOAD_ALLOWED_CONTENT_TYPES` | pdf, png/jpeg/webp, zip, msword/docx, xls/xlsx, ppt/pptx |
| `UPLOAD_MAX_BYTES`             | `25 * 1024 * 1024` (25 MB)                               |
| `UPLOAD_URL_TTL_SECONDS`       | `300`                                                    |
| `UPLOAD_KEY_PREFIX`            | `"documents"`                                            |

`isAllowedContentType(ct)` is the shared allow-list check.

### `TODO(3.S1)` — Security & QA hardening

- **Hard size cap:** a presigned **PUT** cannot enforce a max byte size (only the
  _declared_ `size` is validated here). For a server-enforced cap, switch to a
  presigned **POST** with a `content-length-range` policy.
- Tighten the allow-list, add per-type size caps, and consider **magic-byte
  sniffing** (content-type header is client-declared and spoofable).
- Optionally scan objects post-upload.

### Key sanitization

- The object key is `documents/<uuid>-<sanitizedName>` — `<uuid>` from
  `crypto.randomUUID()`.
- `fileName` is sanitized (`sanitizeFileName`): path components stripped
  (path-traversal defence), reduced to `[a-zA-Z0-9._-]`, length-capped. The
  client name never dictates the storage path.

---

## Environment

| Key                    | Used for                  | Required?                        |
| ---------------------- | ------------------------- | -------------------------------- |
| `R2_ACCOUNT_ID`        | R2 endpoint               | yes (500 if unset)               |
| `R2_ACCESS_KEY_ID`     | R2 credentials            | yes                              |
| `R2_SECRET_ACCESS_KEY` | R2 credentials            | yes                              |
| `R2_BUCKET`            | target bucket             | yes                              |
| `R2_PUBLIC_BASE_URL`   | public base for `fileUrl` | **new** — recommended (see note) |

**`R2_PUBLIC_BASE_URL` (new key):** the public bucket / CDN base (e.g.
`https://pub-xxxx.r2.dev` or a custom domain `https://cdn.example.com`). Used to
build `fileUrl`. If unset, `fileUrl` falls back to the S3 API endpoint, which is
**not publicly reachable** — set this for working public links. It should be added
to `.env.example` (owned by Security & QA).

---

## Error responses

| Status | When                                                                      |
| ------ | ------------------------------------------------------------------------- |
| 400    | invalid JSON / missing `fileName` / disallowed `contentType` / bad `size` |
| 401    | no session                                                                |
| 403    | member (not admin/lead)                                                   |
| 500    | R2 env missing or presign failed (generic message; no secret leak)        |
