import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { addEvent, addWeeklyEvent } from '../util/calander';
import { createLogger } from '../util/logger';
import chalk from 'chalk';

const logger = createLogger(import.meta, chalk.bold.bgWhite);

let data = new SlashCommandBuilder()
    .setName('calendar-add')
    .setDescription('Adds an event to the local calendar.')
    .addStringOption(option =>
        option.setName('summary')
            .setDescription('Event summary/title')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('date')
            .setDescription('Date (YYYY-MM-DD)')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('start_time')
            .setDescription('Start time (hh:mm AM/PM)')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('end_time')
            .setDescription('End time (hh:mm AM/PM)')
            .setRequired(true)
    )
    .addBooleanOption(option =>
        option.setName('weekly')
            .setDescription('Should this event repeat weekly?')
            .setRequired(false)
    );

export { data, execute };

function parseDateTime(date: string, time: string): Date | null {
    const dateMatch = date.match(/^\d{4}-\d{2}-\d{2}$/);
    const timeMatch = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (!dateMatch || !timeMatch) return null;

    let [_, hourStr, minuteStr, ampm] = timeMatch;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;

    const iso = `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
}

async function execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    const summary = interaction.options.get('summary')?.value as string;
    const date = interaction.options.get('date')?.value as string;
    const startTime = interaction.options.get('start_time')?.value as string;
    const endTime = interaction.options.get('end_time')?.value as string;
    const weekly = interaction.options.get('weekly')?.value as boolean;

    const startDate = parseDateTime(date, startTime);
    const endDate = parseDateTime(date, endTime);

    if (!summary || !startDate || !endDate) {
        await interaction.editReply('Missing or invalid event details. Please use the format YYYY-MM-DD for date and hh:mm AM/PM for time.');
        return;
    }

    const event = {
        id: `${summary.replace(/\s+/g, '_')}_${Date.now()}`,
        summary,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        status: "confirmed" as "confirmed"
    };

    const embed = new EmbedBuilder()
        .setTitle(weekly ? 'Weekly Event Added!' : 'Event Added!')
        .setColor('#1E90FF')
        .setDescription(`**${summary}**`)
        .addFields(
            { name: 'Date', value: `${startDate.toLocaleDateString()}`, inline: true },
            { name: 'Start Time', value: `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, inline: true },
            { name: 'End Time', value: `${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, inline: true },
            { name: 'Repeats', value: weekly ? 'Weekly' : 'No', inline: true }
        )
        .setFooter({ text: 'Event successfully added to the calendar.' });

    try {
        if (weekly) {
            addWeeklyEvent(event);
        } else {
            addEvent(event);
        }
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        logger.logError(error);
        await interaction.editReply('Failed to add event. Please check your input format.');
    }
}
