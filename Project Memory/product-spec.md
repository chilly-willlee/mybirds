# New Birds — Product Specification (MVP)

## Overview

**New Birds** is a web application that helps birders discover bird species they haven't seen yet by surfacing recent nearby sightings. Users import their eBird life list via CSV, and the app compares it against local sightings to highlight new birding opportunities.

---

## Problem Statement

Birders maintaining life lists often miss opportunities to spot new species because:
- They don't know what birds are currently in their area
- Manually cross-referencing eBird sightings against their life list is tedious
- There's no proactive notification when a "lifer" opportunity appears nearby

---

## Target Users

**Primary Persona: The Life List Birder**
- Actively maintains a life list on eBird
- Willing to travel within reasonable distance to see new species
- Checks eBird regularly but wants a more streamlined experience
- Values being notified about rare or new-to-them sightings

**Secondary Persona: The Curious Visitor**
- Interested in birding but may not have an eBird account (or hasn't connected one yet)
- Wants to see what interesting birds are around them right now
- May convert to a logged-in user after seeing the value of the app

---

## Core Features (MVP)

### 1. All Users

Features in this section are shared between logged-out visitors and logged-in users.

#### Birds for You

A paginated list (20 per page, "Show more" button) of relatively rare birds recently sighted near the user's location. Location is determined via browser geolocation (with a prompt) or by ZIP code.

**Controls**:
- **ZIP code**: Text input to set location by ZIP code
- **Sort**: Score (default), Distance, Date, Alphabetical
- **Lookback**: 1 day, 3 days, 7 days (max)

**Scoring**: See [Rarity Scoring](#rarity-scoring) below.

**Species Entry Display** (one card per species, top to bottom):

| Line | Content |
|------|---------|
| Name | Common name (linked to eBird species page) followed by scientific name in italics in parentheses — e.g., `Varied Thrush (Ixoreus naevius)` |
| Tags | One or more reason tags explaining why this bird is notable (see [Rarity Scoring](#rarity-scoring)). Omitted if no tags. |
| Photos | Up to 3 thumbnails sourced from the checklists referenced by this entry. Each thumbnail links to its originating checklist. Omitted if no photos. |
| Stats | `Last spotted: [date] ([distance] mi away, [location])` — e.g., `Last spotted: Today (8 mi away, Tilden Regional Park)` |
| Your sightings | `You spotted: never`, `You spotted: 1 time`, or `You spotted: [N] times` — logged-in users only |
| CTA | "Show recent sightings" link that expands the Species Detail section inline |

**Species Detail** (inline, below the card entry, loaded on demand):

A loading skeleton is shown while data is fetched. Once loaded, the detail section displays:

| Element | Content |
|---------|---------|
| Sighting count | `[N] sighting[s] nearby in the last [N] day[s]` — count of unique recent observation entries from the eBird per-species endpoint |
| Checklists | All recent nearby checklists for this species, listed as: `[location name] · [relative date] · [X] mi away [📷 (N)]` — each location name links to the eBird checklist. If photos of this species were submitted with the checklist, a camera icon and count `📷 (N)` appear at the end, also linking to the checklist. Count is per-species (from `mediaCounts.P` in the eBird checklist view API). Omitted when no photos. |

"Hide" collapses the section.

### 2. Logged-Out Mode

Visitors who have not signed in see a curated landing experience designed to showcase the app's value and encourage sign-up.

The logged-out landing page displays the Birds for You list (see [All Users](#1-all-users)) alongside CTAs to sign up.

**Call to Action**:
- Prominent CTA: "Sign up to import your life list and see which of these you haven't spotted yet"
- Secondary CTA: "See your full life list and discover new birds nearby"
- CTA appears at the top and bottom of the Birds for You list

### 3. Authentication

- **Magic link (email-only)**: Passwordless auth via email. No passwords to manage.
- **No eBird OAuth**: The eBird API does not support OAuth. User authentication is independent of eBird.
- Life list data is imported via CSV upload (see below).

### 4. Logged-In Mode

#### Birds for You (Logged-In)

Logged-in users see the same Birds for You list as logged-out users (see [All Users](#1-all-users)), with one addition: species not on the user's life list are tagged as **"Lifer"** and receive the highest rarity score weight. The display also shows how many times the logged-in user has personally observed each species.

**Additional Species Entry Lines (Logged-In)**:
| Line | Content |
|------|---------|
| Lifer tag | "Lifer" reason tag added to the tags line if species is not on the user's life list |
| Your sightings | `You spotted: never`, `You spotted: 1 time`, or `You spotted: [N] times` — displayed between the stats line and the "Show details" CTA |

#### Life List Screen

Two tabs:

##### Tab A: "My Life List"

Displays all bird species the user has observed in their lifetime, sourced from their uploaded CSV.

**Data Source**: User-uploaded CSV from `https://ebird.org/lifelist?time=life&r=world`

**Display Controls**:
- **Sort options**: Taxonomic order (default), Date newest/oldest, Alphabetical A–Z / Z–A
- **Search/filter**: Text search by species name
- **Total count**: Display total species count prominently

**Species Entry Display**:
- Common name
- Scientific name
- Date last observed (most recent observation)
- Location last observed (most recent observation)
- Link to species page on eBird

##### Tab B: "Birds for You"

Same as the logged-out Birds for You (see [All Users](#1-all-users)), with the Lifer additions described above.

**Empty State**: "No recommended birds nearby in the last 7 days. Try expanding your search radius!"

#### User Profile Settings

##### Life List Import
- **CSV upload**: User downloads their life list from [ebird.org/lifelist?time=life&r=world](https://ebird.org/lifelist?time=life&r=world) ("Download CSV") or full observation history from [ebird.org/downloadMyData](https://ebird.org/downloadMyData), then uploads to New Birds
- Both eBird CSV formats supported (Life List export and My Data export)
- Display import status: species count, upload confirmation message
- Link to eBird download page

##### Location Settings
- **Browser geolocation**: One-click "Use My Location" with permission prompt
- **ZIP code lookup**: Enter a US ZIP code to set location
- **Manual coordinates**: Latitude and longitude text inputs
- Display current saved coordinates
- **Search radius**: Slider input (range: 1–25 miles, default: 10 miles)

---

## Rarity Scoring

Used by both the logged-out and logged-in Birds for You. A species is scored by a weighted combination of signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| Lifer | 1000 (logged-in only) | Species not on the user's life list — the most valuable recommendation |
| Notable (eBird rarity) | 500 | Species flagged as rare by eBird's regional rarity system |
| Checklist notes | 150 | Species with observer-written descriptions or notes on the checklist (indicates likely rare/confirmed sighting) |

Signals stack — a species can score across multiple signals simultaneously. Results are sorted highest score first.

Each species entry displays one or more **reason tags**:
- **"Lifer"** (logged-in only) — species is not on the user's life list
- **"Rare in this region"** — species flagged as notable by eBird
- **"Checklist notes added"** — observer wrote a description or notes for this species observation

---

## Screen Specifications

### Responsive Design Requirements

| Breakpoint | Target |
|------------|--------|
| Mobile | 320px – 767px |
| Tablet | 768px – 1023px |
| Desktop | 1024px+ |

### Navigation

- **Mobile**: Bottom tab bar with icons (Life List, Birds for You, Settings)
- **Desktop**: Left sidebar or top navigation bar
- Persistent indication of current location and radius setting

### Screen: Logged-Out Landing

```
┌─────────────────────────────────────────┐
│  🐦 New Birds                           │
│  Discover your next lifer               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Sign in to see which birds near │    │
│  │ you are missing from your list. │    │
│  │                                 │    │
│  │ [Sign up with email →]          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  BIRDS FOR YOU                          │
│  📍 Oakland, CA  Sort: [Score ▼] [7d ▼] │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Varied Thrush (Ixoreus naevius) │    │
│  │ 🏷 Rare in this region          │    │
│  │ [photo] [photo]                 │    │
│  │ Last spotted: Today             │    │
│  │   (8 mi away, Tilden RP)        │    │
│  │ Show recent sightings           │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Varied Thrush (Ixoreus naevius) │    │
│  │ 🏷 Rare in this region          │    │
│  │ [photo] [photo]                 │    │
│  │ Last spotted: Today             │    │
│  │   (8 mi away, Tilden RP)        │    │
│  │ Hide                            │    │
│  ├─────────────────────────────────┤    │
│  │ 5 sightings nearby in the last  │    │
│  │   7 days                        │    │
│  │ Tilden RP · Today · 8 mi 📷(2)  │    │
│  │ Briones RP · Today · 12 mi away │    │
│  │ Lake Chabot · Yesterday · 6 mi  │    │
│  └─────────────────────────────────┘    │
│  ...                                    │
│  [Show more (12 remaining)]             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [Sign up with email →]          │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Screen: User Profile Settings

```
┌─────────────────────────────────────────┐
│  ⚙️ Settings                            │
├─────────────────────────────────────────┤
│                                         │
│  LIFE LIST                              │
│  ┌─────────────────────────────────┐    │
│  │ 342 species imported            │    │
│  │                                 │    │
│  │ [Upload CSV]                    │    │
│  │ Download from eBird ↗           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  LOCATION                               │
│  ┌─────────────────────────────────┐    │
│  │ Current: 37.8044, -122.2712     │    │
│  │ [Use My Location]               │    │
│  │                                 │    │
│  │ ZIP Code: [94607] [Set]         │    │
│  │                                 │    │
│  │ Latitude: [37.8044]             │    │
│  │ Longitude: [-122.2712]  [Set]   │    │
│  │                                 │    │
│  │ Search Radius: [===●=====] 10mi │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Screen: Life List (Tab A)

```
┌─────────────────────────────────────────┐
│  🐦 My Birds                            │
├─────────────────────────────────────────┤
│  [My Life List]  [Birds for You]        │
├─────────────────────────────────────────┤
│  Total Species: 342                     │
│  [Search... 🔍]  Sort: [Taxonomic ▼]    │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ American Robin                  │    │
│  │ Turdus migratorius              │    │
│  │ Last seen: Feb 10, 2026         │    │
│  │ 📍 Central Park, NY             │    │
│  └─────────────────────────────────┘    │
│  ...                                    │
└─────────────────────────────────────────┘
```

### Screen: Birds for You (Tab B, Logged-In)

```
┌─────────────────────────────────────────┐
│  🐦 My Birds                            │
├─────────────────────────────────────────┤
│  [My Life List]  [Birds for You ●]      │
├─────────────────────────────────────────┤
│  📍 Oakland, CA • 10 mi radius          │
│  Sort: [Score ▼]  Show: [7 days ▼]      │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ Varied Thrush (Ixoreus naevius) │    │
│  │ 🏷 Lifer  🏷 Rare in this region │    │
│  │ [photo] [photo]                 │    │
│  │ Last spotted: Today             │    │
│  │   (8 mi away, Tilden RP)        │    │
│  │ You spotted: never              │    │
│  │ Show recent sightings           │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Lewis's Woodpecker              │    │
│  │   (Melanerpes lewis)            │    │
│  │ 🏷 Lifer  🏷 Checklist notes added│   │
│  │ Last spotted: 2 days ago        │    │
│  │   (22 mi away, Briones RP)      │    │
│  │ You spotted: never              │    │
│  │ Show recent sightings           │    │
│  └─────────────────────────────────┘    │
│  ...                                    │
│  [Show more (8 remaining)]              │
└─────────────────────────────────────────┘
```

---

## Branding Direction

### Name & Tagline
- **Name**: New Birds
- **Tagline**: "Discover your next lifer"

### Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Forest Green | `#2D5A3D` | Headers, primary buttons, links |
| Secondary | Sky Blue | `#5BA4D9` | Accents, notification badges |
| Accent | Golden Yellow | `#F4B942` | Highlights, "rare" badges, CTAs |
| Background | Warm White | `#FAF9F7` | Page backgrounds |
| Surface | Cloud White | `#FFFFFF` | Cards, panels |
| Text Primary | Charcoal | `#2C3E40` | Body text |
| Text Secondary | Slate Gray | `#6B7C7E` | Captions, metadata |

### Typography

- **Headings**: Inter (semi-bold) — clean, modern, highly legible
- **Body**: Inter (regular) — consistent family for UI
- **Scientific names**: Inter (italic)

### Visual Style

- **Aesthetic**: Clean, naturalistic, trustworthy
- **Imagery**: Subtle watercolor-style bird silhouettes as background accents
- **Icons**: Rounded, friendly line icons (Feather Icons or similar)
- **Cards**: Soft shadows, rounded corners (8px radius)
- **Micro-interactions**: Gentle transitions, subtle hover states

### Logo Concept

A minimalist bird silhouette (perhaps a warbler or thrush in flight) integrated with a location pin or compass element. The mark should work at small sizes for favicon/app icon use.

---

## Technical Considerations

### API Integration

**eBird API v2** (https://documenter.getpostman.com/view/664302/S1ENwy59)
- **API key authentication** (developer key via `x-ebirdapitoken` header, stored server-side only)
- No OAuth flow available — eBird API does not support user-specific data access
- User life list imported via CSV upload (not available through API)
- Query recent nearby observations (`/data/obs/geo/recent`) — one entry per species (most recent globally)
- Query notable/rare observations (`/data/obs/geo/recent/notable`) — one entry per checklist for notable species
- Query per-species recent observations (`/data/obs/geo/recent/{speciesCode}`) — one entry per location, used for Species Detail sighting count and checklist list
- Species taxonomy (`/ref/taxonomy/ebird`)
- Checklist details (`/product/checklist/view/{subId}`) — used to check species-level `comments` field for documentation scoring
- **Radius limit**: Max 50km per query; app max 25mi (~40km) stays within limit

**Macaulay Library** (Cornell Lab)
- Photo thumbnails fetched via `https://search.macaulaylibrary.org/api/v1/search?subId={checklistId}&mediaType=Photo`
- The `subId` parameter returns only photos submitted as part of that specific checklist
- Each photo result includes `speciesCode` and `assetId`; thumbnail URL: `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/{assetId}/320`
- Cached 24 hours server-side per checklist ID

**Nominatim (OpenStreetMap)**
- ZIP code → lat/lng geocoding for US ZIP codes
- Cached permanently server-side per ZIP code

### CSV Format Support

Two eBird CSV export formats are supported:
- **Life List export** (`ebird.org/lifelist` → Download CSV): one row per species, columns include `Taxon Order`, `SubID`
- **My Data export** (`ebird.org/downloadMyData`): one row per observation, columns include `Submission ID`, `Taxonomic Order`

### Data Refresh Strategy

| Data Type | Refresh Frequency |
|-----------|-------------------|
| User's life list | On CSV re-import (user-triggered) |
| Nearby sightings (all species) | Cached 30 minutes |
| Per-species sightings (Species Detail) | Cached 30 minutes |
| Checklist details (comments) | Cached 24 hours |
| Checklist photos (Macaulay Library) | Cached 24 hours per checklist |
| Taxonomy | Cached 24 hours |
| ZIP code geocoding | Cached permanently |
| User location | On-demand (user-triggered) |

### Performance Requirements

- Initial page load: < 3 seconds
- Life list render: < 2 seconds for 500+ species
- Nearby sightings query: < 2 seconds

---

## Success Metrics

| Metric | Target (MVP) |
|--------|--------------|
| Logged-out → sign-up | 15% of logged-out visitors create an account |
| User activation | 70% of signups upload their eBird life list CSV |
| Engagement | 3+ sessions per week per active user |
| Conversion | 10% of "Birds for You" views result in eBird checklist clicks |

---

## Out of Scope (MVP)

The following features are deferred to future releases:

- Push notifications or email alerts for new nearby species
- Multiple saved locations / "trip mode"
- Social features (following other birders, sharing)
- In-app bird identification
- Offline-first / PWA functionality
- Native mobile apps (iOS/Android)
- Seasonal rarity scoring (out-of-season vagrants, early/late migrants)
- Address autocomplete / map-based location picker
- Bird photo upload or management (in-app)

---

## Future Roadmap

### Phase 2: Enhanced Discovery
- Multiple saved locations
- "Rare bird alerts" with configurable rarity threshold
- Historical sighting patterns ("Best time to see X")
- Seasonal rarity scoring

### Phase 3: Social & Community
- Follow other birders
- Share life list milestones
- Local birding hotspot recommendations

### Phase 4: Photo Library Management
- Upload and organize bird photos
- Auto-tag photos by species (ML-powered)
- Link photos to life list entries
- Export tools for sharing / printing

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| Life list | A cumulative list of all bird species a birder has observed |
| Lifer | A bird species seen for the first time (added to life list) |
| Checklist | An eBird submission documenting birds observed at a location/time |
| Hotspot | A popular birding location tracked by eBird |
| Notable | eBird's designation for species rare or unusual for a given region |

### References

- eBird API Documentation: https://documenter.getpostman.com/view/664302/S1ENwy59
- eBird Life List: https://ebird.org/lifelist?time=life&r=world
- eBird Terms of Use: https://www.birds.cornell.edu/home/ebird-api-terms-of-use/

---

*Document Version: 3.0 (MVP — restructured)*
*Last Updated: February 2026*
