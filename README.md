# 🌤️ WeatherNow — Real-Time Weather Forecasting App

A responsive, atmosphere-aware weather app that turns raw weather data into a living, visual experience — dynamic backgrounds, animated metrics, and a full 5-day outlook, all in vanilla HTML, CSS, and JavaScript.

**Live Demo:** [amritesh3924.github.io/Weather-Now](https://amritesh3924.github.io/Weather-Now)

---

## 📌 Project Overview

WeatherNow goes beyond a basic "temperature and icon" widget. It combines three live OpenWeatherMap data feeds into a single real-time dashboard, then wraps the result in an interface that visually reacts to the weather itself — rain fields, drifting clouds, fog layers, and lightning flashes shift in based on live conditions.

---

## ✨ Features

- **Live Weather Search** — search any city worldwide with auto-suggestions from a curated list of 25 popular cities
- **Geolocation Support** — one-tap detection of the user's current location and local weather
- **Current Conditions Dashboard** — temperature, description, "feels like," humidity, wind speed, pressure, visibility, sunrise, and sunset
- **Custom AQI Engine** — converts raw PM2.5 concentration into the standard 0–500 US EPA Air Quality Index across 6 severity bands (Good → Hazardous)
- **5-Day Forecast** — daily min/max temperatures and conditions, aggregated from 3-hour interval data
- **Dynamic Atmosphere** — background theme (clear, clouds, rain, snow, mist, fog, thunderstorm) changes automatically based on live conditions
- **Animated UI** — smooth number count-up animations, pointer-based 3D tilt on metric cards, and an ambient motion toggle for accessibility
- **Search History** — remembers the last 5 searched cities for quick access
- **Fully Responsive & Accessible** — ARIA live regions, keyboard navigation, and reduced-motion support throughout

---

## 🛠️ Tech Stack

| Layer         | Technology                                  |
|---------------|----------------------------------------------|
| Frontend      | HTML5, CSS3, Vanilla JavaScript (ES6+)       |
| Weather Data  | OpenWeatherMap Current Weather API           |
| Forecast Data | OpenWeatherMap 5-Day / 3-Hour Forecast API   |
| Air Quality   | OpenWeatherMap Air Pollution API             |
| Fonts         | Google Fonts (Manrope, DM Mono)              |
| Deployment    | GitHub Pages                                  |

---

## 🏗️ How It Works

1. **Search or Locate** — the user searches for a city or taps "Use my location" to trigger the Geolocation API.
2. **Concurrent API Calls** — the app fires 3 concurrent requests: current weather, 5-day forecast, and air pollution (using coordinates from the current weather response).
3. **AQI Calculation** — the app extracts the PM2.5 concentration from the air pollution response and maps it onto the US EPA 0–500 AQI scale using linear interpolation across 6 concentration bands.
4. **Rendering** — current conditions animate into the dashboard, the 5-day forecast populates a scrollable grid, and the page background theme updates to match the live condition (e.g., `rain`, `clear`, `snow`).
5. **Persistence (session-only)** — recent searches are cached in memory for the session, so switching between recently viewed cities is instant.

---

## 📁 Project Structure

```
Weather-Now/
├── index.html      # App shell, layout, and ARIA structure
├── styles.css      # Atmosphere theming, animations, responsive layout
├── script.js       # API integration, AQI engine, rendering, interactions
└── README.md       # This file
```

---

## ⚙️ How to Run Locally

**1. Clone the repository**
```bash
git clone https://github.com/amritesh3924/Weather-Now.git
cd Weather-Now
```

**2. Add your OpenWeatherMap API key**

Sign up for a free key at [openweathermap.org/api](https://openweathermap.org/api), then set it in `script.js`:
```js
const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY';
```

**3. Serve the app**

Since this is a static site, any local server works:
```bash
# Python
python -m http.server 8000

# Or just open index.html directly in a browser
```

**4. Open in browser**

`http://localhost:8000`

---

## 🔑 API Reference

WeatherNow integrates 3 endpoints from the [OpenWeatherMap API](https://openweathermap.org/api):

| Endpoint | Purpose |
|---|---|
| `/data/2.5/weather` | Current conditions (temp, humidity, wind, pressure, visibility, sunrise/sunset) |
| `/data/2.5/forecast` | 5-day / 3-hour interval forecast, aggregated into daily summaries |
| `/data/2.5/air_pollution` | PM2.5 concentration, converted into a US EPA AQI score |

---

## 💡 What Makes This Project Unique

Most weather app tutorials stop at "fetch and display." WeatherNow adds:

1. **A real AQI conversion engine** — not just displaying a raw pollutant number, but mapping PM2.5 into the internationally recognized 0–500 AQI scale with proper severity labeling
2. **Condition-reactive visuals** — the entire page atmosphere (clouds, rain, fog, lightning) shifts to match live weather, not just a static icon swap
3. **Accessibility-first animation** — a dedicated ambient motion toggle respects users who prefer reduced motion, without removing the visual experience for everyone else
4. **Timezone-correct sun times** — sunrise/sunset are calculated using each city's actual UTC offset, not the browser's local time

---

## ⚠️ Notes

- Requires a valid OpenWeatherMap API key (free tier is sufficient).
- AQI is calculated from PM2.5 only — official AQI reporting uses the highest sub-index across all measured pollutants, so this is an estimate rather than an authoritative government AQI value.

---

## 👨‍💻 Developer

**Amritesh Bhaskar** — Information Science & Engineering, BMSIT Bengaluru
GitHub: [@amritesh3924](https://github.com/amritesh3924)

---

## 📄 License

This project is licensed under the MIT License.
