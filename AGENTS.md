# Project Guidelines

## Code Style
- Vanilla JavaScript with small helper functions and direct DOM and Chrome API usage; follow patterns in [content.js](content.js) and [background.js](background.js).
- Popup UI keeps styling inline in HTML and minimal JS wiring; see [popup.html](popup.html) and [popup.js](popup.js).
- CSS is class-based with simple hover/opacity rules; keep selectors flat like [style.css](style.css).

## Architecture
- Manifest V3 extension with a background service worker that persists global settings and broadcasts to tabs; configuration in [manifest.json](manifest.json) and logic in [background.js](background.js).
- Content script injects export UI into tables, converts table data to CSV/JSON/Markdown, and writes to clipboard; see [content.js](content.js).
- Popup toggles the global visibility setting via message passing to background; see [popup.js](popup.js).
- Dynamic tables are handled via MutationObserver and scroll/resize repositioning in [content.js](content.js).

## Build and Test
- Install deps: `npm install`.
- Build packages and zips: `npm run build` (runs [scripts/build.js](scripts/build.js)).
- No automated tests or lint scripts are defined in [package.json](package.json).

## Project Conventions
- Single source manifest in repo; Firefox-specific changes are applied at build time in [scripts/build.js](scripts/build.js).
- Build output goes to dist/chrome and dist/firefox with versioned zip names; see [scripts/build.js](scripts/build.js).
- Content scripts run on all URLs and inject [style.css](style.css) globally; changes should be scoped to avoid site breakage.

## Integration Points
- Chrome extension APIs: runtime messaging and tab/window coordination in [background.js](background.js) and [content.js](content.js).
- Clipboard API is used for exports via user-initiated clicks in [content.js](content.js).

## Security
- Permissions include activeTab, clipboardWrite, and tabs in [manifest.json](manifest.json); avoid expanding unless necessary.
- Settings are stored locally in IndexedDB via the background worker; no network calls are present in current code.
