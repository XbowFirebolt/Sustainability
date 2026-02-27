# Wiki Improvement To-Do List

A running list of improvements for the wiki feature — functionality, visuals, content, and organization.
Check off items as they're completed. Add notes inline as needed.

---

## Content & Data

- [ ] Add real photos for all species (currently only Great White has one)
- [ ] Complete Vital Signs tab data for all species (size, weight, lifespan, diet, habitat stats)
- [ ] Add physical scale images for all species (like white_shark_size.png)
- [ ] Add habitat distribution map images for all species
- [ ] Add population trend chart data for all species (currently only Great White has this)
- [ ] Add prey decline + fishing pressure regional data for all species
- [ ] Add more shark species beyond the current 5 (there are 500+ shark species)
- [ ] Add taxonomy info per species (Family, Order, Class) to Vital Signs
- [ ] Add geographic range description as a data field
- [ ] Add conservation status history (e.g., "Was Near Threatened in 2000, now Vulnerable")
- [ ] Add "related species" cross-references between cards
- [ ] Add links to external resources within species (papers, org pages) in Action Items
- [ ] Add `emoji` field for all species (fallback in hero image area)
- [ ] Add a `lastUpdated` timestamp per species for data freshness tracking
- [ ] Add a `tags` array per species (e.g., `["pelagic", "apex predator", "reef"]`) to enable richer tag-based filtering

---

## Functionality

- [x] **Tab state persistence during nav** — when clicking Prev/Next, remember which tab was active instead of resetting to Vital Signs
- [x] **"Show Favorites Only" toggle** — quick button to filter grid to starred species only, separate from sort
- [x] **Clear all filters button** — single click to reset search, status chips, and sort to defaults
- [x] **"No results" empty state** — when filters return nothing, show a friendly message with a clear-filters action instead of a blank grid
- [x] **Random species button** — "Surprise me" button that opens a random species modal
- [x] **Recently viewed tracking** — track which species were opened, add a "Recently Viewed" sort option
- [x] **Share / copy URL button** — clipboard button in modal header that copies the deep link for that species
- [ ] **Search within tabs** — allow search to match content inside threat descriptions, action items, etc.
- [ ] **Additional filter dimensions** — filter by habitat type, diet (carnivore/omnivore), or geographic region
- [ ] **Tag-based filtering** — filter chips or dropdown for tags (once `tags` field is added to data)
- [ ] **Species comparison view** — select 2–3 species and see a side-by-side stat comparison table
- [ ] **Multi-select favorites management** — a "manage favorites" mode to bulk remove stars
- [x] **Favorites count badge** — show number of favorited species on the toggle button (e.g., "★ Favorites (3)")
- [ ] **Keyboard shortcut help overlay** — press `?` to see all keyboard shortcuts for the wiki page
- [ ] **Autocomplete / search suggestions** — as-you-type dropdown showing matching species names
- [ ] **Data completeness indicator** — show on cards/modal if a species is missing data (e.g., a small "incomplete data" badge)
- [ ] **Print / export** — print-friendly stylesheet or PDF export button for a species detail page
- [ ] **Pagination or infinite scroll** — for projects with many species, virtualize the grid so it doesn't render 500+ DOM nodes at once
- [ ] **Swipe left/right gesture** — navigate Prev/Next in modal via touch swipes on mobile
- [ ] **Deep-link animation fallback** — when `?species=` is in the URL on page load, play a fade-in instead of the morph (morph requires visible source card)
- [ ] **Life bar tooltip** — on hover/tap, explain what "Population health: X%" means and how it's calculated

---

## Visuals & UI Polish

- [x] **Smoother Prev/Next transition** — animate the modal content swap instead of an instant replace (fade or slide)
- [x] **Image zoom in modal** — click/tap on hero image to open a full-screen zoom view
- [x] **Multiple photos per species (gallery)** — swipeable image strip in the hero area when a species has more than one photo
- [x] **Progress ring on cards** — swap or supplement the life bar with a circular progress ring for a more visual health indicator
- [x] **Habitat + diet badges on cards** — small icon badges on the card for quick at-a-glance info (ocean, freshwater, omnivore, etc.)
- [ ] **Loading skeleton screens** — show skeleton card shapes while species images load, instead of empty/blank cards
- [ ] **Lazy load images** — use IntersectionObserver so off-screen species photos don't load until scrolled into view
- [ ] **Interactive population chart** — hover/tap data points to see exact year and value tooltips
- [ ] **Compact vs. expanded card view toggle** — let users switch between a dense compact list view and the current large card grid
- [ ] **Masonry or variable-height grid option** — alternative to the fixed-width uniform grid
- [ ] **Better color coding on region grids** — color the region cards by severity with stronger visual contrast
- [ ] **Sticky search bar** — keep the search input visible as the user scrolls down the grid
- [ ] **Animate status chips appearance** — stagger-animate the At a Glance chips on page load for a polished intro
- [ ] **Species count badge in status chips** — make the count more prominent (e.g., large number above label), like an app badge
- [ ] **Count-up animation in modal** — animate the lifePercent number counting up when the modal opens
- [ ] **Mobile full-screen modal** — on small viewports render the modal as a full-screen bottom sheet instead of a floating overlay
- [ ] **Drag-to-dismiss on mobile** — allow swiping the modal sheet down to close it on touch devices
- [x] **Card hover lift** — subtle elevation/shadow increase on card hover for a tactile feel

---

## Organization & Navigation

- [x] **Dynamic page title** — show the project name in the header (e.g., "Shark Wiki" not just "Wiki") and in the browser tab title
- [ ] **Collapsible filter/sort panel** — on mobile, collapse the status chips + sort controls behind a "Filters" button to save vertical space
- [x] **Reorder tabs** — consider: Overview → Threats → Health Metrics → Action Items (lead with quick context, then data)
- [x] **Add an "Overview" tab** — a summary panel with: description, habitat, diet, size snapshot, and IUCN status blurb — the most-needed info in one place
- [ ] **Move threat severity legend to tooltip** — instead of always showing the legend strip, show it on hover over a `?` icon near severity badges
- [ ] **Group grid by status** — optional sectioned layout: "Critically Endangered (2)", "Vulnerable (1)", etc. as section headers
- [ ] **Breadcrumb in modal** — show the filtered context the user came from (e.g., "Filtered: Critically Endangered › 2 of 2")
- [ ] **Sort + filter state in URL** — serialize current search/sort/filter to URL params so users can share a filtered view (extend existing `?species=` deep link)
- [ ] **Open Graph meta tags** — add dynamic OG tags for rich social/Slack previews when sharing deep links
- [ ] **Section headers in modal** — within tab panels, use clearer visual section grouping to reduce the wall-of-info feeling

---

## Accessibility

- [ ] **Focus trap in modal** — tab key should cycle only within the open modal, not reach background elements
- [ ] **ARIA live region for filter changes** — announce to screen readers when the species count changes after filtering (e.g., "5 results")
- [ ] **More descriptive ARIA labels** — e.g., star button should say "Add Great White Shark to favorites" not just "Favorite species"
- [ ] **Skip-to-content link** — add a visually hidden skip link at the top of the page for keyboard users
- [ ] **High contrast mode** — respect `prefers-contrast: more` with adjusted palette

---

## Performance

- [ ] **Debounce search input** — ensure search doesn't re-render on every keystroke, only after a short delay (check if already in place)
- [ ] **Cache rendered tab panel HTML** — don't re-render tab panel HTML on every modal open; cache it per species ID
- [ ] **Debounce modal resize recalculation** — if any resize listeners exist, ensure they're debounced

---

## Architecture / Code Quality

- [ ] **Support multiple wiki datasets per project** — allow a project to have sub-categories (e.g., "Sharks" + "Rays" in the same project)
- [ ] **Extract data.js schema documentation** — add a `data-schema.md` or comments in data.js explaining every field so new species are easy to add correctly
- [ ] **Add a second project's wiki** — implement a second `projects/<id>/data.js` for another sustainability project to validate the generic wiki architecture works beyond sharks
- [ ] **Unit tests for core functions** — test `renderWikiGrid`, `openSpeciesModal`, sorting/filtering logic independently
- [ ] **JSDoc type annotations** — add `@typedef` comments for the WIKI_DATA schema (items, vitalSigns, threats, etc.) so editors can provide autocomplete when editing data.js
- [ ] **Data completeness audit script** — a small browser-console or Node script that checks every species in WIKI_DATA.items and reports which fields are missing/empty

---

## Notes

- Only **Great White Shark** currently has complete data — all other 4 species need significant data work
- The architecture is already generic; a second project wiki can be added with just a new `data.js`
- Deep linking (`?species=great-white`) works but skips the morph animation — tracked as a todo above (fade-in fallback)
- Modal morphing animation only works when the source card is visible in the viewport at open time
- Metric/imperial unit toggle is already implemented in the Vital Signs tab header
- Data sources (WIKI_DATA.sources) are already rendered at the bottom of the Vital Signs tab
