import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getCanceledEvents,getEvents } from '../util/calanderCheck'
import { createLogger } from '../util/logger';
import { execute as forecastExecute } from './forecast';
import chalk from 'chalk';
const logger = createLogger(import.meta, chalk.bold.bgWhite);
let data = new SlashCommandBuilder()
    .setName('calendarcheck')
    .setDescription('Checks Google Calendar for canceled events.');
    
export { data, execute };
data.addStringOption(option =>
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
    await interaction.deferReply(); // Defer reply for long-running tasks

    const inputDay = interaction.options.get('day')?.value as string;
    try {
        const events = await getEvents(inputDay);

        if (!events || events.length === 0) {
            await interaction.editReply('No events found in the calendar.');
            return;
        }

        const roboticsMeeting = events.find(event => event.summary === 'Robotics Meeting');

        if (roboticsMeeting) {
            const forecastEmbed = await forecastExecute(interaction);

            await interaction.editReply({
                content: `@everyone There is a meeting on ${inputDay || 'today'}!`,
                embeds: forecastEmbed ? [forecastEmbed] : [],
                allowedMentions: { parse: ['everyone'] },
            });
        } else {
            await interaction.editReply({
                content: `@everyone No meeting on ${inputDay || 'today'}! This is Robert's fault :c`,
                allowedMentions: { parse: ['everyone'] },
            });
        }
    } catch (error) {
        logger.logError(error);
        await interaction.editReply('An error occurred while checking the calendar.');
    }
}

