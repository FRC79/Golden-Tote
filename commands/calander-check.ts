import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getCanceledEvents,getEvents } from '../util/calanderCheck'
import { createLogger } from '../util/logger';
import { execute as forecastExecute } from './forecast';
import chalk from 'chalk';
const logger = createLogger(import.meta, chalk.bold.bgWhite);
let data = new SlashCommandBuilder()
    .setName('calendarcheck')
    .setDescription('Checks Google Calendar for canceled events.');

async function execute(interaction: CommandInteraction) {
    await interaction.deferReply(); // Defer reply for long-running tasks

    try {
        // Fetch today's events
        const events = await getEvents();

        // Check if there is a recurring "Robotics meeting" today
        const roboticsMeeting = events.find(event => 
            event.summary === 'Robotics Meeting'
        );

        if (roboticsMeeting) {
            await interaction.editReply({
                content: '@everyone There is a meeting today!',
                allowedMentions: { parse: ['everyone'] },
            });
            forecastExecute(interaction);
        } else {
            await interaction.editReply({
                content: '@everyone No meeting today! This is Robert\'s fault :c',
                allowedMentions: { parse: ['everyone'] },
            });
        }
    } catch (error) {
        logger.logError(error);
        await interaction.editReply('An error occurred while checking the calendar.');
    }
}

export { data, execute };
