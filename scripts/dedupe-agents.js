#!/usr/bin/env node
/**
 * AgentVault Dedupe Script
 * Removes duplicate agents from agents.json.
 * Duplicates are detected by normalized URL first, then by normalized name.
 * When merging, keeps the "best" record: featured > has logo > longer description,
 * and fills missing fields (logo, description_en, tags, ...) from the duplicates.
 * Run: node scripts/dedupe-agents.js
 */
const fs = require('fs');
const path = require('path');
const { normalizeUrl, normalizeName } = require('./normalize-url');

const root = path.join(__dirname, '..');
const agentsPath = path.join(root, 'agents.json');

function score(a) {
  let s = 0;
  if (a.featured) s += 100;
  if (a.logo) s += 20;
  if (a.description_en) s += 5;
  s += Math.min(((a.description || '').length + (a.description_en || '').length) / 50, 10);
  s += (a.tags || []).length;
  return s;
}

function mergeInto(best, dup) {
  // Fill any missing/empty fields from the duplicate
  for (const [k, v] of Object.entries(dup)) {
    const cur = best[k];
    const empty = cur === undefined || cur === null || cur === '' ||
      (Array.isArray(cur) && cur.length === 0);
    if (empty && v !== undefined && v !== null && v !== '') best[k] = v;
  }
  // Union tags
  for (const key of ['tags', 'tags_en', 'features']) {
    if (Array.isArray(dup[key]) && dup[key].length) {
      const set = new Set([...(best[key] || []), ...dup[key]]);
      best[key] = [...set];
    }
  }
  if (dup.featured) best.featured = true;
  // Keep earliest added_date
  if (dup.added_date && (!best.added_date || dup.added_date < best.added_date)) {
    best.added_date = dup.added_date;
  }
}

function dedupe(agents) {
  const byKey = new Map();
  const order = [];
  for (const a of agents) {
    const key = normalizeUrl(a.url) || 'name:' + normalizeName(a.name);
    if (!byKey.has(key)) { byKey.set(key, a); order.push(key); continue; }
    const cur = byKey.get(key);
    if (score(a) > score(cur)) { mergeInto(a, cur); byKey.set(key, a); }
    else { mergeInto(cur, a); }
  }
  // Second pass: same normalized name (different URL variants like app.x.com vs x.com)
  const byName = new Map();
  const result = [];
  for (const key of order) {
    const a = byKey.get(key);
    const nk = normalizeName(a.name);
    if (!nk) { result.push(a); continue; }
    if (!byName.has(nk)) { byName.set(nk, a); result.push(a); continue; }
    const cur = byName.get(nk);
    if (score(a) > score(cur)) {
      mergeInto(a, cur);
      result[result.indexOf(cur)] = a;
      byName.set(nk, a);
    } else {
      mergeInto(cur, a);
    }
  }
  return result;
}

function main() {
  const agents = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'));
  const before = agents.length;
  const cleaned = dedupe(agents);
  console.log(`Dedupe: ${before} -> ${cleaned.length} (removed ${before - cleaned.length})`);
  if (cleaned.length !== before) {
    fs.writeFileSync(agentsPath, JSON.stringify(cleaned), 'utf-8');
    console.log('agents.json written (minified).');
  } else {
    console.log('No duplicates found.');
  }
}

main();
module.exports = { dedupe };
