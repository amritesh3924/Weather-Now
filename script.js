// WeatherNow data layer: preserves OpenWeatherMap current weather, forecast and AQI flows.
let searchHistoryList = [];
const apiKey = 'da5cc509bc967933cf9f957a7a06eb9b';
const cityInput = document.getElementById('city');
const suggestionsBox = document.getElementById('suggestions');
const loader = document.getElementById('loader');
const toast = document.getElementById('toast');
let toastTimer;

const popularCities = ['London','New York','Paris','Tokyo','Sydney','Dubai','Singapore','Mumbai','Bangkok','Los Angeles','Toronto','Berlin','Madrid','Rome','Amsterdam','Barcelona','Istanbul','Mexico City','São Paulo','Shanghai','Hong Kong','Moscow','Delhi','Cairo','Seoul'];

function showToast(message) {
  document.getElementById('toastMessage').textContent = message;
  toast.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
}
function setLoading(loading) { loader.classList.toggle('active', loading); }

async function getWeather() {
  const city = cityInput.value.trim();
  if (!city) { showToast('Enter a city to explore its atmosphere.'); cityInput.focus(); return; }
  addToSearchHistory(city);
  const base = 'https://api.openweathermap.org/data/2.5/';
  fetchWeatherData(`${base}weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`, `${base}forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
  closeSuggestions();
}

async function getWeatherByCoords(lat, lon) {
  const base = 'https://api.openweathermap.org/data/2.5/';
  fetchWeatherData(`${base}weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`, `${base}forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`, true);
}

async function fetchWeatherData(currentWeatherUrl, forecastWeatherUrl, isGeolocation = false) {
  setLoading(true);
  try {
    const currentResponse = await fetch(currentWeatherUrl);
    if (!currentResponse.ok) throw new Error(currentResponse.status === 404 ? 'We could not find that location.' : 'Weather service is temporarily unavailable.');
    const currentData = await currentResponse.json();
    if (isGeolocation) { cityInput.value = currentData.name; addToSearchHistory(currentData.name); }
    const { lat, lon } = currentData.coord;
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const [airResponse, forecastResponse] = await Promise.all([fetch(airQualityUrl), fetch(forecastWeatherUrl)]);
    if (!forecastResponse.ok) throw new Error('Forecast data is unavailable.');
    const airData = airResponse.ok ? await airResponse.json() : null;
    const forecastData = await forecastResponse.json();
    updateCurrentWeather(currentData, airData);
    renderForecast(forecastData);
    showToast(`${currentData.name} is now in view.`);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    showToast(error.message || 'Something interrupted the weather signal.');
  } finally { setLoading(false); }
}

function updateCurrentWeather(data, airData) {
  const condition = data.weather[0].main.toLowerCase();
  const temperature = Math.round(data.main.temp);
  document.getElementById('cityName').textContent = data.name;
  animateNumber('temperature', temperature, '°');
  document.getElementById('description').textContent = data.weather[0].description;
  document.getElementById('conditionLabel').textContent = `${data.weather[0].main} field`;
  document.getElementById('feelsLike').textContent = `Feels like ${Math.round(data.main.feels_like)}°C · ${data.sys.country}`;
  document.getElementById('humidity').textContent = `${data.main.humidity}%`;
  document.querySelector('.gauge-progress').style.strokeDashoffset = 264 - (264 * Math.min(data.main.humidity, 100) / 100);
  document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
  document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
  document.getElementById('visibility').textContent = `${((data.visibility || 0) / 1000).toFixed(1)} km`;
  const timezone = data.timezone;
  document.getElementById('sunrise').textContent = formatLocalTime(data.sys.sunrise, timezone);
  document.getElementById('sunset').textContent = formatLocalTime(data.sys.sunset, timezone);
  document.getElementById('lastUpdated').textContent = `Last signal · ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
  updateAqi(airData);
  changeBackground(condition);
}

function formatLocalTime(unix, offset) {
  return new Date((unix + offset) * 1000).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'UTC'});
}
function animateNumber(id, target, suffix) {
  const node = document.getElementById(id); const start = Number.parseInt(node.textContent) || 0; const began = performance.now();
  const tick = now => { const p = Math.min((now - began) / 520, 1); node.textContent = `${Math.round(start + (target - start) * (1 - Math.pow(1-p,3)))}${suffix}`; if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
// Converts the supplied PM2.5 value into the familiar 0–500 US EPA AQI scale.
// This is a PM2.5-only estimate; official AQI uses the highest sub-index across pollutants.
function calculateUsPm25Aqi(pm25) {
  const concentration = Math.floor(Number(pm25) * 10) / 10;
  const bands = [[0,9.0,0,50,'Good'],[9.1,35.4,51,100,'Moderate'],[35.5,55.4,101,150,'Unhealthy for sensitive groups'],[55.5,125.4,151,200,'Unhealthy'],[125.5,225.4,201,300,'Very unhealthy'],[225.5,325.4,301,500,'Hazardous']];
  const [cLow,cHigh,iLow,iHigh,label] = bands.find(([low,high]) => concentration >= low && concentration <= high) || [325.5,99999.9,501,999,'Hazardous'];
  return { value: Math.round(((iHigh-iLow)/(cHigh-cLow))*(concentration-cLow)+iLow), label };
}
function updateAqi(airData) {
  const node = document.getElementById('aqi'); const detail = document.getElementById('aqiDetail'); const card = node.closest('.info-card');
  if (!airData?.list?.[0]) { node.textContent = 'Unavailable'; detail.textContent = 'PM2.5 data unavailable'; return; }
  const pm25 = airData.list[0].components.pm2_5; const result = calculateUsPm25Aqi(pm25);
  node.textContent = result.value; detail.textContent = `${result.label} · PM2.5 ${Math.round(pm25)} µg/m³`;
  card.dataset.aqi = result.value;
}

// Dynamic CSS atmosphere: lightweight fallback that does not require WebGL.
function changeBackground(condition) {
  const body = document.body;
  body.className = body.className.replace(/\b(clear|clouds|rain|snow|mist|fog|thunderstorm|default)\b/g, '').trim();
  const theme = ['drizzle'].includes(condition) ? 'rain' : ['haze','smoke','dust','sand','ash','squall','tornado'].includes(condition) ? 'mist' : condition;
  body.classList.add(['clear','clouds','rain','snow','mist','fog','thunderstorm'].includes(theme) ? theme : 'default');
}

function renderForecast(forecastData) {
  const daily = {}; const today = new Date(); today.setHours(0, 0, 0, 0);
  forecastData.list.forEach(item => {
    const itemDate = new Date(item.dt_txt); const day = new Date(itemDate); day.setHours(0,0,0,0);
    if (day <= today) return;
    const key = day.toISOString().slice(0,10);
    if (!daily[key]) daily[key] = { temps:[], mins:[], maxs:[], item };
    daily[key].temps.push(item.main.temp); daily[key].mins.push(item.main.temp_min); daily[key].maxs.push(item.main.temp_max);
  });
  const grid = document.getElementById('forecastGrid'); grid.innerHTML = '';
  Object.values(daily).slice(0,5).forEach((day, index) => {
    const date = new Date(day.item.dt_txt); const condition = day.item.weather[0].main.toLowerCase();
    const card = document.createElement('article'); card.className = 'day-card'; card.tabIndex = 0;
    card.innerHTML = `<p class="weekday">${index === 0 ? 'Tomorrow' : date.toLocaleDateString('en-US',{weekday:'short'})}</p><p class="date">${date.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p><div class="forecast-icon ${forecastIconClass(condition)}"></div><p class="temp">${Math.round(day.temps[0])}°</p><p class="temp-range">${Math.round(Math.min(...day.mins))}° / ${Math.round(Math.max(...day.maxs))}°</p><p class="description">${day.item.weather[0].description}</p>`;
    addTilt(card); grid.appendChild(card);
  });
}
function forecastIconClass(condition) { if (condition.includes('rain') || condition === 'drizzle') return 'rain'; if (condition === 'snow') return 'snow'; return condition === 'clouds' ? 'cloudy' : 'clear'; }

function detectLocation() {
  if (!navigator.geolocation) { showToast('Geolocation is not supported by this browser.'); return; }
  cityInput.value = 'Locating you…'; setLoading(true);
  navigator.geolocation.getCurrentPosition(
    position => { const {latitude, longitude} = position.coords; getWeatherByCoords(latitude, longitude); },
    error => { setLoading(false); cityInput.value = ''; console.error('Geolocation error:', error); showToast('Location access was unavailable. Enable it, or search for a city.'); },
    {enableHighAccuracy:false, timeout:10000, maximumAge:300000}
  );
}

cityInput.addEventListener('input', event => {
  const value = event.target.value.trim().toLowerCase();
  if (!value) { closeSuggestions(); return; }
  const filtered = popularCities.filter(city => city.toLowerCase().startsWith(value));
  filtered.length ? showSuggestions(filtered) : closeSuggestions();
});
cityInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); getWeather(); } if (event.key === 'Escape') closeSuggestions(); });
function showSuggestions(cities) { suggestionsBox.innerHTML = ''; cities.forEach(city => { const item = document.createElement('div'); item.className = 'suggestion-item'; item.textContent = city; item.setAttribute('role','option'); item.onclick = () => { cityInput.value = city; closeSuggestions(); getWeather(); }; suggestionsBox.appendChild(item); }); suggestionsBox.classList.add('active'); }
function closeSuggestions() { suggestionsBox.classList.remove('active'); }
document.addEventListener('click', event => { if (!event.target.closest('.search-wrapper')) closeSuggestions(); });

function addToSearchHistory(city) { const existing = searchHistoryList.findIndex(item => item.toLowerCase() === city.toLowerCase()); if (existing >= 0) searchHistoryList.splice(existing, 1); searchHistoryList.unshift(city); searchHistoryList = searchHistoryList.slice(0,5); updateSearchHistoryDisplay(); }
function updateSearchHistoryDisplay() { const container = document.getElementById('searchHistory'); container.innerHTML = ''; searchHistoryList.forEach(city => { const item = document.createElement('button'); item.className = 'history-item'; item.type = 'button'; item.textContent = city; item.onclick = () => { cityInput.value = city; getWeather(); }; container.appendChild(item); }); }

// Interaction system: tiny pointer transforms only on capable pointers.
function addTilt(element) { if (!window.matchMedia('(pointer:fine)').matches) return; element.addEventListener('pointermove', e => { const r = element.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; element.style.transform = `translateY(-6px) rotateX(${-y*5}deg) rotateY(${x*5}deg)`; }); element.addEventListener('pointerleave', () => element.style.transform = ''); }
document.querySelectorAll('.info-card').forEach(addTilt);
document.getElementById('ambientToggle').addEventListener('click', event => { const paused = document.body.classList.toggle('motion-off'); event.currentTarget.setAttribute('aria-pressed', paused); event.currentTarget.querySelector('span').textContent = paused ? 'Still' : 'Ambient'; showToast(paused ? 'Ambient motion paused.' : 'Ambient motion restored.'); });
