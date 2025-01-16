interface Logger {
    meta: ImportMeta,
    process: string,
    chalkInstace?: ChalkInstance,
    log(message: string): void,
    logError(error: any): void
}

type Command = {
    data: SlashCommandBuilder;
    execute(interaction: CommandInteraction): Promise<void>;
}