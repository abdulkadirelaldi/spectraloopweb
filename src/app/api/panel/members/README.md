# Panel Members API — `/api/panel/members`

Member directory (read) + role-based member management (admin CRUD), enforced at
the API layer (PROGRAM.md §11). **Security-critical** (QA 2.Q1). Consumed by the
panel member directory (task 2.F4).

> Path pattern: panel APIs under **`/api/panel/*`** (same as 2.B2/2.B3).

Shared types: `User`, `Role` from `@/types`.
Guards: `requireApiSession`, `requireApiRole` from `@/lib/auth/guard`.
Password hashing: `hashPassword` from `@/lib/utils/password`.

---

## RBAC matrix (role × operation)

| Operation       | admin                      | lead                                        | member         |
| --------------- | -------------------------- | ------------------------------------------- | -------------- |
| `GET` directory | all (with email)           | all (with email)                            | all (no email) |
| `POST` create   | ✅ (incl. role assignment) | ✗ (403)                                     | ✗ (403)        |
| `PATCH` update  | any field + password reset | `name`/`photoUrl` of **own-subteam** member | ✗ (403)        |
| `DELETE` (soft) | ✅                         | ✗ (403)                                     | ✗ (403)        |

---

## Field-visibility policy (decision)

The `GET` projection is a **safe allow-list** — `passwordHash` is **never**
returned (schema `select:false` **and** `toMember()` builds from an explicit
allow-list — defence in depth).

| Field                                                              | member sees | lead / admin see |
| ------------------------------------------------------------------ | ----------- | ---------------- |
| `id`, `name`, `role`, `subteam`, `photoUrl`, `active`, `createdAt` | ✅          | ✅               |
| `email`                                                            | ❌ (hidden) | ✅               |

**Decision:** `email` is treated as PII and shown only to **admin + lead**;
`member` viewers get the directory without emails. (Relaxable later via chief.)

---

## Privilege-escalation & safety rules

- **Role assignment is admin-only.** `POST` (which assigns a role) and any
  `role` change via `PATCH` require admin. A **lead cannot** change `role`,
  `active`, `email`, `subteam`, or `password` — attempting any of these → **403**.
- **(De)activation is admin-only** (`active` via PATCH, or `DELETE`).
- **Last-admin guard.** The API refuses to demote or deactivate the **last active
  admin** (via PATCH role/active or DELETE) → **403**. This prevents locking
  everyone out of the panel (incl. an admin self-lockout when they are the last).
- **Passwords** are always hashed with bcrypt (`hashPassword`); a plaintext
  password is **never stored or logged**. Password reset is admin-only (PATCH
  `password`).
- **Lead IDOR:** a lead may only edit members whose `subteam` equals the lead's
  own subteam.

---

## Endpoints

### `GET /api/panel/members` — directory (any session)

Optional query filters (AND-combined):

| Query     | Matches                                                        |
| --------- | -------------------------------------------------------------- |
| `subteam` | `subteam` equals                                               |
| `role`    | `role` equals (valid `Role`, else 400)                         |
| `active`  | `true` / `false`                                               |
| `q`       | case-insensitive search on `name` (and `email` for admin/lead) |

**200** → `{ ok: true, members: MemberView[] }` (sorted by name).

### `POST /api/panel/members` — create (admin only)

Body:

| Field      | Type      | Required | Notes                               |
| ---------- | --------- | -------- | ----------------------------------- |
| `name`     | `string`  | yes      | 1–120                               |
| `email`    | `string`  | yes      | valid, unique (409 on duplicate)    |
| `password` | `string`  | no       | ≥8 chars; hashed (never stored raw) |
| `role`     | `Role`    | no       | default `"member"`                  |
| `subteam`  | `string`  | no       |                                     |
| `photoUrl` | `string`  | no       |                                     |
| `active`   | `boolean` | no       | default `true`                      |

**201** → `{ ok: true, member: MemberView }` (email included). **409** if email
already exists.

### `PATCH /api/panel/members/[id]` — update (admin, lead-limited)

Body: subset of `name`, `email`, `password`, `role`, `subteam`, `photoUrl`,
`active` (at least one). Role gating per the matrix above.

**200** → `{ ok: true, member: MemberView }`

### `DELETE /api/panel/members/[id]` — soft delete (admin only)

**Soft-delete decision:** rather than removing the document (which would orphan
FK references — `Task.createdBy/assigneeId`, `Announcement.authorId`), DELETE
sets `active: false`. Idempotent; last-admin guard applies.

**200** → `{ ok: true, member: MemberView }` (with `active: false`).

---

## Error responses

| Status | When                                                      |
| ------ | --------------------------------------------------------- |
| 400    | invalid JSON / validation / bad filter / malformed `[id]` |
| 401    | no session                                                |
| 403    | insufficient role, lead out-of-scope, or last-admin guard |
| 404    | `[id]` not found                                          |
| 409    | duplicate email                                           |
| 500    | database error (generic message)                          |

---

## Open items

- **Validation is interim (hand-rolled)** in `shared.ts`, marked `TODO(2.Q)`. A
  panel-member zod schema is needed from Security & QA (`@/lib/validation`, task
  2.Q0), bound like the public form schemas (cf. 1.B5).
- **Response summary (for Frontend 2.F4):** success → `{ ok:true, ... }` with
  `members` (list) or `member` (single); failure → `{ ok:false, error }`.
  `MemberView` = `{ id, name, email?, role, subteam?, photoUrl?, active, createdAt }`.
