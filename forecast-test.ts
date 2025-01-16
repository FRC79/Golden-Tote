// const url = 'https://api.tomorrow.io/v4/weather/forecast?location=28.1113128504228%2C-82.69373019226934&timesteps=1d&units=imperial&apikey=ucPFPcTymh9mPT5PrwoL5Cm5n9u2J4fz';
// const options = {
//   method: 'GET',
//   headers: {accept: 'application/json', 'accept-encoding': 'deflate, gzip, br'}
// };

// const res = await fetch(url, options);
// const json = await res.json();
// console.log(json);



import queryString from "query-string";

const weatherForecastParams = queryString.stringify({
    location: [28.1113128504228, -82.69373019226934], // ELHS lat and lon
    units: 'imperial',
    timestamps: ['1d'],
    apikey: Bun.env.TOMORROW_IO_API_KEY
}, { arrayFormat: 'comma' });

const getWeatherForecastUrl = "https://api.tomorrow.io/v4/weather/forecast";
const options = { method: 'GET', headers: { accept: 'application/json' } };

console.log(`${getWeatherForecastUrl}?${weatherForecastParams}`);

const weatherForecastRes = await fetch(
    `${getWeatherForecastUrl}?${weatherForecastParams}`,
    options
);

const weatherForecastData: WeatherResponse = await weatherForecastRes.json();

console.log(weatherForecastData);
const dailyWeatherForecastData = weatherForecastData?.timelines?.daily?.at(0);