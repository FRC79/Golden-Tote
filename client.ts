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

    const channelId = Bun.env.CHANNEL_ID; 
    if (!channelId) {
        console.error('CHANNEL_ID is not defined in the environment variables.');
        return;
    }

    const channel = await client.channels.fetch(channelId);
    if (channel?.isTextBased()) {
    const weekday_job = new CronJob(
        '0 16 * * 1-4',
        async () => {
          console.log("Posting daily message at 4 PM...");
          try {
            const command = commands.get('calendarcheck');
            if (command) {
              const fakeInteraction = {
                commandName: 'calendarcheck',
                member: {
                  roles: {
                    cache: [
                      { id: 'GoldentoteId', name: 'Goldentote' }
                    ],
                    some: function(callback: (value: any, index: number, array: any[]) => boolean) {
                      return this.cache.some(callback);
                    }
                  }
                },
                options: {
                  get: () => ({ value: null }),
                },
                deferReply: async () => {
                  logger.log('Deferred reply.');
                },
                editReply: async (message: any) => {
                  if (message?.content || (message?.embeds && message.embeds.length > 0)) {
                    await (channel as TextChannel).send({
                      content: message.content ?? '',
                      embeds: message.embeds ?? [],
                      allowedMentions: { parse: ['everyone'] },
                    });
                  } else {
                    logger.logError('Cannot send an empty message.');
                  }
                },
              } as unknown as CommandInteraction;
      
              await command.execute(fakeInteraction);
            } else {
                logger.logError('Command "calendarcheck" not found.');
              await (channel as TextChannel).send('Command "calendarcheck" could not be executed.');
            }
          } catch (error) {
            logger.logError('Error sending message:' + error);
          }
        }
      );
      
      // Setup weekend job for Sunday @ 8:00 AM
      const weekend_job = new CronJob(
        '0 8 * * 0',
        async () => {
            logger.log("Posting Sunday message at 5:40 PM...");
          try {
            const command = commands.get('calendarcheck');
            if (command) {
              const fakeInteraction = {
                commandName: 'calendarcheck',
                member: {
                  roles: {
                    cache: [
                      { id: 'GoldentoteId', name: 'Goldentote' }
                    ],
                    some: function(callback: (value: any, index: number, array: any[]) => boolean) {
                      return this.cache.some(callback);
                    }
                  }
                },
                options: {
                  get: () => ({ value: null }),
                },
                deferReply: async () => {
                    logger.log('Deferred reply.');
                },
                editReply: async (message: any) => {
                  if (message?.content || (message?.embeds && message.embeds.length > 0)) {
                    await (channel as TextChannel).send({
                      content: message.content ?? '',
                      embeds: message.embeds ?? [],
                      allowedMentions: { parse: ['everyone'] },
                    });
                  } else {
                    logger.logError('Cannot send an empty message.');
                  }
                },
              } as unknown as CommandInteraction;
      
              await command.execute(fakeInteraction);
            } else {
                logger.logError('Command "calendarcheck" not found.');
              await (channel as TextChannel).send('Command "calendarcheck" could not be executed.');
            }
          } catch (error) {
            logger.logError('Error sending message:' +  error);
          }
        }
      );
      
	// Start jobs
	weekday_job.start();
	weekend_job.start();

	// Check if we're running
	if (weekday_job.running) {
		logger.log("Weekday posting job is started and currently running! :)")
	} else {
		logger.logError("Weekday posting job did not start for some reason! :(")
	}
	if (weekend_job.running) {
		logger.log("Weekend posting job is started and currently running! :)")
	} else {
		logger.logError("Weekend posting job did not start for some reason! :(")
	}logger
    } else {
        logger.logError(`Channel with ID ${channelId} is not a text channel or could not be fetched.`);
    }
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
