import queryString from 'query-string';
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'

let data = new SlashCommandBuilder()
    .setName('forecast')
    .setDescription('Replies with the current forecast at the East Lake Community Library.');

async function execute(interaction: CommandInteraction) {
    const weatherForecastParams = queryString.stringify({
        apikey: Bun.env.TOMORROW_IO_API_KEY,
        location: [28.1113128504228, -82.69373019226934], // ELHS lat & lon
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
    .setTitle('Robotics Weather Forecast')
    .setDescription(`Weather forecast for ${forecastDate.toLocaleDateString()}`)
    .setColor('#1E90FF')
    .setThumbnail(
      'https://static.wixstatic.com/media/8ce68c_fd250bd70999440dbaf90da0a428f3be~mv2.png/v1/fit/w_2500,h_1330,al_c/8ce68c_fd250bd70999440dbaf90da0a428f3be~mv2.png'
    );

    const weekdayTimeEmojis = ['🕔', '🕕', '🕖']
  

  if (today === 0 || today === 6) {
    weatherForecastEmbed.addFields(
      {
        name: 'Morning 🌅',
        value: [
          '10:00 AM - 12:00 PM',
          `Temp: ${getAggregateTemperature(filteredHourlyWeatherForecastData.slice(0, 3))}°F ${getTemperatureEmoji(
            getAggregateTemperature(filteredHourlyWeatherForecastData.slice(0, 3))
          )}`,
          `${getAggregateRainPercentage(filteredHourlyWeatherForecastData.slice(0, 3))}% ${getRainEmoji( getAggregateRainPercentage(filteredHourlyWeatherForecastData.slice(0, 3)) )}`
        ].join('\n'),
        inline: true
      },
      {
        name: 'Afternoon 🌤️',
        value: [
          '1:00 PM - 3:00 PM',
          `Temp: ${getAggregateTemperature(filteredHourlyWeatherForecastData.slice(3, 6))}°F ${getTemperatureEmoji(
            getAggregateTemperature(filteredHourlyWeatherForecastData.slice(3, 6))
          )}`,
          `${getAggregateRainPercentage(filteredHourlyWeatherForecastData.slice(3, 6))}% ${getRainEmoji( getAggregateRainPercentage(filteredHourlyWeatherForecastData.slice(3, 6)) )}`
        ].join('\n'),
        inline: true
      },
      {
        name: 'Evening 🌆',
        value: [
          '4:00 PM - 6:00 PM',
          `Temp: ${getAggregateTemperature(filteredHourlyWeatherForecastData.slice(6, 8))}°F ${getTemperatureEmoji(
            getAggregateTemperature(filteredHourlyWeatherForecastData.slice(6, 8))
          )}`,
          `${getAggregateRainPercentage(filteredHourlyWeatherForecastData.slice(6, 8))}% ${getRainEmoji( getAggregateRainPercentage(filteredHourlyWeatherForecastData.slice(6, 8)) )}` 
        ].join('\n'),
        inline: true
      }
    );
  } else {
    const forecastTimes = ['5:00 PM', '6:00 PM', '7:00 PM'];
  
    forecastTimes.forEach((time, index) => {
      if (filteredHourlyWeatherForecastData[index]) {
        weatherForecastEmbed.addFields({
          name: `${time} ${weekdayTimeEmojis[index]}`,
          value: [
            `${filteredHourlyWeatherForecastData[index].values.temperature}°F ${getTemperatureEmoji(
              filteredHourlyWeatherForecastData[index].values.temperature
            )}`,
            ` ${filteredHourlyWeatherForecastData[index].values.precipitationProbability}%` + getRainEmoji(
                filteredHourlyWeatherForecastData[index].values.precipitationProbability
                )
          ].join('\n'),
          inline: true
        });
      }
    }
    );

}
    weatherForecastEmbed.setFooter({
        text: 'What time is it! Krunch Time!'
    });
    try{
    await interaction.reply({ embeds: [weatherForecastEmbed] })
    } catch (error) {
        await interaction.editReply({embeds: [weatherForecastEmbed]})
    }
}
    
export { data, execute }