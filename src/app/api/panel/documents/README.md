# Panel Documents API — `/api/panel/documents`

Panel-side CRUD for documents (**metadata only**), **subteam-scoped** with RBAC
at the API layer (PROGRAM.md §11). Consumed by the panel document archive
(task 2.F5).

> Path pattern: panel APIs under **`/api/panel/*`** (same as 2.B2/2.B3).
> **`fileUrl` is a plain string** (a pre-uploaded / external URL). **Real file
> upload — Cloudflare R2 presigned URLs + MIME/size validation — is deferred to
> Faz 3 (`TODO(Faz3)`).** This endpoint does not upload anything.

Shared types: `Document`, `DocumentCategory` from `@/types`.
Guards: `requireApiSession`, `requireApiRole` from `@/lib/auth/guard`.

---

## RBAC matrix (role × operation)

| Operation                      | admin       | lead                  | member  |
| ------------------------------ | ----------- | --------------------- | ------- |
| `GET` list / `GET [id]` (read) | all         | all                   | all     |
| `POST` create                  | any subteam | own subteam only      | ✗ (403) |
| `PATCH` update                 | any         | own-subteam docs only | ✗ (403) |
| `DELETE`                       | any         | own-subteam docs only | ✗ (403) |

- No session → **401**. Insufficient role / out-of-scope lead → **403**.

---

## Endpoints

### `GET /api/panel/documents` — list (any session)

Query filters (AND): `subteam`, `category` (valid `DocumentCategory`, else 400).

**200** → `{ ok: true, documents: Document[] }` (newest first).

### `POST /api/panel/documents` — create (admin, lead)

Body:

| Field      | Type                                                        | Required                       | Notes                        |
| ---------- | ----------------------------------------------------------- | ------------------------------ | ---------------------------- |
| `title`    | `string`                                                    | yes                            | 1–200                        |
| `fileUrl`  | `string`                                                    | yes                            | valid **http(s)** URL, ≤2048 |
| `category` | `"cad" \| "report" \| "presentation" \| "media" \| "other"` | no                             | default `"other"`            |
| `subteam`  | `string`                                                    | admin: optional / lead: pinned | lead → own subteam           |

`uploadedBy` is **server-assigned** from the session. A lead is pinned to their
own subteam; targeting another → **403**.

**201** → `{ ok: true, document: Document }`

### `GET /api/panel/documents/[id]` — read one (any session)

**200** → `{ ok: true, document: Document }`

### `PATCH /api/panel/documents/[id]` — update (admin, lead-own-subteam)

Body: subset of `title`, `fileUrl`, `category`, `subteam` (at least one). A lead
cannot move a document to another subteam.

**200** → `{ ok: true, document: Document }`

### `DELETE /api/panel/documents/[id]` — delete (admin, lead-own-subteam)

**200** → `{ ok: true, id: string }`

---

## IDOR rules

- A document's `subteam` is compared against `session.user.subteam` **server-side**
  before any lead write; a lead cannot escalate by sending another `subteam`.
- `uploadedBy` is never taken from the body.

---

## Error responses

| Status | When                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| 400    | invalid JSON / validation / bad `category` filter / bad `fileUrl` / malformed `[id]` |
| 401    | no session                                                                           |
| 403    | insufficient role / lead out-of-scope                                                |
| 404    | `[id]` not found                                                                     |
| 500    | database error (generic message)                                                     |

---

## Open items

- **File upload deferred to Faz 3** (`TODO(Faz3)` in `src/models/Document.ts` +
  `shared.ts`): presigned R2 URL issuance + MIME/size validation. For now only
  metadata (incl. an external `fileUrl`) is stored.
- **Validation is authoritative (zod).** The body is validated by
  `panelDocumentCreateSchema` / `panelDocumentUpdateSchema` from
  `@/lib/validation` (Security & QA, 2.Q0), bound in 2.B6. `fileUrl` is checked
  as an http(s) URL. Lead subteam pinning / IDOR stay in the route.
- **Response summary (for Frontend 2.F5):** success → `{ ok:true, ... }` with
  `documents` (list) / `document` (single) / `id` (delete); failure →
  `{ ok:false, error }`.
