# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static single-page web app hosted at [dropgenerator.com](https://dropgenerator.com). It generates random Fortnite drop locations — either a named POI or a completely random map coordinate — using the live Fortnite API.

No build system, no package manager, no dependencies. Open `index.html` directly in a browser to run locally.

## Architecture

**Three files do everything:**

- `index.html` — Single page. Injects `generator.js` with a cache-busting timestamp query param on every load.
- `css/style.css` — All styles. The map uses `object-fit: contain` with letterboxing, which drives the coordinate math in JS.
- `scripts/generator.js` — All logic. Self-contained IIFE.

**`generator.js` data flow:**

1. On init, fetches `https://fortnite-api.com/v1/map` (live API, no key required)
2. Uses `images.blank` from the response as the map image src (label-free map)
3. Filters POIs whose `id` starts with `"Athena.Location.POI."` to get named locations
4. Auto-calibrates `WORLD_CX`, `WORLD_CY`, `RANGE_X`, `RANGE_Y` from the POI bounding box so markers stay accurate as the map changes each season
5. `worldToImagePixel()` converts Fortnite world coords → natural image pixels (uses a `* 0.66` fudge factor to correct for the API's coordinate scale)
6. `imagePixelToScreen()` accounts for `object-fit: contain` letterboxing to convert natural pixels → on-screen pixels

**Click tracking** — Both buttons POST to `https://click-tracker-server-avsz.onrender.com/click` (external server on Render). The total is polled every 5 seconds and displayed in `#total`.

**Two marker types:**
- `.marker` div — text label for named POIs (Random POI button)
- `#node-marker` span — red dot for random spots (Random Spot button)
Only one is visible at a time; they toggle each other's `visibility`.

## External Dependencies

- `https://fortnite-api.com/v1/map` — map image + POI data (no API key needed)
- `https://click-tracker-server-avsz.onrender.com` — click counter server (separate project)
- Google Analytics: `G-1HWWMJBJS9`

## Deployment

Deployed via GitHub Pages from the `main` branch. The `CNAME` file sets the custom domain `dropgenerator.com`. Push to `main` to deploy.

## Git Workflow

After every change, always:
1. `git add` the modified files
2. Commit with a clean, descriptive message summarizing what changed and why
3. `git push origin main` to sync with GitHub

This keeps a full version history on GitHub so any change can be reverted easily.

## Known Quirks

- The `* 0.66` scale factor in `worldToImagePixel()` is a calibration constant — don't remove it without re-testing marker placement across multiple POIs.
- Buttons are disabled until both the API fetch and image load complete (`waitForImage` promise).
- The map image src is replaced at runtime with the API's blank map, overriding the fallback `src` in the HTML.
