# Panel Applications API — `/api/panel/applications`

Panel-side management of **"Bize Katıl"** applications (review workflow), with
RBAC at the API layer (PROGRAM.md §11). Consumed by the panel applications view
(task 3.F1).

> Path pattern: panel APIs under **`/api/panel/*`**. The **public** submission
> endpoint **`POST /api/applications`** (1.B1) is separate and untouched —
> applications are **created** there and **managed** here.

Shared types: `Application`, `ApplicationStatus` from `@/types`.
Guards: `requireApiRole` from `@/lib/auth/guard`.

---

## RBAC matrix (role × operation)

| Operation                      | admin | lead | member  |
| ------------------------------ | ----- | ---- | ------- |
| `GET` list / `GET [id]` (read) | ✅    | ✅   | ✗ (403) |
| `PATCH [id]` (status update)   | ✅    | ✅   | ✗ (403) |
| `DELETE [id]`                  | ✅    | ✗    | ✗ (403) |

- **member access (decision):** applications contain applicant **PII** (name,
  email, message), so **members cannot see or manage them** — admin + lead only.
- **delete (decision):** `DELETE` is **admin-only** (spam cleanup). A lead can
  triage via status (e.g. `rejected`) but cannot hard-delete.
- No session → **401**. Wrong role → **403**.

---

## Status workflow

`status` values (`ApplicationStatus` from `@/types`):

```
new  →  reviewing  →  accepted
                   ↘  rejected
```

| Value       | Meaning                                    |
| ----------- | ------------------------------------------ |
| `new`       | just submitted (public form default, 1.B1) |
| `reviewing` | under review by the team                   |
| `accepted`  | approved                                   |
| `rejected`  | declined                                   |

Transitions are not enforced server-side (any valid value may be set); the UI
drives the flow.

---

## Endpoints

### `GET /api/panel/applications` — list (admin, lead)

Optional query filters (AND-combined):

| Query    | Matches                                                   |
| -------- | --------------------------------------------------------- |
| `status` | `status` equals (valid `ApplicationStatus`, else 400)     |
| `q`      | case-insensitive search on `name`, `email`, `subteamPref` |

**200** → `{ ok: true, applications: Application[] }` (newest first).

### `GET /api/panel/applications/[id]` — read one (admin, lead)

**200** → `{ ok: true, application: Application }`

### `PATCH /api/panel/applications/[id]` — update status (admin, lead)

Body:

| Field    | Type                | Required | Notes                                   |
| -------- | ------------------- | -------- | --------------------------------------- |
| `status` | `ApplicationStatus` | yes      | `new`/`reviewing`/`accepted`/`rejected` |

**Content is read-only.** Only `status` is written; any other field in the body
(`name`, `email`, `subteamPref`, `message`) is **ignored** — the application
content submitted by the applicant is never mutated in the panel.

**200** → `{ ok: true, application: Application }`

### `DELETE /api/panel/applications/[id]` — delete (admin only)

**200** → `{ ok: true, id: string }`

---

## Error responses

Consistent `{ ok:false, error }` shape:

| Status | When                                                          |
| ------ | ------------------------------------------------------------- |
| 400    | invalid JSON / invalid status / bad filter / malformed `[id]` |
| 401    | no session                                                    |
| 403    | insufficient role (member on any; lead on DELETE)             |
| 404    | `[id]` not found                                              |
| 500    | database error (generic message)                              |

---

## Open items

- **Validation is authoritative (zod).** The status-update body is validated by
  `panelApplicationStatusSchema` from `@/lib/validation` (Security & QA, 3.Q0),
  bound in 3.B6 — `status` only (application content stays read-only). Who may
  review stays in the route/guard.
- **Response summary (for Frontend 3.F1):** success → `{ ok:true, ... }` with
  `applications` (list) / `application` (single) / `id` (delete); failure →
  `{ ok:false, error }`.
