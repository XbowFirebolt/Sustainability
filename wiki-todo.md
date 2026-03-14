# Wiki Improvement To-Do List

A running list of improvements for the wiki feature — functionality, visuals, content, and organization.
Check off items as they're completed. Add notes inline as needed.

---

## Content & Data

### Species Data Completion

- [ ] **Promote remaining ~65 stubs to Full tier** — fill `vitalSigns`, `threats`, `actionItems`, `healthMetrics`, `statusHistory`, `populationTrend`, `populationTrendMeta`, `preyDeclineRegions`, `fishingPressureRegions`, `diet`, `size`, `habitatStats` for all stub-tier species
- [ ] **Add photos for ~65+ species without images** — image dirs exist for ~35 of ~100 species; remaining stubs need `photos` field + PNG in `images/<id>/`
- [ ] **Add `physicalScaleImage` for all Full-tier species** — Great White is the only species with one; 30+ Full (partial) species still missing this
- [ ] **Add `habitatImage` for most species** — only a handful have habitat distribution maps; ideally every Full-tier species should have one
- [ ] **Add geographic range description per species** — a short written summary of range as a data field (e.g., "Found throughout tropical and subtropical Atlantic waters")
- [ ] **Add "related species" cross-references** — `relatedSpecies` array of IDs per species, rendered as clickable links in the Overview tab
- [ ] **Add external resource links in Action Items** — each action item can include a `url` pointing to relevant org pages, petitions, or research papers
- [ ] **Verify and audit stub data accuracy** — funFact, description, lifePercent, and IUCN status for all ~65 stubs should be double-checked against IUCN Red List

### Metadata & Tracking

- [ ] **Overhaul species-tracker.md** — currently shows ~56 species, but config.json has ~100; rebuild the table to accurately track all species, tier, and what's missing per species
- [x] **Add geographic range description field** — `geographicRangeDescription` string for each species, shown in Overview tab
- [ ] **Add `conservationActions` field** — list international agreements protecting the species (CITES appendix, CMS, etc.) with current status; distinct from actionItems (those are reader-facing CTAs)
- [ ] **Add more species** — candidates for Phase 4: rays & skates (e.g., Giant Manta Ray, Sawfish species), stingrays, deep-sea sharks; would significantly expand the wiki's scope

---

## Functionality

### Navigation & Discovery

- [ ] **Species comparison view** — select 2–3 species via checkboxes and open a side-by-side stat comparison table (lifePercent, size, diet, status, threats)
- [ ] **Timeline / status-change view** — a secondary view showing all species IUCN status changes plotted across years; shows which species have declined or recovered
- [ ] **"Critically Endangered" spotlight section** — pinned section at the very top of the grid (before the main results) highlighting the most at-risk species
- [ ] **Related species links in modal** — "You might also like" or "Related species" section at the bottom of the Overview tab, using cross-reference IDs
- [ ] **Filter by data completeness tier** — add a "Data" filter chip group: Full / Standard / Stub, so users can find species with complete vs. incomplete data
- [ ] **Tag cloud / bubble visualization** — visual representation of all tags sized by species count; clicking a bubble filters to that tag
- [x] **"New additions" indicator** — badge or section marking recently added species (use `lastUpdated` field or a `addedDate` field)

### User Data & Personalization

- [ ] **Export favorites** — download favorited species data as CSV or JSON
- [ ] **Per-species user notes** — freeform text field users can attach to any species (stored in localStorage), visible in modal footer

### Search & Filtering

- [x] **Fuzzy search / typo tolerance** — search currently requires exact substrings; add simple fuzzy matching (e.g., "wale shark" → Whale Shark)
- [x] **Scientific name search** — ensure search matches `scientificName` field and shows "(Carcharodon carcharias)" hint in autocomplete suggestions

### Data Export & Integration

- [ ] **Bulk data export** — "Download all species data" button that exports the full `WIKI_DATA.items` array as JSON or CSV
- [ ] **Print / batch export** — option to export all species details (not just one) to PDF; currently only single-species print works

---

## Visuals & UI Polish

- [x] **Loading skeleton screens** — show card-shaped skeleton placeholders while the grid first renders, instead of an empty flash
- [x] **Lazy load images** — use IntersectionObserver on card image containers so off-screen photos don't load until scrolled into view (images currently load eagerly on card render)
- [ ] **Dark mode support** — respect `prefers-color-scheme: dark` with an adjusted palette; add a manual toggle to the header
- [x] **Status progression visualization in statusHistory** — in the conservation history timeline, show directional arrows between status changes (↑ improved / ↓ declined) with color-coded severity
- [x] **Animated population trend chart** — draw the chart line from left to right when the Threats/Health Metrics tab first opens, instead of appearing all at once
- [x] **Photo loading blur-up** — load a tiny low-res placeholder first, then swap to full image (LQIP effect) to reduce jarring blank-to-image flash
- [x] **Compact list view improvements** — in list view mode, add a small inline ring/bar and diet+habitat badges so it's more information-dense without needing to open the modal
- [x] **Habitat map in Overview tab** — if `habitatImage` is present, embed it in the Overview tab alongside the description (currently only viewable in gallery)

---

## Organization & Navigation

- [x] **Breadcrumb in modal** — show the active filter context users came from (e.g., "Filtered: Critically Endangered › 4 of 12") with prev/next respecting filter scope
- [ ] **Open Graph / social meta tags** — add dynamic `og:title`, `og:description`, and `og:image` tags (based on `?species=` deep link) for rich previews when sharing links in Slack, Twitter, etc.
- [x] **"About this wiki" page or modal** — brief explainer of data sources, tier definitions, lifePercent methodology, and how to contribute/report errors
- [ ] **Contribution / error-report link** — button or small link in modal footer: "Suggest a correction" that deep-links to a GitHub issue or form

---

## Accessibility

- [ ] **ARIA live region for filter changes** — announce result count to screen readers when filters change (e.g., "Showing 4 results")
- [ ] **Skip-to-content link** — visually hidden `<a href="#wiki-grid">` at the top for keyboard users
- [ ] **High contrast mode** — respect `prefers-contrast: more` with stronger borders and higher text contrast

---

## Performance

- [x] **Debounce search input** — search re-renders on every keystroke; wrap handler in a ~150ms debounce to reduce unnecessary renders
- [x] **Cache rendered tab panel HTML** — don't re-build the tab panel DOM on every modal open; cache the result per species ID and reuse it on subsequent opens
- [x] **Preload next/previous species image on modal open** — when a modal opens, speculatively preload the adjacent species' photo so Prev/Next nav feels instant

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
- [ ] **Support multiple wiki datasets per project** — allow a single project page to have sub-categories (e.g., "Sharks" + "Rays" tabs within the same wiki)
- [ ] **Add a second project's wiki** — implement a second `projects/<id>/data.js` for another sustainability topic to validate the generic wiki architecture beyond sharks
- [ ] **Config-driven badge and filter definitions** — move `HABITAT_BADGE`, `DIET_BADGE`, `TAG_BADGE`, `STATUS_ORDER` into `config.json` so they don't require editing `wiki.js` for new projects

---

## Completed

- [x] Add more shark species beyond the original 5 — now ~100 species across Full, Standard, and Stub tiers
- [x] **Extract data.js schema documentation** — `data-schema.md` added documenting every field
- [x] **Data completeness audit script** — `scripts/check-completeness.js` added
- [x] Add a `tags` array per species (e.g., `["pelagic", "apex predator", "reef"]`) to enable richer tag-based filtering
- [x] Add real photos for the first ~35 species (image dirs present for ~35 of ~100 species)
- [x] Add taxonomy info per species (Family, Order, Class) to Vital Signs
- [x] Add conservation status history per species (e.g., "Was Near Threatened in 2000, now Vulnerable")
- [x] Add `emoji` field for all species (fallback in hero image area)
- [x] Add a `lastUpdated` timestamp per species for data freshness tracking
- [x] **JSDoc type annotations** — `@typedef` comments for the WIKI_DATA schema added
- [x] Add population trend chart data for the majority of Full-tier species
- [x] Add prey decline + fishing pressure regional data for Full-tier species
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

---

## Notes

- **~100 species** currently in `config.json` (species-tracker.md is outdated and needs an overhaul — it only reflects ~56 species)
- **~35 species** have photos in `images/<id>/`; the rest display the silhouette fallback
- **Full (partial)** tier ≈ 31 species (have photos + all data fields, missing `physicalScaleImage`)
- **Stub tier** ≈ 65+ species (basic fields only; no vitalSigns, threats, etc.)
- **Only Great White Shark** has both a `physicalScaleImage` and multiple gallery photos
- The wiki architecture is already generic; a second project just needs a new `data.js` + `config.json`
- Deep linking (`?species=carcharodon-carcharias`) works with fade-in fallback
- Metric/imperial unit toggle already implemented in Vital Signs tab header
- Data sources (`WIKI_DATA.sources`) rendered at the bottom of the Vital Signs tab
- Modal morph animation only works when the source card is visible in the viewport at open time
