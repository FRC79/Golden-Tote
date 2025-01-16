import queryString from 'query-string';
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'

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
    if(diff === 0) {
        if (forecastDate.getHours() >= 20) {
            diff = 1;
        }
    }

    forecastDate.setDate(forecastDate.getDate() + diff);

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

    const today = forecastDate.getDay();
    const startTime = new Date(forecastDate);
    const endTime = new Date(forecastDate);

    if (today === 0 || today === 6) {
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

    const getAggregateTemperature = (data: any) => {
        return Math.round(data.reduce((acc: any, forecast: any) => acc + forecast.values.temperature, 0) / data.length);
    }


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
    
