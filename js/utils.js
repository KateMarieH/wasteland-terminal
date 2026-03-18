// Simple fetch wrapper
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}


// Weather code → description
function weatherDescription(code) {
  const map = {
    0: "Clear",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Fog",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    95: "Thunderstorm"
  };
  return map[code] || "Unknown";
}


// Weather code → icon
function getWeatherIcon(code) {
  if (code === 0) return "https://openweathermap.org/img/wn/01d.png";
  if (code <= 3) return "https://openweathermap.org/img/wn/02d.png";
  if (code === 45 || code === 48) return "https://openweathermap.org/img/wn/50d.png";
  if (code >= 51 && code <= 65) return "https://openweathermap.org/img/wn/09d.png";
  if (code >= 71 && code <= 75) return "https://openweathermap.org/img/wn/13d.png";
  if (code === 95) return "https://openweathermap.org/img/wn/11d.png";
  return "https://openweathermap.org/img/wn/03d.png";
}
