# Contact API — `/api/contact`

Public endpoint for the **İletişim** (Contact) form (task 1.6). Forwards the
message to the team via Resend (best-effort). **Mail-only — no database
persistence** (see [Design decision](#design-decision)).

Shared type: `ContactInput` from `@/types`.

---

## POST `/api/contact`

Send a contact message.

### Request

- **Content-Type:** `application/json`
- **Body** (`ContactInput`):

| Field     | Type     | Required | Notes                   |
| --------- | -------- | -------- | ----------------------- |
| `name`    | `string` | yes      | 1–120 chars             |
| `email`   | `string` | yes      | valid email, ≤254 chars |
| `subject` | `string` | no       | ≤200 chars              |
| `message` | `string` | yes      | 1–5000 chars            |

```json
{
  "name": "Ada Yılmaz",
  "email": "ada@example.com",
  "subject": "Sponsorluk hakkında",
  "message": "Merhaba, sizinle görüşmek istiyoruz."
}
```

### Responses

**201 Created** — message accepted:

```json
{ "ok": true }
```

**400 Bad Request** — invalid JSON or failed validation:

```json
{ "ok": false, "error": "Invalid email address." }
```

Possible 400 messages (from the zod schema, first issue only): `Invalid JSON body.`,
`Name is required.`, `Name is too long.`, `Invalid email address.`,
`Email is too long.`, `Subject is too long.`, `Message is required.`,
`Message is too long.`

> A field that is **entirely absent** (not just empty) yields zod's default type
> message, e.g. `Invalid input: expected string, received undefined`.

### Response shape (summary for Frontend)

- Always JSON with a boolean `ok`. **Consistent with `/api/applications` (1.B1).**
- Success: `{ ok: true }` (HTTP 201). _(No `id` — nothing is persisted.)_
- Failure: `{ ok: false, error: string }` (HTTP 400). `error` is a human-safe
  message; no internal details are leaked.

### Design decision

- **Mail-only, no persistence.** Contact messages are forwarded to the team
  inbox and not stored in MongoDB (kept deliberately simple, per task 1.B2). If
  an audit trail is needed later, add a `ContactMessage` model under chief
  coordination.
- **Email is best-effort.** If `RESEND_API_KEY` / `TEAM_NOTIFY_EMAIL` are unset
  or Resend fails, the request still returns 201 — the contract is "message
  accepted", not "delivery guaranteed". Since nothing is persisted, a
  soft-skipped mail is a no-op on the server side (visible only in server logs).
- **Validation is authoritative (zod).** The body is validated by `contactSchema`
  from `@/lib/validation` (owned by Security & QA, task 1.Q1). Strings are
  trimmed, `subject` is optional, and unknown keys are stripped.

### Environment

Same keys as `/api/applications` (1.B1) — **no new env keys introduced**.

| Key                 | Used for                           | Required?                                   |
| ------------------- | ---------------------------------- | ------------------------------------------- |
| `RESEND_API_KEY`    | sending the notification email     | no (mail skipped if unset)                  |
| `TEAM_NOTIFY_EMAIL` | recipient of the team notification | no (mail skipped if unset)                  |
| `MAIL_FROM`         | sender address                     | no (falls back to Resend onboarding sender) |
