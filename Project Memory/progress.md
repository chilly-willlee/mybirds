# Progress

## Current Status
**Phase**: Phase 2 — Working App (DB + Auth + Scoring + UI) (**COMPLETE**)

## What's Done

### Phase 1 — eBird API Integration Layer (complete)
1. Project scaffolding (Next.js, TypeScript, Vitest, deps)
2. eBird API types & Zod schemas (18 tests)
3. Low-level HTTP client with retry + timeout (10 tests)
4. Observation endpoints (11 tests)
5. Taxonomy, hotspot, region & checklist endpoints (10 tests)
6. Caching layer with TTL + LRU eviction (19 tests)
7. CSV life list parser — both eBird export formats supported (16 tests)
8. Life list matcher by scientific name (8 tests)
9. API routes: `/api/birds/nearby`, `/api/birds/notable`, `/api/lifelist/upload` (7 tests)

### Phase 2 — Working App (complete)
- **Database**: Neon PostgreSQL + Drizzle ORM; schema for users, life list entries, imports
- **Auth**: Auth.js v5 with Resend magic link email
- **Scoring engine**: 4-signal weighted scoring (Lifer 1000, Notable 500, Low-frequency 250 max, Documentation 150)
- **UI components**: Button, Card, Tag, Tabs, Slider
- **Navigation**: Mobile bottom bar + desktop top nav
- **Auth UI**: Sign-in page (magic link), sign-out
- **Settings page**: CSV upload, life list stats, location (geolocation / ZIP / manual lat-lng), radius slider
- **Landing page**: Birds for You with controls (sort, days, single-observer filter), pagination (20/page)
- **Life List page**: Tab A (My Life List — search/sort), Tab B (Birds for You — same controls as landing)
- **Bird cards**: Photo thumbnails (Macaulay Library), multi-checklist links, reason tags
- **Geocode API**: ZIP → lat/lng via Nominatim (`/api/geocode`)
- **Photos API**: Species thumbnails from Macaulay Library (`/api/birds/photos`)
- **Scored birds API**: Merges recent + notable obs, scores, returns sorted results (`/api/birds/scored`)
- **eBird URL fix**: Corrected double `/v2` in all endpoint paths

**Total: 120 tests, all passing. Build succeeds.**

## What's Next
- Manual QA / end-to-end testing with real eBird data
- Deploy to production (Vercel + Neon)
- Any bugs surfaced from real usage

## Known Issues
- Rate limiter is in-memory (resets on server restart); fine for MVP
- Photos API depends on undocumented Macaulay Library search endpoint; may break if API changes
- No persistent "last import date" shown in Settings (spec calls for it, not yet wired up)
