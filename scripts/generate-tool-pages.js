#!/usr/bin/env node
/**
 * Generates a static SEO-friendly HTML page for every agent in agents.json
 * under tools/{id}.html, plus a full sitemap.xml.
 * Runs automatically at the end of scripts/setup.js (weekly workflow).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://ayoub5550.github.io/ai-agents-ar';
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'agents.json'), 'utf-8'));
const agents = Array.isArray(raw) ? raw : raw.agents;

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const PRICE_AR = { free: 'مجاني', freemium: 'مجاني + مدفوع', paid: 'مدفوع', 'open-source': 'مفتوح المصدر', 'free-trial': 'فترة تجريبية' };

function jsonLd(a) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: a.name,
    alternateName: a.name_ar || undefined,
    description: a.official_description || a.description || a.description_en,
    url: a.url,
    applicationCategory: a.category,
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: a.pricing_type === 'free' || a.pricing_type === 'open-source' ? '0' : undefined, priceCurrency: 'USD', description: a.pricing || a.pricing_type }
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AgentVault', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: a.category_ar || a.category, item: SITE + '/?cat=' + encodeURIComponent(a.category) },
      { '@type': 'ListItem', position: 3, name: a.name, item: SITE + '/tools/' + a.id + '.html' }
    ]
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>\n<script type="application/ld+json">${JSON.stringify(crumbs)}</script>`;
}

function relatedHtml(a) {
  const rel = agents.filter(x => x.category === a.category && x.id !== a.id).slice(0, 6);
  if (!rel.length) return '';
  return `<section class="related"><h2>أدوات مشابهة في ${esc(a.category_ar || a.category)}</h2><div class="rel-grid">` +
    rel.map(r => `<a class="rel-card" href="${esc(r.id)}.html"><strong>${esc(r.name)}</strong><span>${esc((r.description || '').slice(0, 80))}</span></a>`).join('') +
    `</div></section>`;
}

function page(a) {
  const title = `${a.name_ar && a.name_ar !== a.name ? a.name_ar + ' — ' + a.name : a.name} | ${a.category_ar || ''} | AgentVault`;
  const desc = (a.official_description || a.description || '').slice(0, 158);
  const visit = a.affiliate_url || a.url;
  const features = (a.features || []).map(f => `<li>${esc(f)}</li>`).join('');
  const tags = (a.tags || []).slice(0, 6).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const canonical = `${SITE}/tools/${a.id}.html`;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#7C3AED">
<link rel="manifest" href="../manifest.json">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary">
${jsonLd(a)}
<style>
:root{--accent:#7C3AED;--accent-dark:#6D28D9;--accent-light:#F5F3FF;--text:#1E293B;--text-2:#64748B;--border:#E2E8F0;--bg:#F9F8FE;--grad:linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{overflow-x:hidden}
body{font-family:'Segoe UI',Tahoma,system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.8}
a{color:var(--accent);text-decoration:none}
.nav{background:#fff;border-bottom:1px solid var(--border);padding:12px 16px}
.nav-inner{max-width:900px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--text)}
.logo{width:32px;height:32px;border-radius:9px;background:var(--grad);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800}
.wrap{max-width:900px;margin:0 auto;padding:28px 16px 48px}
.crumbs{font-size:.85rem;color:var(--text-2);margin-bottom:18px}
.head{display:flex;align-items:center;gap:16px;flex-wrap:wrap;background:#fff;border:1px solid var(--border);border-radius:16px;padding:22px}
.head img{width:64px;height:64px;border-radius:14px;object-fit:contain;background:var(--accent-light)}
.head h1{font-size:1.5rem;line-height:1.4}
.head .en-name{color:var(--text-2);font-size:.95rem;font-weight:600}
.badge{display:inline-block;background:var(--accent-light);color:var(--accent-dark);border-radius:999px;padding:3px 12px;font-size:.8rem;font-weight:700;margin-top:6px}
.cta{margin-inline-start:auto}
.btn{display:inline-block;background:var(--grad);color:#fff;font-weight:700;padding:12px 26px;border-radius:12px;box-shadow:0 4px 14px rgba(124,58,237,.35)}
section{background:#fff;border:1px solid var(--border);border-radius:16px;padding:22px;margin-top:16px}
h2{font-size:1.1rem;margin-bottom:10px;color:var(--accent-dark)}
ul{padding-inline-start:22px}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.meta div{background:var(--accent-light);border-radius:12px;padding:12px 14px;font-size:.9rem}
.meta b{display:block;color:var(--accent-dark);font-size:.78rem;margin-bottom:2px}
.tag{display:inline-block;background:var(--bg);border:1px solid var(--border);border-radius:999px;padding:3px 12px;font-size:.78rem;color:var(--text-2);margin:2px}
.rel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.rel-card{border:1px solid var(--border);border-radius:12px;padding:12px 14px;display:block;color:var(--text);transition:border-color .15s}
.rel-card:hover{border-color:var(--accent)}
.rel-card strong{display:block;color:var(--accent-dark)}
.rel-card span{font-size:.8rem;color:var(--text-2)}
footer{text-align:center;color:var(--text-2);font-size:.85rem;padding:22px}
@media(max-width:640px){.head{padding:16px}.head h1{font-size:1.2rem}.cta{margin:8px 0 0;width:100%}.btn{display:block;text-align:center}}
</style>
</head>
<body>
<nav class="nav"><div class="nav-inner">
<a class="brand" href="../"><span class="logo">AV</span> AgentVault</a>
<a href="../">← كل الأدوات</a>
</div></nav>
<div class="wrap">
<div class="crumbs"><a href="../">الرئيسية</a> ← <a href="../?cat=${encodeURIComponent(a.category)}">${esc(a.category_ar || a.category)}</a> ← ${esc(a.name)}</div>
<div class="head">
<img src="${esc(a.logo)}" alt="${esc(a.name)}" loading="lazy" onerror="this.style.display='none'">
<div>
<h1>${esc(a.name_ar && a.name_ar !== a.name ? a.name_ar : a.name)}</h1>
${a.name_ar && a.name_ar !== a.name ? `<div class="en-name">${esc(a.name)}</div>` : ''}
<span class="badge">${esc(a.category_ar || a.category)}</span>
</div>
<div class="cta"><a class="btn" href="${esc(visit)}" target="_blank" rel="noopener">زيارة الموقع ←</a></div>
</div>
<section><h2>نبذة</h2><p>${esc(a.official_description || a.description)}</p>${a.description_en ? `<p dir="ltr" style="color:var(--text-2);margin-top:8px">${esc(a.description_en)}</p>` : ''}</section>
<section><h2>معلومات سريعة</h2><div class="meta">
<div><b>التسعير</b>${esc(a.pricing || PRICE_AR[a.pricing_type] || '—')}</div>
<div><b>النوع</b>${esc(PRICE_AR[a.pricing_type] || a.pricing_type || '—')}</div>
${a.has_free_trial ? `<div><b>تجربة مجانية</b>${esc(a.free_trial_details || 'متوفرة')}</div>` : ''}
${a.best_for ? `<div><b>الأفضل لـ</b>${esc(a.best_for)}</div>` : ''}
</div></section>
${features ? `<section><h2>أهم المميزات</h2><ul>${features}</ul></section>` : ''}
${tags ? `<section><h2>وسوم</h2>${tags}</section>` : ''}
${relatedHtml(a)}
</div>
<footer>© AgentVault — <a href="../">دليل أدوات الذكاء الاصطناعي</a></footer>
</body>
</html>`;
}

function generateSitemap() {
  const urls = [
    { loc: SITE + '/', pri: '1.0' },
    { loc: SITE + '/tool.html', pri: '0.8' },
    { loc: SITE + '/blog/', pri: '0.8' },
    { loc: SITE + '/about.html', pri: '0.5' },
    { loc: SITE + '/contact.html', pri: '0.4' },
    { loc: SITE + '/privacy.html', pri: '0.3' },
    { loc: SITE + '/terms.html', pri: '0.3' }
  ];
  const blogDir = path.join(ROOT, 'blog');
  if (fs.existsSync(blogDir)) {
    for (const f of fs.readdirSync(blogDir)) {
      if (f.endsWith('.html') && f !== 'index.html') urls.push({ loc: SITE + '/blog/' + f, pri: '0.7' });
    }
  }
  for (const a of agents) urls.push({ loc: SITE + '/tools/' + a.id + '.html', pri: '0.7' });
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`).join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf-8');
  console.log('sitemap.xml written: ' + urls.length + ' URLs');
}

function main() {
  const outDir = path.join(ROOT, 'tools');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  // remove pages for agents that no longer exist
  const ids = new Set(agents.map(a => String(a.id) + '.html'));
  for (const f of fs.readdirSync(outDir)) if (f.endsWith('.html') && !ids.has(f)) fs.unlinkSync(path.join(outDir, f));
  let n = 0;
  for (const a of agents) { fs.writeFileSync(path.join(outDir, a.id + '.html'), page(a), 'utf-8'); n++; }
  console.log('Generated ' + n + ' tool pages in tools/');
  generateSitemap();
}

main();
