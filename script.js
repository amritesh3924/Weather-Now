// Global variables
let searchHistoryList = [];

async function getWeather() {
    const city = document.getElementById('city').value;
    if (!city) {
        alert('Please enter a city name');
        return;
    }

    addToSearchHistory(city);
    const apiKey = 'da5cc509bc967933cf9f957a7a06eb9b';
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    fetchWeatherData(currentWeatherUrl, forecastWeatherUrl);
    closeSuggestions();
}

async function getWeatherByCoords(lat, lon) {
    const apiKey = 'da5cc509bc967933cf9f957a7a06eb9b';
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetchWeatherData(currentWeatherUrl, forecastWeatherUrl, true);
}

async function fetchWeatherData(currentWeatherUrl, forecastWeatherUrl, isGeolocation = false) {
    try {
        // Fetch current weather
        const currentResponse = await fetch(currentWeatherUrl);
        if (!currentResponse.ok) throw new Error('City not found');
        const currentData = await currentResponse.json();
        
        // Update search bar with actual city name if from geolocation
        if (isGeolocation) {
            document.getElementById('city').value = currentData.name;
        }

        // Get coordinates for additional data
        const { lat, lon } = currentData.coord;

        // Fetch AQI data
        const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${'da5cc509bc967933cf9f957a7a06eb9b'}`;

        const airResponse = await fetch(airQualityUrl);
        const airData = await airResponse.json();

        // Update current weather display
        document.getElementById('cityName').textContent = currentData.name;
        document.getElementById('temperature').textContent = `${Math.round(currentData.main.temp)}°C`;
        document.getElementById('description').textContent = currentData.weather[0].description;
        document.getElementById('feelsLike').textContent = `Feels like: ${Math.round(currentData.main.feels_like)}°C`;

        // Update real-time information
        document.getElementById('humidity').textContent = `${currentData.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${currentData.wind.speed} m/s`;
        document.getElementById('pressure').textContent = `${currentData.main.pressure} hPa`;
        document.getElementById('visibility').textContent = `${(currentData.visibility / 1000).toFixed(1)} km`;

        // Format sunrise and sunset with timezone offset
        const timezoneOffset = currentData.timezone; // offset in seconds
        const sunriseDate = new Date((currentData.sys.sunrise + timezoneOffset) * 1000);
        const sunsetDate = new Date((currentData.sys.sunset + timezoneOffset) * 1000);
        const sunriseTime = sunriseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }).replace(/(\d{1,2}):(\d{2}) (.+)/, '$1:$2 $3');
        const sunsetTime = sunsetDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }).replace(/(\d{1,2}):(\d{2}) (.+)/, '$1:$2 $3');
        document.getElementById('sunrise').textContent = sunriseTime;
        document.getElementById('sunset').textContent = sunsetTime;
        
        // Last updated time
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('lastUpdated').textContent = `Last updated: ${timeString}`;

        // Update AQI
        const aqiValue = airData.list[0].main.aqi;
        const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
        const pm25 = airData.list[0].components.pm2_5;
        document.getElementById('aqi').textContent = `${aqiLabels[aqiValue - 1]}  ${Math.round(pm25)}`;
        
        // Apply color coding to AQI card
        const aqiCard = document.getElementById('aqi').closest('.info-card');
        if (aqiCard) {
            aqiCard.className = 'info-card ' + aqiLabels[aqiValue - 1].toLowerCase().replace(' ', '-');
        }

        // Update weather icon
        const weatherCondition = currentData.weather[0].main.toLowerCase();
        const iconElement = document.querySelector('.current-weather .icon');
        if (iconElement) {
            const weatherEmoji = getWeatherEmoji(weatherCondition);
            iconElement.innerHTML = `<span class="weather-emoji-large">${weatherEmoji}</span>`;
        }

        // Change background based on condition
        changeBackground(currentData.weather[0].main.toLowerCase());

        // Fetch 5-day forecast
        const forecastResponse = await fetch(forecastWeatherUrl);
        const forecastData = await forecastResponse.json();

        // Process 5-day forecast (get next 5 days starting from tomorrow)
        const dailyForecasts = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        forecastData.list.forEach(forecast => {
            const forecastDate = new Date(forecast.dt_txt);
            forecastDate.setHours(0, 0, 0, 0);
            
            // Only include forecasts from tomorrow onwards
            if (forecastDate > today) {
                const date = forecastDate.toLocaleDateString('en-US');
                if (!dailyForecasts[date]) {
                    // Initialize with first forecast entry
                    dailyForecasts[date] = {
                        temps: [forecast.main.temp],
                        tempMins: [forecast.main.temp_min],
                        tempMaxs: [forecast.main.temp_max],
                        description: forecast.weather[0].description,
                        weatherCondition: forecast.weather[0].main.toLowerCase(),
                        dt_txt: forecast.dt_txt
                    };
                } else {
                    // Track all temp readings for the day
                    dailyForecasts[date].temps.push(forecast.main.temp);
                    dailyForecasts[date].tempMins.push(forecast.main.temp_min);
                    dailyForecasts[date].tempMaxs.push(forecast.main.temp_max);
                }
            }
        });

        // Display 5-day forecast
        const forecastGrid = document.getElementById('forecastGrid');
        forecastGrid.innerHTML = '';
        const forecastDays = Object.values(dailyForecasts).slice(0, 5);

        forecastDays.forEach(forecast => {
            const forecastDate = new Date(forecast.dt_txt);
            const weekday = forecastDate.toLocaleDateString('en-US', { weekday: 'short' });
            const date = forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const temp = Math.round(forecast.temps[0]);
            const tempMin = Math.round(Math.min(...forecast.tempMins));
            const tempMax = Math.round(Math.max(...forecast.tempMaxs));

            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';
            
            const weatherEmoji = getWeatherEmoji(forecast.weatherCondition);
            
            dayCard.innerHTML = `
                <p class="weekday">${weekday}</p>
                <p class="date">${date}</p>
                <div class="icon"><span class="weather-emoji">${weatherEmoji}</span></div>
                <p class="temp">${temp}°C</p>
                <p class="temp-range">${tempMin}° - ${tempMax}°</p>
                <p class="description">${forecast.description}</p>
            `;
            
            forecastGrid.appendChild(dayCard);
        });

    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error: ' + error.message);
    }
}

function changeBackground(condition) {
    const body = document.body;
    body.className = '';

    switch (condition) {
        case 'clear':
            body.classList.add('clear');
            break;
        case 'clouds':
            body.classList.add('clouds');
            break;
        case 'rain':
            body.classList.add('rain');
            break;
        case 'drizzle':
            body.classList.add('rain');
            break;
        case 'thunderstorm':
            body.classList.add('rain');
            break;
        case 'snow':
            body.classList.add('snow');
            break;
        default:
            body.classList.add('default');
    }
}

// Geolocation Detection
function detectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
                document.getElementById('city').value = 'Detecting...';
            },
            (error) => {
                alert('Unable to get your location. Please enable location permissions.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

// City Search Suggestions
const cityInput = document.getElementById('city');
const suggestionsBox = document.getElementById('suggestions');

// Popular cities list for quick suggestions
const popularCities = [
    'London',
    'New York',
    'Paris',
    'Tokyo',
    'Sydney',
    'Dubai',
    'Singapore',
    'Mumbai',
    'Bangkok',
    'Los Angeles',
    'Toronto',
    'Berlin',
    'Madrid',
    'Rome',
    'Amsterdam',
    'Barcelona',
    'Istanbul',
    'Mexico City',
    'São Paulo',
    'Shanghai',
    'Hong Kong',
    'Moscow',
    'Delhi',
    'Cairo',
    'Seoul'
];

// Event listener for input
cityInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    
    if (value.length === 0) {
        closeSuggestions();
        return;
    }
    
    // Filter cities based on input
    const filtered = popularCities.filter(city =>
        city.toLowerCase().startsWith(value.toLowerCase())
    );
    
    if (filtered.length > 0) {
        showSuggestions(filtered);
    } else {
        closeSuggestions();
    }
});

// Show suggestions
function showSuggestions(cities) {
    suggestionsBox.innerHTML = '';
    
    cities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = city;
        item.onclick = () => {
            cityInput.value = city;
            closeSuggestions();
            getWeather();
        };
        suggestionsBox.appendChild(item);
    });
    
    suggestionsBox.classList.add('active');
}

// Close suggestions
function closeSuggestions() {
    suggestionsBox.classList.remove('active');
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (e.target !== cityInput && e.target !== suggestionsBox) {
        closeSuggestions();
    }
});

// Weather Emoji Mapping
function getWeatherEmoji(condition) {
    const emojiMap = {
        'clear': '☀️',
        'sunny': '☀️',
        'clouds': '☁️',
        'cloudy': '☁️',
        'overcast': '☁️',
        'rain': '🌧️',
        'rainy': '🌧️',
        'drizzle': '🌦️',
        'thunderstorm': '⛈️',
        'snow': '❄️',
        'snowy': '❄️',
        'sleet': '🌨️',
        'mist': '🌫️',
        'fog': '🌫️',
        'wind': '💨',
        'windy': '💨',
        'hail': '🧊',
    };
    
    return emojiMap[condition] || '🌤️';
}

// Search History
function addToSearchHistory(city) {
    if (!searchHistoryList.includes(city)) {
        searchHistoryList.unshift(city);
        if (searchHistoryList.length > 5) {
            searchHistoryList.pop();
        }
        updateSearchHistoryDisplay();
    }
}

function updateSearchHistoryDisplay() {
    const historyContainer = document.getElementById('searchHistory');
    historyContainer.innerHTML = '';
    
    searchHistoryList.forEach(city => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = city;
        item.onclick = () => {
            document.getElementById('city').value = city;
            getWeather();
        };
        historyContainer.appendChild(item);
    });
}