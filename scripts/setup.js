#!/usr/bin/env node
/**
 * AgentVault Setup Script v5
 * 1. Merges ALL new-agents*.json files into agents.json
 * 2. Updates TOTAL count in index.html (title, meta, hero stats)
 * 3. Updates PER-CATEGORY counts on filter buttons
 * 4. Injects enhancement, auth, and fixes CSS & JS
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

// === 1. Merge all new-agents files ===
const agentsPath = path.join(root, 'agents.json');
let agents;
try { agents = JSON.parse(fs.readFileSync(agentsPath, 'utf-8')); }
catch (e) { console.error('Cannot read agents.json:', e.message); process.exit(1); }

const ids = new Set(agents.map(a => a.id));
let totalAdded = 0;
const newFiles = fs.readdirSync(root).filter(f => /^new-agents.*\.json$/i.test(f)).sort();
console.log('Agent files found:', newFiles.join(', ') || 'none');

newFiles.forEach(file => {
  try {
    const arr = JSON.parse(fs.readFileSync(path.join(root, file), 'utf-8'));
    let n = 0;
    arr.forEach(a => { if (!ids.has(a.id)) { agents.push(a); ids.add(a.id); n++; } });
    totalAdded += n;
    console.log('  ' + file + ': +' + n);
  } catch (e) { console.error('  ' + file + ': ERROR ' + e.message); }
});

if (totalAdded > 0) fs.writeFileSync(agentsPath, JSON.stringify(agents, null, 2), 'utf-8');
const count = agents.length;
console.log('Total agents: ' + count + ' (+' + totalAdded + ' new)');

// === 2. Count per category ===
const catCounts = {};
agents.forEach(a => {
  const cat = a.category || 'other';
  catCounts[cat] = (catCounts[cat] || 0) + 1;
});
console.log('Category breakdown:', JSON.stringify(catCounts));

// === 3. Update index.html ===
const idxPath = path.join(root, 'index.html');
let html;
try { html = fs.readFileSync(idxPath, 'utf-8'); }
catch (e) { console.error('Cannot read index.html'); process.exit(1); }

const orig = html;

// 3a. Update total count in meta/title/hero-stats
html = html.replace(/(AgentVault\s*[\u2014\u2013-]\s*)\d+\+?(\s*AI)/gi, '$1' + count + '+$2');
html = html.replace(/(Compare\s+)\d+\+?(\s*AI)/gi, '$1' + count + '+$2');
html = html.replace(/(directory\s*[\u2014\u2013-]\s*)\d+\+?(\s*AI)/gi, '$1' + count + '+$2');
html = html.replace(/(contains\s+)\d+\+?(\s*AI)/gi, '$1' + count + '+$2');
html = html.replace(/(Discover\s*<span>)\d+\+?(<\/span>)/gi, '$1' + count + '+$2');
html = html.replace(/(<div class="hero-stat-num">)\d+\+?(<\/div>)/g, '$1' + count + '+$2');
html = html.replace(/(hero_title:\s*'Discover\s*<span>)\d+\+?(<\/span>)/g, '$1' + count + '+$2');
html = html.replace(/(hero_title:\s*'[^']*<span>)\+?\d+(<\/span>)/g, '$1+' + count + '$2');

// 3b. Update PER-CATEGORY counts on filter buttons
// Match: data-cat="X">...<span class="filter-count">NNN</span>
html = html.replace(/data-cat="([^"]+)"([^>]*)>([\s\S]*?)<span class="filter-count">\s*\d+\s*<\/span>/g,
  function(match, cat, attrs, inner) {
    const c = cat === 'all' ? count : (catCounts[cat] || 0);
    return 'data-cat="' + cat + '"' + attrs + '>' + inner + '<span class="filter-count">' + c + '</span>';
  }
);

// === 4. Inject all enhancements if missing ===
const injects = [
  { file: 'enhancements.css', tag: 'link', where: '</head>' },
  { file: 'auth.css', tag: 'link', where: '</head>' },
  { file: 'fixes.css', tag: 'link', where: '</head>' },
  { file: 'enhancements.js', tag: 'script', where: '</body>' },
  { file: 'auth.js', tag: 'script', where: '</body>' },
  { file: 'fixes.js', tag: 'script', where: '</body>' }
];

injects.forEach(inj => {
  if (!html.includes(inj.file)) {
    if (inj.tag === 'link') {
      html = html.replace(inj.where, `  <link rel="stylesheet" href="${inj.file}">\n${inj.where}`);
    } else {
      html = html.replace(inj.where, `  <script src="${inj.file}" defer><\/script>\n${inj.where}`);
    }
    console.log('Injected ' + inj.file);
  }
});

if (html !== orig) {
  fs.writeFileSync(idxPath, html, 'utf-8');
  console.log('index.html updated: count=' + count + '+, per-category counts fixed');
} else {
  console.log('index.html already up to date');
}
console.log('\nSetup complete!');
