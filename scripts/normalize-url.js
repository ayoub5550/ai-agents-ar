// Shared URL normalizer for dedupe logic
function normalizeUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let u = raw.trim();
  try {
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    const url = new URL(u);
    let host = url.hostname.toLowerCase().replace(/^www\./, '');
    let path = url.pathname.replace(/\/+$/, '').toLowerCase();
    // Drop tracking params entirely; keep no query/hash
    return host + path;
  } catch (e) {
    return u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  }
}

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
}

module.exports = { normalizeUrl, normalizeName };
