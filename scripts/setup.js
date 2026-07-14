#!/usr/bin/env node
/**
 * AgentVault Setup Script
 * 1. Injects enhancement CSS & JS references into index.html
 * 2. Merges new-agents.json into agents.json
 * Run: node scripts/setup.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// === 1. Inject enhancements into index.html ===
const indexPath = path.join(root, 'index.html');
let html;
try {
  html = fs.readFileSync(indexPath, 'utf-8');
} catch (e) {
  console.error('Could not read index.html:', e.message);
  process.exit(1);
}

let changed = false;

if (!html.includes('enhancements.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="enhancements.css">\n</head>');
  changed = true;
  console.log('\u2705 Injected enhancements.css link into index.html');
}

if (!html.includes('enhancements.js')) {
  html = html.replace('</body>', '  <script src="enhancements.js" defer></script>\n</body>');
  changed = true;
  console.log('\u2705 Injected enhancements.js script into index.html');
}

if (changed) {
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('\u2705 index.html updated');
} else {
  console.log('\u2139\uFE0F Enhancements already present in index.html');
}

// === 2. Merge new agents ===
const agentsPath = path.join(root, 'agents.json');
const newAgentsPath = path.join(root, 'new-agents.json');

if (fs.existsSync(newAgentsPath)) {
  try {
    const agents = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'));
    const newAgents = JSON.parse(fs.readFileSync(newAgentsPath, 'utf-8'));
    const existingIds = new Set(agents.map(a => a.id));
    let added = 0;
    newAgents.forEach(a => {
      if (!existingIds.has(a.id)) {
        agents.push(a);
        existingIds.add(a.id);
        added++;
      }
    });
    if (added > 0) {
      fs.writeFileSync(agentsPath, JSON.stringify(agents, null, 2), 'utf-8');
      console.log(`\u2705 Added ${added} new agents. Total: ${agents.length}`);
    } else {
      console.log('\u2139\uFE0F No new agents to add (all already exist)');
    }
  } catch (e) {
    console.error('Error merging agents:', e.message);
  }
} else {
  console.log('\u2139\uFE0F No new-agents.json found — skipping merge');
}

console.log('\n\u2705 Setup complete!');
