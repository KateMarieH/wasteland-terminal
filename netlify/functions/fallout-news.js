// netlify/functions/fallout-news.js
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
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function pickSource(block) {
  const m = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
  return m ? m[1].trim() : "";
}

function parseRss(xml) {
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
  const items = [];

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
      ts: pubDate ? Date.parse(pubDate) : 0,
    });
  }

  items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return items.slice(0, 30).map(({ ts, ...rest }) => rest);
}

exports.handler = async function handler() {
  try {
    const res = await fetch(FEED_URL, {
      headers: {
        "User-Agent": "WastelandTerminal/1.0 (+Netlify Function)",
      },
    });

    if (!res.ok) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ error: `Feed fetch failed: ${res.status}` }),
      };
    }

    const xml = await res.text();
    const items = parseRss(xml);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
      body: JSON.stringify({
        feed: "Google News RSS (Fallout game news)",
        count: items.length,
        items,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: err?.message || "Unknown error" }),
    };
  }
};
