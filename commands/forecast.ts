import queryString from 'query-string';
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'

let data = new SlashCommandBuilder()
    .setName('forecast')
    .setDescription('Replies with the current forecast at the East Lake Community Library.');

async function execute(interaction: CommandInteraction) {
    const weatherForecastParams = queryString.stringify({
        apikey: Bun.env.TOMORROW_IO_API_KEY,
        location: [28.1113128504228, -82.69373019226934], 
        units: 'imperial',
        timestamps: ['1d']
    }, { arrayFormat: 'comma' });

    const getWeatherForecastUrl = 'https://api.tomorrow.io/v4/weather/forecast';
    const options = { method: 'GET', headers: { accept: 'application/json' } };

    const weatherForecastRes = await fetch(
        `${getWeatherForecastUrl}?${weatherForecastParams}`, 
        options
    );

    const weatherForecastData: WeatherResponse = await weatherForecastRes.json();

    console.log(JSON.stringify(weatherForecastData));

    const today = new Date().getDay()
    const startTime = new Date();
    const endTime = new Date();

    if (today === 0) {
        startTime.setHours(10, 0, 0, 0);
        endTime.setHours(19, 0, 0, 0);
    } else {
        startTime.setHours(17, 0, 0, 0);
        endTime.setHours(20, 0, 0, 0);
    }


    const hourlyWeatherForecastData = weatherForecastData?.timelines?.hourly;

    const filteredHourlyWeatherForecastData = hourlyWeatherForecastData?.filter(
        forecast => {
            const forecastTime = new Date(forecast.time);
            return forecastTime >= startTime && forecastTime <= endTime;
        }
    );

    const rainPercentage = filteredHourlyWeatherForecastData.reduce(
        (acc, forecast) => acc + forecast.values.precipitationProbability, 0
    ) / filteredHourlyWeatherForecastData.length;

    const getTemperatureEmoji = (temp: any) => {
        if (temp >= 80) return '🥵'; 
        if (temp >= 70) return '😎'; 
        if (temp >= 50) return '🥶'; 
        return '❄️'; 
    };

    const getRainEmoji = (rainChance: any) => {
        if (rainChance >= 70) return '🌧️'; 
        if (rainChance >= 40) return '🌦️'; 
        if (rainChance >= 20) return '🌥️'; 
        return '☀️'; 
    };

    const temperatureEmojis = filteredHourlyWeatherForecastData.map(
        (data) => getTemperatureEmoji(data.values.temperature)
    );

    //get average temperature for a given time block
    const getAggregateTemperature = (data: any) => {
        return Math.round(data.reduce((acc: any, forecast: any) => acc + forecast.values.temperature, 0) / data.length);
    }

    const rainEmoji = getRainEmoji(rainPercentage);

    const weatherForecastEmbed = new EmbedBuilder()
    .setTitle('Robotics Weather Forecast')
    .setDescription('Weather outlook for today’s robotics meeting!')
    .setColor('#1E90FF')
    .setThumbnail('https://static.wixstatic.com/media/8ce68c_fd250bd70999440dbaf90da0a428f3be~mv2.png/v1/fit/w_2500,h_1330,al_c/8ce68c_fd250bd70999440dbaf90da0a428f3be~mv2.png');

    // Check if today is Sunday
    if (today === 0) {
        // Grouped time blocks for Sunday
        weatherForecastEmbed.addFields(
            {
                name: `Morning 🌅`,
                value: `10:00 AM - 12:00 PM: Temp ${getAggregateTemperature(filteredHourlyWeatherForecastData.slice(0, 3))}°F ${getTemperatureEmoji(getAggregateTemperature(filteredHourlyWeatherForecastData.slice(0, 3)))}`,
                inline: true
            },
            {
                name: `Afternoon 🌤️`,
                value: `1:00 PM - 3:00 PM: Temp ${getAggregateTemperature(filteredHourlyWeatherForecastData.slice(3, 6))}°F ${getTemperatureEmoji(getAggregateTemperature(filteredHourlyWeatherForecastData.slice(3, 6)))}`,
                inline: true
            },
            {
                name: `Evening 🌆`,
                value: `4:00 PM - 6:00 PM: Temp ${getAggregateTemperature(filteredHourlyWeatherForecastData.slice(6, 8))}°F ${getTemperatureEmoji(getAggregateTemperature(filteredHourlyWeatherForecastData.slice(6, 8)))}`,
                inline: true
            }
        );
    } else {
        const forecastTimes = ['5:00 PM', '6:00 PM', '7:00 PM'];
        forecastTimes.forEach((time, index) => {
            if (filteredHourlyWeatherForecastData[index]) {
                weatherForecastEmbed.addFields({
                    name: `${time} ${temperatureEmojis[index]}`,
                    value: `${filteredHourlyWeatherForecastData[index].values.temperature}°F`,
                    inline: true
                });
            }
        });
    }

    // Add rain chance field
    weatherForecastEmbed.addFields({
        name: `Rain Chance ${rainEmoji}`,
        value: `${rainPercentage}%`
    });

    // Add footer
    weatherForecastEmbed.setFooter({
        text: 'What time is it! Krunch Time!'
    });

    // Send the reply
    await interaction.reply({ embeds: [weatherForecastEmbed] });
}
    
export { data, execute }