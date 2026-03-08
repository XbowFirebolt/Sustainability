// Type definitions for WIKI_DATA — shark-populations project.
// Not loaded at runtime; exists solely for editor autocomplete (JSDoc / VS Code IntelliSense).
//
// Usage in other JS files:
//   /** @type {import('./types.js').WikiData} */
//   const data = window.WIKI_DATA;

/**
 * Top-level shape of window.WIKI_DATA.
 * @typedef {Object} WikiData
 * @property {string}        projectId            - Unique identifier for this wiki project.
 * @property {string}        favoritesKey         - localStorage key used to persist favorites.
 * @property {string}        recentlyViewedKey    - localStorage key used to persist recently-viewed items.
 * @property {string}        silhouetteFallback   - Path to the fallback silhouette image.
 * @property {Source[]}      sources              - Global attribution sources shown in the footer.
 * @property {SpeciesItem[]} items                - Ordered list of all species entries.
 */

/**
 * An attribution source (shown in the footer).
 * @typedef {Object} Source
 * @property {string} label - Display name of the source.
 * @property {string} url   - Full URL to the source.
 */

/**
 * A single species entry — the core data unit.
 * @typedef {Object} SpeciesItem
 * @property {string}   id                - Kebab-case species identifier (e.g. "carcharodon-carcharias").
 * @property {string}   lastUpdated       - ISO 8601 date the record was last fact-checked (e.g. "2025-01-10").
 * @property {string}   emoji             - Representative emoji for the species.
 * @property {string}   commonName        - Common English name.
 * @property {string}   scientificName    - Binomial scientific name.
 * @property {Taxonomy} taxonomy          - Full taxonomic classification.
 * @property {string}   statusLabel       - IUCN status string (e.g. "Vulnerable", "Critically Endangered").
 * @property {number}   lifePercent       - Population health indicator, 0–100 (100 = thriving).
 * @property {string[]} habitatTypes      - Habitat categories (e.g. "ocean", "coastal", "freshwater").
 * @property {string}   dietType          - Diet category key (e.g. "apex-predator", "filter-feeder").
 * @property {string[]} geographicRegions - Geographic region keys (e.g. "tropical", "temperate").
 * @property {string[]} tags              - Descriptive tags (e.g. "migratory", "keystone", "bycatch").
 * @property {string[]} photos            - Relative paths to species photos.
 * @property {string}   funFact           - One standout fact displayed on the card.
 * @property {string}   description       - Paragraph-length overview of the species.
 * @property {string}   habitat           - Description of where the species lives.
 * @property {string}   diet              - Description of what the species eats.
 * @property {string}   size              - Size range description.
 * @property {VitalSign[]}             vitalSigns              - Key statistics shown in the vital-signs panel.
 * @property {string}                  [physicalScaleImage]    - Path to the size-comparison graphic.
 * @property {string}                  [habitatImage]          - Path to the habitat/range map graphic.
 * @property {MeasuredStat[]}          [habitatStats]          - Habitat statistics (range, depth, etc.).
 * @property {StatusHistoryEntry[]}    [statusHistory]         - Timeline of IUCN status changes.
 * @property {PopulationTrendPoint[]}  [populationTrend]       - Year-by-year population estimates.
 * @property {PopulationTrendMeta}     [populationTrendMeta]   - Metadata describing trend data quality.
 * @property {RegionSeverity[]}        [preyDeclineRegions]    - Prey-decline pressure by region.
 * @property {RegionSeverity[]}        [fishingPressureRegions]- Fishing pressure by region.
 * @property {HealthMetric[]}          [healthMetrics]         - Composite health indicators.
 * @property {Threat[]}                threats                 - Threats facing the species.
 * @property {ActionItem[]}            [actionItems]           - Conservation actions readers can take.
 */

/**
 * Full taxonomic classification.
 * @typedef {Object} Taxonomy
 * @property {string} kingdom - e.g. "Animalia"
 * @property {string} phylum  - e.g. "Chordata"
 * @property {string} class   - e.g. "Chondrichthyes"
 * @property {string} order   - e.g. "Lamniformes"
 * @property {string} family  - e.g. "Lamnidae"
 * @property {string} genus   - e.g. "Carcharodon"
 * @property {string} species - Abbreviated binomial, e.g. "C. carcharias"
 */

/**
 * A single vital-sign statistic.
 * @typedef {Object} VitalSign
 * @property {string}  label     - Display label (e.g. "Max Length").
 * @property {string}  value     - Default display value (metric + imperial combined, or plain).
 * @property {string}  [metric]  - Metric-only value (shown when user selects metric units).
 * @property {string}  [imperial]- Imperial-only value (shown when user selects imperial units).
 * @property {boolean} [glance]  - If true, this stat appears in the at-a-glance summary strip.
 */

/**
 * A measurement that may have separate metric / imperial representations.
 * Used in habitatStats and similar panels.
 * @typedef {Object} MeasuredStat
 * @property {string} label     - Display label.
 * @property {string} value     - Default combined value.
 * @property {string} [metric]  - Metric-only value.
 * @property {string} [imperial]- Imperial-only value.
 */

/**
 * One entry in the IUCN status history timeline.
 * @typedef {Object} StatusHistoryEntry
 * @property {number} year   - Calendar year of the assessment.
 * @property {string} status - IUCN status at that year (e.g. "Vulnerable", "Not Evaluated").
 */

/**
 * A single data point in the population trend chart.
 * @typedef {Object} PopulationTrendPoint
 * @property {number} year  - Calendar year.
 * @property {number} value - Estimated population at that year.
 */

/**
 * Metadata describing the confidence and sourcing of population trend data.
 * @typedef {Object} PopulationTrendMeta
 * @property {string} confidence - Confidence level (e.g. "estimated", "modeled", "observed").
 * @property {string} note       - Human-readable explanation of the data source and caveats.
 */

/**
 * Severity of a pressure (fishing, prey decline, etc.) within a geographic region.
 * @typedef {Object} RegionSeverity
 * @property {string}                       name     - Region name (e.g. "Mediterranean").
 * @property {'critical'|'high'|'medium'|'low'} severity - Severity level.
 * @property {string}                       note     - Brief description of the pressure in this region.
 */

/**
 * A composite health indicator shown in the health-metrics panel.
 * @typedef {Object} HealthMetric
 * @property {string}                       label  - Display label (e.g. "IUCN Status").
 * @property {string}                       value  - Human-readable value.
 * @property {'stable'|'up'|'down'|null}    trend  - Trend direction, or null if unknown/not applicable.
 * @property {Link[]}                       [links]- Optional reference links for this metric.
 */

/**
 * A labelled hyperlink.
 * @typedef {Object} Link
 * @property {string} label - Display text.
 * @property {string} url   - Full URL.
 */

/**
 * A threat facing the species.
 * @typedef {Object} Threat
 * @property {string}                           name        - Short threat name (e.g. "Bycatch").
 * @property {'critical'|'high'|'medium'|'low'} severity    - Severity level.
 * @property {string}                           description - Explanation of the threat and its impact.
 */

/**
 * A concrete conservation action readers can take.
 * @typedef {Object} ActionItem
 * @property {string}      title       - Short action title.
 * @property {string}      description - Explanation of how and why to take this action.
 * @property {string|null} link        - Optional URL for more information, or null.
 */
