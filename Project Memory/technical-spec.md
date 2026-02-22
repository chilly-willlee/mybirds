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

## Architecture

### eBird API Integration Layer

```
src/lib/ebird/
  client.ts          — HTTP client (fetch + x-ebirdapitoken header + retry + Zod validation)
  types.ts           — Zod schemas & TypeScript types for all eBird responses
  cache.ts           — In-memory cache with TTL (swappable to Redis later)
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
  csv-parser.ts      — Parse eBird CSV export → deduplicated life list
  matcher.ts         — Compare observations against life list (lifer detection)
  types.ts           — Life list types
```

### API Routes (Next.js Route Handlers)

```
src/app/api/
  birds/
    nearby/route.ts  — GET: recent observations (proxied through server)
    notable/route.ts — GET: notable/rare observations
  lifelist/
    upload/route.ts  — POST: CSV upload + parse
```

## Key Design Decisions

### eBird API Constraints
- **No OAuth**: API key only (`x-ebirdapitoken`), stored server-side in `.env`
- **No user life list endpoint**: Life list imported via CSV upload
- **50km radius cap**: App max 25mi (~40km) stays within API limit; no geo-tiling needed
- **30-day lookback max**: `back` parameter capped at 30

### Caching Strategy

| Data | TTL | Cache Key |
|------|-----|-----------|
| Observations | 30 min | `obs:{lat2dp}:{lng2dp}:{dist}:{back}` |
| Notable observations | 30 min | `notable:{lat2dp}:{lng2dp}:{dist}:{back}` |
| Taxonomy | 24 hours | `taxonomy:{speciesCodes}` |
| Hotspots | 6 hours | `hotspots:{lat2dp}:{lng2dp}:{dist}` |
| Checklists | 24 hours | `checklist:{subId}` |

Lat/lng rounded to 2 decimal places (~1.1km) to increase cache hit rate.

### Security
- eBird API key: server-side only, never in client bundles or responses
- CSV upload: content-type validation, 10MB max, server-side parsing
- API route rate limiting: 30 req/min per IP
- All inputs validated with Zod at system boundaries

### Species Matching
- Match by **scientific name** (universal across locales), not common name
- Taxonomy endpoint provides `speciesCode` ↔ `sciName` mapping
