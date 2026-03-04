#!/usr/bin/env node
'use strict';

/**
 * Data completeness checker for shark-populations data.js
 *
 * Usage (from repo root):
 *   node projects/shark-populations/scripts/check-completeness.js
 *
 * Usage (from projects/shark-populations/):
 *   node scripts/check-completeness.js
 *
 * Flags:
 *   --no-color   disable ANSI color output
 *   --json       output machine-readable JSON instead of the human report
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ── Load data.js by mocking the browser `window` global ──────────────────────

const dataPath = path.resolve(__dirname, '..', 'data.js');
if (!fs.existsSync(dataPath)) {
  console.error(`Cannot find data.js at: ${dataPath}`);
  process.exit(1);
}

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(dataPath, 'utf8'), sandbox);

const { items } = sandbox.window.WIKI_DATA;
if (!Array.isArray(items) || items.length === 0) {
  console.error('WIKI_DATA.items is empty or not an array.');
  process.exit(1);
}

// ── Tier field definitions (from data-schema.md Tier Summary) ─────────────────

const STUB_FIELDS = [
  'id', 'commonName', 'scientificName', 'statusLabel', 'lifePercent',
  'habitatTypes', 'dietType', 'geographicRegions', 'tags',
  'description', 'funFact', 'emoji',
];

const STANDARD_FIELDS = [
  'vitalSigns', 'threats', 'actionItems', 'statusHistory',
  'habitat', 'diet', 'size',
];

const FULL_FIELDS = [
  'photos',
  'physicalScaleImage', 'habitatImage',
  'populationTrend', 'populationTrendMeta',
  'preyDeclineRegions', 'fishingPressureRegions',
  'healthMetrics',
];

// Fields where an empty array [] counts as missing (no useful data)
const ARRAY_FIELDS = new Set([
  'habitatTypes', 'geographicRegions', 'tags',
  'vitalSigns', 'threats', 'actionItems', 'statusHistory', 'photos',
  'populationTrend', 'preyDeclineRegions',
  'fishingPressureRegions', 'healthMetrics',
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPresent(species, field) {
  const val = species[field];
  if (val === undefined || val === null || val === '') return false;
  if (ARRAY_FIELDS.has(field) && Array.isArray(val) && val.length === 0) return false;
  return true;
}

function getMissing(species, fields) {
  return fields.filter(f => !isPresent(species, f));
}

function getTier(species) {
  if (getMissing(species, STUB_FIELDS).length > 0)     return 'Incomplete';
  if (getMissing(species, STANDARD_FIELDS).length > 0) return 'Stub';
  if (getMissing(species, FULL_FIELDS).length > 0)     return 'Standard';
  return 'Full';
}

// ── ANSI colors ───────────────────────────────────────────────────────────────

const noColor = process.argv.includes('--no-color') || !process.stdout.isTTY;
const C = noColor
  ? { reset: '', bold: '', red: '', yellow: '', green: '', cyan: '', dim: '' }
  : {
      reset:  '\x1b[0m',
      bold:   '\x1b[1m',
      red:    '\x1b[31m',
      yellow: '\x1b[33m',
      green:  '\x1b[32m',
      cyan:   '\x1b[36m',
      dim:    '\x1b[2m',
    };

function tierColor(tier) {
  return { Full: C.green, Standard: C.cyan, Stub: C.yellow, Incomplete: C.red }[tier] ?? C.reset;
}

// ── JSON output ───────────────────────────────────────────────────────────────

if (process.argv.includes('--json')) {
  const results = items.map(s => ({
    id:              s.id ?? null,
    commonName:      s.commonName ?? null,
    tier:            getTier(s),
    stubMissing:     getMissing(s, STUB_FIELDS),
    standardMissing: getMissing(s, STANDARD_FIELDS),
    fullMissing:     getMissing(s, FULL_FIELDS),
  }));
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

// ── Human report ──────────────────────────────────────────────────────────────

const LINE = '─'.repeat(70);

console.log(`\n${C.bold}Data Completeness Report — ${items.length} species${C.reset}\n${LINE}`);

const tierCounts = { Full: 0, Standard: 0, Stub: 0, Incomplete: 0 };

for (const species of items) {
  const tier            = getTier(species);
  const stubMissing     = getMissing(species, STUB_FIELDS);
  const standardMissing = getMissing(species, STANDARD_FIELDS);
  const fullMissing     = getMissing(species, FULL_FIELDS);
  const color           = tierColor(tier);
  const name            = species.commonName || species.id || '(unknown)';

  tierCounts[tier]++;

  console.log(`\n${color}${C.bold}${name}${C.reset}  ${color}[${tier}]${C.reset}`);

  if (stubMissing.length > 0) {
    console.log(`  ${C.red}✗ Stub missing:     ${stubMissing.join(', ')}${C.reset}`);
  }
  if (standardMissing.length > 0) {
    console.log(`  ${C.yellow}○ Standard missing: ${standardMissing.join(', ')}${C.reset}`);
  }
  if (fullMissing.length > 0) {
    console.log(`  ${C.dim}· Full missing:     ${fullMissing.join(', ')}${C.reset}`);
  }
  if (stubMissing.length === 0 && standardMissing.length === 0 && fullMissing.length === 0) {
    console.log(`  ${C.green}✓ All fields present${C.reset}`);
  }
}

console.log(`\n${LINE}\n${C.bold}Summary${C.reset}`);
for (const tier of ['Full', 'Standard', 'Stub', 'Incomplete']) {
  const count = tierCounts[tier];
  if (count === 0) continue;
  console.log(`  ${tierColor(tier)}${tier.padEnd(12)}${C.reset} ${count}`);
}
console.log();
