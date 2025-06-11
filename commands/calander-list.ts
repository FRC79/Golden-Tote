import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getEvents, getCurrentEvents } from '../util/calander';
import { createLogger } from '../util/logger';
import chalk from 'chalk';

const logger = createLogger(import.meta, chalk.bold.bgWhite);

let data = new SlashCommandBuilder()
    .setName('calendar-list')
    .setDescription('Lists all upcoming meetings in the local calendar.');

export { data, execute };

async function execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
        const currentEvents = await getCurrentEvents();
        const events = await getEvents();
        const now = new Date();
        const upcoming = events
            .filter(event => new Date(event.end) > now && event.status !== 'cancelled')
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        // Filter out duplicate weekly meetings
        const seenWeeklyIds = new Set();
        const filteredUpcoming = upcoming.filter(event => {
            const weeklyMatch = event.id.match(/(.+)-week\d+$/);
            if (weeklyMatch) {
                if (seenWeeklyIds.has(weeklyMatch[1])) {
                    return false;
                }
                seenWeeklyIds.add(weeklyMatch[1]);
                event.summary += ' _(Weekly)_';
            }
            return true;
        });

        const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

        const embed = new EmbedBuilder()
            .setTitle('📅 Upcoming Meetings')
            .setColor('#1E90FF')
            .setThumbnail('https://static.wixstatic.com/media/8ce68c_fd250bd70999440dbaf90da0a428f3be~mv2.png/v1/fit/w_2500,h_1330,al_c/8ce68c_fd250bd70999440dbaf90da0a428f3be~mv2.png')
            .setFooter({ text: 'What time is it? Krunch Time!' });

        if (currentEvents.length > 0) {
            const currentLines = currentEvents.map(event => {
                const start = new Date(event.start);
                return `**${event.summary}**\n${start.toLocaleString(undefined, dateOptions)} _(Happening now!)_`;
            });
            embed.addFields({
                name: '🟢 Happening Now',
                value: currentLines.join('\n'),
                inline: false
            });
        }

        if (filteredUpcoming.length > 0) {
            // Show up to 5 upcoming meetings
            const lines = filteredUpcoming.slice(0, 5).map(event => {
                const start = new Date(event.start);
                return `**${event.summary}**\n${start.toLocaleString(undefined, dateOptions)}`;
            });
            embed.addFields({
                name: '🔜 Upcoming',
                value: lines.join('\n'),
                inline: false
            });
        }

        if (embed.data.fields?.length === 0) {
            embed.setDescription('No upcoming or current meetings found.');
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        logger.logError(error);
        await interaction.editReply('Failed to list meetings.');
    }
}