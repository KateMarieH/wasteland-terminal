<script>
const newsTicker = document.getElementById("newsTicker");
const newsSource = document.getElementById("newsSource");
const newsUpdated = document.getElementById("newsUpdated");
const newsLink = document.getElementById("newsLink");
const newsRefresh = document.getElementById("newsRefresh");

let headlines = [];
let idx = 0;

// timing (ms)
const TYPE_SPEED = 22;       // lower = faster typing
const HOLD_TIME = 15000;     // wait 15 seconds after typing finishes
const FADE_TIME = 900;       // fade out duration
const BETWEEN_TIME = 350;    // small gap before next type begins

let typingTimer = null;
let cycleTimer = null;

function stamp(){ return new Date().toLocaleString(); }

function shorten(text, max=120){
  return text.length > max ? text.slice(0, max-1) + "…" : text;
}

function clearTimers(){
  if (typingTimer) clearInterval(typingTimer);
  if (cycleTimer) clearTimeout(cycleTimer);
  typingTimer = null;
  cycleTimer = null;
}

function typeLine(fullText, onDone){
  let i = 0;
  newsTicker.style.opacity = 1;
  newsTicker.textContent = "";

  typingTimer = setInterval(() => {
    i++;
    newsTicker.textContent = fullText.slice(0, i);
    if (i >= fullText.length){
      clearInterval(typingTimer);
      typingTimer = null;
      onDone?.();
    }
  }, TYPE_SPEED);
}

function fadeOut(onDone){
  newsTicker.style.opacity = 0;
  cycleTimer = setTimeout(() => onDone?.(), FADE_TIME);
}

function startCycle(){
  clearTimers();

  if (!headlines.length){
    newsTicker.textContent = "NO HEADLINES AVAILABLE";
    newsSource.textContent = "—";
    newsUpdated.textContent = stamp();
    newsLink.href = "#";
    return;
  }

  // current item
  const item = headlines[idx];
  const line = `${(item.source || "SOURCE").toUpperCase()} — ${shorten(item.title || "", 120)}`;

  // update meta panel
  newsSource.textContent = (item.source || "—").toUpperCase();
  newsUpdated.textContent = stamp();
  newsLink.href = item.link || "#";

  typeLine(line, () => {
    // hold 15 seconds AFTER typing finishes
    cycleTimer = setTimeout(() => {
      fadeOut(() => {
        // advance + next
        idx = (idx + 1) % headlines.length;
        cycleTimer = setTimeout(startCycle, BETWEEN_TIME);
      });
    }, HOLD_TIME);
  });
}

async function loadNews(){
  clearTimers();
  newsTicker.style.opacity = 1;
  newsTicker.textContent = "LOADING FALLOUT HEADLINES…";
  newsSource.textContent = "—";
  newsUpdated.textContent = stamp();
  newsLink.href = "#";

  try{
    const r = await fetch("/.netlify/functions/fallout-news", { cache:"no-store" });
    const d = await r.json();
    if (!r.ok || !d.items?.length) throw new Error(d.error || "No headlines");

    // keep it tight for terminal readability
    headlines = d.items.slice(0, 12);
    idx = 0;

    startCycle();
  }catch(e){
    newsTicker.textContent = "NEWS FEED OFFLINE";
    newsSource.textContent = "SYSTEM";
    newsUpdated.textContent = stamp();
    newsLink.href = "#";
  }
}

newsRefresh.onclick = loadNews;
loadNews();
</script>
