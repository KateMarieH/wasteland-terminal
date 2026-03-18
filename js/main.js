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

// Load Weather
async function loadWeather() {
  const panel = document.getElementById('weather');

  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.6&longitude=-122.5&current_weather=true');
    const data = await res.json();

    const temp = Math.round(data.current_weather.temperature);
    const desc = data.current_weather.weathercode;
    const icon = getWeatherIcon(desc);

    panel.innerHTML = `
      <div class="weather-temp">${temp}°F</div>
      <div class="weather-desc">${weatherDescription(desc)}</div>
      <img class="weather-icon" src="${icon}" alt="">
    `;
  } catch (err) {
    panel.textContent = "Weather unavailable";
  }
}

loadWeather();

