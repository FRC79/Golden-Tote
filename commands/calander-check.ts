import { CommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { getEvents } from '../util/calanderCheck';
import { createLogger } from '../util/logger';
import { execute as forecastExecute } from './forecast';
import chalk from 'chalk';

const logger = createLogger(import.meta, chalk.bold.bgWhite);

let data = new SlashCommandBuilder()
    .setName('calendarcheck')
    .setDescription('Checks Google Calendar for canceled events.')
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

export { data, execute };

async function execute(interaction: CommandInteraction) {
    await interaction.deferReply(); // Defer reply for long-running tasks

    // Check if the member has the "Goldentote" role.
    const member = interaction.member as GuildMember | null;
    const mentionEveryone = member 
        ? member.roles.cache.some(role => role.name === 'Goldentote')
        : false;
    // Build the mention string and allowedMentions object accordingly.
    const mentionString = mentionEveryone ? '@everyone ' : '';
    const allowedMentionsOption = mentionEveryone ? { allowedMentions: { parse: ['everyone'] as const } } : {};

    const inputDay = interaction.options.get('day')?.value as string;
    try {
        const events = await getEvents(inputDay);

        if (!events || events.length === 0) {
            await interaction.editReply('No events found in the calendar.');
            return;
        }

        const roboticsMeeting = events.find(event => event.summary === 'Robotics Meeting');

        if (roboticsMeeting) {
            // Determine meeting start and end times.
            // Adjust based on how your event object stores times.
            // Here we check for a dateTime property, falling back to the value directly.
            const meetingStart = new Date(roboticsMeeting.start.dateTime || roboticsMeeting.start);
            const meetingEnd = new Date(roboticsMeeting.end.dateTime || roboticsMeeting.end);
            const now = new Date();

            // If the current time is within the meeting window, do not call the forecast.
            if (now >= meetingStart && now <= meetingEnd) {
                await interaction.editReply({
                    content: `${mentionString}The meeting is happening right now!`,
                    ...allowedMentionsOption
                });
                return;
            }

            // Otherwise, run the forecast command.
            const forecastEmbed = await forecastExecute(interaction);
            await interaction.editReply({
                content: `${mentionString}There is a meeting on ${inputDay || 'today'}!`,
                embeds: forecastEmbed ? [forecastEmbed] : [],
                ...allowedMentionsOption
            });
        } else {
            await interaction.editReply({
                content: `${mentionString}No meeting on ${inputDay || 'today'}! This is Robert's fault :c`,
                ...allowedMentionsOption
            });
        }
    } catch (error) {
        logger.logError(error);
        await interaction.editReply('An error occurred while checking the calendar.');
    }
}
