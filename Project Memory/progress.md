# Progress

## Current Status
**Phase**: Beta v0.1 — deployed to production at https://new-birds.vercel.app

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
- **Scoring engine**: 4-signal weighted scoring (Lifer 1000, Notable 500, Documentation 150, Recency 150)
- **UI components**: Button, Card, Tag, Tabs, Slider
- **Navigation**: Mobile bottom bar + desktop top nav
- **Auth UI**: Sign-in page (magic link), sign-out
- **Settings page**: Location (geolocation / ZIP / manual lat-lng), radius slider
- **Landing page**: Birds for You with controls (sort, days, single-observer filter), pagination (20/page)
- **Life List page**: Tab A (My Life List — search/sort/date toggle), Tab B (Birds for You — same controls as landing)
- **Bird cards**: Photo thumbnails (Macaulay Library), multi-checklist links, reason tags
- **Geocode API**: ZIP → lat/lng via Nominatim (`/api/geocode`)
- **Photos API**: Species thumbnails from Macaulay Library (`/api/birds/photos`)
- **Scored birds API**: Merges recent + notable obs, scores, returns sorted results (`/api/birds/scored`)
- **Per-species API**: Recent sightings detail with checklist list + photo counts (`/api/birds/species/[speciesCode]`)

### Beta v0.1 Polish (complete)
- **Two-CSV Life List upload**: "Upload CSV: [First Seen] [Last Seen]" — two distinct buttons; each uploads to the correct DB columns. Import status lines show per-type species count + date.
- **Date mode toggle**: `[First Seen | Last Seen]` segmented control; greyed + tooltip when type not uploaded. Fallback to available date if selected mode has no data.
- **Life List filtering**: Non-species entries (slash, spuh, hybrid) excluded at parse time.
- **observationCount semantics**: Life List CSV = 0 (unknown); My Data CSV = checklist row count. "Seen N times" hidden when count is 0.
- **Relative timestamps**: "Just now" (< 1h), "X hours ago" (< 24h), "Yesterday", "X days ago", or short date.
- **Verbiage**: "Last spotted" → "Last seen"; "You spotted" → "You've seen".
- **Hover underlines**: All text links underline on hover (Life List + Birds for You).
- **Logo mark hidden**: Nav wordmark only.

**Total: 120 tests, all passing. Build succeeds.**

## What's Next
- Monitor production for bugs from real usage
- Gather beta feedback

## Known Issues
- Rate limiter is in-memory (resets on server restart); fine for MVP
- Photos API depends on undocumented Macaulay Library search endpoint; may break if API changes
- `mergeLastSeenData` uses explicit SELECT → UPDATE → INSERT (not `onConflictDoUpdate`) due to Drizzle ORM requiring a unique CONSTRAINT (not just `uniqueIndex`) for conflict resolution
