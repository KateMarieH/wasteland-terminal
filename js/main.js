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


// -------------------------
// WEATHER MODULE
// -------------------------

const WX_KEY = "wt_weather_profile_v4";

const wxLoc = document.getElementById("wx-location");
const wxNow = document.getElementById("wx-now");
const wxMeta = document.getElementById("wx-meta");
const wxInput = document.getElementById("wx-input");
const wxUseLoc = document.getElementById("wx-use-loc");
const wxUseSaved = document.getElementById("wx-use-saved");

function wxSave(p){ localStorage.setItem(WX_KEY, JSON.stringify(p)); }
function wxLoad(){ try{ return JSON.parse(localStorage.getItem(WX_KEY)); }catch{ return null; } }

function mapWasteland(code){
  if([95,96,99].includes(code)) return "RADSTORM";
  if([61,63,65,80,81,82].includes(code)) return "ACID RAIN";
  if([45,48].includes(code)) return "RADCLOUDS";
  if([71,73,75,77].includes(code)) return "ASHFALL";
  if([0,1].includes(code)) return "CLEAR";
  if([2,3].includes(code)) return "CLOUDY";
  if([51,53,55].includes(code)) return "MIST";
  return "ATMOSPHERIC";
}

async function wxFetch(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=sunrise,sunset&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`;
  const r = await fetch(url);
  if(!r.ok) throw new Error("weather fetch failed");
  return r.json();
}

async function wxRender(p){
  wxLoc.textContent = `LOCATION: ${p.name}`;
  wxNow.textContent = `NOW: LOADING…`;
  wxMeta.textContent = `—`;

  try{
    const d = await wxFetch(p.latitude, p.longitude);
    const cw = d.current_weather;
    const cond = mapWasteland(cw.weathercode);
    const temp = Math.round(cw.temperature);
    const wind = Math.round(cw.windspeed);

    wxNow.textContent = `NOW: ${cond} • ${temp}°F • WIND ${wind} MPH`;

    const sr = new Date(d.daily.sunrise[0]).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
    const ss = new Date(d.daily.sunset[0]).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
    wxMeta.textContent = `SUNRISE ${sr} • SUNSET ${ss}`;
  }catch(e){
    wxNow.textContent = `NOW: FEED OFFLINE`;
    wxMeta.textContent = `—`;
  }
}

async function wxGeocode(q){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&format=json`;
  const r = await fetch(url);
  const j = await r.json();
  if(!j.results?.length) return null;
  const g = j.results[0];
  return { name: `${g.name}, ${g.country}`, latitude: g.latitude, longitude: g.longitude };
}

// Input enter
wxInput.addEventListener("keydown", async (e) => {
  if(e.key === "Enter"){
    const q = wxInput.value.trim();
    if(!q) return;
    wxInput.value = "";
    const p = await wxGeocode(q);
    if(!p){
      wxNow.textContent = "NOW: LOCATION NOT FOUND";
      return;
    }
    wxSave(p);
    wxRender(p);
  }
});

// Use my location
wxUseLoc.addEventListener("click", () => {
  if(!navigator.geolocation){
    wxNow.textContent = "NOW: GEO NOT AVAILABLE";
    return;
  }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const p = { name: "MY LOCATION", latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    wxSave(p);
    wxRender(p);
  }, () => {
    wxNow.textContent = "NOW: LOCATION DENIED";
  });
});

// Use saved
wxUseSaved.addEventListener("click", () => {
  const p = wxLoad();
  if(p) wxRender(p);
});

// Init
const wxInit = wxLoad();
if(wxInit) wxRender(wxInit);
else wxNow.textContent = "NOW: ENTER LOCATION";

// -------------------------
// RADIO ELEMENTS
// -------------------------

const radioPlayer = document.getElementById("radio-player");
const radioToggle = document.getElementById("radio-toggle");
const radioVolume = document.getElementById("radio-volume");

// Safety check
console.log("radioPlayer:", radioPlayer);
console.log("radioToggle:", radioToggle);
console.log("radioVolume:", radioVolume);

// Start at comfortable volume
radioPlayer.volume = 0.2;

// -------------------------
// PLAY / STOP BUTTON
// -------------------------

radioToggle.addEventListener("click", () => {
  if (radioPlayer.paused) {
    radioPlayer.play();
    radioToggle.textContent = "■ STOP";
  } else {
    radioPlayer.pause();
    radioToggle.textContent = "▶ PLAY";
  }
});

// -------------------------
// VOLUME SLIDER
// -------------------------

radioVolume.addEventListener("input", () => {
  radioPlayer.volume = radioVolume.value;
});

// -------------------------
// RADIO SCHEDULE (PST)
// -------------------------

const radioSchedule = [
  { name: "Wasteland Wakeup", start: 5, end: 14 },
  { name: "Dusty Afternoon Jazz", start: 14, end: 21 },
  { name: "After Dark in the Wastes", start: 21, end: 24 },
  { name: "After Dark in the Wastes", start: 0, end: 5 }
];

function formatTime(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:00 ${suffix}`;
}

function updateRadioSchedule() {
  const now = new Date();
  const pstHour = parseInt(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hour12: false })
  );

  let currentBlock = radioSchedule.find(b => pstHour >= b.start && pstHour < b.end);
  let currentIndex = radioSchedule.indexOf(currentBlock);
  let nextBlock = radioSchedule[(currentIndex + 1) % radioSchedule.length];

  document.getElementById("radio-block").innerHTML =
    `PROGRAM: <span>${currentBlock.name}</span>`;

  document.getElementById("radio-upnext-name").textContent = nextBlock.name;
  document.getElementById("radio-upnext-time").textContent = formatTime(nextBlock.start);
}

updateRadioSchedule();

// -------------------------
// WASTELAND BULLETIN (Top 3)
// -------------------------

const NEWS_ENDPOINT = "/.netlify/functions/fallout-news";

const newsList = document.getElementById("newsList");
const newsSource = document.getElementById("newsSource");
const newsUpdated = document.getElementById("newsUpdated");
const newsRefresh = document.getElementById("newsRefresh");

async function loadNews() {
  try {
    const resp = await fetch(NEWS_ENDPOINT);
    const data = await resp.json();

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid news format");
    }

    const top3 = data.items.slice(0, 3);

    newsList.innerHTML = "";
    top3.forEach(item => {
  const li = document.createElement("li");

  const a = document.createElement("a");
  a.href = item.link;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = item.title;

  li.appendChild(a);
  newsList.appendChild(li);
});


    newsSource.textContent = top3[0]?.source || "Google News";

    const now = new Date();
    newsUpdated.textContent =
      `Updated ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  } catch (err) {
    newsList.innerHTML = "<li>NEWS FEED OFFLINE</li>";
    newsSource.textContent = "SYSTEM";
    newsUpdated.textContent = "—";
  }
}

newsRefresh.addEventListener("click", loadNews);
loadNews();


