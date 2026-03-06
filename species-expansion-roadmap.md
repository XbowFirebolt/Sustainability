# Species Expansion Roadmap: 1 → 500+ Sharks

A phased plan for expanding the shark wiki from its current state (5 species in data.js, only 1 fully complete) to a comprehensive catalog of 500+ species.

---

## Current State

| Species | Complete? | Notes |
|---|---|---|
| Great White Shark | ✅ Full | Photos, vitalSigns, populationTrend, prey/fishing regions, healthMetrics, threats, actionItems, statusHistory |
| Scalloped Hammerhead | ✅ Full | Photos, vitalSigns, populationTrend, prey/fishing regions, healthMetrics, threats, actionItems, statusHistory |
| Whale Shark | ✅ Full | Photos, vitalSigns, populationTrend, prey/fishing regions, healthMetrics, threats, actionItems, statusHistory |
| Bull Shark | ✅ Full | Photos, vitalSigns, populationTrend, prey/fishing regions, healthMetrics, threats, actionItems, statusHistory |
| Tiger Shark | ✅ Full | Photos, vitalSigns, populationTrend, prey/fishing regions, healthMetrics, threats, actionItems, statusHistory |

**Core problem:** The current `data.js` schema is hand-authored and deeply detailed. A single fully complete species entry is ~100 lines of JS. 500 species × 100 lines = 50,000+ lines — not feasible to write by hand.

---

## Guiding Principle: Tiered Completeness

Not all 500+ species need the same depth. Define three tiers so every species can be *present* without being a blocker:

| Tier | What's included | Target count |
|---|---|---|
| **Stub** | id, commonName, scientificName, statusLabel, lifePercent, habitatTypes, dietType, geographicRegions, tags, description, funFact | 500+ |
| **Standard** | Stub + vitalSigns, threats, actionItems, diet, habitat, size, healthMetrics | 50–100 priority species |
| **Full** | Standard + photos, physicalScaleImage, habitatImage, populationTrend, preyDeclineRegions, fishingPressureRegions | 10–20 flagship species |

A stub species renders a complete, valid card in the grid and opens a working modal — it just shows an "Incomplete Data" badge (already implemented) for tabs that have no content yet.

---

## ~~Phase 1 — Finish the Current 5~~ ✅

Before scaling out, stabilize the foundation.

**Goals:**
- Bring the 4 partial species to at least **Standard tier**
- Confirm the data schema handles edge cases (no photos, no populationTrend, etc.) without JS errors
- Add the `emoji` field to all 5 as a hero fallback when no photo exists

**Why first:** Every bug found in 5 species is 500 bugs avoided later.

**Checklist:**
- [x] Fill `vitalSigns` for Scalloped Hammerhead, Whale Shark, Bull Shark, Tiger Shark
- [x] Fill `healthMetrics` for the 4 partial species
- [x] Add shark-silhouette fallback logic so species without real photos still look clean
- [x] Add `emoji` field to all 5 (`🦈` works for most)
- [x] Confirm modal renders gracefully when `populationTrend`, `preyDeclineRegions`, and `fishingPressureRegions` are empty arrays

---

## ~~Phase 2 — Data Schema + Tooling (parallel to Phase 1)~~ ✅

Before adding species, make adding species easier.

### ~~2a. Document the schema~~ ✅

Extract the schema into `projects/shark-populations/data-schema.md`. Document every field: type, whether it's required, what happens if it's missing, and example values. This is the reference for anyone (or any script) authoring new entries.

Reference from `wiki-todo.md`:
> Extract data.js schema documentation — add a data-schema.md or comments in data.js explaining every field

### ~~2b. Write a data completeness checker~~ ✅

A small Node script (or browser console snippet) that reads `WIKI_DATA.items` and prints a table of which fields each species is missing. Run it before every batch add.

```
node scripts/check-completeness.js
# Scalloped Hammerhead: missing vitalSigns, populationTrend, photos (real)
# Whale Shark: missing vitalSigns, physicalScaleImage, habitatImage
```

Reference from `wiki-todo.md`:
> Data completeness audit script

### 2c. Split data.js into per-species JSON files + build script

At 50+ species, a single `data.js` becomes impossible to maintain. The plan: author each species as a standalone `.json` file, generate `data.js` via a Node build script, and use the same pipeline for automated stub generation.

**Target file structure:**
```
projects/shark-populations/
  data/
    config.json           ← project metadata (sources, keys, silhouette path)
    species/
      carcharodon-carcharias.json
      rhincodon-typus.json
      ...                 ← one file per species
  scripts/
    build-data.js         ← reads data/ → writes data.js
    generate-stubs.js     ← Wikidata + Wikipedia → writes new .json files to data/species/
    check-completeness.js   (already exists)
  data.js                 ← GENERATED, not hand-edited
```

**Workflow:**
- **Edit a species** → edit its `.json` file, run `build-data.js`
- **Add species (manual)** → create a new `.json` stub, run `build-data.js`
- **Add species (automated)** → run `generate-stubs.js`, then `build-data.js`
- **Browser** → loads `data.js` exactly as today (no app code changes)

**Why JSON over JS files:**
- Structured data is easy to validate against the data schema
- Clean git diffs when a single species is updated
- `build-data.js` is trivial: read all `.json` files in `data/species/`, merge with `config.json`, write `window.WIKI_DATA = {...}`

**The automation script (`generate-stubs.js`):**

Uses two openly licensed, no-token-required data sources:

| Source | License | Provides |
|---|---|---|
| **Wikidata SPARQL** | CC0 (public domain) | Scientific name, common name, IUCN status, full taxonomy |
| **Wikipedia REST API** | CC BY-SA | Species description (first paragraph) |

The IUCN Red List API was considered but excluded — its terms of use prohibit use by or on behalf of for-profit entities. Commercial use requires a paid IBAT subscription.

The script:
1. Queries Wikidata for all shark species under Selachimorpha in a single SPARQL request
2. For each species, fetches the Wikipedia page summary for the description
3. Maps fields → data schema (status QID → `statusLabel`/`lifePercent`, taxonomy, order-based `habitatTypes`, family-based `dietType`)
4. Writes `data/species/<slug>.json` at Stub tier — leaving Standard/Full fields for later
5. Prints a summary with a checklist of what still needs manual fill-in

What stays manual (no open structured source exists):
- `funFact` — no equivalent in any open dataset
- `description` — review/improve the Wikipedia excerpt
- `habitatTypes`, `geographicRegions`, `tags` — verify the heuristic defaults
- `photos`, `physicalScaleImage`, `habitatImage` (Full tier)
- `vitalSigns`, `threats`, `actionItems` (Standard tier)

**Checklist:**
- [x] Migrate the 5 existing species from `data.js` → individual `.json` files + `config.json`
- [x] Write `build-data.js` and verify the generated `data.js` is identical to the current hand-authored one
- [x] Write `generate-stubs.js` with IUCN API field mapping
- [x] Test stub generation on a known species and QA the output against `data-schema.md`
- [x] Mark `data.js` as generated in a comment at the top of the file

---

## Phase 3 — Batch Add Stub Species (10 → 50 → 200+) *(Batch 1 complete)*

With schema docs and a completeness checker in place, start adding stubs in priority order.

### Priority order

1. **Critically Endangered first** — the wiki's purpose is conservation; the most at-risk species should be present
2. **Well-known species** — species users are likely to search for (Bull Shark, Tiger Shark, Nurse Shark, Basking Shark, Thresher Shark, etc.)
3. **Ecologically distinct** — one or two representatives per family/order for taxonomic coverage
4. **Long tail** — the remaining obscure deep-sea species

### Data sources for stubs

| Field | Automated source | Manual fallback |
|---|---|---|
| `commonName`, `scientificName` | Wikidata SPARQL | Wikipedia, WoRMS |
| `statusLabel`, `lifePercent` | Wikidata (P141 IUCN status, CC0) | IUCN Red List website |
| `taxonomy` | Wikidata SPARQL | FishBase |
| `description` | Wikipedia REST API (CC BY-SA) | Write from Wikipedia + FishBase |
| `habitatTypes`, `dietType` | Order/family heuristic in script | FishBase, species pages |
| `geographicRegions`, `tags` | Defaults ("global", solitary/keystone) | Manual curation |
| `funFact` | — | Write by hand |

**Note on the IUCN Red List API:** The API (`apiv3.iucnredlist.org`) prohibits use by for-profit entities. Commercial use requires a paid IBAT subscription. The IUCN Red List *website* can still be consulted manually for research. The IUCN status values themselves are available via Wikidata (P141) under CC0.

### Wikidata + Wikipedia (the automation path)

`generate-stubs.js` uses a single Wikidata SPARQL query to fetch all shark species under Selachimorpha, then hits the Wikipedia summary API for descriptions. No token required; both sources are openly licensed.

**This single script can generate 200–300 stubs in an afternoon.**

### Per-stub review checklist

After running `generate-stubs.js`, every generated file needs a human review pass. Use this checklist for each stub:

```
Species: ______________________

Wikidata fields (accurate but verify):
  [ ] commonName     — confirm it's the standard English name, not a synonym or
                       the scientific name (fallback for species with no en label)
  [ ] statusLabel    — spot-check against IUCN Red List website for recent reclassifications
  [ ] taxonomy       — confirm order/family are correct (Wikidata occasionally has errors)

Heuristic fields (rough defaults, fix before publishing):
  [ ] habitatTypes   — script uses order-level defaults; check actual species range
                       e.g. a coastal Squaliformes wrongly gets ["ocean", "deep-sea"]
                       add "freshwater" for river sharks (Glyphis spp., bull shark already done)
                       add "tropical" for reef species
  [ ] geographicRegions — script defaults to ["global"]; fix for regionally endemic species:
                       Mediterranean endemics → ["mediterranean"]
                       Indo-Pacific only → ["tropical"]
                       Cold-water/deep → ["temperate"] or ["arctic"]
  [ ] dietType       — check family heuristic held; benthic Carcharhinidae may be "carnivore"
                       not "apex-predator"
  [ ] tags           — script only adds "solitary"/"schooling" + "keystone"; also add:
                       "migratory" if the species makes long seasonal migrations
                       "bycatch"   if it is a known bycatch target
                       "finning"   if the shark fin trade is a documented threat

Wikipedia-sourced fields (review quality):
  [ ] description    — read it; Wikipedia excerpts can be too technical, describe the genus
                       instead of the species, or be a stub sentence. Rewrite if needed.
                       Target: 2–4 plain-English sentences covering habitat, diet, status.

Must be written from scratch (no automated source):
  [ ] funFact        — replace the TODO placeholder with one striking, specific fact
                       (size record, sensory ability, behavior, ecological role, etc.)
```

**What "done" looks like:** all boxes checked, `funFact` is real prose, and the card looks
correct in the wiki grid after running `build-data.js`.

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

| Milestone | Condition | Approx. species count | Status |
|---|---|---|---|
| **Stable base** | All 5 current species at Standard tier; schema documented | 5 | ✅ |
| **Meaningful catalog** | All Critically Endangered sharks as stubs; IUCN script working | 15–20 | ✅ |
| **Usable at scale** | Virtualized grid + lazy images shipped | any | |
| **Broad coverage** | 100+ stubs; 20+ at Standard tier | 100+ | |
| **Comprehensive** | 300+ stubs covering all major families | 300+ | |
| **Complete** | All ~500 assessed species present as stubs | 500+ | |

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
