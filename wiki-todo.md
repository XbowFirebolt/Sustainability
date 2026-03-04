# Wiki Improvement To-Do List

A running list of improvements for the wiki feature — functionality, visuals, content, and organization.
Check off items as they're completed. Add notes inline as needed.

---

## General To-Dos

### Content & Data

- [ ] Add real photos for all species (currently only Great White has one)
- [ ] Complete Vital Signs tab data for all species (size, weight, lifespan, diet, habitat stats)
- [ ] Add physical scale images for all species (like white_shark_size.png)
- [ ] Add habitat distribution map images for all species
- [ ] Add population trend chart data for all species (currently only Great White has this)
- [ ] Add prey decline + fishing pressure regional data for all species
- [ ] Add more shark species beyond the current 5 (there are 500+ shark species)
- [x] Add taxonomy info per species (Family, Order, Class) to Vital Signs
- [ ] Add geographic range description as a data field
- [ ] Add conservation status history (e.g., "Was Near Threatened in 2000, now Vulnerable")
- [ ] Add "related species" cross-references between cards
- [ ] Add links to external resources within species (papers, org pages) in Action Items
- [x] Add `emoji` field for all species (fallback in hero image area)
- [x] Add a `lastUpdated` timestamp per species for data freshness tracking

### Functionality

- [ ] **Species comparison view** — select 2–3 species and see a side-by-side stat comparison table
- [ ] **Pagination or infinite scroll** — for projects with many species, virtualize the grid so it doesn't render 500+ DOM nodes at once
- [ ] **Export favorites** — download favorited species data as CSV or JSON for offline reference

### Visuals & UI Polish

- [ ] **Loading skeleton screens** — show skeleton card shapes while species images load, instead of empty/blank cards
- [ ] **Lazy load images** — use IntersectionObserver so off-screen species photos don't load until scrolled into view
- [ ] **Dark mode support** — respect `prefers-color-scheme: dark` with an adjusted palette and toggle

### Organization & Navigation

- [ ] **Breadcrumb in modal** — show the filtered context the user came from (e.g., "Filtered: Critically Endangered › 2 of 2")
- [ ] **Open Graph meta tags** — add dynamic OG tags for rich social/Slack previews when sharing deep links

### Accessibility

- [ ] **ARIA live region for filter changes** — announce to screen readers when the species count changes after filtering (e.g., "5 results")
- [ ] **Skip-to-content link** — add a visually hidden skip link at the top of the page for keyboard users
- [ ] **High contrast mode** — respect `prefers-contrast: more` with adjusted palette

### Performance

- [ ] **Debounce search input** — search currently re-renders on every keystroke; add a short delay (e.g., 150ms setTimeout)
- [ ] **Cache rendered tab panel HTML** — don't re-render tab panel HTML on every modal open; cache it per species ID
- [ ] **Debounce modal resize recalculation** — if any resize listeners exist, ensure they're debounced

### Architecture / Code Quality

- [ ] **Support multiple wiki datasets per project** — allow a project to have sub-categories (e.g., "Sharks" + "Rays" in the same project)
- [ ] **Extract data.js schema documentation** — add a `data-schema.md` or comments in data.js explaining every field so new species are easy to add correctly
- [ ] **Add a second project's wiki** — implement a second `projects/<id>/data.js` for another sustainability project to validate the generic wiki architecture works beyond sharks
- [ ] **Unit tests for core functions** — test `renderWikiGrid`, `openSpeciesModal`, sorting/filtering logic independently
- [ ] **JSDoc type annotations** — add `@typedef` comments for the WIKI_DATA schema (items, vitalSigns, threats, etc.) so editors can provide autocomplete when editing data.js
- [ ] **Data completeness audit script** — a small browser-console or Node script that checks every species in WIKI_DATA.items and reports which fields are missing/empty
- [ ] **Offline / PWA support** — add a service worker to cache wiki assets so the page works offline

---

## Mobile / Touch Needs

- [ ] **Swipe left/right gesture** — navigate Prev/Next in modal via touch swipes on mobile
- [ ] **Mobile full-screen modal** — on small viewports render the modal as a full-screen bottom sheet instead of a floating overlay
- [ ] **Drag-to-dismiss on mobile** — allow swiping the modal sheet down to close it on touch devices
- [ ] **Pinch-to-zoom on gallery images** — on mobile, allow pinch gesture to zoom into hero photos (complement to the existing tap-to-fullscreen zoom)
- [ ] **Touch-friendly tap targets** — audit all interactive elements (chips, sort pills, tab buttons) to ensure they meet 44×44px minimum tap target size

---

## Completed

- [x] Add a `tags` array per species (e.g., `["pelagic", "apex predator", "reef"]`) to enable richer tag-based filtering
- [x] **Tab state persistence during nav** — when clicking Prev/Next, remember which tab was active instead of resetting to Vital Signs
- [x] **"Show Favorites Only" toggle** — quick button to filter grid to starred species only, separate from sort
- [x] **Clear all filters button** — single click to reset search, status chips, and sort to defaults
- [x] **"No results" empty state** — when filters return nothing, show a friendly message with a clear-filters action instead of a blank grid
- [x] **Random species button** — "Surprise me" button that opens a random species modal
- [x] **Recently viewed tracking** — track which species were opened, add a "Recently Viewed" sort option
- [x] **Share / copy URL button** — clipboard button in modal header that copies the deep link for that species
- [x] **Search within tabs** — allow search to match content inside threat descriptions, action items, etc.
- [x] **Additional filter dimensions** — filter by habitat type, diet (carnivore/omnivore), or geographic region
- [x] **Tag-based filtering** — filter chips or dropdown for tags (once `tags` field is added to data)
- [x] **Multi-select favorites management** — a "manage favorites" mode to bulk remove stars
- [x] **Favorites count badge** — show number of favorited species on the toggle button (e.g., "★ Favorites (3)")
- [x] **Keyboard shortcut help overlay** — press `?` to see all keyboard shortcuts for the wiki page
- [x] **Autocomplete / search suggestions** — as-you-type dropdown showing matching species names
- [x] **Data completeness indicator** — show on cards/modal if a species is missing data (e.g., a small "incomplete data" badge)
- [x] **Print / export** — print-friendly stylesheet or PDF export button for a species detail page
- [x] **Deep-link animation fallback** — when `?species=` is in the URL on page load, play a fade-in instead of the morph (morph requires visible source card)
- [x] **Life bar tooltip** — on hover/tap, explain what "Population health: X%" means and how it's calculated
- [x] **Smoother Prev/Next transition** — animate the modal content swap instead of an instant replace (fade or slide)
- [x] **Image zoom in modal** — click/tap on hero image to open a full-screen zoom view
- [x] **Multiple photos per species (gallery)** — swipeable image strip in the hero area when a species has more than one photo
- [x] **Progress ring on cards** — swap or supplement the life bar with a circular progress ring for a more visual health indicator
- [x] **Habitat + diet badges on cards** — small icon badges on the card for quick at-a-glance info (ocean, freshwater, omnivore, etc.)
- [x] **Interactive population chart** — hover/tap data points to see exact year and value tooltips
- [x] **Compact vs. expanded card view toggle** — let users switch between a dense compact list view and the current large card grid
- [x] **Masonry or variable-height grid option** — alternative to the fixed-width uniform grid
- [x] **Sticky search bar** — keep the search input visible as the user scrolls down the grid
- [x] **Animate status chips appearance** — stagger-animate the At a Glance chips on page load for a polished intro
- [x] **Species count badge in status chips** — make the count more prominent (e.g., large number above label), like an app badge
- [x] **Count-up animation in modal** — animate the lifePercent number counting up when the modal opens
- [x] **Card hover lift** — subtle elevation/shadow increase on card hover for a tactile feel
- [x] **Dynamic page title** — show the project name in the header (e.g., "Shark Wiki" not just "Wiki") and in the browser tab title
- [x] **Reorder tabs** — consider: Overview → Threats → Health Metrics → Action Items (lead with quick context, then data)
- [x] **Add an "Overview" tab** — a summary panel with: description, habitat, diet, size snapshot, and IUCN status blurb — the most-needed info in one place
- [x] **Move threat severity legend to tooltip** — instead of always showing the legend strip, show it on hover over a `?` icon near severity badges
- [x] **Group grid by status** — optional sectioned layout: "Critically Endangered (2)", "Vulnerable (1)", etc. as section headers
- [x] **Sort + filter state in URL** — serialize current search/sort/filter to URL params so users can share a filtered view (extend existing `?species=` deep link)
- [x] **Section headers in modal** — within tab panels, use clearer visual section grouping to reduce the wall-of-info feeling
- [x] **Focus trap in modal** — tab key should cycle only within the open modal, not reach background elements
- [x] **Search result highlighting** — matched text is highlighted with `<mark>` in cards (name, sci name, status) and inside Threats/Action Items tab content
- [x] **Keyboard navigation in grid** — arrow keys move focus between species cards; Enter opens the focused card; `?` opens the shortcut help overlay
- [x] **More descriptive ARIA labels** — star buttons say e.g. "Unfavorite Great White Shark" / "Favorite Great White Shark" everywhere (card stars, modal star)
- [x] **Collapsible filter/sort panel** — all filter dimensions (status, habitat, diet, region, tags) are hidden behind a "Filter ▾" toggle button; collapses to save space on any viewport

---

## Notes

- Only **Great White Shark** currently has complete data — all other 4 species need significant data work
- The architecture is already generic; a second project wiki can be added with just a new `data.js`
- Deep linking (`?species=great-white`) works with a fade-in animation fallback (morph requires a visible source card in the viewport)
- Modal morphing animation only works when the source card is visible in the viewport at open time
- Metric/imperial unit toggle is already implemented in the Vital Signs tab header
- Data sources (WIKI_DATA.sources) are already rendered at the bottom of the Vital Signs tab
