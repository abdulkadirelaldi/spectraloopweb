# Announcements API — `/api/announcements`

Public, **read-only** endpoint. Returns announcements/news published to the
public site, for the Haberler/Medya page (task 1.6) and, later, the Ana Sayfa.
Consumed by the Frontend.

> **Path choice:** `/api/announcements` (matches the `Announcement` domain type),
> not `/api/news`.

Shared types: `Announcement`, `AnnouncementAudience` from `@/types`.

---

## GET `/api/announcements`

Return public announcements, newest first.

- **Query params:** none.
- **Auth:** none (public).

### Responses

**200 OK**

```json
{
  "ok": true,
  "announcements": [
    {
      "id": "665f1c2e9a3b4c1d2e3f4a5b",
      "title": "Spectraloop 2026 sezonuna başladı",
      "body": "Yeni sezon hazırlıklarımız tüm hızıyla devam ediyor.",
      "audience": "all",
      "authorId": "000000000000000000000000",
      "publishedToPublic": true,
      "createdAt": "2026-07-03T10:00:00.000Z"
    }
  ]
}
```

Each item matches the shared `Announcement` type. `publishedToPublic` is always
`true` in this response (see guarantee below).

**500 Internal Server Error** — database read failed:

```json
{ "ok": false, "error": "Could not load announcements." }
```

### Guarantees

- **Only `publishedToPublic: true` records are returned.** This is a security
  boundary: panel-only / draft announcements must never leak to the public site.
  The filter is applied server-side.
- **Ordering:** sorted by `createdAt` **descending (newest first)**. The
  Frontend can render the array as-is.

### Response shape (summary for Frontend)

- Success: `{ ok: true, announcements: Announcement[] }` (HTTP 200).
- Failure: `{ ok: false, error: string }` (HTTP 500).
- Consistent `ok` boolean with the other endpoints (1.B1 / 1.B2 / 1.B3).

### Caching

`export const revalidate = 300` — cached and revalidated at most every 5 minutes
(announcement data changes rarely). Newly published announcements may take up to
5 minutes to appear.

---

## Seeding sample data

Populate the database with representative (placeholder) announcements:

```bash
npm run seed:announcements
```

- Requires `MONGODB_URI` in `.env.local` (loaded via `@next/env`).
- **Idempotent:** upserts by `title`, so re-running does not create duplicates.
- Inserts 5 records — **3 public** (`publishedToPublic: true`) and **2
  panel-only/draft** (`false`) — to demonstrate that the endpoint returns only
  the public ones.
- The data is fake/placeholder, not real announcements.
