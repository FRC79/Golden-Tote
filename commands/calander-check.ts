import { CommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { getEvents } from '../util/calander';
import { createLogger } from '../util/logger';
import { execute as forecastExecute } from './forecast';
import chalk from 'chalk';

const logger = createLogger(import.meta, chalk.bold.bgWhite);

let data = new SlashCommandBuilder()
    .setName('calendar-check')
    .setDescription('Checks the local calendar for events.')
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
    await interaction.deferReply();

    const member = interaction.member as GuildMember | null;
    const mentionEveryone = member 
        ? member.roles.cache.some(role => role.name === 'Goldentote')
        : false;
    const mentionString = mentionEveryone ? '@everyone ' : '';
    const allowedMentionsOption = mentionEveryone ? { allowedMentions: { parse: ['everyone'] as const } } : {};

    let inputDay = interaction.options.get('day')?.value as string;
    if (inputDay == null) {
        const today = new Date();
        inputDay = today.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    }
    
    try {
        const events = await getEvents(inputDay);
        logger.log(`Loaded events: ${JSON.stringify(events, null, 2)}`);

        if (!events || events.length === 0) {
            await interaction.editReply('No events found in the calendar.');
            return;
        }
        const roboticsMeeting = events[0];

        if (roboticsMeeting) {
            const meetingStart = new Date(roboticsMeeting.start);
            const meetingEnd = new Date(roboticsMeeting.end);
            const now = new Date();

            if (now >= meetingStart && now <= meetingEnd) {
                await interaction.editReply({
                    content: `${mentionString}The meeting is happening right now!`,
                    ...allowedMentionsOption
                });
                return;
            }

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
