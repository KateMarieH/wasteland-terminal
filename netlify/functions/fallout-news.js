// netlify/functions/fallout-news.js
export default async (request) => {
  try {
    // Google News RSS query you mentioned:
    const rssUrl =
      "https://news.google.com/rss/search?q=Fallout+game+news&hl=en-US&gl=US&ceid=US:en";

    const resp = await fetch(rssUrl, {
      headers: {
        "User-Agent": "WastelandTerminal/1.0 (+https://wastelandterminal.com)",
        "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `RSS fetch failed: ${resp.status}` }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    const xml = await resp.text();

    // Minimal RSS parsing (no dependencies)
    // NOTE: This is intentionally lightweight; good enough for Google News RSS.
    const items = [];
    const itemBlocks = xml.split("<item>").slice(1);
    for (const block of itemBlocks) {
      const get = (tag) => {
        const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
        return m ? m[1].trim() : "";
      };

      const rawTitle = get("title");
      const rawLink = get("link");
      const rawSource = (() => {
        const m = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
        return m ? m[1].trim() : "";
      })();

      // Basic cleanup for CDATA
      const clean = (s) =>
        s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();

      const title = clean(rawTitle);
      const link = clean(rawLink);
      const source = clean(rawSource) || "Google News";

      if (title && link) items.push({ title, link, source });
      if (items.length >= 12) break;
    }

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // light caching so Google News doesn’t rate-limit you
        "cache-control": "public, max-age=60",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
