#!/usr/bin/env node
'use strict';

/**
 * generate-stubs.js — Wikidata + Wikipedia → data/species/<slug>.json stubs
 *
 * Fetches shark species data from Wikidata (taxonomy, IUCN status) and
 * Wikipedia (species descriptions), then writes stub JSON files at Stub tier.
 *
 * Data sources are openly licensed — no API token required:
 *   Wikidata:  CC0 (public domain)        https://www.wikidata.org
 *   Wikipedia: CC BY-SA                   https://en.wikipedia.org
 *
 * Usage (from projects/shark-populations/):
 *   node scripts/generate-stubs.js [options]
 *
 * Usage (from repo root):
 *   node projects/shark-populations/scripts/generate-stubs.js
 *
 * Options:
 *   --name=SCIENTIFIC   Process a single species by scientific name (repeatable)
 *   --overwrite         Overwrite existing species files (default: skip existing)
 *   --dry-run           Print what would be generated without writing files
 *   --no-color          Disable ANSI color output
 *   --delay=MS          Delay between Wikipedia API requests in ms (default: 200)
 *
 * What gets auto-populated from Wikidata/Wikipedia:
 *   Stub tier:     id, emoji, commonName, scientificName, taxonomy, statusLabel, lifePercent,
 *                  habitatTypes (order heuristic), dietType (family heuristic),
 *                  geographicRegions (defaults to ["global"]), tags (family heuristic), description
 *   Standard tier: size, habitat, diet (Wikipedia sections), vitalSigns with Max Length,
 *                  Max Weight, Lifespan (Wikidata P2043/P2067/P2250, where available)
 *
 * What needs manual authoring after generation:
 *   funFact, habitatTypes (verify heuristic), geographicRegions (refine from default),
 *   tags (add bycatch/finning/migratory), threats, actionItems, statusHistory, photos,
 *   and all Full tier fields
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// ── Paths ─────────────────────────────────────────────────────────────────────

const root       = path.resolve(__dirname, '..');
const speciesDir = path.join(root, 'data', 'species');

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArgs(name) {
  const prefix = `--${name}=`;
  return args.filter(a => a.startsWith(prefix)).map(a => a.slice(prefix.length));
}

function getArg(name) { return getArgs(name)[0] ?? null; }
function hasFlag(name) { return args.includes(`--${name}`); }

const NAMES     = getArgs('name');
const OVERWRITE = hasFlag('overwrite');
const DRY_RUN   = hasFlag('dry-run');
const NO_COLOR  = hasFlag('no-color') || !process.stdout.isTTY;
const DELAY_MS  = parseInt(getArg('delay') ?? '200', 10);

// ── ANSI colors ───────────────────────────────────────────────────────────────

const C = NO_COLOR
  ? { reset: '', bold: '', red: '', yellow: '', green: '', cyan: '', dim: '', magenta: '' }
  : {
      reset:   '\x1b[0m',
      bold:    '\x1b[1m',
      red:     '\x1b[31m',
      yellow:  '\x1b[33m',
      green:   '\x1b[32m',
      cyan:    '\x1b[36m',
      dim:     '\x1b[2m',
      magenta: '\x1b[35m',
    };

// ── Wikidata IUCN status resolution ───────────────────────────────────────────
//
// Wikidata P141 (conservation status) uses inconsistent QIDs across species.
// We resolve status by English label first (most robust), then QID as fallback.
//
// lifePercent heuristics from data-schema.md:
//   LC≈70–95, NT≈55–70, VU≈35–55, EN≈20–35, CR≈3–20, EW≈1–3, Extinct=0
// Defaults are midpoints; individual species should be tuned based on trend context.

// Label-based map (primary). Covers Wikidata label variations for each category.
const LABEL_STATUS = {
  'least concern':         { statusLabel: 'Least Concern',        lifePercent: 82 },
  'near threatened':       { statusLabel: 'Near Threatened',      lifePercent: 62 },
  'vulnerable':            { statusLabel: 'Vulnerable',           lifePercent: 45 },
  'endangered':            { statusLabel: 'Endangered',           lifePercent: 27 },
  'endangered species':    { statusLabel: 'Endangered',           lifePercent: 27 },
  'endangered status':     { statusLabel: 'Endangered',           lifePercent: 27 },
  'critically endangered': { statusLabel: 'Critically Endangered',lifePercent: 10 },
  'extinct in the wild':   { statusLabel: 'Extinct in the Wild',  lifePercent: 2  },
  'extinct species':       { statusLabel: 'Extinct',              lifePercent: 0  },
  'extinct':               { statusLabel: 'Extinct',              lifePercent: 0  },
  'data deficient':        { statusLabel: 'Data Deficient',       lifePercent: 45 },
  'not evaluated':         { statusLabel: 'Not Evaluated',        lifePercent: 45 },
};

// QID-based map (fallback). QIDs verified against Wikidata as of 2026-03.
const WIKIDATA_STATUS = {
  Q211005:  { statusLabel: 'Least Concern',        lifePercent: 82 },
  Q719675:  { statusLabel: 'Near Threatened',      lifePercent: 62 },
  Q278113:  { statusLabel: 'Vulnerable',           lifePercent: 45 },
  Q11394:   { statusLabel: 'Endangered',           lifePercent: 27 }, // "endangered species"
  Q96377276:{ statusLabel: 'Endangered',           lifePercent: 27 }, // "Endangered status" (common in WD)
  Q219127:  { statusLabel: 'Critically Endangered',lifePercent: 10 },
  Q239509:  { statusLabel: 'Extinct in the Wild',  lifePercent: 2  },
  Q237350:  { statusLabel: 'Extinct',              lifePercent: 0  }, // "extinct species"
  Q3245245: { statusLabel: 'Data Deficient',       lifePercent: 45 },
  Q3350324: { statusLabel: 'Not Evaluated',        lifePercent: 45 },
};

// Resolve IUCN status. Label takes precedence over QID to handle Wikidata inconsistencies.
function mapStatus(qid, wikidataLabel) {
  if (wikidataLabel) {
    const match = LABEL_STATUS[wikidataLabel.toLowerCase().trim()];
    if (match) return match;
  }
  return WIKIDATA_STATUS[qid] ?? { statusLabel: 'Not Evaluated', lifePercent: 50 };
}

// ── Diet type: inferred from family name ──────────────────────────────────────

const FILTER_FEEDER_FAMILIES = new Set([
  'Rhincodontidae',  // whale shark
  'Cetorhinidae',    // basking shark
  'Megachasmidae',   // megamouth shark
]);

const APEX_PREDATOR_FAMILIES = new Set([
  'Lamnidae',        // great white, mako, porbeagle, salmon shark
  'Sphyrnidae',      // hammerheads
  'Carcharhinidae',  // bull, tiger, oceanic whitetip, silky, reef sharks
  'Odontaspididae',  // sand tiger / grey nurse
  'Carchariidae',    // smalltooth sand tiger
  'Hemigaleidae',    // weasel sharks
  'Hexanchidae',     // sixgill and sevengill sharks
]);

function mapDietType(family) {
  if (FILTER_FEEDER_FAMILIES.has(family)) return 'filter-feeder';
  if (APEX_PREDATOR_FAMILIES.has(family)) return 'apex-predator';
  return 'carnivore';
}

// ── Habitat types: rough heuristic from order ─────────────────────────────────
//
// Order-level defaults capture broad habitat patterns. All stubs default to
// ["ocean"]; flag for manual review where possible.

const ORDER_HABITATS = {
  Carcharhiniformes: ['ocean', 'coastal'],
  Lamniformes:       ['ocean', 'pelagic'],
  Orectolobiformes:  ['ocean', 'coastal'],
  Hexanchiformes:    ['ocean', 'deep-sea'],
  Squaliformes:      ['ocean', 'deep-sea'],
  Squatiniformes:    ['ocean', 'coastal'],
  Pristiophoriformes:['ocean', 'coastal'],
  Heterodontiformes: ['ocean', 'coastal'],
  Echinorhiniformes: ['ocean', 'deep-sea'],
};

function mapHabitatTypes(orderName) {
  return ORDER_HABITATS[orderName] ?? ['ocean'];
}

// ── Geographic regions ────────────────────────────────────────────────────────
//
// Without structured range data, "global" is the conservative default for
// ocean-wide species. Orectolobiformes tend toward Indo-Pacific/tropical.

function mapGeographicRegions(orderName) {
  if (orderName === 'Orectolobiformes') return ['tropical'];
  return ['global'];
}

// ── Tags: inferred from family and order ──────────────────────────────────────

function mapTags(familyName, orderName) {
  const tags = new Set();
  if (familyName === 'Sphyrnidae') tags.add('schooling');
  else tags.add('solitary');
  if (APEX_PREDATOR_FAMILIES.has(familyName)) tags.add('keystone');
  // Most sharks targeted by fisheries are subject to bycatch or finning
  // These are filled in during manual review — leave tags minimal for stubs
  return [...tags];
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function stripHtml(text) {
  return (text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract up to maxChars of text, ending on a sentence boundary.
function extractText(raw, maxChars = 400) {
  const text = stripHtml(raw);
  if (!text) return '';
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastPeriod = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? '),
  );
  return lastPeriod > 80 ? truncated.slice(0, lastPeriod + 1) : truncated.trimEnd() + '…';
}

function toSlug(sciName) {
  return sciName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function httpGet(url, headers = {}, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'shark-wiki-stub-generator/2.0 (github.com/user/sustainability)', ...headers } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpGet(res.headers.location, headers, timeoutMs).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 120)}`));
        } else {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(new Error('Request timed out')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Wikidata SPARQL ───────────────────────────────────────────────────────────

const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';

// Build a SPARQL query for all shark species under Selachimorpha (Q25364),
// or for specific scientific names when provided.
function buildSparqlQuery(sciNames = []) {
  const filter = sciNames.length > 0
    ? `VALUES ?scientificName { ${sciNames.map(n => `"${n}"`).join(' ')} }\n  ?taxon wdt:P225 ?scientificName.`
    : `?taxon wdt:P171+ wd:Q25364.   # descendants of Selachimorpha (sharks superorder)
  ?taxon wdt:P105 wd:Q7432.          # rank = species
  ?taxon wdt:P225 ?scientificName.`;

  return `
SELECT DISTINCT
  ?taxon
  ?scientificName
  (SAMPLE(?commonNameVal)      AS ?commonName)
  (SAMPLE(?iucnStatusQID)      AS ?iucnStatus)
  (SAMPLE(?iucnStatusLabelVal) AS ?iucnStatusLabel)
  (SAMPLE(?familyNameVal)      AS ?familyName)
  (SAMPLE(?orderNameVal)       AS ?orderName)
  (SAMPLE(?genusNameVal)       AS ?genusName)
  (SAMPLE(?bodyLengthVal)      AS ?bodyLength)
  (SAMPLE(?massVal)            AS ?mass)
  (SAMPLE(?lifespanVal)        AS ?lifespan)
WHERE {
  ${filter}

  OPTIONAL {
    ?taxon wdt:P1843 ?commonNameVal.
    FILTER(LANG(?commonNameVal) = "en")
  }

  OPTIONAL {
    ?taxon wdt:P141 ?iucnStatusEntity.
    BIND(STRAFTER(STR(?iucnStatusEntity), "entity/") AS ?iucnStatusQID)
    OPTIONAL {
      ?iucnStatusEntity rdfs:label ?iucnStatusLabelVal.
      FILTER(LANG(?iucnStatusLabelVal) = "en")
    }
  }

  OPTIONAL {
    ?taxon wdt:P171+ ?familyEntity.
    ?familyEntity wdt:P105 wd:Q35409.
    ?familyEntity wdt:P225 ?familyNameVal.
  }

  OPTIONAL {
    ?taxon wdt:P171+ ?orderEntity.
    ?orderEntity wdt:P105 wd:Q36602.
    ?orderEntity wdt:P225 ?orderNameVal.
  }

  OPTIONAL {
    ?taxon wdt:P171 ?genusEntity.
    ?genusEntity wdt:P225 ?genusNameVal.
  }

  OPTIONAL { ?taxon wdt:P2043 ?bodyLengthVal. }  # max body length (metres, SI-normalised)
  OPTIONAL { ?taxon wdt:P2067 ?massVal. }         # mass (kg, SI-normalised)
  OPTIONAL { ?taxon wdt:P2250 ?lifespanVal. }     # lifespan (years)
}
GROUP BY ?taxon ?scientificName`.trim();
}

async function queryWikidata(sparql) {
  const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(sparql)}&format=json`;
  // Bulk Selachimorpha queries can be slow — allow 90 seconds
  const data = await httpGet(url, { Accept: 'application/sparql-results+json' }, 90000);
  return (data.results?.bindings ?? []).map(row => {
    const val = key => row[key]?.value ?? null;
    const num = key => { const v = val(key); return v !== null ? parseFloat(v) : null; };
    return {
      taxonQID:        val('taxon')?.replace('http://www.wikidata.org/entity/', '') ?? null,
      scientificName:  val('scientificName'),
      commonName:      val('commonName'),
      iucnStatusQID:   val('iucnStatus'),
      iucnStatusLabel: val('iucnStatusLabel'),
      familyName:      val('familyName'),
      orderName:       val('orderName'),
      genusName:       val('genusName'),
      bodyLengthM:     num('bodyLength'), // metres (P2043)
      massKg:          num('mass'),       // kg (P2067)
      lifespanYrs:     num('lifespan'),   // years (P2250)
    };
  }).filter(r => r.scientificName);
}

// ── Wikipedia API ─────────────────────────────────────────────────────────────
//
// Uses the stable MediaWiki action API (extracts) rather than the REST API.
// explaintext=true + exsectionformat=wiki returns plain text with == headings ==,
// which we split into a section map for targeted extraction.

const HABITAT_SECTIONS = new Set([
  'habitat', 'distribution', 'distribution and habitat', 'range',
  'range and habitat', 'ecology', 'geographic range', 'occurrence',
]);
const DIET_SECTIONS = new Set([
  'diet', 'feeding', 'diet and feeding', 'feeding behavior',
  'feeding behaviour', 'prey', 'predation', 'food habits',
]);

// Split a plain-text Wikipedia extract into { lowercaseTitle: content } map.
// Lead text (before the first heading) is stored under the empty-string key.
function parseSections(extract) {
  const parts = extract.split(/\n={2,}\s*([^=\n]+?)\s*={2,}\n?/);
  const sections = { '': parts[0] ?? '' };
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const title = parts[i].trim().toLowerCase();
    if (!(title in sections)) sections[title] = parts[i + 1] ?? '';
  }
  return sections;
}

async function fetchWikipediaData(title) {
  const params = new URLSearchParams({
    action:          'query',
    titles:          title,
    prop:            'extracts',
    exsectionformat: 'wiki',
    explaintext:     'true',
    redirects:       'true',
    format:          'json',
  });
  const url = `https://en.wikipedia.org/w/api.php?${params}`;
  try {
    const data = await httpGet(url, { Accept: 'application/json' }, 20000);
    const page = Object.values(data.query?.pages ?? {})[0];
    if (!page || page.missing !== undefined) return { description: null, habitat: null, diet: null };

    const sections = parseSections(page.extract ?? '');
    const findSection = (titleSet, maxChars) => {
      for (const key of Object.keys(sections)) {
        if (titleSet.has(key)) return extractText(sections[key], maxChars) || null;
      }
      return null;
    };

    // Full article text used for keyword inference in buildStub (not stored in output JSON).
    // We use the complete extract so keywords deep in habitat/conservation sections aren't cut off.
    const inferenceText = page.extract ?? '';

    return {
      description:   extractText(sections[''], 400) || null,
      habitat:       findSection(HABITAT_SECTIONS, 300),
      diet:          findSection(DIET_SECTIONS, 300),
      inferenceText,
    };
  } catch {
    return { description: null, habitat: null, diet: null, inferenceText: '' };
  }
}


// ── Text-based field inference ────────────────────────────────────────────────
//
// These replace the simple order/family heuristics with keyword scanning of the
// Wikipedia inferenceText (lead + habitat + diet, raw, up to 2000 chars).
// The order/family heuristics still provide the base; text signals augment them.

function inferGeographicRegions(orderName, text) {
  const t = (text ?? '').toLowerCase();
  const regions = new Set();
  if (/\btropical\b/.test(t))         regions.add('tropical');
  if (/\btemperate\b/.test(t))        regions.add('temperate');
  if (/\barctic\b|\bpolar\b/.test(t)) regions.add('arctic');
  if (/\bmediterranean\b/.test(t))    regions.add('mediterranean');
  return regions.size > 0 ? [...regions] : mapGeographicRegions(orderName);
}

function inferHabitatTypes(orderName, text) {
  const base = new Set(mapHabitatTypes(orderName));
  const t = (text ?? '').toLowerCase();
  if (/\bcoastal\b|\bnearshore\b|\bshallow/.test(t))        base.add('coastal');
  if (/\bdeep[- ]sea\b|\bdeep\s+water\b|\bbenthic/.test(t)) base.add('deep-sea');
  if (/\bfreshwater\b|\briver\b|\bestuar/.test(t))           base.add('freshwater');
  if (/\breef\b/.test(t))                                    base.add('coastal');
  return [...base];
}

function inferTags(familyName, orderName, text) {
  const base = new Set(mapTags(familyName, orderName));
  const t = (text ?? '').toLowerCase();
  if (/\bmigrat/.test(t))                    base.add('migratory');
  if (/\bbycatch\b/.test(t))                 base.add('bycatch');
  if (/\bfinning\b|\bfin\s+trade\b/.test(t)) base.add('finning');
  return [...base];
}

// ── Standard tier builders ────────────────────────────────────────────────────

// Build a human-readable size string from Wikidata biometrics.
function buildSizeString(lengthM, massKg) {
  const parts = [];
  if (lengthM != null) {
    const ft = (lengthM * 3.28084).toFixed(1);
    parts.push(`Up to ${lengthM} m (${ft} ft)`);
  }
  if (massKg != null) {
    const lbs = Math.round(massKg * 2.20462).toLocaleString();
    parts.push(`${Math.round(massKg).toLocaleString()} kg (${lbs} lb)`);
  }
  return parts.length ? parts.join('; ') : null;
}

// Build vitalSigns array from Wikidata biometrics. Only includes fields with data.
function buildVitalSigns(lengthM, massKg, lifespanYrs) {
  const vitals = [];
  if (lengthM != null) {
    const ft = (lengthM * 3.28084).toFixed(1);
    vitals.push({
      label:    'Max Length',
      value:    `${lengthM} m (${ft} ft)`,
      metric:   `${lengthM} m`,
      imperial: `${ft} ft`,
      glance:   true,
    });
  }
  if (massKg != null) {
    const kg  = Math.round(massKg).toLocaleString();
    const lbs = Math.round(massKg * 2.20462).toLocaleString();
    vitals.push({
      label:    'Max Weight',
      value:    `${kg} kg (${lbs} lb)`,
      metric:   `${kg} kg`,
      imperial: `${lbs} lb`,
      glance:   true,
    });
  }
  if (lifespanYrs != null) {
    vitals.push({ label: 'Lifespan', value: `Up to ${lifespanYrs} years` });
  }
  return vitals;
}

// ── Stub builder ──────────────────────────────────────────────────────────────

function buildStub(record, wikiData) {
  const {
    scientificName, commonName, iucnStatusQID, iucnStatusLabel,
    familyName, orderName, genusName,
    bodyLengthM, massKg, lifespanYrs,
  } = record;
  const { description: wikiDesc, habitat, diet, inferenceText } = wikiData;
  const { statusLabel, lifePercent } = mapStatus(iucnStatusQID, iucnStatusLabel);
  const genus   = genusName ?? scientificName.split(' ')[0];
  const epithet = scientificName.split(' ').slice(1).join(' ');
  const name    = commonName || scientificName;

  const description = wikiDesc ||
    `${name} (${scientificName}) is a shark species. ` +
    (statusLabel !== 'Not Evaluated'
      ? `It is currently assessed as ${statusLabel} on the IUCN Red List.`
      : 'Its conservation status has not been fully evaluated.');

  const size      = buildSizeString(bodyLengthM, massKg);
  const vitalSigns = buildVitalSigns(bodyLengthM, massKg, lifespanYrs);

  const stub = {
    id:          toSlug(scientificName),
    lastUpdated: new Date().toISOString().slice(0, 10),
    emoji:       '🦈',
    commonName:  name,
    scientificName,
    taxonomy: {
      kingdom: 'Animalia',
      phylum:  'Chordata',
      class:   'Chondrichthyes',
      order:   orderName  ?? 'Unknown',
      family:  familyName ?? 'Unknown',
      genus,
      species: epithet ? `${genus.charAt(0)}. ${epithet}` : scientificName,
    },
    statusLabel,
    lifePercent,
    habitatTypes:      inferHabitatTypes(orderName, inferenceText),
    dietType:          mapDietType(familyName),
    geographicRegions: inferGeographicRegions(orderName, inferenceText),
    tags:              inferTags(familyName, orderName, inferenceText),
    description,
    funFact: `TODO: Add a striking fun fact about ${name}.`,
  };

  // Standard tier — only included when data is available
  if (size)              stub.size       = size;
  if (habitat)           stub.habitat    = habitat;
  if (diet)              stub.diet       = diet;
  if (vitalSigns.length) stub.vitalSigns = vitalSigns;

  return stub;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const LINE = '─'.repeat(64);
  console.log(`\n${C.bold}generate-stubs.js${C.reset}${DRY_RUN ? `  ${C.yellow}[DRY RUN]${C.reset}` : ''}\n`);
  console.log(`Sources: ${C.cyan}Wikidata (CC0)${C.reset} + ${C.cyan}Wikipedia (CC BY-SA)${C.reset}`);
  console.log(`No API token required.\n`);

  if (!fs.existsSync(speciesDir) && !DRY_RUN) {
    fs.mkdirSync(speciesDir, { recursive: true });
  }

  // ── Step 1: query Wikidata ─────────────────────────────────────────────────

  const isByName = NAMES.length > 0;
  if (isByName) {
    print(`Looking up ${NAMES.length} species by name in Wikidata…`, C.cyan);
  } else {
    print('Fetching all shark species from Wikidata (Selachimorpha)…', C.cyan);
    print('This query traverses the full taxonomic tree and may take 20–60 seconds.', C.dim);
  }

  let records;
  try {
    records = await queryWikidata(buildSparqlQuery(isByName ? NAMES : []));
  } catch (err) {
    console.error(`\n${C.red}Wikidata query failed: ${err.message}${C.reset}`);
    if (!isByName) {
      console.error(`${C.dim}Tip: if the request timed out, try processing species individually:${C.reset}`);
      console.error(`${C.dim}  node scripts/generate-stubs.js --name="Carcharhinus leucas"${C.reset}`);
    }
    process.exit(1);
  }

  print(`Wikidata returned ${records.length} species records.`, C.dim);

  // ── Step 2: filter already-existing files ──────────────────────────────────

  const toProcess = [];
  const skipped   = [];

  for (const rec of records) {
    const filePath = path.join(speciesDir, `${toSlug(rec.scientificName)}.json`);
    if (fs.existsSync(filePath) && !OVERWRITE) skipped.push(rec.scientificName);
    else toProcess.push(rec);
  }

  if (skipped.length > 0) {
    print(`Skipping ${skipped.length} already-existing species (use --overwrite to regenerate).`, C.dim);
  }

  if (toProcess.length === 0) {
    print('\nNothing to generate.', C.yellow);
    return;
  }

  print(`\nGenerating ${toProcess.length} stub${toProcess.length !== 1 ? 's' : ''} (Wikipedia descriptions at ${DELAY_MS} ms/req)…`, C.bold);
  console.log(LINE);

  // ── Step 3: fetch Wikipedia descriptions + write stubs ────────────────────

  const written = [];
  const failed  = [];

  for (let i = 0; i < toProcess.length; i++) {
    const rec      = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;
    console.log(`\n${C.bold}${progress}${C.reset} ${C.cyan}${rec.scientificName}${C.reset}`);

    try {
      // Try scientific name first, then common name as fallback
      let wikiData = await fetchWikipediaData(rec.scientificName);
      if (!wikiData.description && rec.commonName) {
        await sleep(DELAY_MS);
        wikiData = await fetchWikipediaData(rec.commonName);
      }
      await sleep(DELAY_MS);

      const stub     = buildStub(rec, wikiData);
      const filePath = path.join(speciesDir, `${stub.id}.json`);
      const json     = JSON.stringify(stub, null, 2) + '\n';
      const relPath  = path.relative(root, filePath);

      if (DRY_RUN) {
        print(`  [DRY RUN] Would write → ${relPath}`, C.yellow);
      } else {
        fs.writeFileSync(filePath, json, 'utf8');
        print(`  ✓ ${relPath}`, C.green);
      }
      const extras = [stub.size && 'size', stub.habitat && 'habitat', stub.diet && 'diet', stub.vitalSigns?.length && `${stub.vitalSigns.length} vitals`].filter(Boolean);
      print(`  ${stub.commonName} · ${stub.statusLabel} · ${stub.dietType} · [${stub.habitatTypes.join(', ')}]`, C.dim);
      if (extras.length) print(`  Standard tier: ${extras.join(', ')}`, C.dim);
      if (!wikiData.description) print(`  (no Wikipedia description found — placeholder used)`, C.yellow);

      written.push({ slug: stub.id, commonName: stub.commonName, statusLabel: stub.statusLabel });
    } catch (err) {
      print(`  ✗ ${err.message}`, C.red);
      failed.push({ sciName: rec.scientificName, error: err.message });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n${LINE}\n${C.bold}Summary${C.reset}`);

  if (written.length > 0) {
    print(`\n${C.green}${C.bold}Written (${written.length}):${C.reset}`, null);
    for (const s of written) {
      console.log(`  ${C.green}✓${C.reset} ${s.commonName} (${s.slug}) — ${s.statusLabel}`);
    }
  }

  if (failed.length > 0) {
    print(`\n${C.red}${C.bold}Failed (${failed.length}):${C.reset}`, null);
    for (const f of failed) {
      console.log(`  ${C.red}✗${C.reset} ${f.sciName}: ${f.error}`);
    }
  }

  if (skipped.length > 0) print(`\nSkipped ${skipped.length} already-existing species.`, C.dim);

  if (!DRY_RUN && written.length > 0) {
    console.log(`\n${C.bold}Fields requiring manual authoring:${C.reset}`);
    console.log(`  ${C.yellow}funFact${C.reset}           — no open data equivalent`);
    console.log(`  ${C.yellow}description${C.reset}       — review/improve the Wikipedia excerpt`);
    console.log(`  ${C.yellow}habitatTypes${C.reset}      — verify order-based heuristic`);
    console.log(`  ${C.yellow}geographicRegions${C.reset} — refine from default`);
    console.log(`  ${C.yellow}tags${C.reset}              — add bycatch, finning, migratory as appropriate`);
    console.log(`  ${C.yellow}threats, actionItems, statusHistory${C.reset} — Standard tier (no open data source)`);
    console.log(`  ${C.yellow}photos${C.reset}            — licensing requires manual sourcing`);
    console.log(`\n${C.bold}Auto-populated Standard tier fields (where data exists):${C.reset}`);
    console.log(`  size · habitat · diet · vitalSigns (Max Length, Max Weight, Lifespan)`);
    console.log(`\n${C.bold}Next steps:${C.reset}`);
    console.log('  1. Add new species IDs to data/config.json "speciesOrder"');
    console.log('  2. node scripts/build-data.js');
    console.log('  3. node scripts/check-completeness.js');
  }

  console.log();
}

function print(msg, color) {
  console.log(color ? `${color}${msg}${C.reset}` : msg);
}

main().catch(err => {
  console.error(`${C.red}Fatal: ${err.message}${C.reset}`);
  process.exit(1);
});
