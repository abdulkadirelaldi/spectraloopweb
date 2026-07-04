# Panel Announcements API — `/api/panel/announcements`

Panel-side CRUD for announcements, protected by RBAC at the **API layer**
(PROGRAM.md §11: role checks live in the API, not just the UI). Consumed by the
panel UI (task 2.F2).

> **Path pattern:** panel write/admin APIs live under **`/api/panel/*`**, kept
> separate from public read APIs. The public read endpoint **`/api/announcements`**
> (GET, only `publishedToPublic: true`) is unchanged and unrelated to these.

Shared types: `Announcement`, `AnnouncementAudience` from `@/types`.
Guards: `requireApiSession`, `requireApiRole` from `@/lib/auth/guard`.

---

## RBAC matrix

| Method + path                          | Who                               | Notes                            |
| -------------------------------------- | --------------------------------- | -------------------------------- |
| `GET /api/panel/announcements`         | any session (member, lead, admin) | lists **all** (no public filter) |
| `GET /api/panel/announcements/[id]`    | any session (member+)             | read one                         |
| `POST /api/panel/announcements`        | **admin, lead**                   | create                           |
| `PATCH /api/panel/announcements/[id]`  | **admin, lead**                   | update fields                    |
| `DELETE /api/panel/announcements/[id]` | **admin, lead**                   | delete                           |

- **No session → `401 { ok:false, error:"Unauthorized" }`** (checked before any
  body parsing or id lookup).
- **Authenticated but wrong role → `403 { ok:false, error:"Forbidden" }`.**

---

## Endpoints

### `GET /api/panel/announcements`

List all announcements, newest first (no `publishedToPublic` filter — panel sees
drafts + panel-only too).

**200** → `{ ok: true, announcements: Announcement[] }`

### `POST /api/panel/announcements` — create (admin, lead)

Body:

| Field               | Type                           | Required | Notes                   |
| ------------------- | ------------------------------ | -------- | ----------------------- |
| `title`             | `string`                       | yes      | 1–200 chars             |
| `body`              | `string`                       | yes      | 1–10000 chars           |
| `audience`          | `"all" \| "leads" \| "admins"` | no       | default `"all"`         |
| `publishedToPublic` | `boolean`                      | no       | default `false` (draft) |

`authorId` is **server-assigned** from the session — never read from the body.

**201** → `{ ok: true, announcement: Announcement }`

### `GET /api/panel/announcements/[id]` — read one (member+)

**200** → `{ ok: true, announcement: Announcement }`

### `PATCH /api/panel/announcements/[id]` — update (admin, lead)

Body: any subset of `title`, `body`, `audience`, `publishedToPublic` (at least
one). `authorId` cannot be changed.

**200** → `{ ok: true, announcement: Announcement }`

### `DELETE /api/panel/announcements/[id]` — delete (admin, lead)

**200** → `{ ok: true, id: string }`

---

## Error responses

Consistent `{ ok:false, error }` shape (Faz 1 convention):

| Status | When                                                  |
| ------ | ----------------------------------------------------- |
| 400    | invalid JSON, failed validation, or malformed `[id]`  |
| 401    | no session                                            |
| 403    | authenticated but insufficient role                   |
| 404    | `[id]` not found                                      |
| 500    | database error (generic message; no internals leaked) |

---

## Decisions & open items

- **Validation is interim (hand-rolled).** `title`/`body` required + length caps,
  `audience` enum, `publishedToPublic` boolean. Marked `TODO(2.Q)` in
  `shared.ts`. **A panel-announcement zod schema is needed from Security & QA**
  (in `@/lib/validation`), to be bound the same way public forms bind
  `applicationSchema` / `contactSchema` (cf. task 1.B5).
- **IDOR / lead scope (deferred).** Currently **both admin and lead can
  update/delete any announcement.** PROGRAM.md §8 grants leads CRUD over _their
  own subteam's_ content, so a stricter rule (a lead may only modify
  announcements they authored / for their subteam) is a candidate refinement —
  deferred pending product confirmation. When added, PATCH/DELETE would return
  `403` for a lead acting outside their scope; `GET` (read) stays open to all.
- **Response summary (for Frontend 2.F2):** success → `{ ok:true, ... }` with
  `announcement` (single) or `announcements` (list) or `id` (delete); failure →
  `{ ok:false, error }` with the status codes above.
