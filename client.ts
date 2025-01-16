import { join } from 'path';
import { readdir } from 'fs';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [ GatewayIntentBits.Guilds ] });

const commands: Collection<string, Command> = new Collection();
const commandsPath = join(import.meta.dir, 'commands');

readdir(commandsPath, (error, commandFiles) => {
    if (error) {
        console.error(error);
    }

    for (var commandFile of commandFiles) {
        const commandPath = join(commandsPath, commandFile);
        const command: Command = require(commandPath);
        commands.set(command.data.name, command);
    }

    console.log(commands);
});

client.once(Events.ClientReady, client => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        
        let content: string = 'There was an error while executing this command!';

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, ephemeral: true });
        }
        else {
            await interaction.followUp({ content, ephemeral: true });
        }
    }
});

client.login(Bun.env.DISCORD_TOKEN);