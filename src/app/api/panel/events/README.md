# Panel Events API — `/api/panel/events`

Panel-side CRUD for calendar events / deadlines, with RBAC at the API layer
(PROGRAM.md §11). Consumed by the panel calendar (task 2.F5).

> Path pattern: panel APIs under **`/api/panel/*`**. Events are **not
> subteam-scoped** — reads are open to any authenticated user; writes require
> admin/lead (no per-subteam IDOR check).

Shared types: `Event`, `EventType` from `@/types`.
Guards: `requireApiSession`, `requireApiRole` from `@/lib/auth/guard`.

---

## RBAC matrix (role × operation)

| Operation                      | admin | lead | member  |
| ------------------------------ | ----- | ---- | ------- |
| `GET` list / `GET [id]` (read) | all   | all  | all     |
| `POST` create                  | ✅    | ✅   | ✗ (403) |
| `PATCH` update                 | ✅    | ✅   | ✗ (403) |
| `DELETE`                       | ✅    | ✅   | ✗ (403) |

- No session → **401**. member write → **403**.

---

## Endpoints

### `GET /api/panel/events` — list (any session)

Query filter: `type` (valid `EventType`, else 400).

**200** → `{ ok: true, events: Event[] }` (sorted by `date` ascending — soonest
first).

### `POST /api/panel/events` — create (admin, lead)

Body:

| Field         | Type                                                                | Required | Notes             |
| ------------- | ------------------------------------------------------------------- | -------- | ----------------- |
| `title`       | `string`                                                            | yes      | 1–200             |
| `date`        | ISO date `string`                                                   | yes      | parsed to a date  |
| `type`        | `"meeting" \| "deadline" \| "competition" \| "workshop" \| "other"` | no       | default `"other"` |
| `description` | `string`                                                            | no       | ≤10000            |

**201** → `{ ok: true, event: Event }`

### `GET /api/panel/events/[id]` — read one (any session)

**200** → `{ ok: true, event: Event }`

### `PATCH /api/panel/events/[id]` — update (admin, lead)

Body: subset of `title`, `date`, `type`, `description` (at least one).

**200** → `{ ok: true, event: Event }`

### `DELETE /api/panel/events/[id]` — delete (admin, lead)

**200** → `{ ok: true, id: string }`

---

## Error responses

| Status | When                                                             |
| ------ | ---------------------------------------------------------------- |
| 400    | invalid JSON / validation / bad `type` filter / malformed `[id]` |
| 401    | no session                                                       |
| 403    | member attempting a write                                        |
| 404    | `[id]` not found                                                 |
| 500    | database error (generic message)                                 |

---

## Open items

- **Validation is interim (hand-rolled)** in `shared.ts`, marked `TODO(2.Q)` —
  needs a panel-event zod schema from Security & QA (`@/lib/validation`, 2.Q0).
- **Response summary (for Frontend 2.F5):** success → `{ ok:true, ... }` with
  `events` (list) / `event` (single) / `id` (delete); failure →
  `{ ok:false, error }`.
