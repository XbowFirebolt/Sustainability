# Sustainability Tracker

A web app for browsing and following sustainability projects — from reforestation and ocean cleanup to urban solar and rewilding. Each project themes the entire UI with its own color, and you can favorite projects to keep them in your personal dock.

## Features

- **Project dock** — Infinite carousel of your favorited projects on the home screen
- **Dynamic theming** — The UI colors shift to match whichever project is active
- **Discover page** — Browse and search all projects, star favorites
- **Species wiki** — Per-project species browser with filtering, sorting, favorites, and a detailed modal
- **Account modal** — View your account info and favorited projects
- **Persistent state** — Favorites, unit preferences, and account data saved to localStorage

## Wiki Features

The wiki is the main per-project experience. Each project has a `data.js` that defines its species/items. Current project: **Shark Populations**.

- **Grid view** — Cards with health bar, conservation status, and favorite star
- **Filtering** — Filter by IUCN conservation status via "At a Glance" chips; toggle "Show Favorites Only"
- **Search** — Live text search across name, scientific name, and status
- **Sorting** — Default, A→Z, health % (ascending/descending), most threatened
- **Clear filters** — Single button to reset all search, filter, and sort state
- **Species modal** — Detailed view with 5 tabs: Overview, Vital Signs, Health Metrics, Threats, Action Items
- **Prev/Next navigation** — Browse species in current filtered order with animated transitions
- **Metric/Imperial toggle** — Switch units in the Vital Signs tab
- **Keyboard navigation** — Arrow keys, Escape, and Tab work inside the modal
- **Deep linking** — `?species=<id>` in the URL opens a species modal directly
- **Favorites** — Per-project favorites persisted to localStorage

## Running Locally

```
npm start
```

Then open the URL printed in the terminal (default: http://localhost:3000).

No install step required — `npx serve` is used automatically.

## Project Structure

```
/
├── index.html              # Home page with project dock
├── discover.html           # Project discovery page
├── wiki.html               # Wiki species browser (project-specific)
├── js/
│   ├── shared.js           # Project catalog, theming, account, and dock logic
│   ├── wiki.js             # Wiki grid, modal, filtering, sorting, and tab rendering
│   ├── discover.js         # Discover page search and favorites logic
│   └── theme-init.js       # Early theme initialization (runs before page renders)
├── css/
│   └── styles.css          # Global stylesheet
├── assets/
│   └── map.png             # World map background image
└── projects/
    └── shark-populations/
        ├── data.js         # Species data for the Shark Populations wiki
        └── images/         # Species photos, scale images, habitat maps
```

## Adding a New Project Wiki

1. Create `projects/<project-id>/data.js` exporting a `window.WIKI_DATA` object
2. Add the project to `PROJECT_CATALOG` in `shared.js`
3. The wiki page reads `WIKI_DATA` dynamically — no other changes needed

See `projects/shark-populations/data.js` for the full data schema (items, vitalSigns, threats, populationTrend, etc.).
