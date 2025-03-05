import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { google } from 'googleapis';

const credentialsPath = path.join(__dirname, '/credentials.json');
const tokenPath = path.join(__dirname, '/token.json');

function loadCredentials() {
    return JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
}

async function getNewToken() {
    const { client_secret, client_id, redirect_uris } = loadCredentials().installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Ensures a refresh token is issued
        scope: ['https://www.googleapis.com/auth/calendar.readonly'],
        prompt: 'consent', // Forces new refresh token
    });

    console.log(`Authorize this app by visiting this URL:\n${authUrl}`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', async (code) => {
        rl.close();
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Save the token
        fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
        console.log(`Token saved to ${tokenPath}`);
    });
}

getNewToken().catch(console.error);
