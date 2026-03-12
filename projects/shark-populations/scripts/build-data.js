#!/usr/bin/env node
// Reads data/config.json + data/species/*.json → writes data.js
// Edit individual species files, then run: node scripts/build-data.js

const fs   = require('fs');
const path = require('path');

let sharp;
try { sharp = require('sharp'); } catch { sharp = null; }

async function generateLqip(imgPath) {
  if (!sharp) return null;
  const absPath = path.join(__dirname, '../../..', imgPath);
  if (!fs.existsSync(absPath)) return null;
  try {
    const buf = await sharp(absPath)
      .resize(20, null, { withoutEnlargement: true })
      .jpeg({ quality: 40 })
      .toBuffer();
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

const root       = path.join(__dirname, '..');
const dataDir    = path.join(root, 'data');
const speciesDir = path.join(dataDir, 'species');
const outputPath = path.join(root, 'data.js');

// --- read config ---
const config = JSON.parse(fs.readFileSync(path.join(dataDir, 'config.json'), 'utf8'));
const { speciesOrder, ...projectConfig } = config;

if (!speciesOrder || !Array.isArray(speciesOrder)) {
  console.error('config.json must include a "speciesOrder" array');
  process.exit(1);
}

// --- read species in declared order ---
const rawItems = speciesOrder.map(id => {
  const filePath = path.join(speciesDir, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing species file: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
});

(async () => {
  // --- generate LQIPs for species with photos ---
  if (sharp) {
    console.log('Generating LQIPs...');
    await Promise.all(rawItems.map(async species => {
      const photo = species.photos && species.photos[0];
      if (photo) {
        species.lqip = await generateLqip(photo);
      }
    }));
  } else {
    console.warn('sharp not found — skipping LQIP generation (run: npm install sharp)');
  }

  // --- assemble and write ---
  const wikiData = { ...projectConfig, items: rawItems };

  const output =
    '// GENERATED FILE — do not edit by hand.\n' +
    '// Edit data/config.json or data/species/<id>.json, then run:\n' +
    '//   node scripts/build-data.js\n' +
    '/** @type {import(\'./types.js\').WikiData} */\n' +
    'window.WIKI_DATA = ' + JSON.stringify(wikiData, null, 2) + ';\n';

  fs.writeFileSync(outputPath, output, 'utf8');

  console.log(`Built data.js with ${rawItems.length} species:`);
  rawItems.forEach(s => console.log(`  ✓ ${s.commonName} (${s.id})`));
})();
