import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { removeEvent } from '../util/calander';
import { createLogger } from '../util/logger';
import chalk from 'chalk';

const logger = createLogger(import.meta, chalk.bold.bgWhite);

let data = new SlashCommandBuilder()
    .setName('calendar-remove')
    .setDescription('Removes all matching events from the local calendar.')
    .addStringOption(option =>
        option.setName('summary')
            .setDescription('Event summary/title')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('date')
            .setDescription('Date of the event (YYYY-MM-DD)')
            .setRequired(false) // <-- Make date optional
    );

export { data, execute };
async function execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    const summary = interaction.options.get('summary')?.value as string;
    const date = interaction.options.get('date')?.value as string | undefined;

    if (!summary) {
        await interaction.editReply('Missing summary. Please provide it.');
        return;
    }

    try {
        const removedCount = await removeEvent(summary, date, true);
        if (removedCount > 0) {
            if (date) {
                await interaction.editReply(`Removed ${summary} from ${date} in the calendar.`);
            } else {
                await interaction.editReply(`Removed ${summary} from the calendar.`);
            }
        } else {
            if (date) {
                await interaction.editReply(`No "${summary}" found on ${date} event.`);
            } else {
                await interaction.editReply(`No "${summary}" found event.`);
            }
        }
    } catch (error) {
        logger.logError(error);
        await interaction.editReply('Failed to remove event. Please check your input.');
    }
}
