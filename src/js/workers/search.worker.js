function stripTags(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(s) {
  return (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalize(s) {
  return decodeEntities(stripTags(s))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(q) {
  const n = normalize(q);
  if (!n) return [];
  return n.split(" ").filter(Boolean);
}

function scoreText(tokens, text, weight) {
  if (!text) return 0;
  const t = normalize(text);
  let score = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;

    if (t === tok) score += 6 * weight;
    else if (t.startsWith(tok)) score += 4 * weight;
    else if (t.includes(` ${tok} `)) score += 3 * weight;
    else if (t.includes(tok)) score += 1 * weight;
  }

  return score;
}

async function safeJson(url) {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function safeText(url) {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parsePage(html, url, label, priorityBoost) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(stripTags(titleMatch[1])) : label || url;

  const headingRe = /<(h1|h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const headings = [];
  let m;
  while ((m = headingRe.exec(html)) !== null) {
    const level = m[1].toLowerCase();
    const text = decodeEntities(stripTags(m[2]));
    if (text) headings.push({ level, text });
  }

  const bodyText = normalize(html).slice(0, 2000);

  return {
    kind: "page",
    url,
    title,
    subtitle: label || "Page",
    priorityBoost: priorityBoost || 0,
    headings,
    bodyText
  };
}

function spellFromJson(s) {
  const name = s.name || s.spellName || "";
  const note = s.note || s.description || s.summary || "";
  const icon = s.icon || s.texture || "";
  const id = s.id || s.spellId || "";
  const url = s.url || (id ? `/pages/guide/index.html#spell_${id}` : "/pages/guide/index.html");

  return {
    kind: "spell",
    url,
    title: name || "Spell",
    subtitle: "Spell",
    icon,
    text: `${name} ${note}`.trim()
  };
}

function glossaryFromJson(g) {
  const term = g.term || g.title || "";
  const def = g.definition || g.text || g.description || "";
  const url = g.url || "/pages/guide/index.html";

  return {
    kind: "glossary",
    url,
    title: term || "Term",
    subtitle: "Glossary",
    text: `${term} ${def}`.trim()
  };
}

let READY = false;
let INDEX = {
  pages: [],
  items: []
};

async function buildIndex() {
  const pages = (await safeJson("/data/searchPages.json")) || [];
  const spellsJson = (await safeJson("/data/spells.json")) || [];
  const glossaryJson = (await safeJson("/data/glossary.json")) || [];

  const pageEntries = [];
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const html = await safeText(p.url);
    if (!html) continue;
    pageEntries.push(parsePage(html, p.url, p.label, p.priority || 0));
  }

  const spellEntries = Array.isArray(spellsJson) ? spellsJson.map(spellFromJson) : [];
  const glossaryEntries = Array.isArray(glossaryJson) ? glossaryJson.map(glossaryFromJson) : [];

  INDEX = {
    pages: pageEntries,
    items: [...spellEntries, ...glossaryEntries]
  };

  READY = true;
}

function search(query) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const results = [];

  for (let i = 0; i < INDEX.pages.length; i++) {
    const p = INDEX.pages[i];

    let s = 0;
    s += scoreText(tokens, p.title, 4);
    s += scoreText(tokens, p.subtitle, 2);

    for (let h = 0; h < p.headings.length; h++) {
      s += scoreText(tokens, p.headings[h].text, p.headings[h].level === "h2" ? 3 : 2);
    }

    s += scoreText(tokens, p.bodyText, 1);

    if (p.priorityBoost) s += p.priorityBoost;

    if (s > 0) {
      results.push({
        kind: "page",
        url: p.url,
        title: p.title,
        subtitle: p.subtitle,
        score: s
      });
    }
  }

  for (let i = 0; i < INDEX.items.length; i++) {
    const it = INDEX.items[i];
    let s = 0;
    s += scoreText(tokens, it.title, 4);
    s += scoreText(tokens, it.subtitle, 2);
    s += scoreText(tokens, it.text, 2);

    if (s > 0) {
      results.push({
        kind: it.kind,
        url: it.url,
        title: it.title,
        subtitle: it.subtitle,
        icon: it.icon || "",
        score: s
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  const seen = new Set();
  const out = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const key = `${r.kind}|${r.url}|${r.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
    if (out.length >= 10) break;
  }

  return out;
}

self.addEventListener("message", async (e) => {
  const msg = e.data || {};

  if (msg.type === "init") {
    if (!READY) await buildIndex();
    self.postMessage({ type: "ready" });
    return;
  }

  if (msg.type === "query") {
    if (!READY) await buildIndex();
    const q = msg.query || "";
    const res = search(q);
    self.postMessage({ type: "results", query: q, results: res });
  }
});