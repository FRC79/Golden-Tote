import { join } from 'path';
import { readdir } from 'fs';
import { Client, Collection, CommandInteraction, Events, GatewayIntentBits, TextChannel } from 'discord.js';
import { CronJob } from 'cron';
import { createLogger } from './util/logger';
import chalk from 'chalk';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const logger = createLogger(import.meta, chalk.bold.bgGreen);

const commands: Collection<string, Command> = new Collection();
const commandsPath = join(import.meta.dir, 'commands');

readdir(commandsPath, (error, commandFiles) => {
    if (error) {
        console.error(error);
    }

    for (const commandFile of commandFiles) {
        const commandPath = join(commandsPath, commandFile);
        const command: Command = require(commandPath);
        commands.set(command.data.name, command);
    }

    console.log(commands);
});

client.once(Events.ClientReady, async (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

});


client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
        logger.logError(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        logger.logError(error);

        let content: string = 'There was an error while executing this command!';

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, ephemeral: true });
        } else {
            await interaction.followUp({ content, ephemeral: true });
        }
    }
});

client.login(Bun.env.DISCORD_TOKEN);
