import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { google, Auth } from 'googleapis';
import { createLogger } from './logger';
import chalk from 'chalk';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const credentialsPath = path.join(__dirname, '../credentials.json');
const tokenPath = path.join(__dirname, '../token.json');

const logger = createLogger(import.meta, chalk.bold.bgWhite);
logger.log('Logger created in calendarCheck.ts');

/**
 * Load credentials from the credentials.json file.
 */
function loadCredentials() {
    if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Credentials file not found: ${credentialsPath}`);
    }

    try {
        const content = fs.readFileSync(credentialsPath, 'utf8');
        const parsedCredentials = JSON.parse(content);

        if (!parsedCredentials.installed) {
            throw new Error('Invalid credentials.json format: Missing "installed" property.');
        }

        return parsedCredentials;
    } catch (error: any) {
        throw new Error(`Failed to load credentials.json: ${error.message}`);
    }
}

/**
 * Save the token to token.json for future use.
 */
function saveToken(token: any) {
    fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
    logger.log(`New token saved to ${tokenPath}`);
}

/**
 * Get an authorized OAuth2 client using pre-stored access and refresh tokens.
 */
async function authorize(): Promise<Auth.OAuth2Client> {
    const { client_secret, client_id, redirect_uris } = loadCredentials().installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // If token.json exists, load it
    if (fs.existsSync(tokenPath)) {
        const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        oAuth2Client.setCredentials(token);

        try {
            // Check if the access token is still valid
            await oAuth2Client.getRequestHeaders();
            logger.log('Existing token is still valid.');
            return oAuth2Client;
        } catch (error) {
            logger.logError('Access token expired, refreshing...');

            // Refresh the access token
            const { credentials } = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(credentials);
            saveToken(credentials);
            return oAuth2Client;
        }
    } else {
        // If token.json doesn't exist, get a new token
        return await getNewToken(oAuth2Client);
    }
}

/**
 * Get a new OAuth token interactively.
 */
async function getNewToken(oAuth2Client: Auth.OAuth2Client): Promise<Auth.OAuth2Client> {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Ensures a refresh token is issued
        scope: SCOPES,
        prompt: 'consent', // Forces a new refresh token
    });

    console.log(`Authorize this app by visiting this URL:\n${authUrl}`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', async (code) => {
            rl.close();
            try {
                const { tokens } = await oAuth2Client.getToken(code);
                oAuth2Client.setCredentials(tokens);
                saveToken(tokens);
                logger.log('New token obtained and saved.');
                resolve(oAuth2Client);
            } catch (error) {
                logger.logError('Error retrieving access token:' +  error);
                reject(error);
            }
        });
    });
}

/**
 * Check for canceled events in Google Calendar.
 */
export async function getCanceledEvents(): Promise<string[]> {
    logger.log('Checking for canceled events...');
    const auth: Auth.OAuth2Client = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date().toISOString();
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now,
        timeMax: oneDayFromNow,
        singleEvents: true,
        orderBy: 'startTime',
        showDeleted: true, // Include deleted (canceled) events
    });

    const events = res.data.items || [];
    const canceledEvents = events
        .filter((event) => event.status === 'cancelled')
        .map((event) => event.summary || 'Unnamed Event');

    return canceledEvents;
}

/**
 * Retrieve events from Google Calendar.
 */
export async function getEvents(day?: string): Promise<any[]> {
    logger.log('Checking for canceled events...');
    const auth: Auth.OAuth2Client = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    let startOfDay = new Date();
    let endOfDay = new Date();

    if (day) {
        const dayMap: Record<string, number> = {
            sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
            thursday: 4, friday: 5, saturday: 6
        };
        const targetIndex = dayMap[day.toLowerCase()];
        const todayIndex = now.getDay();
        const diff = (targetIndex - todayIndex + 7) % 7;

        startOfDay.setDate(now.getDate() + diff);
        endOfDay.setDate(now.getDate() + diff);
    }

    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
    });

    const events = res.data.items || [];
    return events;
}
