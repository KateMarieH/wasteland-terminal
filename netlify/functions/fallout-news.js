// netlify/functions/fallout-news.js
// No dependencies. Node 18+ (Netlify) supports global fetch.

const RSS_URL =
  "https://news.google.com/rss/search?q=Fallout+game+news&hl=en-US&gl=US&ceid=US:en";

// Tiny helpers
function pickTag(xml, tag) {
  // Matches <tag>...</tag> including CDATA
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return "";
  return m[1]
    .replace(/<!\[CDATA\[(.*?)\]\]>/gis, "$1")
    .trim();
}

function decodeEntities(str) {
  return (str || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractItems(xml, max = 15) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) && items.length < max) {
    const block = m[1];

    const title = decodeEntities(pickTag(block, "title"));
    const link = decodeEntities(pickTag(block, "link"));
    const pubDate = decodeEntities(pickTag(block, "pubDate"));

    // Google News RSS often has: <source url="...">Publisher Name</source>
    let source = decodeEntities(pickTag(block, "source"));

    // Fallback: titles often look like "Headline - Publisher"
    if (!source && title.includes(" - ")) {
      source = title.split(" - ").slice(-1)[0].trim();
    }

    items.push({
      title: title || "Untitled",
      link: link || "",
      source: source || "Google News",
      pubDate: pubDate || ""
    });
  }
  return items;
}

exports.handler = async function handler() {
  try {
    const r = await fetch(RSS_URL, {
      headers: {
        // User agent helps avoid occasional blocks
        "user-agent": "Mozilla/5.0 (WastelandTerminal; +https://wastelandterminal.com)",
        "accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8"
      }
    });

    const xml = await r.text();

    if (!r.ok) {
      return {
        statusCode: 502,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        },
        body: JSON.stringify({
          error: `RSS fetch failed: ${r.status} ${r.statusText}`,
          sample: xml.slice(0, 300)
        })
      };
    }

    const items = extractItems(xml, 20);

    if (!items.length) {
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        },
        body: JSON.stringify({
          error: "Parsed 0 items from RSS (feed format may have changed).",
          items: []
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      },
      body: JSON.stringify({ items })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      },
      body: JSON.stringify({
        error: "Function crashed",
        message: String(err?.message || err)
      })
    };
  }
};
