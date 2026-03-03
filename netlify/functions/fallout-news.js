// netlify/functions/fallout-news.js
// Fetch Google News RSS and return clean JSON for the homepage ticker.

const FEED_URL =
  "https://news.google.com/rss/search?q=Fallout+game+news&hl=en-US&gl=US&ceid=US:en";

function decodeEntities(str = "") {
  return str
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#8217;", "’")
    .replaceAll("&#8230;", "…");
}

function pick(tag, block) {
  // picks <tag>...</tag> (non-greedy)
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function pickSource(block) {
  // Google News RSS often uses: <source url="...">Source Name</source>
  const m = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
  return m ? m[1].trim() : "";
}

function parseRss(xml) {
  // 1) split out items
  const items = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const title = decodeEntities(pick("title", itemXml));
    const link = decodeEntities(pick("link", itemXml));
    const pubDate = pick("pubDate", itemXml);
    const source = decodeEntities(pickSource(itemXml)) || "Unknown";

    if (!title || !link) continue;

    items.push({
      title,
      link,
      source,
      pubDate,
      // numeric date for sorting (fallback 0)
      ts: pubDate ? Date.parse(pubDate) : 0
    });
  }

  // newest first
  items.sort((a, b) => (b.ts || 0) - (a.ts || 0));

  // trim + remove internal fields
  return items.slice(0, 30).map(({ ts, ...rest }) => rest);
}

export async function handler() {
  try {
    const res = await fetch(FEED_URL, {
      headers: {
        "User-Agent": "WastelandTerminal/1.0 (+Netlify Function)"
      }
    });

    if (!res.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: `Feed fetch failed: ${res.status}` })
      };
    }

    const xml = await res.text();
    const items = parseRss(xml);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // cache for 10 minutes at the edge
        "Cache-Control": "public, max-age=600"
      },
      body: JSON.stringify({
        feed: "Google News RSS (Fallout game news)",
        count: items.length,
        items
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || "Unknown error" })
    };
  }
}
