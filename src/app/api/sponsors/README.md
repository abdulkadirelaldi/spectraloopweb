# Sponsors API — `/api/sponsors`

Public, **read-only** endpoint. Returns active sponsors for the Ana Sayfa
sponsor strip (task 1.2) and the Sponsorluk page. Consumed by the Frontend.

Shared types: `Sponsor`, `SponsorTier` from `@/types`.

---

## GET `/api/sponsors`

Return all active sponsors, ordered by tier.

- **Query params:** none.
- **Auth:** none (public).

### Responses

**200 OK**

```json
{
  "ok": true,
  "sponsors": [
    {
      "id": "665f1c2e9a3b4c1d2e3f4a5b",
      "name": "Acme Robotics",
      "logoUrl": "https://placehold.co/240x120?text=Acme+Robotics",
      "tier": "gold",
      "website": "https://example.com/acme",
      "active": true,
      "createdAt": "2026-07-03T10:00:00.000Z"
    }
  ]
}
```

Each item matches the shared `Sponsor` type. `website` may be absent (optional).

**500 Internal Server Error** — database read failed:

```json
{ "ok": false, "error": "Could not load sponsors." }
```

### Guarantees

- **Only `active: true` sponsors** are returned. Inactive sponsors are filtered
  out server-side.
- **Ordering:** sorted by tier **gold → silver → bronze**. The Frontend can
  render the array as-is; no client-side sorting needed. (Within a tier the
  order is unspecified.)

### Response shape (summary for Frontend)

- Success: `{ ok: true, sponsors: Sponsor[] }` (HTTP 200).
- Failure: `{ ok: false, error: string }` (HTTP 500).
- Consistent `ok` boolean with the other endpoints (1.B1 / 1.B2).

### Caching

`export const revalidate = 300` — the response is cached and revalidated at most
every 5 minutes (sponsor data changes rarely). Newly seeded/edited sponsors may
take up to 5 minutes to appear.

---

## Seeding sample data

Populate the database with representative (placeholder) sponsors:

```bash
npm run seed:sponsors
```

- Requires `MONGODB_URI` in `.env.local` (loaded via `@next/env`).
- **Idempotent:** upserts by sponsor `name`, so re-running does not create
  duplicates.
- Inserts 5 records across tiers (2 gold, 1 silver, 2 bronze) — one of which is
  `active: false` to verify the endpoint's active-only filter.
- The data is fake/placeholder (names + `placehold.co` logo URLs), not real
  sponsors.
