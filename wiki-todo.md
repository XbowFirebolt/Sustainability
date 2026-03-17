# Wiki Improvement To-Do List

A running list of improvements for the wiki feature — functionality, visuals, content, and organization.
Check off items as they're completed. Add notes inline as needed.

---

## Functionality

### User Data & Personalization

- [ ] **Export favorites** — download favorited species data as CSV or JSON
- [ ] **Per-species user notes** — freeform text field users can attach to any species (stored in localStorage), visible in modal footer

### Data Export & Integration

- [ ] **Bulk data export** — "Download all species data" button that exports the full `WIKI_DATA.items` array as JSON or CSV
- [ ] **Print / batch export** — option to export all species details (not just one) to PDF; currently only single-species print works

---

## Visuals & UI Polish

- [ ] **Dark mode support** — respect `prefers-color-scheme: dark` with an adjusted palette; add a manual toggle to the header

---

## Organization & Navigation

- [ ] **Open Graph / social meta tags** — add dynamic `og:title`, `og:description`, and `og:image` tags (based on `?species=` deep link) for rich previews when sharing links in Slack, Twitter, etc.
- [ ] **Contribution / error-report link** — button or small link in modal footer: "Suggest a correction" that deep-links to a GitHub issue or form

---

## Accessibility

- [ ] **ARIA live region for filter changes** — announce result count to screen readers when filters change (e.g., "Showing 4 results")
- [ ] **Skip-to-content link** — visually hidden `<a href="#wiki-grid">` at the top for keyboard users
- [ ] **High contrast mode** — respect `prefers-contrast: more` with stronger borders and higher text contrast

---

## Mobile / Touch

- [ ] **Swipe left/right in modal** — navigate Prev/Next via horizontal touch swipes on mobile
- [ ] **Mobile full-screen modal** — on small viewports (`<600px`) render the modal as a full-screen bottom sheet instead of a floating overlay
- [ ] **Drag-to-dismiss on mobile** — swipe the bottom sheet down to close it on touch devices
- [ ] **Pinch-to-zoom on gallery images** — allow pinch gesture inside the gallery overlay to zoom photos
- [ ] **Tap target audit** — ensure all interactive elements (chips, sort pills, tab buttons, star buttons) meet 44×44px minimum touch target size

---

## Architecture / Code Quality

- [ ] **Unit tests for core functions** — test `renderWikiGrid`, `openSpeciesModal`, filtering/sorting logic, and `isSpeciesIncomplete` independently
- [ ] **Offline / PWA support** — add a service worker to cache wiki assets (JS, CSS, images) so the page works offline or on slow connections
- [ ] **Config-driven badge and filter definitions** — move `HABITAT_BADGE`, `DIET_BADGE`, `TAG_BADGE`, `STATUS_ORDER` into `config.json` so they don't require editing `wiki.js` for new projects

---

## Completed

- [x] **Species comparison view** — select 2–3 species via checkboxes and open a side-by-side stat comparison table (lifePercent, size, diet, status, threats)
- [x] **Timeline / status-change view** — a secondary view showing all species IUCN status changes plotted across years; shows which species have declined or recovered
- [x] **Related species links in modal** — "You might also like" or "Related species" section at the bottom of the Overview tab, using cross-reference IDs
- [x] **Filter by data completeness tier** — add a "Data" filter chip group: Full / Standard / Stub, so users can find species with complete vs. incomplete data
- [x] **"New additions" indicator** — badge or section marking recently added species (use `lastUpdated` field or a `addedDate` field)
- [x] **Fuzzy search / typo tolerance** — search currently requires exact substrings; add simple fuzzy matching (e.g., "wale shark" → Whale Shark)
- [x] **Scientific name search** — ensure search matches `scientificName` field and shows "(Carcharodon carcharias)" hint in autocomplete suggestions
- [x] **Loading skeleton screens** — show card-shaped skeleton placeholders while the grid first renders, instead of an empty flash
- [x] **Lazy load images** — use IntersectionObserver on card image containers so off-screen photos don't load until scrolled into view
- [x] **Status progression visualization in statusHistory** — show directional arrows between status changes (↑ improved / ↓ declined) with color-coded severity
- [x] **Animated population trend chart** — draw the chart line from left to right when the Threats/Health Metrics tab first opens
- [x] **Photo loading blur-up** — load a tiny low-res placeholder first, then swap to full image (LQIP effect)
- [x] **Compact list view improvements** — in list view mode, add a small inline ring/bar and diet+habitat badges so it's more information-dense
- [x] **Habitat map in Overview tab** — if `habitatImage` is present, embed it in the Overview tab alongside the description
- [x] **Breadcrumb in modal** — show the active filter context users came from (e.g., "Filtered: Critically Endangered › 4 of 12") with prev/next respecting filter scope
- [x] **"About this wiki" page or modal** — brief explainer of data sources, tier definitions, lifePercent methodology, and how to contribute/report errors
- [x] **Debounce search input** — search re-renders on every keystroke; wrap handler in a ~150ms debounce to reduce unnecessary renders
- [x] **Cache rendered tab panel HTML** — don't re-build the tab panel DOM on every modal open; cache the result per species ID and reuse it on subsequent opens
- [x] **Preload next/previous species image on modal open** — speculatively preload the adjacent species' photo so Prev/Next nav feels instant
- [x] **Extract data.js schema documentation** — `data-schema.md` added documenting every field
- [x] **Data completeness audit script** — `scripts/check-completeness.js` added
- [x] **JSDoc type annotations** — `@typedef` comments for the WIKI_DATA schema added
- [x] **Tab state persistence during nav** — clicking Prev/Next remembers the active tab
- [x] **"Show Favorites Only" toggle** — quick button to filter grid to starred species only
- [x] **Clear all filters button** — single click to reset search, status chips, and sort
- [x] **"No results" empty state** — friendly message with clear-filters action
- [x] **Random species button** — "Surprise me" button that opens a random species modal
- [x] **Recently viewed tracking** — track opened species; "Recently Viewed" sort option
- [x] **Share / copy URL button** — clipboard button in modal header copies deep link
- [x] **Search within tabs** — search matches threat descriptions, action items, etc.
- [x] **Additional filter dimensions** — filter by habitat type, diet, geographic region
- [x] **Tag-based filtering** — filter chips for tags
- [x] **Multi-select favorites management** — bulk-remove stars in manage mode
- [x] **Favorites count badge** — count shown on the Favorites toggle button
- [x] **Keyboard shortcut help overlay** — press `?` to see all keyboard shortcuts
- [x] **Autocomplete / search suggestions** — as-you-type dropdown of matching species names
- [x] **Data completeness indicator** — "incomplete data" badge on stub-tier cards/modal
- [x] **Print / export** — print-friendly stylesheet + PDF export for single species
- [x] **Deep-link animation fallback** — `?species=` on page load uses fade-in instead of morph
- [x] **Life bar tooltip** — hover/tap explains what "Population health: X%" means
- [x] **Smoother Prev/Next transition** — modal content fades/slides on navigation
- [x] **Image zoom in modal** — click/tap hero image to open full-screen gallery overlay
- [x] **Multiple photos per species (gallery)** — swipeable gallery with thumbnail strip
- [x] **Progress ring on cards** — circular progress ring as visual health indicator
- [x] **Habitat + diet badges on cards** — icon badges for quick at-a-glance info
- [x] **Interactive population chart** — hover/tap data points for year + value tooltips
- [x] **Compact vs. expanded card view toggle** — grid / masonry / list view modes
- [x] **Masonry grid option** — variable-height masonry layout
- [x] **Sticky search bar** — search input stays visible while scrolling
- [x] **Animate status chips appearance** — stagger-animate At a Glance chips on load
- [x] **Species count badge in status chips** — large count above label, badge style
- [x] **Count-up animation in modal** — lifePercent number counts up on modal open
- [x] **Card hover lift** — elevation/shadow increase on hover
- [x] **Dynamic page title** — project name in header and browser tab title
- [x] **Reorder tabs** — Overview → Threats → Health Metrics → Action Items
- [x] **Add an "Overview" tab** — description, habitat, diet, size, IUCN status in one place
- [x] **Move threat severity legend to tooltip** — shown on hover over `?` icon
- [x] **Group grid by status** — optional sectioned layout with status headers
- [x] **Sort + filter state in URL** — search/sort/filter serialized to URL params for shareable views
- [x] **Section headers in modal** — visual section grouping within tab panels
- [x] **Focus trap in modal** — tab key cycles only within the open modal
- [x] **Search result highlighting** — matched text highlighted with `<mark>` in cards and tab content
- [x] **Keyboard navigation in grid** — arrow keys move focus; Enter opens; `?` opens shortcuts
- [x] **More descriptive ARIA labels** — star buttons say "Favorite Great White Shark" etc.
- [x] **Collapsible filter/sort panel** — all filter dimensions behind a "Filter ▾" toggle
- [x] **Pagination / infinite scroll** — virtualized grid renders species in pages via IntersectionObserver
