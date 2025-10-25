const searchBar = document.getElementById('search-bar');
const searchResult = document.getElementById('result');
const searchResults = document.getElementById('results-container'); 
const date = document.getElementById('date');
const temp = document.getElementById('temp');
const tempPic = document.getElementById('tempPic');
const sunset = document.getElementById('sunset');
const sunrise = document.getElementById('sunrise');
const uv = document.getElementById('uv');
const feels = document.getElementById('feelsLike');
const rainChance = document.getElementById('rainChance');
const wind = document.getElementById('wind');
const hourElems = document.querySelectorAll('.hour');
const hourIconElems = document.querySelectorAll('.hourIcon');
const hourDegElems = document.querySelectorAll('.hourDeg');
const dayName = document.querySelectorAll('.day-name');
const dayDate = document.querySelectorAll('.day-date');
const dayIcon = document.querySelectorAll('.day-icon');
const dayMaxMinTemp = document.querySelectorAll('.day-max-temp');
const dayWeatherDescription = document.querySelectorAll('.day-description');
const cityName = document.getElementById('location');
const tempSwitch = document.getElementById('tempSwitch');
const options = tempSwitch.querySelectorAll('.option');
const lazyLoader = document.querySelector('.lazyLoader');
const appBody = document.querySelector('.app-body');
const notFound = document.getElementById('not-found');
const errorBox = document.getElementById('error-box');
const errorMsg = document.getElementById('error-msg');


let currentUnit = 'f'; 
const apiKey = '1d4da012c679f4419ba20400f29e46a4';

window.addEventListener('load', () => {
    appBody.style.display='none';
    lazyLoader.style.display='flex'
});


searchBar.addEventListener("input", function (e) {
    const city = searchBar.value.trim();
    searchBar.classList.add('clicked-search-bar');
    if (city.length < 2) {
        searchResults.innerText = "";
        searchResults.style.display = 'none';
        return;
    }
    const xhrSuggestions = new XMLHttpRequest();
    const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${apiKey}`;

    xhrSuggestions.open("GET", geoURL);
    xhrSuggestions.send();

    xhrSuggestions.onreadystatechange = function () {
        if (xhrSuggestions.readyState === 4 && xhrSuggestions.status === 200) {
            const suggestions = JSON.parse(xhrSuggestions.responseText);
    
            searchResults.innerText = ""; 
    
            const filteredSuggestions = suggestions.filter(cityObj => {
                const fullCityName = `${cityObj.name}${cityObj.state ? ', ' + cityObj.state : ''}, ${cityObj.country}`;
                return fullCityName.toLowerCase().includes(city.toLowerCase());
            });
    
            if (filteredSuggestions.length === 0) {
                searchResults.innerHTML = `<div class="result">No results found</div>`;
            } else {
                filteredSuggestions.forEach(cityObj => {
                    const fullCityName = `${cityObj.name}${cityObj.state ? ', ' + cityObj.state : ''}, ${cityObj.country}`;
                    const div = document.createElement("div");
                    div.className = "result";
                    div.innerText = fullCityName;
    
                    div.addEventListener("click", function () {
                        appBody.style.display = 'flex';
                        lazyLoader.style.display = 'none';
    
                        searchBar.value = fullCityName;
                        searchResults.style.display = "none";
                        fetchWeather(cityObj.name);
                    });
    
                    searchResults.appendChild(div);
                });
            }
    
            searchResults.style.display = 'block';
        }
        else {
            searchResults.style.display = 'block';
        }
    };
    
});


function fetchWeather(city) {
    let xhr = new XMLHttpRequest();
    const unit = currentUnit === 'c' ? 'metric' : 'imperial';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`;
    xhr.open("GET", url);
    xhr.send();

    xhr.addEventListener('readystatechange', function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let data = JSON.parse(xhr.responseText);
            console.log(data);
            cityName.innerText = data.name;
            date.innerText = getFormattedDate(new Date());
            temp.innerText = `${Math.round(data.main.temp_max)}°/${Math.round(data.main.temp_min)}°`;
            feels.innerText = `${Math.round(data.main.feels_like)}°`;
            wind.innerText = `${data.wind.speed}km/h`;
            sunrise.innerText = TimeFormat(data.sys.sunrise, data.timezone);
            sunset.innerText = TimeFormat(data.sys.sunset, data.timezone);
            tempPic.src = `img/${data.weather[0].icon}.png`;
            rainChance.innerText = data.rain ? data.rain["1h"] : 'NaN';
            uv.innerText = data.current ? data.current.uvi : 'NaN';

            let lat = data.coord.lat;
            let lon = data.coord.lon;
            let xhr2 = new XMLHttpRequest();
            let url2 = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;

            xhr2.open("GET", url2);
            xhr2.send();

            xhr2.addEventListener('readystatechange', function () {
                if (xhr2.readyState == 4 && xhr2.status == 200) {
                    let data2 = JSON.parse(xhr2.responseText);
                    for (let i = 0; i <= 8; i++) {
                        const hourlyTemp = data2.list[i];
                        hourDegElems[i].innerText = `${Math.round(hourlyTemp.main.temp)}°`;
                        hourIconElems[i].src = `img/${hourlyTemp.weather[0].icon}.png`;
                        hourElems[i].innerText = TimeFormat(hourlyTemp.dt, data2.city.timezone);
                    }

                    const dailyForcast = {};

                    data2.list.forEach(forecast => {
                        const date = getFormattedDate(new Date((forecast.dt + data2.city.timezone) * 1000));
                        if (!dailyForcast[date]) {
                            dailyForcast[date] = [];
                        }
                        dailyForcast[date].push(forecast);
                    });

                    const dailySummary = [];

                    Object.keys(dailyForcast).forEach(date => {
                        const allForecasts = dailyForcast[date];
                        let min = 100;
                        let max = -100;
                        let dayIcon = "";
                        let weatherDescription;

                        allForecasts.forEach(item => {
                            min = Math.min(min, item.main.temp_min);
                            if (max < item.main.temp_max) {
                                max = item.main.temp_max;
                                dayIcon = item.weather[0].icon;
                                weatherDescription = item.weather[0].description;
                            }
                        });

                        dailySummary.push({
                            day: date,
                            minTemp: Math.round(min),
                            maxTemp: Math.round(max),
                            icon: dayIcon,
                            description: weatherDescription
                        });
                    });

                    for (let i = 0; i <= 5; i++) {
                        dayMaxMinTemp[i].innerText = `${dailySummary[i].maxTemp}°/${dailySummary[i].minTemp}°`;
                        dayWeatherDescription[i].innerText = `${dailySummary[i].description}`;
                        dayIcon[i].src = `img/${dailySummary[i].icon}.png`;
                        dayDate[i].innerText = dailySummary[i].day.split(',')[0];
                        dayName[i].innerText = dailySummary[i].day.split(',')[1].trim();
                    }
                }
            });
        } else if (xhr.readyState == 4 && xhr.status !== 200) {
           
            showError(errorMsg);
        }
    });
}

function TimeFormat(unixTimestamp, timezone) {
    const date = new Date((unixTimestamp + timezone) * 1000);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${formattedMinutes} ${ampm}`;
}

function getFormattedDate(dateToFormat) {
    const formattedDate = new Date(dateToFormat);
    const day = formattedDate.getDate();
    const month = formattedDate.toLocaleString('en-US', { month: 'short' });
    const weekday = formattedDate.toLocaleString('en-US', { weekday: 'long' });
    const dayWithSuffix = getDayWithSuffix(day);
    return `${dayWithSuffix} ${month}, ${weekday}`;
}

function getDayWithSuffix(day) {
    if (day >= 11 && day <= 13) return `${day}th`;
    switch (day % 10) {
        case 1: return `${day}st`;
        case 2: return `${day}nd`;
        case 3: return `${day}rd`;
        default: return `${day}th`;
    }
}

tempSwitch.addEventListener('click', function(e) {
    const selectedOption = e.target.closest('.option');
    
    currentUnit = selectedOption.dataset.unit;
    
    options.forEach(opt => {
        opt.classList.toggle('chosen', opt === selectedOption);
    });
    
    const city = cityName.innerText; 
    fetchWeather(city); 
});

function showError(message) {
    errorMsg.innerText = message;
    errorBox.display='block';
}

