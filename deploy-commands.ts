import chalk from 'chalk';
import { readdir } from 'fs';
import { join } from 'path';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import type { RESTPostAPIChatInputApplicationCommandsJSONBody as JSON } from 'discord.js';
import { createLogger } from './util/logger';

const logger = createLogger(import.meta, chalk.bold.bgBlue);
const rest = new REST().setToken(Bun.env.DISCORD_TOKEN as string);

async function reloadCommands(body: JSON[]): Promise<void> {
    try {
        logger.log(`Reloading ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(Bun.env.APP_ID as string, Bun.env.GUILD_ID as string),
            { body }
        ) as JSON[];

        logger.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        logger.logError(error);
    }
}

const commands = new Array<JSON>();
const commandsPath = join(import.meta.dir, 'commands');

function pushCommand(command: Command) {
    const json = (command.data as SlashCommandBuilder).toJSON();
    commands.push(json);
}

readdir(commandsPath, async (error, commandFiles) => {
    if (error) {
        logger.logError(error);
    }

    for (var commandFile of commandFiles) {
        const commandPath = join(commandsPath, commandFile);
        pushCommand(require(commandPath));
    }

    await reloadCommands(commands);
});