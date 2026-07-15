#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const agentsPath = path.join(root, 'agents.json');
const dataPath = path.join(root, 'data', 'extra-agents.json');

if (!fs.existsSync(dataPath)) { console.log('No data/extra-agents.json found'); process.exit(0); }

const catAr = {'coding':'برمجة','creative':'إبداعي','productivity':'إنتاجية','general-assistant':'مساعد عام','infrastructure':'بنية تحتية','framework':'إطار عمل','research':'بحث','no-code':'بدون كود','automation':'أتمتة','customer-support':'دعم العملاء','sales-marketing':'مبيعات وتسويق','education':'تعليم','data-analytics':'تحليل البيانات','security':'أمن سيبراني','finance':'مالية','health':'صحة','legal':'قانوني'};

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
let agents;
try { agents = JSON.parse(fs.readFileSync(agentsPath, 'utf-8')); }
catch (e) { console.error('Cannot read agents.json:', e.message); process.exit(1); }

const ids = new Set(agents.map(a => a.id));
let added = 0;

for (const entry of data) {
  const [id, name, nameAr, cat, desc, pt, url, tags] = entry;
  if (ids.has(id)) { console.log('  Skip: ' + id); continue; }
  agents.push({
    id, name, name_ar: nameAr,
    category: cat, category_ar: catAr[cat] || cat,
    description: desc, official_description: desc,
    features: [],
    pricing: pt === 'free' ? 'Free' : pt === 'freemium' ? 'Free tier + paid plans' : pt === 'open-source' ? 'Free (open source)' : 'Paid plans',
    pricing_type: pt === 'open-source' ? 'free' : pt,
    has_free_trial: pt !== 'paid',
    free_trial_details: pt === 'free' || pt === 'open-source' ? 'Completely free' : pt === 'freemium' ? 'Free tier available' : '',
    url, affiliate_url: '', logo: '',
    tags: tags || [], featured: false,
    open_source: pt === 'free' || pt === 'open-source',
    added_date: new Date().toISOString().split('T')[0],
    best_for: [],
    description_en: desc,
    tags_en: tags || [],
    features_en: [],
    best_for_en: []
  });
  ids.add(id);
  added++;
  console.log('  Added: ' + name);
}

if (added > 0) {
  fs.writeFileSync(agentsPath, JSON.stringify(agents, null, 2), 'utf-8');
}
console.log('Total added: ' + added + '. Directory: ' + agents.length + ' agents');
