# data.js Schema Reference

This document describes every field in `WIKI_DATA` and `WIKI_DATA.items[]`. Use it as the authoritative reference when authoring new species entries or writing scripts that read or generate data.

---

## Top-Level `WIKI_DATA` Object

```js
window.WIKI_DATA = {
  projectId,          // string — unique project identifier, e.g. "shark-populations"
  favoritesKey,       // string — localStorage key for favorites
  recentlyViewedKey,  // string — localStorage key for recently-viewed list
  silhouetteFallback, // string — relative path to fallback silhouette image used when a species has no photos
  sources,            // Source[] — list of citation sources shown in the wiki footer
  items,              // Species[] — the full array of species entries
}
```

### `Source`

```js
{ label: string, url: string }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `label` | string | yes | Display name, e.g. `"IUCN Red List"` |
| `url` | string | yes | Full URL |

---

## Species Entry (`items[]`)

Every object in `items` represents one species. Fields are divided into **Stub**, **Standard**, and **Full** tiers based on how complete the entry is.

**Core authoring rule: all data fields are always present.** If a value is unknown or unavailable, write `"Unknown"` (for strings) or `[]` (for empty arrays like `populationTrend`) rather than omitting the field. The only exception is image paths (`photos`, `physicalScaleImage`, `habitatImage`) — omit those entirely when no image exists.

---

### Stub Tier (required for every species)

These are the minimum fields needed to render a valid grid card and open a working modal.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Kebab-case scientific name identifier, e.g. `"carcharodon-carcharias"`. Used in URLs and localStorage keys. |
| `commonName` | string | yes | Common English name, e.g. `"Great White Shark"` |
| `scientificName` | string | yes | Binomial name, e.g. `"Carcharodon carcharias"` |
| `statusLabel` | string | yes | IUCN status string. One of: `"Least Concern"`, `"Near Threatened"`, `"Vulnerable"`, `"Endangered"`, `"Critically Endangered"`, `"Extinct in the Wild"`, `"Extinct"`, `"Data Deficient"`, `"Not Evaluated"` |
| `lifePercent` | number | yes | 0–100. Population health estimate relative to pre-industrial/historical baseline (100 = fully recovered to historical carrying capacity — a theoretical ceiling no current species is expected to reach). 0 = extinct. Assign based on IUCN status and available trend context: LC ≈ 70–95, NT ≈ 55–70, VU ≈ 35–55, EN ≈ 20–35, CR ≈ 3–20 (low end for species with no confirmed sightings in decades; high end for documented but crashing populations), Extinct in the Wild ≈ 1–3. Ranges are contiguous — edge cases should use judgment rather than defaulting to status midpoints. |
| `habitatTypes` | string[] | yes | One or more habitat labels. Known values: `"ocean"`, `"coastal"`, `"freshwater"`, `"pelagic"`, `"tropical"`, `"deep-sea"`. |
| `dietType` | string | yes | One of: `"apex-predator"`, `"carnivore"`, `"filter-feeder"`, `"omnivore"`. Used for filter chips. |
| `geographicRegions` | string[] | yes | One or more region labels. Known values: `"tropical"`, `"temperate"`, `"arctic"`, `"mediterranean"`, `"global"`. |
| `tags` | string[] | yes | Free-form behavioral/ecological tags. Common values: `"migratory"`, `"solitary"`, `"schooling"`, `"keystone"`, `"bycatch"`, `"finning"`. Used for search and filter chips. |
| `description` | string | yes | 2–4 sentence species overview shown in the modal overview tab. |
| `funFact` | string | yes | Single striking fact shown as a callout. 1–2 sentences. |
| `emoji` | string | yes | Fallback emoji for grid cards with no photo. Use `"🦈"` for all sharks unless a more specific one applies. |

---

### Standard Tier

Fills all data tabs in the modal. Every Standard-tier species must include **all** of the following fields. If a specific value is unknown, use `"Unknown"` for string fields, `[]` for array fields, or `"data-deficient"` for confidence fields — the UI handles these gracefully. Standard tier does not include photos.

| Field | Type | Unknown fallback | Notes |
|---|---|---|---|
| `lastUpdated` | string | omit if unknown | ISO 8601 date (`"YYYY-MM-DD"`). Shown in the modal footer. |
| `taxonomy` | Taxonomy | all fields `"Unknown"` | Full taxonomic classification. See below. |
| `habitat` | string | `"Unknown"` | 1–2 sentence habitat description. Shown in overview tab. |
| `diet` | string | `"Unknown"` | 1–2 sentence diet description. Shown in overview tab. |
| `size` | string | `"Unknown"` | Size summary string. Shown in overview tab. |
| `vitalSigns` | VitalSign[] | all 6 glance entries with `"Unknown"` values | Key stats shown in the Vitals tab. See below. |
| `threats` | Threat[] | `[]` | Threat list shown in the Threats tab. |
| `actionItems` | ActionItem[] | `[]` | Calls to action shown in the Take Action tab. |
| `statusHistory` | StatusEntry[] | `[{ year: currentYear, status: statusLabel }]` | Chronological IUCN status history. Shown as a timeline. |
| `healthMetrics` | HealthMetric[] | all 6 canonical entries with `"Unknown"` / `trend: null` | Summary metrics shown in the Health tab. See below. |
| `habitatStats` | HabitatStat[] | entries with `"Unknown"` values | Key habitat stats shown alongside the habitat image. See below. |
| `populationTrend` | TrendPoint[] | `[]` — chart renders "Data Insufficient" state | Time-series data for the population chart. See below. |
| `populationTrendMeta` | TrendMeta | `{ confidence: "data-deficient", note: "..." }` | Confidence and source note displayed below the chart. See below. |
| `preyDeclineRegions` | Region[] | `[]` | Per-region prey availability data for the pressure map. See below. |
| `fishingPressureRegions` | Region[] | `[]` | Per-region fishing pressure data for the pressure map. See below. |

#### `Taxonomy`

```js
taxonomy: {
  kingdom: string,  // "Animalia"
  phylum:  string,  // "Chordata"
  class:   string,  // "Chondrichthyes"
  order:   string,  // e.g. "Lamniformes"
  family:  string,  // e.g. "Lamnidae"
  genus:   string,  // e.g. "Carcharodon"
  species: string,  // abbreviated, e.g. "C. carcharias"
}
```

All 7 rank fields are required whenever `taxonomy` is present. Use `"Unknown"` for any rank that cannot be determined.

#### `VitalSign`

```js
{ label: string, value: string, metric?: string, imperial?: string, glance?: boolean }
```

| Field | Type | Notes |
|---|---|---|
| `label` | string | Stat name, e.g. `"Estimated Population"`, `"Lifespan"`, `"Max Length"` |
| `value` | string | Default display value. May include both units, e.g. `"6.4 m (20.9 ft)"` |
| `metric` | string | Optional metric-only version shown when unit toggle is set to metric |
| `imperial` | string | Optional imperial-only version shown when unit toggle is set to imperial |
| `glance` | boolean | If `true`, this stat appears in the at-a-glance summary row in the modal header |

**At-a-glance stats (overview row):** Exactly **6** `vitalSigns` entries must have `glance: true`. These 6 are displayed as the key stat tiles in the species overview. Use this canonical set in this order:

| # | Label | Example value |
|---|---|---|
| 1 | `"Estimated Population"` | `"~3,500 adults"` |
| 2 | `"Lifespan"` | `"70+ years"` |
| 3 | `"Max Length"` | `"6.4 m (20.9 ft) confirmed"` |
| 4 | `"Max Weight"` | `"~2,000 kg (~4,400 lbs)"` |
| 5 | `"Top Speed"` | `"~56 km/h (~35 mph) in bursts"` |
| 6 | `"Ecological Role"` | `"Apex Predator"` |

If a value is truly unknown, use `"Unknown"` — do not omit the entry or set `glance: false` to drop it. Provide `metric` and `imperial` variants on any stat that has distinct unit forms (length, weight, speed, depth).

Additional (non-glance) `vitalSigns` entries document supplemental facts in the Vitals tab. Common labels: `"Reproductive Rate"`, `"Age at Maturity"`, `"Diet"`, `"Population Growth Rate"`, `"Key Senses"` / `"Key Adaptations"`.

#### `Threat`

```js
{ name: string, severity: string, description: string }
```

| Field | Type | Notes |
|---|---|---|
| `name` | string | Short threat name, e.g. `"Bycatch"`, `"Shark Fin Trade"` |
| `severity` | string | One of: `"critical"`, `"high"`, `"medium"`, `"low"` |
| `description` | string | 1–3 sentence explanation of the threat |

#### `ActionItem`

```js
{ title: string, description: string, link: string | null }
```

| Field | Type | Notes |
|---|---|---|
| `title` | string | Short call-to-action label |
| `description` | string | 1–3 sentence explanation of what the reader can do |
| `link` | string \| null | Optional URL for the action; `null` if no specific link |

#### `StatusEntry`

```js
{ year: number, status: string }
```

Ordered chronologically (ascending year). `status` uses the same values as `statusLabel`.

> **Required for population chart timeline:** The status history legend below the population trend chart only renders when `statusHistory` contains **2 or more distinct status values**. If a species was only ever assessed at one status (e.g. always "Vulnerable"), the legend is silently omitted.
>
> **Rule 1 — Pre-assessment entry:** Any species with `populationTrend` data that predates the first IUCN assessment **must** include a leading `"Not Evaluated"` entry anchored to the first year of the trend data. Example:
> ```json
> "statusHistory": [
>   { "year": 1975, "status": "Not Evaluated" },
>   { "year": 2007, "status": "Vulnerable" }
> ]
> ```
>
> **Rule 2 — No consecutive duplicates:** Do **not** repeat the same status across multiple entries. Reassessments that result in no status change should be collapsed — keep only the first year the status was assigned. The legend displays a single continuous range per status (e.g. `Vulnerable (2007–present)`), so duplicate entries just fragment the label without adding information. ✗ Wrong:
> ```json
> { "year": 1996, "status": "Vulnerable" },
> { "year": 2009, "status": "Vulnerable" },
> { "year": 2022, "status": "Vulnerable" }
> ```
> ✓ Correct:
> ```json
> { "year": 1996, "status": "Vulnerable" }
> ```

#### `TrendPoint`

```js
{ year: number, value: number }
```

`value` is an estimated population count. Use round numbers. Order ascending by year. Empty array `[]` is valid — the chart will render a "Data Insufficient" state.

#### `TrendMeta`

```js
{ confidence: string, note: string }
```

| Field | Type | Notes |
|---|---|---|
| `confidence` | string | One of: `"estimated"`, `"modeled"`, `"survey-based"`, `"data-deficient"` |
| `note` | string | 1–3 sentence source attribution and caveats |

#### `Region`

Used for both `preyDeclineRegions` and `fishingPressureRegions`:

```js
{ name: string, severity: string, note: string }
```

| Field | Type | Notes |
|---|---|---|
| `name` | string | Named ocean region, e.g. `"Indo-Pacific"`, `"Mediterranean"`, `"N. Atlantic"` |
| `severity` | string | One of: `"critical"`, `"high"`, `"medium"`, `"low"` |
| `note` | string | 1–2 sentence explanation of the specific pressure in that region |

**How regional pressure data is rendered:** Both arrays power a pressure map UI. Each entry becomes a color-coded card labeled with the region name. A small legend above the map explains the four severity levels:

| Severity | Meaning (prey decline) | Meaning (fishing pressure) |
|---|---|---|
| `"critical"` | Prey stocks collapsed or near-absent | Dense active fleets; minimal or no enforcement |
| `"high"` | Significant prey depletion | Heavy incidental bycatch or targeted fishing |
| `"medium"` | Moderate prey reduction | Moderate pressure; some mitigation in place |
| `"low"` | Prey populations relatively stable | Low commercial activity or well-enforced protections |

**Authoring notes:**
- Include only regions where the species' range actually overlaps — omit regions where the species does not occur.
- Aim for 4–6 entries per array so the map isn't sparse or cluttered. Fewer entries are fine for species with limited ranges.
- The `note` should be factual and specific, e.g. `"Bluefin tuna collapse; ~97% fish biomass lost"` rather than generic phrases like `"some pressure exists"`.
- Common region name tokens: `"N. Atlantic"`, `"S. Atlantic"`, `"N. Pacific"`, `"S. Pacific"`, `"Indo-Pacific"`, `"Mediterranean"`, `"Indian Ocean"`, `"S. Africa"`, `"Australia"`, `"Arctic"`, `"Caribbean"`.

#### `HealthMetric`

```js
{ label: string, value: string, trend: string | null, links?: Link[] }
```

| Field | Type | Notes |
|---|---|---|
| `label` | string | Metric name — use the canonical labels below |
| `value` | string | 1–2 sentence plain-English description of the current state |
| `trend` | string \| null | One of: `"up"`, `"down"`, `"stable"`, or `null` (no trend indicator). Rendered as an arrow icon next to the metric card. |
| `links` | Link[] | Optional array of reference links rendered as chips below the metric. See `Link` below. |

**Canonical set:** Every Standard-tier species must include exactly **6** `healthMetrics` entries with these labels, in this order:

| # | Label | `trend` guidance | Notes |
|---|---|---|---|
| 1 | `"IUCN Status"` | `"stable"` / `"down"` / `"up"` | Value is the IUCN status word plus a brief qualifier, e.g. `"Vulnerable — listed since 1996"`. Trend reflects direction of change across recent assessments. |
| 2 | `"Population Trend"` | `"down"` / `"stable"` / `"up"` | Value describes the trajectory in plain English, e.g. `"Decreasing"` or `"Stable but critically low"`. |
| 3 | `"Habitat Quality"` | `null` / `"down"` | Value describes current habitat condition and key stressors, e.g. `"Moderate — coastal zones under pressure"`. Use `null` trend when data is insufficient to assign a direction. |
| 4 | `"Prey Availability"` | `"down"` / `"stable"` | Value summarizes prey status across the range, e.g. `"Declining in key regions"`. |
| 5 | `"Fishing Pressure"` | `"down"` / `"stable"` | Value names the dominant pressure type, e.g. `"High — bycatch and targeted poaching"`. Use `"down"` when pressure is worsening (i.e. bad for the species). |
| 6 | `"Protection Coverage"` | `"stable"` / `"up"` | Value names specific protections in effect, e.g. `"Partial — CITES Appendix II, some EEZs"`. Add `links` chips here to point to CITES, IUCN, or relevant conservation bodies. |

If data for a metric is unavailable, still include the entry with `value: "Unknown"` and `trend: null`.

#### `Link`

```js
{ label: string, url: string }
```

Same shape as `Source`. Used inside `HealthMetric.links`.

#### `HabitatStat`

```js
{ label: string, value: string, metric?: string, imperial?: string }
```

Same shape as `VitalSign` minus `glance`. Common labels: `"Global Range"`, `"Depth Range"`.

---

### Full Tier

A species reaches Full tier when its **complete** photo set is present. All Standard data fields must already be populated before a species is considered Full tier.

**Partial photos = Standard tier.** If some but not all photos have been sourced, keep the species at Standard and omit the `photos` field entirely until the full set is ready. A single photo in the gallery is not enough to call it Full.

Image fields are the **only** fields in the entire schema that should be omitted when unavailable — do not write `"Unknown"` or an empty string for them; simply leave the field out of the entry.

| Field | Type | Notes |
|---|---|---|
| `photos` | string[] | Array of relative paths to species photos. First photo is used as the hero image. **Include only when the complete intended photo set is ready.** Omit entirely otherwise — the UI falls back to `silhouetteFallback`. |
| `physicalScaleImage` | string | Relative path to a size-comparison illustration. Omit if unavailable. |
| `habitatImage` | string | Relative path to a habitat range map image. Omit if unavailable. |

---

## Tier Summary

| Tier | What it has | Unlocks |
|---|---|---|
| **Stub** | Core identity fields only (`id`, `commonName`, `scientificName`, `statusLabel`, `lifePercent`, `habitatTypes`, `dietType`, `geographicRegions`, `tags`, `description`, `funFact`, `emoji`) | Grid card + modal shell with "Incomplete Data" badges |
| **Standard** | All Stub fields + all data fields (with `"Unknown"` / `[]` fallbacks where needed). No images. | All data tabs fully rendered; unknown values display gracefully |
| **Full** | All Standard fields + `photos`. Optionally `physicalScaleImage` and/or `habitatImage` if available. | Hero photo, photo gallery, size illustration, habitat map |

**The key distinction:** Stub → Standard is about populating all the data fields. Standard → Full is solely about adding a complete photo set. Images are the only fields that are ever truly absent from an entry. A species with partial photos is still Standard.

---

## Stub Template

Minimum viable entry for a new species:

```js
{
  id: "species-id",
  emoji: "🦈",
  commonName: "Common Name",
  scientificName: "Genus species",
  statusLabel: "Vulnerable",
  lifePercent: 55,
  habitatTypes: ["ocean"],
  dietType: "carnivore",
  geographicRegions: ["tropical"],
  tags: ["migratory"],
  description: "...",
  funFact: "...",
},
```

## Known Enum Values

### `statusLabel`
`"Least Concern"` · `"Near Threatened"` · `"Vulnerable"` · `"Endangered"` · `"Critically Endangered"` · `"Extinct in the Wild"` · `"Extinct"` · `"Data Deficient"` · `"Not Evaluated"`

### `habitatTypes`
`"ocean"` · `"coastal"` · `"freshwater"` · `"pelagic"` · `"tropical"` · `"deep-sea"`

### `dietType`
`"apex-predator"` · `"carnivore"` · `"filter-feeder"` · `"omnivore"`

### `geographicRegions`
`"tropical"` · `"temperate"` · `"arctic"` · `"mediterranean"` · `"global"`

### `tags`
`"migratory"` · `"solitary"` · `"schooling"` · `"keystone"` · `"bycatch"` · `"finning"`

### `severity` (threats, regions)
`"critical"` · `"high"` · `"medium"` · `"low"`

### `trend` (healthMetrics)
`"up"` · `"down"` · `"stable"` · `null`

### `confidence` (populationTrendMeta)
`"estimated"` · `"modeled"` · `"survey-based"` · `"data-deficient"`
