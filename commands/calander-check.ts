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
    const events = await getEvents(inputDay);

    try {
        // Fetch events for the specified day
        const roboticsMeeting = events.find(event => 
            event.summary === 'Robotics Meeting'
        );

        if (roboticsMeeting) {
            await interaction.editReply({
                content: `@everyone There is a meeting on ${inputDay || 'today'}!`,
                allowedMentions: { parse: ['everyone'] },
            });
            forecastExecute(interaction);
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