<script>
  const newsTicker = document.getElementById("newsTicker");
  const newsUpdated = document.getElementById("newsUpdated");
  const newsSource = document.getElementById("newsSource");
  const newsLink = document.getElementById("newsLink");
  const newsRefresh = document.getElementById("newsRefresh");

  function stamp(){ return new Date().toLocaleString(); }

  async function loadNews(){
    newsTicker.textContent = "Loading Fallout headlines…";
    newsUpdated.textContent = stamp();
    newsSource.textContent = "—";
    newsLink.href = "#";

    try {
      const res = await fetch("/.netlify/functions/fallout-news", { cache: "no-store" });
      const data = await res.json();
      const items = (data.items || []).slice(0, 15);

      if (!items.length) {
        newsTicker.textContent = "No Fallout news available.";
        return;
      }

      // Build continuous ticker string
      const tickerText = items.map(item =>
        `${item.source.toUpperCase()} — ${item.title}`
      ).join("   •   ");

      // Reset animation by cloning node
      const clone = newsTicker.cloneNode(true);
      clone.textContent = tickerText;
      newsTicker.parentNode.replaceChild(clone, newsTicker);

      // Update references
      window.newsTicker = clone;

      newsUpdated.textContent = stamp();
      newsSource.textContent = "MULTIPLE SOURCES";
      newsLink.href = items[0].link || "#";

    } catch (e) {
      newsTicker.textContent = "News feed offline. Try refresh.";
    }
  }

  newsRefresh?.addEventListener("click", loadNews);
  loadNews();
</script>
