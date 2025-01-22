import { join } from 'path';
import { readdir } from 'fs';
import { Client, Collection, CommandInteraction, Events, GatewayIntentBits, TextChannel } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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

    const channelId = Bun.env.CHANNEL_ID; // Replace with your channel ID
    if (!channelId) {
        console.error('CHANNEL_ID is not defined in the environment variables.');
        return;
    }

    const channel = await client.channels.fetch(channelId);
    if (channel?.isTextBased()) {
        scheduleDailyTask(16, 0, async () => {
            console.log("Posting daily message at 4 PM...");

            try {
                // Run the calendar-check command
                const command = commands.get('calendarcheck');
                if (command) {
                    const fakeInteraction = {
                        commandName: 'calendarcheck',
                        options: {
                            get: () => ({ value: null }),
                        },
                        deferReply: async () => {
                            console.log('Deferred reply.');
                        },
                        editReply: async (message: any) => {
                            if (message?.content || message?.embeds?.length > 0) {
                                await (channel as TextChannel).send({
                                    content: message.content ?? '',
                                    embeds: message.embeds ?? [],
                                    allowedMentions: { parse: ['everyone'] },
                                });
                            } else {
                                console.error('Cannot send an empty message.');
                            }
                        },
                    } as unknown as CommandInteraction;

                    await command.execute(fakeInteraction);
                } else {
                    console.error('Command "calendarcheck" not found.');
                    await (channel as TextChannel).send('Command "calendarcheck" could not be executed.');
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });
    } else {
        console.error(`Channel with ID ${channelId} is not a text channel or could not be fetched.`);
    }
});

function scheduleDailyTask(hour: number, minute: number, task: () => void) {
    const now = new Date();
    const nextRun = new Date();

    // Determine the time for the next run
    const today = now.getDay();
    if (today === 2) { // Sunday
        nextRun.setHours(9, 0, 0, 0); // 9 AM on Sundays
    } else {
        nextRun.setHours(hour, minute, 0, 0); // Default time for other days
    }

    if (now > nextRun) {
        // If the current time is past today's scheduled time, schedule for tomorrow
        nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();

    const executeTask = () => {
        const today = new Date().getDay(); // Get current day of the week
        if (today === 5 || today === 6) { // Skip Fridays and Saturdays
            console.log('Skipping task for Friday or Saturday.');
            return;
        }

        if (today === 0) {
            console.log('Executing Sunday task at 9 AM.');
        } else {
            console.log('Executing daily task at default time.');
        }

        task(); // Execute the scheduled task
    };

    setTimeout(() => {
        executeTask();
        setInterval(() => {
            const now = new Date();
            if (now.getDay() === 0) { // Sunday
                if (now.getHours() === 9 && now.getMinutes() === 0) {
                    executeTask();
                }
            } else if (now.getHours() === hour && now.getMinutes() === minute) {
                executeTask();
            }
        }, 60 * 1000); // Check every minute
    }, delay);
}

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
        } else {
            await interaction.followUp({ content, ephemeral: true });
        }
    }
});

client.login(Bun.env.DISCORD_TOKEN);
