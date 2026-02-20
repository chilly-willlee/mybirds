# New Birds — Product Specification (MVP)

## Overview

**New Birds** is a web application that helps birders discover bird species they haven't seen yet by surfacing recent nearby sightings. By connecting to a user's eBird account, the app compares their life list against local sightings to highlight new birding opportunities.

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

### 1. Logged-Out Mode

Visitors who have not connected an eBird account see a curated landing experience designed to showcase the app's value and encourage sign-up.

#### Birds for You (Logged-Out)

A short list (up to 10 species) of relatively rare birds recently sighted near the visitor's location. Location is determined via browser geolocation (with a prompt).

**Scoring**: See [Rarity Scoring](#rarity-scoring) below.

**Species Entry Display (Logged-Out)**:
| Field | Description |
|-------|-------------|
| Species name | Common name, linked to eBird species page |
| Scientific name | Displayed in italics below common name |
| Reason | One or more tags explaining why this bird is notable (see [Rarity Scoring](#rarity-scoring)) |
| Users spotting | Number of unique users who spotted this species in the given timeframe |
| Last spotted | Most recent sighting date |
| Location hint | General area (e.g., "Lake Merritt, Oakland") |
| Distance | Miles from visitor's location (e.g., "12 mi away") |
| Checklist link | Link to the most recent eBird checklist containing this species |

#### Call to Action

- Prominent CTA: "Sign up to import your life list and see which of these you haven't spotted yet"
- Secondary CTA: "See your full life list and discover new birds nearby"
- CTA appears at the top and bottom of the Birds for You list

### 2. Authentication

- **Magic link (email-only)**: Passwordless auth via email. No passwords to manage.
- **No eBird OAuth**: The eBird API does not support OAuth. User authentication is independent of eBird.
- Life list data is imported via CSV upload (see below).

### 3. User Profile Settings Screen

#### Life List Import
- **CSV upload**: User downloads their life list from [ebird.org/lifelist](https://ebird.org/lifelist) ("Download CSV") or full observation history from [ebird.org/downloadMyData](https://ebird.org/downloadMyData), then uploads the CSV to New Birds
- Display import status: last imported date, total species count
- "Re-import" button to upload a newer CSV and refresh the life list
- Link to eBird download page with brief instructions

#### Location Settings
- **Browser geolocation**: One-click "Use My Location" with permission prompt
- **Manual address entry**: Text input with address autocomplete
- Display current saved location on a mini-map
- **Search radius**: Slider input (range: 1–100 miles, default: 25 miles)

### 4. User's Birding Life List Screen

Two tabs within this screen:

#### Tab A: "My Life List"

Displays all bird species the user has observed in their lifetime, sourced from their eBird account.

**Data Source**: `https://ebird.org/lifelist?time=life&r=world`

**Display Controls** (mirror eBird's interface):
- **View mode**: List view / Grid view
- **Sort options**:
  - Taxonomic order (default)
  - Date (newest first / oldest first)
  - Alphabetical (A–Z / Z–A)
- **Search/filter**: Text search by species name
- **Total count**: Display total species count prominently

**Species Entry Display**:
- Common name
- Scientific name
- Date last observed (most recent observation)
- Location last observed (most recent observation)
- Link to species page on eBird

#### Tab B: "Birds for You"

Recommends birds worth traveling to observe, spotted within the user's configured radius in the last 30 days. This view appears virtually identical to the logged-out "Birds for You" list, with additional logged-in-only fields.

**Purpose**: Help users discover birds that are interesting, rare, or new to them.

**Scoring**: See [Rarity Scoring](#rarity-scoring) below.

**Display Controls**:
- **Sort options**:
  - Distance (nearest first) — default
  - Last spotted (most recent first)
  - Alphabetical (A–Z)
- **Filter by**: Date range (last 7 days, 14 days, 30 days)

**Species Entry Display (Logged-In)**:
| Field | Description |
|-------|-------------|
| Species name | Common name, linked to eBird species page |
| Scientific name | Displayed in italics below common name |
| Reason | One or more tags explaining why this bird is recommended. Includes rarity reasons (see [Rarity Scoring](#rarity-scoring)) and, for species not on the user's life list, a "Lifer" tag |
| Times you spotted | Number of times the logged-in user has observed this species (0 for lifers) |
| Users spotting | Number of unique users who spotted this species in the given timeframe |
| Last spotted | Most recent sighting date |
| Location hint | General area (e.g., "Lake Merritt, Oakland") |
| Distance | Miles from user's location (e.g., "12 mi away") |
| Checklist link | Link to the most recent eBird checklist containing this species |

**Empty State**: "No recommended birds nearby in the last 30 days. Try expanding your search radius!"

---

## Rarity Scoring

Used by both the logged-out "Birds for You" and the logged-in "Birds for You" tab. A species is considered "relatively rare" based on a weighted combination of three signals, with extra weight given to the eBird rarity score:

| Signal | Weight | Description |
|--------|--------|-------------|
| Lifer | Highest (logged-in only) | Species not on the user's life list — the most valuable recommendation |
| eBird rarity score | High | Species with low regional frequency scores in eBird's abundance data |
| Seasonal rarity | Medium | Species that are uncommon for the current season in the region (out-of-range vagrants, early/late migrants) |
| Low checklist frequency | Medium | Species appearing on a small percentage of recent local checklists (last 30 days) |

Each species entry displays one or more **reason tags** explaining why it was included:
- **"Lifer"** (logged-in only) — species is not on the user's life list
- "Rare in this region" (eBird rarity score)
- "Unusual for February" (seasonal rarity)
- "Spotted on <2% of local checklists" (low checklist frequency)
- Multiple tags may appear if more than one signal applies

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
│  │ Connect your eBird account to   │    │
│  │ see which birds near you are    │    │
│  │ missing from your life list.    │    │
│  │                                 │    │
│  │ [Sign up with email →]       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  BIRDS FOR YOU                          │
│  📍 Oakland, CA                         │
│  ┌─────────────────────────────────┐    │
│  │ Varied Thrush                   │    │
│  │ Ixoreus naevius                 │    │
│  │ 🏷 Rare in this region          │    │
│  │ 🏷 Unusual for February         │    │
│  │ 5 users spotting                │    │
│  │ Last spotted: Today • 8 mi     │    │
│  │ 📍 Tilden Regional Park         │    │
│  │ [View Checklist →]              │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Lewis's Woodpecker              │    │
│  │ Melanerpes lewis                │    │
│  │ 🏷 <2% of local checklists     │    │
│  │ 2 users spotting                │    │
│  │ Last spotted: 2 days ago • 22mi│    │
│  │ 📍 Briones Regional Park        │    │
│  │ [View Checklist →]              │    │
│  └─────────────────────────────────┘    │
│  ...                                    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ See your full life list and     │    │
│  │ discover new birds nearby.      │    │
│  │ [Sign up with email →]         │    │
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
│  │ Last imported: Feb 15, 2026     │    │
│  │                                 │    │
│  │ [Upload new CSV]                │    │
│  │ [Download from eBird ↗]         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  LOCATION                               │
│  ┌─────────────────────────────────┐    │
│  │ 📍 Oakland, CA                  │    │
│  │ [Use My Location] [Enter Address]│   │
│  │                                 │    │
│  │ Search Radius: [==●======] 25mi │    │
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
│  ┌─────────────────────────────────┐    │
│  │ Northern Cardinal               │    │
│  │ Cardinalis cardinalis           │    │
│  │ Last seen: Jan 28, 2026         │    │
│  │ 📍 Prospect Park, NY            │    │
│  └─────────────────────────────────┘    │
│  ...                                    │
└─────────────────────────────────────────┘
```

### Screen: Birds for You (Tab B)

```
┌─────────────────────────────────────────┐
│  🐦 My Birds                            │
├─────────────────────────────────────────┤
│  [My Life List]  [Birds for You ●]      │
├─────────────────────────────────────────┤
│  📍 Oakland, CA • 25 mi radius          │
│  Sort: [Distance ▼]  Show: [30 days ▼]  │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ Varied Thrush                   │    │
│  │ Ixoreus naevius                 │    │
│  │ 🏷 Lifer  🏷 Rare in this region │    │
│  │ 🏷 Unusual for February         │    │
│  │ You: never • 5 users spotting   │    │
│  │ Last spotted: Today • 8 mi     │    │
│  │ 📍 Tilden Regional Park         │    │
│  │ [View Checklist →]              │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Lewis's Woodpecker              │    │
│  │ Melanerpes lewis                │    │
│  │ 🏷 Lifer  🏷 <2% of checklists  │    │
│  │ You: never • 2 users spotting   │    │
│  │ Last spotted: 2 days ago • 22mi│    │
│  │ 📍 Briones Regional Park        │    │
│  │ [View Checklist →]              │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Cedar Waxwing                   │    │
│  │ Bombycilla cedrorum             │    │
│  │ 🏷 Unusual for February         │    │
│  │ You: 3 times • 12 users spotting│    │
│  │ Last spotted: Yesterday • 15 mi│    │
│  │ 📍 Lake Merritt                 │    │
│  │ [View Checklist →]              │    │
│  └─────────────────────────────────┘    │
│  ...                                    │
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
- Query recent nearby observations (`/v2/data/obs/geo/recent`)
- Query notable/rare observations (`/v2/data/obs/geo/recent/notable`)
- Species taxonomy (`/v2/ref/taxonomy/ebird`)
- Checklist details (`/v2/product/checklist/view/{subId}`)
- **Radius limit**: Max 50km per query; geo-tiling used for larger radii

### Data Refresh Strategy

| Data Type | Refresh Frequency |
|-----------|-------------------|
| User's life list | On CSV re-import (user-triggered) |
| Nearby sightings | Cached 30 minutes |
| Taxonomy | Cached 24 hours |
| User location | On-demand (user-triggered) |

### Performance Requirements

- Initial page load: < 3 seconds
- Life list render: < 2 seconds for 500+ species
- Nearby sightings query: < 2 seconds

### Offline Considerations (MVP)

- Display cached life list when offline
- Show "last updated" timestamp

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
- Photo upload or management
- Offline-first / PWA functionality
- Native mobile apps (iOS/Android)

---

## Future Roadmap

### Phase 2: Enhanced Discovery
- Multiple saved locations
- "Rare bird alerts" with configurable rarity threshold
- Historical sighting patterns ("Best time to see X")

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

### References

- eBird API Documentation: https://documenter.getpostman.com/view/664302/S1ENwy59
- eBird Life List: https://ebird.org/lifelist
- eBird Terms of Use: https://www.birds.cornell.edu/home/ebird-api-terms-of-use/

---

*Document Version: 1.0 (MVP)*
*Last Updated: February 2026*
