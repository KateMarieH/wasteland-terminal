<script>
const newsListEl  = document.getElementById("newsList");
const newsSource  = document.getElementById("newsSource");
const newsUpdated = document.getElementById("newsUpdated");
const newsLink    = document.getElementById("newsLink");
const newsRefresh = document.getElementById("newsRefresh");

const NEWS_CACHE_KEY = "wt_news_cache_v1";   // stores last 5 links
const NEWS_POLL_MS   = 5 * 60 * 1000;        // auto refresh every 5 minutes
const MAX_ITEMS      = 5;

function stamp(){ return new Date().toLocaleString(); }

function safeText(s){ return (s || "").toString().trim(); }

function loadCache(){
  try { return JSON.parse(localStorage.getItem(NEWS_CACHE_KEY) || "[]"); }
  catch { return []; }
}
function saveCache(arr){
  localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(arr.slice(0, MAX_ITEMS)));
}

function render(items, newestIsNew){
  if(!items?.length){
    newsListEl.innerHTML = `<div class="tickerLine mono">NO HEADLINES AVAILABLE</div>`;
    newsSource.textContent = "—";
    newsUpdated.textContent = stamp();
    newsLink.href = "#";
    return;
  }

  // newest item is index 0
  const newest = items[0];
  newsLink.href = newest.link || "#";
  newsSource.textContent = (newest.source || "MULTI").toUpperCase();
  newsUpdated.textContent = stamp();

  newsListEl.innerHTML = items.slice(0, MAX_ITEMS).map((it, i) => {
    const title = safeText(it.title) || "UNTITLED";
    const src   = safeText(it.source) || "SOURCE";
    const link  = it.link || "#";

    const cls = i === 0 ? "newsItem newest" : "newsItem";
    const newTag = (i === 0 && newestIsNew) ? ` <span class="amber mono">[NEW]</span>` : "";

    return `
      <div class="${cls}">
        <div class="headline mono">
          <a href="${link}" target="_blank" rel="noopener">
            ${i+1}. ${title}${newTag}
          </a>
        </div>
        <div class="meta">SOURCE: ${src.toUpperCase()}</div>
      </div>
    `;
  }).join("");
}

async function loadNews(){
  newsListEl.innerHTML = `<div class="tickerLine mono">LOADING FALLOUT HEADLINES…</div>`;
  newsUpdated.textContent = stamp();
  newsSource.textContent = "—";
  newsLink.href = "#";

  try{
    const r = await fetch("/.netlify/functions/fallout-news", { cache:"no-store" });
    const d = await r.json();
    if(!r.ok || !d.items?.length) throw new Error(d.error || "No headlines");

    // keep top 5, newest first (assumes function already returns newest first)
    const items = d.items.slice(0, MAX_ITEMS);

    // detect if the newest story changed (by link)
    const prev = loadCache();
    const newestLink = items[0]?.link || "";
    const newestIsNew = !!newestLink && prev.length && prev[0] !== newestLink;

    // store current links to compare next time
    saveCache(items.map(x => x.link || ""));

    render(items, newestIsNew);
  }catch(e){
    newsListEl.innerHTML = `<div class="tickerLine mono">NEWS FEED OFFLINE</div>`;
    newsSource.textContent = "SYSTEM";
    newsUpdated.textContent = stamp();
    newsLink.href = "#";
  }
}

newsRefresh?.addEventListener("click", loadNews);
loadNews();
setInterval(loadNews, NEWS_POLL_MS);
</script>
