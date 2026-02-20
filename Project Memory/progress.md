# Progress

## Current Status
**Phase**: Phase 1 — eBird API Integration Layer (starting implementation)

## What's Done
- Product specification finalized and updated for API reality
- Technical specification created (`technical-spec.md`)
- CLAUDE.md created with project context and development guidelines
- eBird API researched: no OAuth, no user life list endpoint, API-key-only
- Auth revised to magic link (email-only) + CSV life list import
- Implementation plan approved (10 tasks)

## Current Work
Beginning Task 1: Project scaffolding (Next.js, TypeScript, Vitest, deps)

## What's Left (Phase 1)
1. ~~Project scaffolding~~ (starting)
2. eBird API types & Zod schemas
3. Low-level HTTP client
4. Observation endpoints
5. Taxonomy, hotspot, region & checklist endpoints
6. Caching layer
7. Geo-tiling for large radius
8. CSV life list parser
9. Life list matcher
10. Next.js API routes

## Known Issues
- eBird API radius capped at 50km; geo-tiling needed for user's 1-100 mile range
- eBird "Download My Data" CSV format may vary; need real sample data to validate parser
