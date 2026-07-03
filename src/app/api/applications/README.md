# Applications API — `/api/applications`

Public endpoint for the **"Bize Katıl"** application form (task 1.7) and reused
by the **Sponsorluk** form (task 1.5). Persists an application to MongoDB and
sends a best-effort team notification email via Resend.

Shared types: `Application`, `ApplicationInput`, `ApplicationStatus` from
`@/types`.

---

## POST `/api/applications`

Create a new application.

### Request

- **Content-Type:** `application/json`
- **Body** (`ApplicationInput`):

| Field         | Type     | Required | Notes                          |
| ------------- | -------- | -------- | ------------------------------ |
| `name`        | `string` | yes      | 1–120 chars                    |
| `email`       | `string` | yes      | valid email, ≤254 chars        |
| `subteamPref` | `string` | yes      | preferred subteam, 1–120 chars |
| `message`     | `string` | yes      | 1–5000 chars                   |

`status`, `id`, and `createdAt` are assigned server-side — do **not** send them.

```json
{
  "name": "Ada Yılmaz",
  "email": "ada@example.com",
  "subteamPref": "Yazılım",
  "message": "Takıma katılmak istiyorum."
}
```

### Responses

**201 Created** — application saved:

```json
{ "ok": true, "id": "665f1c2e9a3b4c1d2e3f4a5b" }
```

**400 Bad Request** — invalid JSON or failed validation:

```json
{ "ok": false, "error": "Invalid email address." }
```

Possible 400 messages: `Invalid JSON body.`,
`Request body must be a JSON object.`,
`Fields name, email, subteamPref and message are required.`,
`Invalid email address.`, `One or more fields exceed the maximum length.`

**500 Internal Server Error** — database write failed:

```json
{ "ok": false, "error": "Could not save your application. Please try again." }
```

### Response shape (summary for Frontend)

- Always JSON with a boolean `ok`.
- Success: `{ ok: true, id: string }` (HTTP 201).
- Failure: `{ ok: false, error: string }` (HTTP 400 or 500). `error` is a
  human-safe message; no internal details are leaked.

### Notes

- **Email is best-effort.** If `RESEND_API_KEY` / `TEAM_NOTIFY_EMAIL` are unset
  or Resend fails, the application is still saved and the response is still 201.
- **Validation is interim.** Server-side checks here are minimal (required
  fields, email format, length caps). The authoritative zod schema arrives with
  task **1.Q1** (Security & QA) and will replace the hand-rolled `validate()`.

### Environment

| Key                | Used for                            | Required?                       |
| ------------------ | ----------------------------------- | ------------------------------- |
| `MONGODB_URI`      | DB connection                       | yes (500 if unset)              |
| `RESEND_API_KEY`   | sending the notification email      | no (mail skipped if unset)      |
| `TEAM_NOTIFY_EMAIL`| recipient of the team notification  | no (mail skipped if unset)      |
| `MAIL_FROM`        | sender address                      | no (falls back to Resend onboarding sender) |
