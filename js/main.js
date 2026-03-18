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
