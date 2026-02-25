# Technical Specification

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14+ (App Router) | Server-side API key protection, full-stack MVP, built-in caching |
| Language | TypeScript | Type safety across eBird API responses and life list data |
| Validation | Zod | Runtime validation of all external data (eBird API, CSV uploads) |
| Testing | Vitest | Fast, native ESM, compatible with Next.js |
| CSV Parsing | Papa Parse | Battle-tested, handles encoding edge cases |
| Package Manager | pnpm | Fast, disk-efficient |
| Database | Neon PostgreSQL (serverless) | Serverless-compatible, no connection pooling needed |
| ORM | Drizzle ORM | Type-safe queries, lightweight, works well with Neon |
| Auth | Auth.js v5 + Resend | Magic link (passwordless), Drizzle adapter |
| Deployment | Vercel | Zero-config Next.js deploy |

## Architecture

### eBird API Integration Layer

```
src/lib/ebird/
  client.ts          — HTTP client (fetch + x-ebirdapitoken header + retry + Zod validation)
  types.ts           — Zod schemas & TypeScript types for all eBird responses
  cache.ts           — In-memory cache with TTL + LRU eviction (swappable to Redis later)
  singleton.ts       — Shared EBirdClient + cache instances
  endpoints/
    observations.ts  — Recent & notable nearby observations
    taxonomy.ts      — Species taxonomy
    hotspots.ts      — Nearby hotspots
    regions.ts       — Species list by region
    checklists.ts    — Checklist details
```

### Life List Layer

```
src/lib/lifelist/
  csv-parser.ts      — Parse eBird CSV exports → deduplicated life list
  matcher.ts         — Compare observations against life list (lifer detection)
  types.ts           — Life list types
```

### Scoring Layer

```
src/lib/scoring/
  types.ts           — ScoredObservation, ReasonTag, SCORE_WEIGHTS
  rarity.ts          — Scoring engine + Haversine distance
```

### Database Layer

```
src/lib/db/
  index.ts           — Drizzle + Neon connection singleton (server-only)
  schema.ts          — All table definitions
  life-list.ts       — Life list CRUD: upsertFirstSeenList, mergeLastSeenData, getLifeList, etc.
  user-settings.ts   — User location + radius CRUD
```

### Auth

```
src/lib/auth.ts      — Auth.js v5 config (Drizzle adapter + Resend email provider)
src/middleware.ts    — Route protection (/lifelist, /settings)
```

### API Routes (Next.js Route Handlers)

```
src/app/api/
  auth/[...nextauth]/route.ts         — Auth.js handlers (GET/POST)
  birds/
    scored/route.ts                   — GET: scored + ranked Birds for You list
    nearby/route.ts                   — GET: recent nearby observations (proxy)
    notable/route.ts                  — GET: notable/rare observations (proxy)
    photos/route.ts                   — GET: species photos from Macaulay Library
    species/[speciesCode]/route.ts    — GET: per-species sighting detail
  lifelist/
    route.ts                          — GET: user's life list (sorted/filtered)
    upload/route.ts                   — POST: CSV upload → parse → DB write
  settings/route.ts                   — GET/PATCH: user location + radius
  geocode/route.ts                    — GET: ZIP code → lat/lng via Nominatim
```

## Key Design Decisions

### eBird API Constraints
- **No OAuth**: API key only (`x-ebirdapitoken`), stored server-side in `.env`
- **No user life list endpoint**: Life list imported via CSV upload
- **50km radius cap**: App max 25mi (~40km) stays within API limit; no geo-tiling needed
- **30-day lookback max**: `back` parameter capped at 30

### Life List CSV Import Strategy

Two separate CSV downloads from `ebird.org/lifelist` are supported:
- **First Seen CSV**: Sort by "Date first observed" → `upsertFirstSeenList` (full replace, writes `firstObs*` columns)
- **Last Seen CSV**: Sort by "Date last observed" → `mergeLastSeenData` (updates `lastObs*` for existing, inserts new)
- **My Data export**: One row per observation → `upsertLifeList` (full replace, populates both `firstObs*` and `lastObs*`)

The parser always places the CSV date in `firstObservation`; the upload route swaps it to `lastObservation` when type is "last-seen".

`mergeLastSeenData` uses explicit SELECT → UPDATE → INSERT (not `onConflictDoUpdate`) because Drizzle ORM's conflict resolution requires a unique CONSTRAINT; we only have a `uniqueIndex`, which is not recognized as a conflict target.

### Caching Strategy

| Data | TTL | Cache Key |
|------|-----|-----------|
| Observations | 30 min | `obs:{lat2dp}:{lng2dp}:{dist}:{back}` |
| Notable observations | 30 min | `notable:{lat2dp}:{lng2dp}:{dist}:{back}` |
| Taxonomy | 24 hours | `taxonomy` |
| Hotspots | 6 hours | `hotspots:{lat2dp}:{lng2dp}:{dist}` |
| Checklists | 24 hours | `checklist:{subId}` |
| Photos | 24 hours | `photos:{subId}:{speciesCode}` |

Lat/lng rounded to 2 decimal places (~1.1km) to increase cache hit rate.

### Scoring Signals

| Signal | Weight |
|--------|--------|
| Lifer (logged-in only) | 1000 |
| Notable (eBird rarity flag) | 500 |
| Checklist documentation (observer notes) | 150 |
| Recency bonus (proportional, today = max) | 150 |

### Security
- eBird API key: server-side only, never in client bundles or responses
- Auth secret + Resend key: `.env` only, `import "server-only"` in all DB/auth modules
- CSV upload: content-type validation, 10MB max, server-side parsing
- API route rate limiting: 30 req/min per IP (in-memory, resets on restart)
- All inputs validated with Zod at system boundaries
- Auth middleware protects `/settings`, `/lifelist` routes

### Species Matching
- Match by **scientific name** (universal across locales), not common name
- Taxonomy endpoint provides `speciesCode` ↔ `sciName` mapping
- `speciesCode` enriched at import time via taxonomy cache
