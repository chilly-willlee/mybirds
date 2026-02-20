# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**New Birds** is a web application that helps birders discover species they haven't seen by comparing their eBird life list against recent nearby sightings. The product spec lives in `Project Memory/product-spec.md`.

## Project Status

Pre-development. The product specification is complete; no code has been written yet.

## Key Concepts

- **Birds for You**: The core recommendation feature, shown to both logged-out and logged-in users. Surfaces rare/interesting birds spotted nearby, scored by a weighted rarity algorithm (Lifer > eBird rarity > seasonal rarity ≈ checklist frequency).
- **Lifer**: A bird species the user has never observed. Highest-weight signal in the scoring system.
- **eBird integration**: eBird is the sole auth provider (OAuth). Life list data, nearby observations, and species taxonomy all come from the eBird API v2.

## Architecture Decisions (from spec)

- Two screens: User Profile Settings and Birding Life List (with "My Life List" / "Birds for You" tabs)
- Logged-out landing page shows "Birds for You" list with CTA to connect eBird
- Location: browser geolocation by default, manual override in settings
- Search radius: configurable slider, 1–100 miles, default 25
- Responsive: mobile (320–767px), tablet (768–1023px), desktop (1024+)
- Branding: Inter font, Forest Green (#2D5A3D) primary, Golden Yellow (#F4B942) accent

## Development Guidelines

- Limit comments inside the code
- Test all changes before marking complete
- Prefer to run single tests and not the whole suite for performance reasons

## Important Notes

**Credentials & API Keys:**: Any time there are credentials, API keys, etc make sure to store them in a `.env` file

## Project Memory Folder

The Project Memory folder is key to understanding the project and allows you to continue effectively.

**Core Files:**

- `product-spec.md` - All core requirements and goals
- `technical-spec.md` - Key technical design decisions and system patterns to stay consistent
- `progress.md` - Current work focus, recent changes, what's left to build, current status and known issues

**Project Memory Updates occur when:**

- Discovering new project patterns
- After implementing significant changes
- When user requets with "update proj memory" (MUST review all files)

**Note:** When triggered by "update proj memory", review every memory bank file, even if some don't require updates. The project memory must be maintained with precision and clarity as effectiveness in building the project depends on it.