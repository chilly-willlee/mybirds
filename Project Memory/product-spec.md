# My Birds — Product Specification (MVP)

## Overview

**My Birds** is a web application that helps birders discover bird species they haven't seen yet by surfacing recent nearby sightings. Users import their eBird life list via CSV, and the app compares it against local sightings to highlight new birding opportunities.

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

#### Birds for Me

A paginated list (20 per page, "Show more" button) of relatively rare birds recently sighted near the user's location. Location is determined via browser geolocation (with a prompt) or by ZIP code.

**Location bar** (appears above the bird list, visible to all users):
- **Use My Location**: One-click button that triggers browser geolocation
- **ZIP code**: Text input + "Go" button to set location by ZIP code
- **Search radius**: Slider (1–25 mi, default 10 mi) — displayed inline with the above on tablet/desktop; wraps to a second row on mobile

**Controls**:
- **Sort**: Score (default), Distance, Date, Alphabetical
- **Lookback**: 1 day, 3 days, 7 days (max)

**Scoring**: See [Rarity Scoring](#rarity-scoring) below.

**Species Entry Display** (one card per species, top to bottom):

| Line | Content |
|------|---------|
| Name | Common name (linked to eBird species page) followed by scientific name in italics in parentheses — e.g., `Varied Thrush (Ixoreus naevius)` |
| Tags | One or more reason tags explaining why this bird is notable (see [Rarity Scoring](#rarity-scoring)). Omitted if no tags. |
| Photos | Up to 3 thumbnails sourced from the checklists referenced by this entry. Each thumbnail links to its originating checklist. Omitted if no photos. |
| Stats | `Last seen: [relative time] · [distance] mi away · [location]` — e.g., `Last seen: 3 hours ago · 8 mi away · Tilden Regional Park`. Relative time: "Just now" (< 1h), "X hours ago" (< 24h), "Yesterday", "X days ago" (< 7d), or short date. Location name is truncated with CSS ellipsis to prevent the line from wrapping. |
| My sightings | `I've seen: never`, `I've seen: 1 time`, or `I've seen: [N] times` — logged-in users only |
| CTA | "Show recent sightings" link that expands the Species Detail section inline |

**Species Detail** (inline, below the card entry, loaded on demand):

A loading skeleton is shown while data is fetched. Once loaded, the detail section displays:

| Element | Content |
|---------|---------|
| Sighting count | `[N] sighting[s] nearby in the last [N] day[s]` — count of unique recent observation entries from the eBird per-species endpoint |
| Checklists | All recent nearby checklists for this species, listed as: `[date] · [X] mi away · [location name] [📷 (N)]` — each location name links to the eBird checklist. The location name is truncated with CSS ellipsis to prevent the line from wrapping. If photos of this species were submitted with the checklist, a camera icon and count `📷 (N)` appear at the end, also linking to the checklist. Count is per-species (from `mediaCounts.P` in the eBird checklist view API). Omitted when no photos. |

"Hide" collapses the section.

### 2. Logged-Out Mode

Visitors who have not signed in see a curated landing experience designed to showcase the app's value and encourage sign-up.

The logged-out landing page displays the Birds for Me list (see [All Users](#1-all-users)) alongside CTAs to sign up.

**Call to Action**:
- Prominent CTA: "Sign up to import your life list and see which of these you haven't spotted yet"
- Secondary CTA: "See your full life list and discover new birds nearby"
- CTA appears at the top and bottom of the Birds for Me list

### 3. Authentication

- **Magic link (email-only)**: Passwordless auth via email. No passwords to manage.
- **No eBird OAuth**: The eBird API does not support OAuth. User authentication is independent of eBird.
- Life list data is imported via CSV upload (see below).

### 4. Logged-In Mode

#### Birds for Me (Logged-In)

Logged-in users see the same Birds for Me list as logged-out users (see [All Users](#1-all-users)), with one addition: species not on the user's life list are tagged as **"Lifer"** and receive the highest rarity score weight. The display also shows how many times the logged-in user has personally observed each species.

**Additional Species Entry Lines (Logged-In)**:
| Line | Content |
|------|---------|
| Lifer tag | "Lifer" reason tag added to the tags line if species is not on the user's life list |
| My sightings | `I've seen: never`, `I've seen: 1 time`, or `I've seen: [N] times` — displayed between the stats line and the "Show details" CTA |

#### Life List Screen

Displays all bird species the user has observed in their lifetime, sourced from their uploaded CSVs. Headline: **"Life List"**.

**Data Source**: Two separate Life List CSV downloads from `https://ebird.org/lifelist?time=life&r=world`. The eBird Life List page has a sort order control; the CSV's `Date` column reflects whichever date is the active sort key:
- **First Seen CSV**: Sort by "Date first observed" before downloading. `Date` = date of first sighting.
- **Last Seen CSV**: Sort by "Date last observed" before downloading. `Date` = date of most recent sighting.

Both CSVs share the same file format. They are uploaded separately using the type selector in the upload controls.

**Upload Controls** (shown above the species list):
- **Two upload buttons**: `Upload CSV: [First Seen] [Last Seen]` — each button opens a file picker and uploads directly as that type.
- **Import status**: Two status lines, one per type — e.g. `First seen: 847 species · Feb 5, 2026` and `Last seen: 847 species · Feb 5, 2026`. Each shows "not uploaded" until that type has been imported.
- **Download link**: `Download from eBird ↗` links to `https://ebird.org/lifelist?time=life&r=world`.

**Display Controls** (search row, below upload controls; wraps on mobile):
- **Search**: Text search by species name
- **Sort**: Newest first (default), Oldest first, A–Z, Z–A, Taxonomic. Date-based sort options (Newest/Oldest) sort by whichever date mode is active.
- **Date mode toggle**: Segmented control `[First Seen | Last Seen]` — always shown. A mode is greyed out (disabled with tooltip "Upload [First/Last] Seen CSV to enable") if that CSV has not been uploaded yet.
- **Total count**: Displayed above the upload controls, e.g. `342 species`

**Species Entry Display**:

| Line | Content |
|------|---------|
| Line 1 | `[Common Name] (Scientific name)` — common name links to eBird species page (`/species/{speciesCode}`). "Seen N times ↗" shown right-aligned, linking to `https://ebird.org/lifelist?r=world&time=life&spp={speciesCode}` (only shown when observationCount > 0 and speciesCode available). |
| Line 2 | `First seen: [date] · [location]` or `Last seen: [date] · [location]` depending on date mode. Date links to its eBird checklist. Location links to eBird life list for that location (if locationId available). If the selected mode's data is missing for a species, falls back to the other mode's date. |
| Line 3 | `[📷 Show photos]` — on-demand photo thumbnails from last-spotted checklist. Up to 3 thumbnails, each linking to the checklist. Only shown when speciesCode and last checklist ID are available. |

**Links**: No underline by default; underline appears on hover. Consistent with Birds for You styling.

**Merge strategy**: Species lists from both CSVs are unioned. A species present in only one upload retains only that date; the missing date falls back to the available one for display purposes. Species are keyed by scientific name.

**Data notes**:
- `observationCount` ("Seen N times") is only populated from My Data CSV imports. Life List CSV imports do not include a total observation count; the field is set to 0 and "Seen N times" is hidden.
- `speciesCode` and `locationId` are populated at import time. Older imports may require re-upload.

#### User Profile Settings

##### Life List Import
- **Upload controls on Life List screen** (not in Settings): the upload type selector, CSV upload button, and import status are located directly on the Life List screen above the species list.
- Settings screen does not have a separate life list section.

##### Location Settings
- All location controls (Use My Location, ZIP code, radius) live on the Birds for You screen
- No location settings in this screen

---

## Rarity Scoring

Used by both the logged-out and logged-in Birds for You. A species is scored by a weighted combination of signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| Lifer | 1000 (logged-in only) | Species not on the user's life list — the most valuable recommendation |
| Notable (eBird rarity) | 500 | Species flagged as rare by eBird's regional rarity system |
| Checklist notes | 150 | Species with observer-written descriptions or notes on the checklist (indicates likely rare/confirmed sighting) |
| Last spotted | 150 | Proportional recency bonus: +150 for observations from today, scaling down to 0 for the oldest observation in the lookback window. Rewards very fresh sightings without a hard cutoff. |

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
- Location and radius controls are shown inline on the Birds for You screen, not in the navigation bar

### Screen: Logged-Out Landing

```
┌─────────────────────────────────────────┐
│  My Birds                     [Sign in] │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Discover your next lifer.       │    │
│  │ [Sign up with email →]          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  BIRDS FOR ME                           │
│                                         │
│  [📍 My Location] [ZIP: _____ Go]       │  ← location bar (mobile: 2 rows)
│  [══════●══════════════════] 10 mi      │  ← tablet/desktop: same row as above
│                                         │
│  Sort: [Score ▼]  [7d ▼]               │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Varied Thrush (Ixoreus naevius) │    │
│  │ 🏷 Rare in this region          │    │
│  │ [photo] [photo]                 │    │
│  │ Last seen: Today · 8 mi ·        │    │
│  │   Tilden Regional Park          │    │
│  │ Show recent sightings           │    │
│  └─────────────────────────────────┘    │
│  ...                                    │
│  [Show more (12 remaining)]             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [Sign up with email →]          │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘

Tablet/desktop — location bar condenses to one row:
  [📍 My Location]  [ZIP: _____ Go]  [══●══════] 10 mi
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
│└─────────────────────────────────────────┘
```

### Screen: Life List

```
┌─────────────────────────────────────────┐
│  Life List                              │
├─────────────────────────────────────────┤
│  342 species                            │
│  Upload CSV: [First Seen] [Last Seen]   │
│  Download from eBird ↗                  │
│  First seen: 847 species · Feb 5, 2026  │
│  Last seen:  not uploaded               │
├─────────────────────────────────────────┤
│  [Search...]  [Newest ▼]  [First|Last*] │  ← *Last greyed if not uploaded
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ American Robin          Seen    │    │
│  │ (Turdus migratorius)  42 times ↗│    │
│  │ First seen: Mar 15, 2024 ·      │    │
│  │   Central Park, NY              │    │
│  │ [📷 Show photos]                │    │
│  └─────────────────────────────────┘    │
│  ...                                    │
└─────────────────────────────────────────┘

Tablet/desktop — controls on one row:
  Upload CSV: [First Seen] [Last Seen]  [Download from eBird ↗]
  First seen: 847 species · Feb 5, 2026 | Last seen: 847 species · Feb 5, 2026
  [Search species.......] [Newest ▼] [● First Seen | Last Seen]
```

---

## Branding Direction

### Name & Tagline
- **Name**: My Birds
- **Domain**: mybirds.app
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

Three eBird CSV import variants are supported:
- **Life List CSV – First Seen** (`ebird.org/lifelist`, sorted by "Date first observed" → Download CSV): one row per species; `Date`/`SubID`/`LocID` reflect the first sighting. Populates `firstObs*` columns.
- **Life List CSV – Last Seen** (`ebird.org/lifelist`, sorted by "Date last observed" → Download CSV): same format; `Date`/`SubID`/`LocID` reflect the most recent sighting. Populates `lastObs*` columns.
- **My Data export** (`ebird.org/downloadMyData`): one row per observation; columns include `Submission ID`, `Taxonomic Order`. Populates both `firstObs*` and `lastObs*` from the earliest/latest rows, and `observationCount` from total row count per species.

The two Life List CSV variants use the same parser; the upload type selector in the UI determines which DB columns are written.

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

*Document Version: 3.2 (Beta v0.1)*
*Last Updated: February 2026*
