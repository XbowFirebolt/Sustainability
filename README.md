# Sustainability Tracker

A web app for browsing and following sustainability projects — from reforestation and ocean cleanup to urban solar and rewilding. Each project themes the entire UI with its own color palette, and you can favorite projects to keep them in your personal dock.

## App Features

- **Project dock** — Infinite carousel of favorited projects on the home screen
- **Dynamic theming** — UI colors shift to match whichever project is active
- **Discover page** — Browse, search, and star projects
- **Account modal** — View account info and favorited projects
- **Persistent state** — Favorites, unit preferences, and account data saved to localStorage

## Wiki

The wiki is the main per-project experience. Each project has a `data.js` defining its species and data. The current project is **Shark Populations**.

### Browse & Filter

- **View modes** — Toggle between card grid, compact list, and masonry layout
- **Collapsible filter panel** — Filter by IUCN status, habitat, diet, geographic region, and tags — all behind a single "Filter ▾" toggle
- **Group by status** — Optionally section the grid by conservation status with counts
- **Live search** — Full-text search across name, scientific name, status, threats, and action items with result highlighting and autocomplete suggestions
- **Sorting** — Default, A→Z, health % (asc/desc), most threatened, recently viewed
- **Show Favorites Only** — Toggle to filter grid to starred species, with count badge
- **Clear filters** — Single button to reset all search, filter, and sort state
- **No results state** — Friendly empty state with a clear-filters shortcut
- **Sticky search bar** — Search input stays visible while scrolling
- **URL state** — Active search, filters, and sort are serialized into the URL for sharing filtered views

### Species Cards

- **Health bar + progress ring** — Visual population health indicator with tooltip explaining the metric
- **Habitat & diet badges** — At-a-glance icon badges on each card
- **Conservation status chip** — Color-coded IUCN status
- **Data completeness indicator** — Badge when a species is missing data
- **Hover lift** — Subtle elevation animation on hover
- **Keyboard navigation** — Arrow keys move focus between cards; Enter opens the modal

### Species Modal

- **5 tabs** — Overview, Vital Signs, Health Metrics, Threats, Action Items
- **Tab state persistence** — Active tab is remembered when navigating Prev/Next
- **Prev/Next navigation** — Browse species in current filtered order with animated transitions
- **Image gallery** — Swipeable hero image strip when a species has multiple photos; tap to open fullscreen zoom
- **Interactive population chart** — Hover/tap data points to see tooltips with year, value, and change indicator
- **Count-up animation** — Health percentage counts up when the modal opens
- **Metric/Imperial toggle** — Switch units in Vital Signs
- **Share button** — Copies the deep link for the current species to clipboard
- **Print / export** — Print-friendly view or PDF export of a species detail page
- **Morph animation** — Modal morphs from the source card; falls back to fade-in for deep links

### Navigation & UX

- **Deep linking** — `?species=<id>` opens a species modal directly on page load
- **Random species** — "Surprise me" button opens a random species modal
- **Recently viewed** — Tracks opened species; available as a sort option
- **Keyboard shortcuts** — Arrow keys, Escape, Tab, and `?` (opens shortcut help overlay) all work in the wiki
- **Focus trap** — Tab key cycles only within the open modal
- **Animated status chips** — At a Glance chips stagger-animate on page load

### Accessibility

- **ARIA labels** — Star buttons describe their action and target species by name
- **Live region** — Screen readers are notified when species count changes after filtering
- **Skip-to-content link** — Visually hidden skip link for keyboard users

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
