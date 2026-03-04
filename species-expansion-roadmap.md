# Species Expansion Roadmap: 1 → 500+ Sharks

A phased plan for expanding the shark wiki from its current state (5 species in data.js, only 1 fully complete) to a comprehensive catalog of 500+ species.

---

## Current State

| Species | Complete? | Notes |
|---|---|---|
| Great White Shark | ✅ Full | Photos, vitalSigns, populationTrend, prey/fishing regions, healthMetrics, threats, actionItems |
| Scalloped Hammerhead | ⚠️ Partial | Has threats; missing vitalSigns, populationTrend, regions, healthMetrics |
| Whale Shark | ⚠️ Partial | Similar gaps |
| Shortfin Mako | ⚠️ Partial | Similar gaps |
| Oceanic Whitetip | ⚠️ Partial | Similar gaps |

**Core problem:** The current `data.js` schema is hand-authored and deeply detailed. A single fully complete species entry is ~100 lines of JS. 500 species × 100 lines = 50,000+ lines — not feasible to write by hand.

---

## Guiding Principle: Tiered Completeness

Not all 500+ species need the same depth. Define three tiers so every species can be *present* without being a blocker:

| Tier | What's included | Target count |
|---|---|---|
| **Stub** | id, commonName, scientificName, statusLabel, lifePercent, habitatTypes, dietType, geographicRegions, tags, description, funFact | 500+ |
| **Standard** | Stub + vitalSigns, threats, actionItems, diet, habitat, size | 50–100 priority species |
| **Full** | Standard + photos, physicalScaleImage, habitatImage, populationTrend, preyDeclineRegions, fishingPressureRegions, healthMetrics | 10–20 flagship species |

A stub species renders a complete, valid card in the grid and opens a working modal — it just shows an "Incomplete Data" badge (already implemented) for tabs that have no content yet.

---

## Phase 1 — Finish the Current 5 (now → complete)

Before scaling out, stabilize the foundation.

**Goals:**
- Bring the 4 partial species to at least **Standard tier**
- Confirm the data schema handles edge cases (no photos, no populationTrend, etc.) without JS errors
- Add the `emoji` field to all 5 as a hero fallback when no photo exists

**Why first:** Every bug found in 5 species is 500 bugs avoided later.

**Checklist:**
- [ ] Fill `vitalSigns` for Scalloped Hammerhead, Whale Shark, Shortfin Mako, Oceanic Whitetip
- [ ] Fill `healthMetrics` for the 4 partial species
- [ ] Add shark-silhouette fallback logic so species without real photos still look clean
- [ ] Add `emoji` field to all 5 (`🦈` works for most)
- [ ] Confirm modal renders gracefully when `populationTrend`, `preyDeclineRegions`, and `fishingPressureRegions` are empty arrays

---

## Phase 2 — Data Schema + Tooling (parallel to Phase 1)

Before adding species, make adding species easier.

### 2a. Document the schema

Extract the schema into `projects/shark-populations/data-schema.md`. Document every field: type, whether it's required, what happens if it's missing, and example values. This is the reference for anyone (or any script) authoring new entries.

Reference from `wiki-todo.md`:
> Extract data.js schema documentation — add a data-schema.md or comments in data.js explaining every field

### 2b. Write a data completeness checker

A small Node script (or browser console snippet) that reads `WIKI_DATA.items` and prints a table of which fields each species is missing. Run it before every batch add.

```
node scripts/check-completeness.js
# Scalloped Hammerhead: missing vitalSigns, populationTrend, photos (real)
# Whale Shark: missing vitalSigns, physicalScaleImage, habitatImage
```

Reference from `wiki-todo.md`:
> Data completeness audit script

### 2c. Consider splitting data.js

At 50+ species, a single `data.js` becomes hard to edit. Options:

- **One file per species:** `data/great-white.js`, `data/scalloped-hammerhead.js` — concatenated at build time
- **JSON source + JS wrapper:** author species in `.json` files, generate `data.js` via a build script

The JSON approach unlocks automation (pull from APIs, validate with a schema, generate JS). Decide before Phase 3.

---

## Phase 3 — Batch Add Stub Species (10 → 50 → 200+)

With schema docs and a completeness checker in place, start adding stubs in priority order.

### Priority order

1. **Critically Endangered first** — the wiki's purpose is conservation; the most at-risk species should be present
2. **Well-known species** — species users are likely to search for (Bull Shark, Tiger Shark, Nurse Shark, Basking Shark, Thresher Shark, etc.)
3. **Ecologically distinct** — one or two representatives per family/order for taxonomic coverage
4. **Long tail** — the remaining obscure deep-sea species

### Data sources for stubs

Stub data can be assembled from public sources with reasonable research time per species:

| Field | Source |
|---|---|
| `commonName`, `scientificName` | FishBase, Wikipedia |
| `statusLabel`, `lifePercent` (rough) | IUCN Red List API |
| `habitatTypes`, `dietType`, `geographicRegions` | FishBase, IUCN narrative |
| `tags` | Manual curation based on behavior notes |
| `description`, `funFact` | Write from FishBase + IUCN summaries |

### IUCN Red List API

The IUCN has a public API (`apiv3.iucnredlist.org`) that returns structured JSON for any assessed species — including status, population trend narrative, habitat codes, and threat codes. This is the most reliable automation path for stub data.

A short script could:
1. Pull a list of all shark species from IUCN
2. For each species, fetch its assessment
3. Map IUCN fields → `data.js` fields
4. Output a stub JS object ready to paste (or auto-write) into data.js

**This single script could generate 200–300 stubs in an afternoon.**

### Batch size discipline

Add species in batches of ~20–30. After each batch:
- Run the completeness checker
- Load the wiki locally and scroll the grid (visual QA)
- Fix any rendering issues before the next batch

---

## Phase 4 — Promote Priority Species to Standard Tier

For the ~50 highest-priority species, fill in `vitalSigns`, `threats`, `actionItems`, and text fields.

This is the most labor-intensive phase and the one most suited to collaborative or AI-assisted drafting — each species needs accurate, sourced facts rather than generated text.

**Approach options:**

- **Manual research:** ~1–2 hrs per species × 50 = 50–100 hrs. Sustainable as ongoing effort.
- **Structured research sessions:** Focus on one shark family per session (e.g., all Carcharhinidae). Shared context speeds up research.
- **AI-assisted drafting + expert review:** Draft `vitalSigns` and `threats` from IUCN + FishBase data, then review for accuracy before committing.

---

## Phase 5 — Flagship Photos and Full Tier (ongoing)

Promote the most iconic species to Full tier with real photography and visual assets.

### Image sourcing

| Option | Quality | Effort | License |
|---|---|---|---|
| iNaturalist (CC licensed) | High | Medium | CC BY / CC BY-NC |
| Wikimedia Commons | Variable | Low | Usually CC or public domain |
| Partner with conservation orgs | Best | High | Case by case |
| Commission/license stock photography | Best | High | Paid |

Start with Wikimedia Commons + iNaturalist for early full-tier species. A consistent image size and aspect ratio (the current hero uses a landscape crop) matters more than source.

### Population trend data

Real population trend data is scarce for most species. Options:
- Use IUCN assessment years + status changes as a rough proxy for trend direction
- Show "Data Insufficient" state in the chart for species without numeric estimates
- Ensure the chart component gracefully handles an empty `populationTrend: []`

---

## Phase 6 — Architecture for Scale

At 200+ species the current architecture needs reinforcement. These items are already in `wiki-todo.md` but become critical before hitting ~100 species:

### Virtualized grid (critical)
> Pagination or infinite scroll — for projects with many species, virtualize the grid so it doesn't render 500+ DOM nodes at once

Without this, the page will bog down before 200 species. Implement before adding the 100th species.

### Lazy image loading (critical)
> Lazy load images — use IntersectionObserver so off-screen species photos don't load until scrolled into view

Without this, 500 species × 1+ photos = catastrophic load time.

### Split data loading (nice to have at scale)
Instead of one giant `data.js` loaded up front, load species in chunks:
- Eager-load the first ~50 (above the fold)
- Load remaining in the background or on scroll

This is optional if images are lazy-loaded and the grid is virtualized, but becomes necessary at 500+ if the JS payload grows too large.

---

## Milestone Summary

| Milestone | Condition | Approx. species count |
|---|---|---|
| **Stable base** | All 5 current species at Standard tier; schema documented | 5 |
| **Meaningful catalog** | All Critically Endangered sharks as stubs; IUCN script working | 15–20 |
| **Usable at scale** | Virtualized grid + lazy images shipped | any |
| **Broad coverage** | 100+ stubs; 20+ at Standard tier | 100+ |
| **Comprehensive** | 300+ stubs covering all major families | 300+ |
| **Complete** | All ~500 assessed species present as stubs | 500+ |

---

## What "500 species" actually requires

| Task | Est. effort |
|---|---|
| Schema docs + completeness script | 2–4 hrs |
| IUCN API script for stub generation | 4–8 hrs |
| Manual QA + cleanup of generated stubs | 8–16 hrs |
| Virtualized grid + lazy images | 4–8 hrs |
| 50 species at Standard tier (manual research) | 50–100 hrs |
| 10–20 species at Full tier (photos + chart data) | 20–40 hrs |

The stub catalog (500 species present in the wiki) is achievable in a focused week of work once the IUCN script is running. Full-tier coverage for priority species is an ongoing, months-long effort.
