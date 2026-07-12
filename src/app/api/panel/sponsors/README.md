# Panel Sponsors API — `/api/panel/sponsors` (CMS)

Panel-side sponsor management — the **CMS backend** for the public sponsor strip.
RBAC at the API layer (PROGRAM.md §11). Consumed by the panel sponsors view
(task 3.F5).

> Path pattern: panel APIs under **`/api/panel/*`**. The **public** feed
> **`GET /api/sponsors`** (1.B3 — `active:true`, tier order, `revalidate=300`) is
> **untouched**; this endpoint manages what it serves.

Shared types: `Sponsor`, `SponsorTier` from `@/types`.
Guards: `requireApiSession`, `requireApiRole` from `@/lib/auth/guard`.

---

## RBAC matrix (role × operation)

| Operation                      | admin | lead    | member  |
| ------------------------------ | ----- | ------- | ------- |
| `GET` list / `GET [id]` (read) | ✅    | ✅      | ✅      |
| `POST` create                  | ✅    | ✗ (403) | ✗ (403) |
| `PATCH` update / publish       | ✅    | ✗ (403) | ✗ (403) |
| `DELETE`                       | ✅    | ✗ (403) | ✗ (403) |

- **Writes are admin-only (decision):** a sponsor is an **org-level brand asset**
  (public-facing credibility), so create/edit/publish/delete are restricted to
  admin. Any panel user may **read** the full list (incl. unpublished) to see
  what's in the pipeline.
- No session → **401**. Non-admin write → **403**.

---

## CMS publish model (`active`) + public reflection

- **`active` is the publish flag.** `active:true` → shown on the public strip;
  `active:false` → hidden (draft/retired). Toggle it via `PATCH { active }`.
- The **public feed** `GET /api/sponsors` returns only `active:true`, ordered
  gold → silver → bronze, cached with `revalidate=300`.
- **On-demand reflection:** after every panel mutation (create-if-active / update
  / delete) this API calls **`revalidatePath("/api/sponsors")`** (`next/cache`),
  invalidating the public feed's cache so changes surface on the next request —
  **without** waiting out the 5-minute ISR window. (The public route itself is
  not modified; time-based `revalidate=300` remains as the fallback.)
- Pages that render the strip refresh per their own ISR; the API data cache is
  the shared source that this endpoint purges.

---

## logoUrl / upload

`logoUrl` is a plain http(s) URL string. It can be produced by the **R2 upload
flow (3.B4)**: the client requests a presigned URL from `POST /api/panel/uploads`,
PUTs the logo to R2, then sends the returned `fileUrl` here as `logoUrl`. Using
an external URL directly is equally valid — this endpoint only stores the string.

---

## Endpoints

### `GET /api/panel/sponsors` — list (any session)

Query filters (AND): `tier` (valid `SponsorTier`, else 400), `active`
(`true`/`false`).

**200** → `{ ok: true, sponsors: Sponsor[] }` (newest first — **panel order**;
the public feed is tier-ordered).

### `POST /api/panel/sponsors` — create (admin)

Body:

| Field     | Type                             | Required | Notes                      |
| --------- | -------------------------------- | -------- | -------------------------- |
| `name`    | `string`                         | yes      | 1–200                      |
| `logoUrl` | `string`                         | yes      | valid **http(s)** URL      |
| `tier`    | `"gold" \| "silver" \| "bronze"` | yes      |                            |
| `website` | `string`                         | no       | valid http(s) URL          |
| `active`  | `boolean`                        | no       | default `true` (published) |

**201** → `{ ok: true, sponsor: Sponsor }`

### `GET /api/panel/sponsors/[id]` — read one (any session)

**200** → `{ ok: true, sponsor: Sponsor }`

### `PATCH /api/panel/sponsors/[id]` — update / publish toggle (admin)

Body: subset of `name`, `logoUrl`, `tier`, `website`, `active` (at least one).
Set `{ "active": true|false }` to publish/unpublish.

**200** → `{ ok: true, sponsor: Sponsor }`

### `DELETE /api/panel/sponsors/[id]` — delete (admin)

**200** → `{ ok: true, id: string }`

---

## Error responses

| Status | When                                                                       |
| ------ | -------------------------------------------------------------------------- |
| 400    | invalid JSON / validation / bad `tier` filter / bad URL / malformed `[id]` |
| 401    | no session                                                                 |
| 403    | non-admin write                                                            |
| 404    | `[id]` not found                                                           |
| 500    | database error (generic message)                                           |

---

## Open items

- **Validation is authoritative (zod).** The body is validated by
  `panelSponsorCreateSchema` / `panelSponsorUpdateSchema` from `@/lib/validation`
  (Security & QA, 3.Q0), bound in 3.B6. Shape only; the admin-only publish
  (`active`) authority stays in the route/guard.
- **Response summary (for Frontend 3.F5):** success → `{ ok:true, ... }` with
  `sponsors` (list) / `sponsor` (single) / `id` (delete); failure →
  `{ ok:false, error }`.
