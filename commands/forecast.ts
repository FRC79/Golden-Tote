import queryString from 'query-string';
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'

let data = new SlashCommandBuilder()
    .setName('forecast')
    .setDescription('Replies with the current forecast at the East Lake Community Library.');

async function execute(interaction: CommandInteraction) {
    const weatherForecastParams = queryString.stringify({
        apikey: Bun.env.TOMORROW_IO_KEY,
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
    const dailyWeatherForecastData = weatherForecastData?.timelines?.daily?.at(0);

    const weatherForecastEmbed = new EmbedBuilder()
        .setTitle('Forecast')
        .setDescription('ELHS Daily Temperature')
        .setFields(
            { name: 'Min', value: `${dailyWeatherForecastData?.values?.temperatureMin}°F`, inline: true },
            { name: 'Avg', value: `${dailyWeatherForecastData?.values?.temperatureAvg}°F`, inline: true },
            { name: 'Max', value: `${dailyWeatherForecastData?.values?.temperatureMax}°F`, inline: true }
        );

    await interaction.reply({ embeds: [weatherForecastEmbed] });
}
    
export { data, execute }