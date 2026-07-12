# Panel Budget / Expenses API — `/api/panel/budget`

Panel-side expense/budget tracking with an **approval flow** (Faz 3),
**subteam-scoped**, RBAC at the API layer (PROGRAM.md §11). **Financial data —
access restricted to admin + lead.** Consumed by the panel budget view (3.F3).

> Path pattern: panel APIs under **`/api/panel/*`**.
> **New domain type** `Expense` — NOT in PROGRAM.md §8; added to `@/types` via
> chief approval (task 3.B3).

Shared types: `Expense`, `ExpenseStatus` from `@/types`.
Guards: `requireApiRole` from `@/lib/auth/guard`.

---

## RBAC matrix (role × operation)

| Operation                     | admin                         | lead                                        | member  |
| ----------------------------- | ----------------------------- | ------------------------------------------- | ------- |
| `GET` list / `GET [id]`       | all                           | **own subteam only**                        | ✗ (403) |
| `POST` (submit request)       | any subteam                   | own subteam only, `status` forced `pending` | ✗ (403) |
| `PATCH` status (approve etc.) | ✅ (approve/reject/reimburse) | ✗ (cannot change status)                    | ✗ (403) |
| `PATCH` field edit            | any expense                   | own-subteam **pending** expense only        | ✗ (403) |
| `DELETE`                      | any expense                   | own, **pending**, own-subteam request only  | ✗ (403) |

- **member access (decision):** expenses are **financial data** → members
  cannot see or touch them at all (403 on every operation).
- **Approval authority (decision):** only an **admin** may set an approval status
  (`approved` / `reimbursed` / `rejected`). A **lead submits** a request
  (`pending`) and may edit it _while pending_, but **cannot approve** it.
- **delete (decision):** admin may delete any; a lead may delete only their own
  still-`pending` request in their own subteam.
- No session → **401**. Wrong role / out-of-scope / unauthorized transition → **403**.

---

## Approval flow (status)

`ExpenseStatus` (`@/types`):

```
        (lead/admin submit)        (admin)
   —————————————————————▶  pending  ————▶  approved  ——(admin)——▶  reimbursed
                              │
                              └——(admin)——▶  rejected
```

| Value        | Meaning                              | Who sets it       |
| ------------ | ------------------------------------ | ----------------- |
| `pending`    | submitted, awaiting review (default) | created by submit |
| `approved`   | approved for spending/reimbursement  | **admin**         |
| `reimbursed` | paid back to the submitter           | **admin**         |
| `rejected`   | declined                             | **admin**         |

Transitions are not otherwise constrained server-side (admin may set any status);
the UI drives the sequence.

---

## Money / amount note

- `amount` is a **decimal `number`** in a single `currency` field (default
  `"TRY"`). **JS floating-point can introduce rounding error** on arithmetic —
  acceptable for tracking, but production-grade accounting should store integer
  minor units (kuruş/cents). Documented as a known limitation.
- **Summaries never sum across currencies.** `summary.totalsByCurrency` groups
  totals per currency; `summary.byStatus` is a count breakdown.

---

## Endpoints

### `GET /api/panel/budget` — list + summary (admin, lead)

Query filters (AND-combined): `status`, `category`, `from`, `to` (ISO date
range on `date`), and `subteam` (**admin only**; a lead is always scoped to their
own subteam).

**200** →

```json
{
  "ok": true,
  "expenses": [/* Expense[], newest date first */],
  "summary": {
    "count": 3,
    "byStatus": { "pending": 1, "approved": 1, "reimbursed": 1, "rejected": 0 },
    "totalsByCurrency": { "TRY": 1500.5, "USD": 40 }
  }
}
```

### `POST /api/panel/budget` — submit expense (admin, lead)

Body:

| Field      | Type              | Required                       | Notes              |
| ---------- | ----------------- | ------------------------------ | ------------------ |
| `title`    | `string`          | yes                            | 1–200              |
| `amount`   | `number`          | yes                            | > 0                |
| `category` | `string`          | yes                            | 1–120              |
| `date`     | ISO date `string` | yes                            | parsed to a date   |
| `currency` | `string`          | no                             | default `"TRY"`    |
| `subteam`  | `string`          | admin: optional / lead: pinned | lead → own subteam |
| `notes`    | `string`          | no                             | ≤5000              |

`status` is always set to `"pending"` on create (ignored if sent); `submittedBy`
is server-assigned.

**201** → `{ ok: true, expense: Expense }`

### `GET /api/panel/budget/[id]` — read one (admin, lead-own-subteam)

**200** → `{ ok: true, expense: Expense }`

### `PATCH /api/panel/budget/[id]` — update / approve

Body: subset of `title`, `amount`, `currency`, `category`, `date`, `subteam`,
`notes`, `status` (at least one).

- **admin** — any field, including `status` (approve/reimburse/reject).
- **lead** — own-subteam, **pending** expense only; **may not set `status`** or
  change `subteam`.

**200** → `{ ok: true, expense: Expense }`

### `DELETE /api/panel/budget/[id]` — delete

- **admin** — any. **lead** — own, pending, own-subteam request only.

**200** → `{ ok: true, id: string }`

---

## Error responses

| Status | When                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| 400    | invalid JSON / validation / bad filter / bad `from`/`to` / malformed `[id]`          |
| 401    | no session                                                                           |
| 403    | member (any op), lead out-of-scope, or a lead attempting approval / non-pending edit |
| 404    | `[id]` not found                                                                     |
| 500    | database error (generic message)                                                     |

---

## Open items

- **Validation is authoritative (zod).** The body is validated by
  `panelExpenseCreateSchema` / `panelExpenseUpdateSchema` from `@/lib/validation`
  (Security & QA, 3.Q0), bound in 3.B6. Shape only; the approval transition
  (admin-only), subteam scoping, and IDOR stay in the route/guard.
- **Response summary (for Frontend 3.F3):** success → `{ ok:true, ... }` with
  `expenses` + `summary` (list) / `expense` (single) / `id` (delete); failure →
  `{ ok:false, error }`.
