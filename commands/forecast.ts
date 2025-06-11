import queryString from 'query-string';
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { createLogger } from '../util/logger';
import chalk from 'chalk';
import { getEvents } from '../util/calander';

const logger = createLogger(import.meta, chalk.bold.bgWhite);

let data = new SlashCommandBuilder()
    .setName('forecast')
    .setDescription('Replies with the current forecast at the East Lake Community Library.')
    .addStringOption(option =>
        option.setName('day')
            .setDescription('Day of the week (e.g. friday)')
            .setRequired(false)
            .addChoices(
                { name: 'Sunday', value: 'sunday' },
                { name: 'Monday', value: 'monday' },
                { name: 'Tuesday', value: 'tuesday' },
                { name: 'Wednesday', value: 'wednesday' },
                { name: 'Thursday', value: 'thursday' },
                { name: 'Friday', value: 'friday' },
                { name: 'Saturday', value: 'saturday' }
            )
    );

async function execute(interaction: CommandInteraction) {
    const inputDay = interaction.options.get('day')?.value as string;

    const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
    };
    const todayIndex = new Date().getDay();

    let targetIndex = todayIndex;
    if (inputDay && dayMap[inputDay.toLowerCase()] !== undefined) {
        targetIndex = dayMap[inputDay.toLowerCase()];
    }
    let diff = (targetIndex - todayIndex + 7) % 7;
    if (diff > 5) {
        await interaction.reply('That meeting is too far ahead please ask for a closer meeting date.');
        return;
    }

    const forecastDate = new Date();
    if (diff === 0 && forecastDate.getHours() >= 20) {
        diff = 1;
    }
    forecastDate.setDate(forecastDate.getDate() + diff);

    // --- NEW: Check for event on this day ---
    const events = await getEvents(Object.keys(dayMap)[targetIndex]);
    // Find the first event that starts on the forecastDate
    const event = events.find(ev => {
        const evStart = new Date(ev.start);
        return evStart.getFullYear() === forecastDate.getFullYear() &&
            evStart.getMonth() === forecastDate.getMonth() &&
            evStart.getDate() === forecastDate.getDate();
    });

    let startTime: Date, endTime: Date;
    if (event) {
        startTime = new Date(event.start);
        endTime = new Date(event.end);
    } else {
        // fallback to default meeting times
        const meetingDay = forecastDate.getDay();
        startTime = new Date(forecastDate);
        endTime = new Date(forecastDate);
        if (meetingDay === 0 || meetingDay === 6) {
            startTime.setHours(10, 0, 0, 0);
            endTime.setHours(19, 0, 0, 0);
        } else {
            startTime.setHours(17, 0, 0, 0);
            endTime.setHours(20, 0, 0, 0);
        }
    }

    // If the forecast is for today and current time is within meeting time, notify that meeting is happening.
    if (diff === 0) {
        const now = new Date();
        if (now >= startTime && now <= endTime) {
            await interaction.reply('Meeting is happening right now, no forecast available.');
            return;
        }
    }

    // --- Fetch weather as before ---
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

    const hourlyWeatherForecastData = weatherForecastData?.timelines?.hourly;

    // Filter hourly forecast data to the event window
    const filteredHourlyWeatherForecastData = hourlyWeatherForecastData?.filter(
        forecast => {
            const forecastTime = new Date(forecast.time);
            return forecastTime >= startTime && forecastTime <= endTime;
        }
    );

    if (!filteredHourlyWeatherForecastData || filteredHourlyWeatherForecastData.length === 0) {
        await interaction.reply('No forecast data available for that time.');
        return;
    }

    const getAggregateRainPercentage = (data: any) => {
        return Math.round(data.reduce((acc: any, forecast: any) => acc + forecast.values.precipitationProbability, 0) / data.length);
    }

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



    // --- NEW: Split into 3 intervals if event is longer than 3 hours ---
    const eventDurationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    let intervals: { label: string, data: any[] }[] = [];

    if (eventDurationHours > 3) {
        // Split into 3 intervals
        const intervalLength = Math.floor(filteredHourlyWeatherForecastData.length / 3);
        for (let i = 0; i < 3; i++) {
            const startIdx = i * intervalLength;
            const endIdx = i === 2 ? filteredHourlyWeatherForecastData.length : (i + 1) * intervalLength;
            const intervalStart = new Date(startTime.getTime() + (i * (endTime.getTime() - startTime.getTime()) / 3));
            const intervalEnd = new Date(startTime.getTime() + ((i + 1) * (endTime.getTime() - startTime.getTime()) / 3));
            intervals.push({
                label: `${intervalStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                data: filteredHourlyWeatherForecastData.slice(startIdx, endIdx)
            });
        }
    } else {
        // Single interval for short events
        intervals.push({
            label: `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            data: filteredHourlyWeatherForecastData
        });
    }

    // --- Build embed ---
    const weatherForecastEmbed = new EmbedBuilder()
        .setTitle('Robotics Weather Forecast')
        .setDescription(`Weather forecast for ${forecastDate.toLocaleDateString()}${event ? `\nEvent: ${event.summary}` : ''}`)
        .setColor('#1E90FF')
        .setThumbnail(
            'https://static.wixstatic.com/media/8ce68c_fd250bd70999440dbaf90da0a428f3be~mv2.png/v1/fit/w_2500,h_1330,al_c/8ce68c_fd250bd70999440dbaf90da0a428f3be~mv2.png'
        );

    // Split into 3 intervals and aggregate
    const blocks = 3;
    const chunkSize = Math.ceil(filteredHourlyWeatherForecastData.length / blocks);

    for (let i = 0; i < blocks; i++) {
        const chunk = filteredHourlyWeatherForecastData.slice(i * chunkSize, (i + 1) * chunkSize);
        if (chunk.length === 0) continue;

        const start = new Date(chunk[0].time);
        const end = new Date(chunk[chunk.length - 1].time);

        // Aggregate temperature and rain
        const avgTemp = Math.round(chunk.reduce((sum, h) => sum + h.values.temperature, 0) / chunk.length);
        const avgRain = Math.round(chunk.reduce((sum, h) => sum + h.values.precipitationProbability, 0) / chunk.length);

        weatherForecastEmbed.addFields({
            name: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            value: `${avgTemp}°F ${getTemperatureEmoji(avgTemp)}\n${avgRain}%${getRainEmoji(avgRain)}`,
            inline: true
        });
    }

    weatherForecastEmbed.setFooter({
        text: 'What time is it? Krunch Time!'
    });

    try {
        await interaction.reply({ embeds: [weatherForecastEmbed] });
    } catch (error) {
        await interaction.editReply({ embeds: [weatherForecastEmbed] });
    }
    return weatherForecastEmbed;
}

export { data, execute }

