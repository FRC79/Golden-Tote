import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ChalkInstance } from 'chalk';

interface Logger {
    meta: ImportMeta;
    process: string;
    chalkInstace?: ChalkInstance;
    log(message: string): void;
    logError(error: any): void;
    logMultiple(...messages: string[]): void;
}



function appendLogFile(message: string) {
    const logFilePath = path.join('logs', 'logs.txt');
    const logDir = path.dirname(logFilePath);

    // Ensure the logs directory exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Append the log message to the file (fire and forget)
    fs.appendFile(logFilePath, message + '\n', (error) => {
        if (error) {
            console.error('Failed to write to log file:', error);
        }
    });
}

function createLogger(meta: ImportMeta, chalkInstace?: ChalkInstance): Logger {
    // Resolve the current file's name
    const __filename = fileURLToPath(meta.url);
    const processName = path.parse(__filename).name;

    return {
        meta,
        process: processName,
        chalkInstace,
        log(message: string) {
            // Format the log message
            message = `[${this.process.toUpperCase()}] ${message}`;

            // Immediately log to the console
            console.log(chalkInstace ? chalkInstace(message) : message);

            // Save the log to the file asynchronously
            appendLogFile(message);
        },
        logMultiple(...messages: string[]) {
            // Format the log message
            const formattedMessages = messages.map(message => `[${this.process.toUpperCase()}] ${message}`).join(' ');

            // Immediately log to the console
            console.log(chalkInstace ? chalkInstace(formattedMessages) : formattedMessages);

            // Save the log to the file asynchronously
            appendLogFile(formattedMessages);
        },
        logError(error: any) {
            // Format the error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const message = `[${this.process.toUpperCase()}] ERROR: ${errorMessage}`;

            // Immediately log to the console
            console.error(chalkInstace ? chalkInstace.red(message) : message);

            // Save the error log to the file asynchronously
            appendLogFile(message);
        },
    };
}

export { createLogger };
