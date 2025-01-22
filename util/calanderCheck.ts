import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { createLogger } from './logger';
import chalk from 'chalk';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const credentialsPath = path.join(__dirname, '../credentials.json');
const tokenPath = path.join(__dirname, "../token.json");

const logger = createLogger(import.meta, chalk.bold.bgWhite);
logger.log('Logger created in calendarCheck.ts');

/**
 * Load credentials from the credentials.json file.
 */
function loadCredentials() {
    const content = fs.readFileSync(credentialsPath, 'utf8');
    return JSON.parse(content);
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
async function authorize() {
    const { client_secret, client_id, redirect_uris } = loadCredentials().web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Load pre-stored tokens from token.json
    if (fs.existsSync(tokenPath)) {
        const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        oAuth2Client.setCredentials(token);

        // Listen for token refresh events
        oAuth2Client.on('tokens', (tokens) => {
            if (tokens.refresh_token) {
                saveToken(tokens); // Save the new refresh token if it changes
                logger.log('Refresh token updated.');
            }
        });

        try {
            // Force refresh the access token
            const refreshedToken = await oAuth2Client.getAccessToken();
            logger.log('Access token refreshed successfully.');
            return oAuth2Client;
        } catch (error: any) {
            logger.logError('Error refreshing access token:' + error.message);
            throw new Error('Failed to refresh access token. Please reauthenticate.');
        }
    } else {
        throw new Error('No tokens found in token.json. Please authenticate the app first.');
    }
}


/**
 * Check for canceled events in Google Calendar.
 */
export async function getCanceledEvents(): Promise<string[]> {
    logger.log('Checking for canceled events...');
    const auth = await authorize();
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


export async function getEvents(day?: string): Promise<any[]> {
    logger.log('Checking for events...');
    const auth = await authorize();
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
