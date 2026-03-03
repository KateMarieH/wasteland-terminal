// netlify/functions/fallout-news.js
export default async (req, context) => {
  try {
    const FEED =
      "https://news.google.com/rss/search?q=Fallout+game+news&hl=en-US&gl=US&ceid=US:en";

    const res = await fetch(FEED, {
      headers: {
        // Google News sometimes blocks generic serverless requests without a UA
        "User-Agent": "Mozilla/5.0 (WastelandTerminal; +https://wastelandterminal.com)",
        "Accept": "application/rss+xml,application/xml,text/xml,*/*",
      },
    });

    if (!res.ok) {
      const t = await res.text();
      return json(500, { error: `RSS fetch failed (${res.status})`, detail: t.slice(0, 300) });
    }

    const xml = await res.text();

    // Minimal RSS parsing (no dependencies)
    const items = parseRss(xml).slice(0, 20).map((it) => ({
      title: it.title,
      link: it.link,
      source: it.source || guessSource(it.link),
      pubDate: it.pubDate,
    }));

    return json(200, { items, fetchedAt: new Date().toISOString() }, {
      // cache a bit to avoid rate limits
      "Cache-Control": "public, max-age=300",
    });
  } catch (e) {
    return json(500, { error: "Function crashed", detail: String(e?.message || e) });
  }
};

function json(statusCode, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function decode(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decode(m[1].trim()) : "";
}

function parseRss(xml) {
  const out = [];
  const chunks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const block of chunks) {
    const title = getTag(block, "title");
    let link = getTag(block, "link");

    // Some feeds put the real link in guid
    if (!link) link = getTag(block, "guid");

    const pubDate = getTag(block, "pubDate");

    // Google News often includes a <source> tag
    const source = getTag(block, "source");

    // Clean Google redirect links if present
    link = cleanGoogleNewsLink(link);

    if (title && link) out.push({ title, link, pubDate, source });
  }
  return out;
}

function cleanGoogleNewsLink(link = "") {
  // Sometimes it is already a normal URL, sometimes it is a Google redirect.
  // We won't overcomplicate — your UI just needs something clickable.
  return link.trim();
}

function guessSource(link = "") {
  try {
    const u = new URL(link);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "NEWS";
  }
}
