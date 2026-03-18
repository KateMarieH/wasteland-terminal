// Load announcement bar
async function loadAnnouncement() {
  try {
    const data = await loadJSON('content/announcements.json');
    const bar = document.getElementById('announcement-bar');

    if (data.isLive) {
      bar.textContent = `LIVE NOW — ${data.announcement}`;
    } else if (data.announcement) {
      bar.textContent = data.announcement;
    } else {
      bar.style.display = 'none';
    }
  } catch (err) {
    console.error(err);
  }
}

loadAnnouncement();
