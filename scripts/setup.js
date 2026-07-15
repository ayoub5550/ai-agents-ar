#!/usr/bin/env node
/**
 * AgentVault Setup Script v7 — Fixed count update
 * 1. Merges ALL new-agents*.json files into agents.json
 * 2. Updates TOTAL count everywhere in index.html (EN + AR + meta + i18n)
 * 3. Updates PER-CATEGORY counts on filter buttons
 * 4. Injects enhancement, auth, fixes, and ads CSS & JS
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
const cp = count + '+';
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

// 3a. COMPREHENSIVE total count replacement
// All <span>NNN+</span> patterns (hero title EN + AR, i18n strings)
html = html.replace(/(<span>)\d{3,}\+?(<\/span>)/g, '$1' + cp + '$2');

// Hero stat-num divs
html = html.replace(/(<div class="hero-stat-num">)\d{3,}\+?(<\/div>)/g, '$1' + cp + '$2');

// Stat-num spans
html = html.replace(/(<span class="stat-num">)\d{3,}\+?(<\/span>)/g, '$1' + cp + '$2');

// English: "AgentVault — NNN+ AI"
html = html.replace(/(AgentVault\s*[\u2014\u2013\-]\s*)\d{3,}\+?(\s*AI)/gi, '$1' + cp + '$2');

// English: "Compare/Discover/Browse NNN+ AI"
html = html.replace(/((?:Compare|Discover|Browse|Explore)\s+)\d{3,}\+?(\s*AI)/gi, '$1' + cp + '$2');

// English: "directory/contains NNN+ AI"
html = html.replace(/((?:directory|contains?)\s*[\u2014\u2013\-]?\s*)\d{3,}\+?(\s*AI)/gi, '$1' + cp + '$2');

// Arabic: "NNN+ أداة" in content, meta, FAQ schema
html = html.replace(/\d{3,}\+?(\s*أداة)/g, cp + '$1');

// Arabic: "أكثر من NNN+"
html = html.replace(/(أكثر من\s*)\d{3,}\+?/g, '$1' + cp);

// Arabic: "يضم NNN+ أداة"
html = html.replace(/(يضم\s*)\d{3,}\+?(\s*أداة)/g, '$1' + cp + '$2');

// i18n tools_count entries
html = html.replace(/(tools_count:\s*['"])\d{3,}\+?(['"])/g, '$1' + cp + '$2');

// 3b. Update PER-CATEGORY counts on filter buttons
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
  { file: 'fixes.js', tag: 'script', where: '</body>' },
  { file: 'ads.js', tag: 'script', where: '</body>' }
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

// === 5. Add AdSense script to head if missing ===
if (!html.includes('adsbygoogle')) {
  html = html.replace('</head>',
    '  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8708847484545349" crossorigin="anonymous"><\/script>\n</head>');
  console.log('Injected AdSense script');
}

if (html !== orig) {
  fs.writeFileSync(idxPath, html, 'utf-8');
  console.log('index.html updated: count=' + count + ', per-category counts updated');
} else {
  console.log('index.html already up to date');
}
console.log('\nSetup complete!');
