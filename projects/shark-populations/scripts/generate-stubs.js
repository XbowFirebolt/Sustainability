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
 *   id, emoji, commonName, scientificName, taxonomy, statusLabel, lifePercent,
 *   habitatTypes (order-based heuristic), dietType (family-based heuristic),
 *   geographicRegions (defaults to ["global"]), tags (family-based), description
 *
 * What needs manual authoring after generation:
 *   funFact, description (review/improve the Wikipedia excerpt), habitatTypes,
 *   geographicRegions, threats, vitalSigns, actionItems, photos, and all Full tier fields
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

// ── Wikidata IUCN status QID → schema values ──────────────────────────────────
//
// Wikidata P141 (conservation status) points to these items.
// lifePercent heuristics from data-schema.md: CR≈10–25, EN≈30–50, VU≈50–65, NT≈70–80, LC≈85–100

const WIKIDATA_STATUS = {
  Q719675:  { statusLabel: 'Least Concern',        lifePercent: 90 },
  Q11401:   { statusLabel: 'Near Threatened',       lifePercent: 75 },
  Q11394:   { statusLabel: 'Vulnerable',            lifePercent: 55 },
  Q11527:   { statusLabel: 'Endangered',            lifePercent: 35 },
  Q11375:   { statusLabel: 'Critically Endangered', lifePercent: 15 },
  Q237350:  { statusLabel: 'Extinct in the Wild',   lifePercent: 5  },
  Q237244:  { statusLabel: 'Extinct',               lifePercent: 0  },
  Q57625908:{ statusLabel: 'Data Deficient',        lifePercent: 50 },
  Q62035487:{ statusLabel: 'Not Evaluated',         lifePercent: 50 },
};

function mapStatus(qid) {
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
  (SAMPLE(?commonNameVal) AS ?commonName)
  (SAMPLE(?iucnStatusQID)  AS ?iucnStatus)
  (SAMPLE(?familyNameVal)  AS ?familyName)
  (SAMPLE(?orderNameVal)   AS ?orderName)
  (SAMPLE(?genusNameVal)   AS ?genusName)
WHERE {
  ${filter}

  OPTIONAL {
    ?taxon wdt:P1843 ?commonNameVal.
    FILTER(LANG(?commonNameVal) = "en")
  }

  OPTIONAL {
    ?taxon wdt:P141 ?iucnStatusEntity.
    BIND(STRAFTER(STR(?iucnStatusEntity), "entity/") AS ?iucnStatusQID)
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
}
GROUP BY ?taxon ?scientificName`.trim();
}

async function queryWikidata(sparql) {
  const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(sparql)}&format=json`;
  // Bulk Selachimorpha queries can be slow — allow 90 seconds
  const data = await httpGet(url, { Accept: 'application/sparql-results+json' }, 90000);
  return (data.results?.bindings ?? []).map(row => {
    const val = key => row[key]?.value ?? null;
    const qid = val('iucnStatus'); // e.g. "Q11394"
    return {
      taxonQID:     val('taxon')?.replace('http://www.wikidata.org/entity/', '') ?? null,
      scientificName: val('scientificName'),
      commonName:   val('commonName'),
      iucnStatusQID: qid,
      familyName:   val('familyName'),
      orderName:    val('orderName'),
      genusName:    val('genusName'),
    };
  }).filter(r => r.scientificName);
}

// ── Wikipedia summary API ─────────────────────────────────────────────────────

async function fetchWikipediaSummary(title) {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
  try {
    const data = await httpGet(url, { Accept: 'application/json' }, 15000);
    return data.extract ?? null;
  } catch {
    return null;
  }
}

// ── Stub builder ──────────────────────────────────────────────────────────────

function buildStub(record, wikiDescription) {
  const { scientificName, commonName, iucnStatusQID, familyName, orderName, genusName } = record;
  const { statusLabel, lifePercent } = mapStatus(iucnStatusQID);
  const genus   = genusName ?? scientificName.split(' ')[0];
  const epithet = scientificName.split(' ').slice(1).join(' ');
  const name    = commonName || scientificName;

  const description = extractText(wikiDescription, 400) ||
    `${name} (${scientificName}) is a shark species. ` +
    (statusLabel !== 'Not Evaluated'
      ? `It is currently assessed as ${statusLabel} on the IUCN Red List.`
      : 'Its conservation status has not been fully evaluated.');

  return {
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
    habitatTypes:      mapHabitatTypes(orderName),
    dietType:          mapDietType(familyName),
    geographicRegions: mapGeographicRegions(orderName),
    tags:              mapTags(familyName, orderName),
    description,
    funFact: `TODO: Add a striking fun fact about ${name}.`,
  };
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
      let wikiDesc = await fetchWikipediaSummary(rec.scientificName);
      if (!wikiDesc && rec.commonName) {
        await sleep(DELAY_MS);
        wikiDesc = await fetchWikipediaSummary(rec.commonName);
      }
      await sleep(DELAY_MS);

      const stub     = buildStub(rec, wikiDesc);
      const filePath = path.join(speciesDir, `${stub.id}.json`);
      const json     = JSON.stringify(stub, null, 2) + '\n';
      const relPath  = path.relative(root, filePath);

      if (DRY_RUN) {
        print(`  [DRY RUN] Would write → ${relPath}`, C.yellow);
      } else {
        fs.writeFileSync(filePath, json, 'utf8');
        print(`  ✓ ${relPath}`, C.green);
      }
      print(`  ${stub.commonName} · ${stub.statusLabel} · ${stub.dietType} · [${stub.habitatTypes.join(', ')}]`, C.dim);
      if (!wikiDesc) print(`  (no Wikipedia description found — placeholder used)`, C.yellow);

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
    console.log(`\n${C.bold}Fields requiring manual authoring in each stub:${C.reset}`);
    console.log(`  ${C.yellow}funFact${C.reset}         — no open data equivalent`);
    console.log(`  ${C.yellow}description${C.reset}     — review/improve the Wikipedia excerpt`);
    console.log(`  ${C.yellow}habitatTypes${C.reset}    — verify order-based heuristic`);
    console.log(`  ${C.yellow}geographicRegions${C.reset} — refine from "global" default`);
    console.log(`  ${C.yellow}tags${C.reset}            — add bycatch, finning, migratory as appropriate`);
    console.log(`  ${C.yellow}threats, vitalSigns, actionItems${C.reset} — Standard tier`);
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
