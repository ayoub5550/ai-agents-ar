#!/usr/bin/env node
/**
 * AgentVault Auto-Discovery Script
 * Searches for new AI tools from curated sources and generates entries.
 * Run: node scripts/discover-agents.js
 * 
 * Sources:
 * 1. Product Hunt (latest AI launches)
 * 2. GitHub trending AI repos
 * 3. Curated new-agents batch files
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..');
const agentsPath = path.join(root, 'agents.json');
const { normalizeUrl, normalizeName } = require('./normalize-url');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AgentVault-Bot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function discoverFromBatchFiles() {
  const discovered = [];
  const batchPattern = /^new-agents.*\.json$/;
  
  try {
    const files = fs.readdirSync(root).filter(f => batchPattern.test(f));
    for (const file of files) {
      try {
        const agents = JSON.parse(fs.readFileSync(path.join(root, file), 'utf-8'));
        if (Array.isArray(agents)) {
          discovered.push(...agents);
          console.log(`  📂 ${file}: ${agents.length} agents`);
        }
      } catch (e) {
        console.warn(`  ⚠️ Could not parse ${file}: ${e.message}`);
      }
    }
  } catch (e) {
    console.warn('  ⚠️ Could not read directory:', e.message);
  }
  
  return discovered;
}

async function discoverFromGitHub() {
  const discovered = [];
  const categories = ['AI-agent', 'LLM-tools', 'generative-AI'];
  
  for (const topic of categories) {
    try {
      const url = `https://api.github.com/search/repositories?q=topic:${topic}+created:>=${getDateWeeksAgo(2)}&sort=stars&order=desc&per_page=5`;
      const { status, data } = await httpsGet(url);
      
      if (status === 200) {
        const json = JSON.parse(data);
        if (json.items) {
          for (const repo of json.items) {
            if (repo.stargazers_count >= 100) {
              discovered.push({
                id: repo.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                name: repo.name,
                name_ar: repo.name,
                category: 'framework',
                category_ar: 'إطار عمل',
                description: repo.description || repo.name,
                official_description: repo.description || '',
                features: [],
                pricing: 'Free (open source)',
                pricing_type: 'free',
                has_free_trial: false,
                free_trial_details: '',
                url: repo.html_url,
                affiliate_url: '',
                logo: repo.owner.avatar_url || '',
                tags: (repo.topics || []).slice(0, 3),
                featured: false,
                open_source: true,
                added_date: new Date().toISOString().split('T')[0],
                best_for: [],
                description_en: repo.description || repo.name,
                tags_en: (repo.topics || []).slice(0, 3),
                features_en: [],
                best_for_en: []
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`  ⚠️ GitHub search failed for ${topic}: ${e.message}`);
    }
  }
  
  return discovered;
}

function getDateWeeksAgo(weeks) {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log('🔍 AgentVault Auto-Discovery\n');
  
  let agents;
  try {
    agents = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'));
  } catch (e) {
    console.error('❌ Could not read agents.json:', e.message);
    process.exit(1);
  }
  
  const existingIds = new Set(agents.map(a => a.id));
  const existingUrls = new Set(agents.map(a => normalizeUrl(a.url)).filter(Boolean));
  const existingNames = new Set(agents.map(a => normalizeName(a.name)).filter(Boolean));
  console.log(`📊 Current directory: ${agents.length} agents\n`);
  
  // Source 1: Batch files
  console.log('📂 Checking batch files...');
  const batchAgents = await discoverFromBatchFiles();
  
  // Source 2: GitHub trending
  console.log('\n🐙 Checking GitHub trending AI repos...');
  const githubAgents = await discoverFromGitHub();
  
  // Merge all discovered agents
  const allNew = [...batchAgents, ...githubAgents];
  let added = 0;
  
  for (const agent of allNew) {
    const u = normalizeUrl(agent.url);
    const nm = normalizeName(agent.name);
    if (agent.id && !existingIds.has(agent.id) &&
        !(u && existingUrls.has(u)) && !(nm && existingNames.has(nm))) {
      // Validate required fields
      if (agent.name && agent.category && agent.description) {
        agents.push(agent);
        existingIds.add(agent.id);
        if (u) existingUrls.add(u);
        if (nm) existingNames.add(nm);
        added++;
        console.log(`  ✅ Added: ${agent.name} (${agent.category})`);
      }
    }
  }
  
  if (added > 0) {
    fs.writeFileSync(agentsPath, JSON.stringify(agents), 'utf-8');
    console.log(`\n🎉 Added ${added} new agents. Total: ${agents.length}`);
  } else {
    console.log('\nℹ️ No new agents to add');
  }
  
  // Counts in index.html are updated by scripts/setup.js (run after discovery)
  console.log('\n✅ Discovery complete!');
}

main().catch(e => {
  console.error('❌ Discovery failed:', e.message);
  process.exit(1);
});
