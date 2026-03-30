# Schedule Block

Loads a **schedule JSON** document from a link in the block, picks the row that matches the current time (or a **default** row), then inlines an Edge Delivery **fragment** at that path—same idea as [aemsites/author-kit schedule](https://github.com/aemsites/author-kit/blob/main/blocks/schedule/schedule.js), adapted for this storefront (`decorate`, `loadFragment`, local `env`).

## Authoring

### Block (table)

Add a **Schedule** block whose first link points to your JSON (any path that returns `{ "data": [ ... ] }`).

| Schedule |
|----------|
| [Schedule JSON](https://www.example.com/content/schedule.json) |

### Inline link (author-kit `linkBlocks`)

Any `<a href="…/schedules/…">` in main content is auto-decorated (see `linkBlocks` and `buildLinkBlocksFromMain` in `scripts/scripts.js`). Links that sit inside a table-authored `div.schedule` wrapper are skipped so the block decorator does not run twice.

## JSON shape

Each item in `data` can include:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Label for debugging / logging. |
| `start` | For timed rows | ISO 8601 start (used with `end`). |
| `end` | For timed rows | ISO 8601 end. Active when `now` is **after** `start` and **before** `end`. |
| `fragment` | Yes* | Site path or URL to the fragment (e.g. `/fragments/promo`). Resolved to a pathname and passed to `loadFragment`. |

\*If `fragment` is omitted on purpose, the schedule link is removed.

**Default fallback:** an entry with **no** `start` **and** no `end` is used when no timed window matches.

**Order:** The array is processed in **reverse** after load (same as author-kit), so later rows in the file win when windows overlap.

### Example

```json
{
  "data": [
    { "name": "always", "fragment": "/fragments/default-banner" },
    {
      "name": "spring-sale",
      "start": "2026-03-01T00:00:00.000Z",
      "end": "2026-03-31T23:59:59.000Z",
      "fragment": "/fragments/spring-sale"
    }
  ]
}
```

## Non-production: simulated “now”

When `ENV` is not `prod` (see `scripts/utils/env.js`), you can override the clock:

- `localStorage` key `aem-schedule` — value is **Unix time in seconds** (multiplied by 1000 internally), or  
- Query string `?schedule=<unix seconds>`  

Production always uses the real time.

## Error handling

- **Production:** failed fetch, bad JSON, or missing fragment typically **removes** the schedule link with no console noise.  
- **Non-production:** warnings are logged with a `[schedule]` prefix.

## Variants

None. Use the base `Schedule` block name.
