<script>
const newsTicker  = document.getElementById("newsTicker");   // can be a div/span
const newsSource  = document.getElementById("newsSource");
const newsUpdated = document.getElementById("newsUpdated");
const newsLink    = document.getElementById("newsLink");
const newsRefresh = document.getElementById("newsRefresh");

function stamp(){ return new Date().toLocaleString(); }

function esc(s=""){
  return s.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

function renderList(items){
  if (!items?.length){
    newsTicker.innerHTML = `<div class="tickerLine mono">NO HEADLINES AVAILABLE</div>`;
    newsSource.textContent = "—";
    newsUpdated.textContent = stamp();
    newsLink.href = "#";
    return;
  }

  const top5 = items.slice(0,5);

  // newest is [0]
  newsLink.href = top5[0].link || "#";
  newsSource.textContent = (top5[0].source || "—").toUpperCase();
  newsUpdated.textContent = stamp();

  // Build a static list. Newest line in amber.
  newsTicker.innerHTML = `
    <div class="newsList">
      ${top5.map((it, i) => `
        <div class="newsItem ${i===0 ? "isNew" : ""}">
          <span class="newsSrc">${esc((it.source||"SOURCE").toUpperCase())}</span>
          <span class="newsSep">—</span>
          <a class="newsA" href="${esc(it.link||"#")}" target="_blank" rel="noopener">
            ${esc(it.title || "Untitled")}
          </a>
        </div>
      `).join("")}
    </div>
  `;
}

async function loadNews(){
  // show loading
  newsTicker.textContent = "LOADING FALLOUT HEADLINES…";
  newsSource.textContent = "—";
  newsUpdated.textContent = stamp();
  newsLink.href = "#";

  // timeout so it never hangs forever
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);

  try{
    const r = await fetch("/.netlify/functions/fallout-news", {
      cache: "no-store",
      signal: ctrl.signal
    });

    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const text = await r.text(); // read as text first so we can debug

    if (!ct.includes("application/json")){
      throw new Error(`Function returned non-JSON (${r.status}). First 120 chars: ${text.slice(0,120)}`);
    }

    const d = JSON.parse(text);
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    if (!d.items?.length) throw new Error("No items returned");

    renderList(d.items);
  }catch(e){
    newsTicker.innerHTML = `
      <div class="tickerLine mono">NEWS FEED OFFLINE</div>
      <div class="tiny dim" style="margin-top:8px;">${esc(String(e.message || e))}</div>
    `;
    newsSource.textContent = "SYSTEM";
    newsUpdated.textContent = stamp();
    newsLink.href = "#";
  }finally{
    clearTimeout(t);
  }
}

newsRefresh?.addEventListener("click", loadNews);
loadNews();
</script>
