# Panel Inventory API — `/api/panel/inventory`

Panel-side CRUD for **inventory / material tracking** (Faz 3), **subteam-scoped**
with RBAC at the API layer (PROGRAM.md §11). Consumed by the panel inventory view
(task 3.F2).

> Path pattern: panel APIs under **`/api/panel/*`** (same as 2.B3 tasks).
> **New domain type** `Inventory` — NOT in PROGRAM.md §8; added to `@/types` via
> chief approval (task 3.B2).

Shared types: `Inventory`, `InventoryStatus` from `@/types`.
Guards: `requireApiSession`, `requireApiRole` from `@/lib/auth/guard`.

---

## RBAC matrix (role × operation)

| Operation                      | admin       | lead                   | member  |
| ------------------------------ | ----------- | ---------------------- | ------- |
| `GET` list / `GET [id]` (read) | all         | all                    | all     |
| `POST` create                  | any subteam | own subteam only       | ✗ (403) |
| `PATCH` update                 | any         | own-subteam items only | ✗ (403) |
| `DELETE`                       | any         | own-subteam items only | ✗ (403) |

- **Subteam-scoped (decision):** yes — like tasks/documents. Reads are open to
  any authenticated user; writes require admin/lead, with a lead pinned to their
  own subteam.
- No session → **401**. Insufficient role / out-of-scope lead → **403**.

---

## Status values

`InventoryStatus` (`@/types`) — for Frontend badges + QA 3.Q1 zod:

| Value         | Meaning                          |
| ------------- | -------------------------------- |
| `available`   | in stock, ready to use (default) |
| `in-use`      | currently checked out / deployed |
| `maintenance` | under repair / servicing         |
| `depleted`    | used up / out of stock           |

---

## Endpoints

### `GET /api/panel/inventory` — list (any session)

Query filters (AND-combined):

| Query      | Matches                                             |
| ---------- | --------------------------------------------------- |
| `category` | `category` equals                                   |
| `subteam`  | `subteam` equals                                    |
| `status`   | `status` equals (valid `InventoryStatus`, else 400) |
| `q`        | case-insensitive search on `name`, `category`       |

**200** → `{ ok: true, items: Inventory[] }` (newest first).

### `POST /api/panel/inventory` — create (admin, lead)

Body:

| Field      | Type              | Required                       | Notes                         |
| ---------- | ----------------- | ------------------------------ | ----------------------------- |
| `name`     | `string`          | yes                            | 1–200                         |
| `category` | `string`          | yes                            | 1–120 (free text)             |
| `quantity` | `number`          | yes                            | ≥ 0                           |
| `unit`     | `string`          | yes                            | 1–40 (e.g. "adet", "m", "kg") |
| `status`   | `InventoryStatus` | no                             | default `"available"`         |
| `location` | `string`          | no                             | ≤200                          |
| `subteam`  | `string`          | admin: optional / lead: pinned | lead → own subteam            |
| `notes`    | `string`          | no                             | ≤5000                         |

`createdBy` is **server-assigned** from the session. A lead is pinned to their
own subteam; targeting another → **403**.

**201** → `{ ok: true, item: Inventory }`

### `GET /api/panel/inventory/[id]` — read one (any session)

**200** → `{ ok: true, item: Inventory }`

### `PATCH /api/panel/inventory/[id]` — update (admin, lead-own-subteam)

Body: subset of `name`, `category`, `quantity`, `unit`, `status`, `location`,
`subteam`, `notes` (at least one). A lead cannot move an item to another subteam.

**200** → `{ ok: true, item: Inventory }`

### `DELETE /api/panel/inventory/[id]` — delete (admin, lead-own-subteam)

**200** → `{ ok: true, id: string }`

---

## IDOR rules

- An item's `subteam` is compared against `session.user.subteam` **server-side**
  before any lead write; a lead cannot escalate by sending another `subteam`.
- `createdBy` is never taken from the body.

---

## Error responses

| Status | When                                                               |
| ------ | ------------------------------------------------------------------ |
| 400    | invalid JSON / validation / bad `status` filter / malformed `[id]` |
| 401    | no session                                                         |
| 403    | insufficient role / lead out-of-scope                              |
| 404    | `[id]` not found                                                   |
| 500    | database error (generic message)                                   |

---

## Open items

- **Validation is authoritative (zod).** The body is validated by
  `panelInventoryCreateSchema` / `panelInventoryUpdateSchema` from
  `@/lib/validation` (Security & QA, 3.Q0), bound in 3.B6. Shape only; subteam
  scoping / IDOR stay in the route/guard.
- **Response summary (for Frontend 3.F2):** success → `{ ok:true, ... }` with
  `items` (list) / `item` (single) / `id` (delete); failure → `{ ok:false, error }`.
