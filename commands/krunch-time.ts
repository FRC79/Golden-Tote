import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

let data = new SlashCommandBuilder()
    .setName('time')
    .setDescription('Replies with the current time.');

async function execute(interaction: CommandInteraction) {
    await interaction.reply('Krunch time!');
}
    
export { data, execute }