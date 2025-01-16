import chalk from 'chalk';
import { createLogger } from './util/logger';

const logger = createLogger(import.meta, chalk.bold.bgWhite);

const bunRun = ['bun', 'run'];
const deployCommands = [...bunRun, 'deploy-commands.ts'];
const startClient = [...bunRun, 'client.ts'];

logger.log('Deploying commands...');

const proc = Bun.spawn(deployCommands, {
    cwd: './',
    env: Bun.env,
    stdio: ['ignore', 'pipe', 'pipe'], // Ignore `stdin`, capture `stdout` and `stderr`

});

const response = new Response(proc.stdout);
logger.log(await response.text());

Bun.spawn(startClient, {
    cwd: './',
    env: Bun.env
});