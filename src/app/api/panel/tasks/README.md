# Panel Tasks API — `/api/panel/tasks`

Panel-side CRUD for tasks, **subteam-scoped** with RBAC enforced at the API layer
(PROGRAM.md §11). Consumed by the panel task board (task 2.F3).

> Path pattern: panel APIs live under **`/api/panel/*`** (same as 2.B2).

Shared types: `Task`, `TaskStatus` from `@/types`.
Guards: `requireApiSession`, `requireApiRole` from `@/lib/auth/guard`.

---

## RBAC matrix (role × operation)

| Operation                      | admin               | lead                     | member                                           |
| ------------------------------ | ------------------- | ------------------------ | ------------------------------------------------ |
| `GET` list / `GET [id]` (read) | all                 | all (reads everyone, §8) | all (reads everyone, §8)                         |
| `POST` create                  | any subteam         | own subteam only         | ✗ (403)                                          |
| `PATCH` update                 | any field, any task | own subteam tasks only   | **only `status`** of a task **assigned to them** |
| `DELETE`                       | any task            | own subteam tasks only   | ✗ (403)                                          |

- **Read policy (decision):** reads are **open to all authenticated users across
  all subteams**, per §8 ("lead reads everyone", "member reads everyone"). Scope
  the view with query filters instead of role-gating reads.
- No session → **401** `Unauthorized`. Authenticated but not allowed → **403**
  `Forbidden` (with a specific message).

---

## Endpoints

### `GET /api/panel/tasks` — list (any session)

Optional query filters (AND-combined):

| Query      | Matches                                                  |
| ---------- | -------------------------------------------------------- |
| `subteam`  | `subteam` equals                                         |
| `status`   | `status` equals (must be a valid `TaskStatus`, else 400) |
| `assignee` | `assigneeId` equals                                      |

**200** → `{ ok: true, tasks: Task[] }` (newest first).

### `POST /api/panel/tasks` — create (admin, lead)

Body:

| Field         | Type                                            | Required                       | Notes                         |
| ------------- | ----------------------------------------------- | ------------------------------ | ----------------------------- |
| `title`       | `string`                                        | yes                            | 1–200                         |
| `subteam`     | `string`                                        | admin: **yes** / lead: ignored | lead is pinned to own subteam |
| `description` | `string`                                        | no                             | ≤10000                        |
| `assigneeId`  | `string`                                        | no                             | User id                       |
| `status`      | `"todo" \| "in-progress" \| "review" \| "done"` | no                             | default `"todo"`              |
| `dueDate`     | ISO date `string`                               | no                             | parsed to a date              |

`createdBy` is **server-assigned** from the session. For a **lead**, `subteam` is
forced to their own subteam; targeting a different subteam → **403**. For an
**admin**, `subteam` is required.

**201** → `{ ok: true, task: Task }`

### `GET /api/panel/tasks/[id]` — read one (any session)

**200** → `{ ok: true, task: Task }`

### `PATCH /api/panel/tasks/[id]` — update (role-scoped)

Body: any subset of `title`, `description`, `subteam`, `assigneeId`, `status`,
`dueDate` (at least one).

- **admin** — any field.
- **lead** — only if the task is in their own subteam (else 403); cannot set
  `subteam` to a different value (else 403).
- **member** — the body must contain **only `status`**, and the task's
  `assigneeId` must equal the member's own id (else 403).

**200** → `{ ok: true, task: Task }`

### `DELETE /api/panel/tasks/[id]` — delete (admin, lead)

- **admin** — any task. **lead** — own subteam only (else 403). **member** — 403.

**200** → `{ ok: true, id: string }`

---

## IDOR rules (summary)

- The record's `subteam` / `assigneeId` are compared against
  `session.user.{subteam,id}` **server-side** before any write — the client
  cannot escalate by sending a different `subteam`/`assigneeId`/`createdBy`.
- `createdBy` is never taken from the body; `subteam` is forced for leads.
- Reads are intentionally open (§8), so a `404` before a role check leaks no
  secret (existence is not confidential).

---

## Error responses

Consistent `{ ok:false, error }` shape:

| Status | When                                                                                                      |
| ------ | --------------------------------------------------------------------------------------------------------- |
| 400    | invalid JSON, failed validation, bad `status` filter, malformed `[id]`, or admin create without `subteam` |
| 401    | no session                                                                                                |
| 403    | authenticated but not allowed (role / subteam / assignee)                                                 |
| 404    | `[id]` not found                                                                                          |
| 500    | database error (generic message)                                                                          |

---

## Open items

- **Validation is authoritative (zod).** The body is validated by
  `panelTaskCreateSchema` / `panelTaskUpdateSchema` from `@/lib/validation`
  (Security & QA, 2.Q0), bound in 2.B6. Validates shape only; subteam pinning,
  the member "status-only" rule, and IDOR stay in the route/guard. Unknown keys
  are stripped, so `createdBy` cannot be injected.
- **Response summary (for Frontend 2.F3):** success → `{ ok:true, ... }` with
  `tasks` (list) / `task` (single) / `id` (delete); failure → `{ ok:false, error }`.
