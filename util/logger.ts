import fs from 'fs'
import { parse } from 'path';
import type { ChalkInstance } from 'chalk';

function appendLogFile(message: string) {
    const path = 'logs/logs.txt';
    fs.open(path, 'a', (error, fd) => {
        if (error?.code !== 'ENOENT') {
            throw error;
        } else if (error) {
            fs.writeFile(path, message, error => {
                if (error) throw error;
            });
        } else {
            fs.appendFile(path, message, error => {
                if (error) throw error;
            })
        }
    });
}

function createLogger(meta: ImportMeta, chalkInstace?: ChalkInstance): Logger {
    return {
        meta,
        process: parse(meta.file).name,
        chalkInstace,
        log(message: string) {
            message = `[${this.process.toUpperCase()}] ${message}`;
            console.log(chalkInstace ? chalkInstace(message) : message);
            //appendLogFile(message);
        },
        logError(error: any) {
            let errorMessage = error instanceof Error ? error.message : 'Unknown error';
            let message = `[${this.process.toUpperCase()}] ${errorMessage}`;
            console.error(chalkInstace ? chalkInstace(message) : message);
        }
    }
}

export { createLogger };