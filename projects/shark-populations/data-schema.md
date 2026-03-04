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

Every object in `items` represents one species. Fields are divided into **Stub**, **Standard**, and **Full** tiers. Every species must have all Stub fields; Standard and Full fields are optional but unlock richer UI tabs.

---

### Stub Tier (required for every species)

These are the minimum fields needed to render a valid grid card and open a working modal.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Kebab-case unique identifier, e.g. `"great-white"`. Used in URLs and localStorage keys. |
| `commonName` | string | yes | Common English name, e.g. `"Great White Shark"` |
| `scientificName` | string | yes | Binomial name, e.g. `"Carcharodon carcharias"` |
| `statusLabel` | string | yes | IUCN status string. One of: `"Least Concern"`, `"Near Threatened"`, `"Vulnerable"`, `"Endangered"`, `"Critically Endangered"`, `"Extinct in the Wild"`, `"Extinct"`, `"Data Deficient"`, `"Not Evaluated"` |
| `lifePercent` | number | yes | 0–100. Used to drive the health bar on the grid card. Rough proxy for population health — 100 = thriving, 0 = extinct. Assign based on IUCN status + trend: CR ≈ 10–25, EN ≈ 30–50, VU ≈ 50–65, NT ≈ 70–80, LC ≈ 85–100. |
| `habitatTypes` | string[] | yes | One or more habitat labels. Known values: `"ocean"`, `"coastal"`, `"freshwater"`, `"pelagic"`, `"tropical"`, `"deep-sea"`. |
| `dietType` | string | yes | One of: `"apex-predator"`, `"carnivore"`, `"filter-feeder"`, `"omnivore"`. Used for filter chips. |
| `geographicRegions` | string[] | yes | One or more region labels. Known values: `"tropical"`, `"temperate"`, `"arctic"`, `"mediterranean"`, `"global"`. |
| `tags` | string[] | yes | Free-form behavioral/ecological tags. Common values: `"migratory"`, `"solitary"`, `"schooling"`, `"keystone"`, `"bycatch"`, `"finning"`. Used for search and filter chips. |
| `description` | string | yes | 2–4 sentence species overview shown in the modal overview tab. |
| `funFact` | string | yes | Single striking fact shown as a callout. 1–2 sentences. |
| `emoji` | string | yes | Fallback emoji for grid cards with no photo. Use `"🦈"` for all sharks unless a more specific one applies. |

---

### Standard Tier

Fills the Overview tab in the modal with meaningful content. Include these for the ~50–100 priority species.

| Field | Type | Required | Notes |
|---|---|---|---|
| `lastUpdated` | string | no | ISO 8601 date (`"YYYY-MM-DD"`). Shown in the modal footer. |
| `taxonomy` | Taxonomy | no | Full taxonomic classification. See below. |
| `habitat` | string | no | 1–2 sentence habitat description. Shown in overview tab. |
| `diet` | string | no | 1–2 sentence diet description. Shown in overview tab. |
| `size` | string | no | Size summary string. Shown in overview tab. |
| `vitalSigns` | VitalSign[] | no | Key stats shown in the Vitals tab. See below. |
| `threats` | Threat[] | no | Threat list shown in the Threats tab. See below. |
| `actionItems` | ActionItem[] | no | Calls to action shown in the Take Action tab. See below. |
| `statusHistory` | StatusEntry[] | no | Chronological IUCN status history. Shown as a timeline. See below. |
| `photos` | string[] | no | Array of relative paths to species photos. First photo is used as the hero image. If empty or omitted, falls back to `silhouetteFallback`. |

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

All fields are strings. All 7 ranks must be present if `taxonomy` is included at all.

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

Common `label` values used across species: `"Estimated Population"`, `"Lifespan"`, `"Max Length"`, `"Max Weight"`, `"Reproductive Rate"`, `"Age at Maturity"`, `"Top Speed"`, `"Ecological Role"`, `"Diet"`, `"Population Growth Rate"`, `"Key Senses"` / `"Key Adaptations"`.

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

---

### Full Tier

Unlocks the Population, Habitat, and Pressure maps tabs. Include these for the 10–20 flagship species.

| Field | Type | Required | Notes |
|---|---|---|---|
| `populationTrend` | TrendPoint[] | no | Time-series data for the population chart. See below. |
| `populationTrendMeta` | TrendMeta | no | Confidence and source note displayed below the chart. |
| `preyDeclineRegions` | Region[] | no | Per-region prey availability data for the pressure map. See below. |
| `fishingPressureRegions` | Region[] | no | Per-region fishing pressure data for the pressure map. |
| `healthMetrics` | HealthMetric[] | no | Summary metrics shown in the Health tab. See below. |
| `physicalScaleImage` | string | no | Relative path to a size-comparison illustration. |
| `habitatImage` | string | no | Relative path to a habitat range map image. |
| `habitatStats` | HabitatStat[] | no | Key habitat stats shown alongside the habitat image. |

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
| `note` | string | 1–2 sentence explanation |

#### `HealthMetric`

```js
{ label: string, value: string, trend: string | null, links?: Link[] }
```

| Field | Type | Notes |
|---|---|---|
| `label` | string | Metric name. Common values: `"IUCN Status"`, `"Population Trend"`, `"Habitat Quality"`, `"Prey Availability"`, `"Fishing Pressure"`, `"Protection Coverage"` |
| `value` | string | Current state description |
| `trend` | string \| null | One of: `"up"`, `"down"`, `"stable"`, or `null` (no trend indicator) |
| `links` | Link[] | Optional array of reference links rendered as chips. See `Link` below. |

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

## Tier Summary

| Tier | Minimum fields | Unlocks |
|---|---|---|
| **Stub** | `id`, `commonName`, `scientificName`, `statusLabel`, `lifePercent`, `habitatTypes`, `dietType`, `geographicRegions`, `tags`, `description`, `funFact`, `emoji` | Grid card + modal shell with "Incomplete Data" badges |
| **Standard** | Stub + `vitalSigns`, `threats`, `actionItems`, `statusHistory`, `habitat`, `diet`, `size` | Overview, Vitals, Threats, Take Action tabs |
| **Full** | Standard + `photos`, `physicalScaleImage`, `habitatImage`, `habitatStats`, `populationTrend`, `populationTrendMeta`, `preyDeclineRegions`, `fishingPressureRegions`, `healthMetrics` | Population chart, Habitat map, Pressure map, Health metrics |

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
