#!/usr/bin/env node
/**
 * AgentVault Setup Script v4
 * 1. Merges ALL new-agents*.json files into agents.json
 * 2. Updates tool count in index.html
 * 3. Injects all CSS & JS references
 * Run: node scripts/setup.js
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

// === 2. Update index.html ===
const idxPath = path.join(root, 'index.html');
let html;
try { html = fs.readFileSync(idxPath, 'utf-8'); }
catch (e) { console.error('Cannot read index.html'); process.exit(1); }

const orig = html;

// Update counts
html = html.replace(/(AgentVault\s*[\u2014\u2013-]\s*)\d+\+?(\s*AI)/gi, '$1' + count + '+$2');
html = html.replace(/(Compare\s+)\d+\+?(\s*AI)/gi, '$1' + count + '+$2');
html = html.replace(/(directory\s*[\u2014\u2013-]\s*)\d+\+?(\s*AI)/gi, '$1' + count + '+$2');
html = html.replace(/(contains\s+)\d+\+?(\s*AI)/gi, '$1' + count + '+$2');
html = html.replace(/(Discover\s*<span>)\d+\+?(<\/span>)/gi, '$1' + count + '+$2');
html = html.replace(/(<div class="hero-stat-num">)\d+\+?(<\/div>)/g, '$1' + count + '+$2');
html = html.replace(/(hero_title:\s*'Discover\s*<span>)\d+\+?(<\/span>)/g, '$1' + count + '+$2');
html = html.replace(/(hero_title:\s*'[^']*<span>)\+?\d+(<\/span>)/g, '$1+' + count + '$2');
html = html.replace(/(<span class="filter-count">\s*)\d+(\s*<\/span>)/g, '$1' + count + '$2');

// === 3. Inject all missing CSS/JS ===
const cssFiles = ['enhancements.css', 'auth.css', 'fixes.css'];
const jsFiles = ['enhancements.js', 'auth.js', 'fixes.js'];

cssFiles.forEach(f => {
  if (!html.includes(f))
    html = html.replace('</head>', '  <link rel="stylesheet" href="' + f + '">\n</head>');
});

jsFiles.forEach(f => {
  if (!html.includes(f))
    html = html.replace('</body>', '  <script src="' + f + '" defer></script>\n</body>');
});

if (html !== orig) {
  fs.writeFileSync(idxPath, html, 'utf-8');
  console.log('index.html updated: count=' + count + '+, all scripts injected');
} else {
  console.log('index.html already up to date');
}
console.log('\nSetup complete!');
