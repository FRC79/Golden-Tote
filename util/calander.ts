import fs from 'fs';
import path from 'path';
import { createLogger } from './logger';
import chalk from 'chalk';
import fetch from 'node-fetch';

const GIST_ID = process.env.GIST_ID || Bun.env.GIST_ID;
const GIST_FILE = 'Calander.json'; // The filename inside the gist
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || Bun.env.GITHUB_TOKEN;

const logger = createLogger(import.meta, chalk.bold.bgWhite);

type LocalEvent = {
    id: string;
    summary: string;
    start: string; 
    end: string;   
    status?: 'confirmed' | 'cancelled';
};

/**
 * Load events from the local calendar file.
 */
async function loadLocalEvents(): Promise<LocalEvent[]> {
    if (!GIST_ID || !GITHUB_TOKEN) throw new Error('GIST_ID or GITHUB_TOKEN not set');
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    if (!res.ok) throw new Error('Failed to fetch gist');
    const gist = await res.json() as { files: Record<string, { content: string }> };
    const content = gist.files[GIST_FILE]?.content;
    logger.log(`Loaded local calendar from gist: ${GIST_ID}/${GIST_FILE}`);
    if (!content) {
        logger.log('No content found in the gist, returning empty calendar.');
        return [];
    }
    logger.log(`Loaded ${GIST_FILE} with content length: ${content.length}`);

    return content ? JSON.parse(content) : [];
}

/**
 * Save events to the local calendar file.
 */
async function saveLocalEvents(events: LocalEvent[]) {
    if (!GIST_ID || !GITHUB_TOKEN) throw new Error('GIST_ID or GITHUB_TOKEN not set');
    const body = {
        files: {
            [GIST_FILE]: {
                content: JSON.stringify(events, null, 2)
            }
        }
    };
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Failed to update gist');
}

/**
 * Get canceled events from the local calendar.
 */
export async function getCanceledEvents(): Promise<string[]> {
    logger.log('Checking for canceled events...');
    const events = await loadLocalEvents();
    return events
        .filter(event => event.status === 'cancelled')
        .map(event => event.summary || 'Unnamed Event');
}

export async function addEvent(event: LocalEvent) {
    const events = await loadLocalEvents();
    events.push(event);
    await saveLocalEvents(events);
    logger.log(`Added event: ${event.summary}`);
}

/**
 * Add a weekly recurring event to the local calendar.
 * @param event The event template (start and end should be ISO strings for the first occurrence)
 * @param weeks Number of weeks to repeat
 */
export async function addWeeklyEvent(event: LocalEvent) {
    const events = await loadLocalEvents();
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const years = 1;
    const totalWeeks = years * 52;

    for (let i = 0; i < totalWeeks; i++) {
        const newStart = new Date(startDate);
        newStart.setDate(startDate.getDate() + i * 7);
        const newEnd = new Date(endDate);
        newEnd.setDate(endDate.getDate() + i * 7);

        events.push({
            ...event,
            id: `${event.id}-week${i + 1}`,
            start: newStart.toISOString(),
            end: newEnd.toISOString(),
        });
    }
    await saveLocalEvents(events);
    logger.log(`Added weekly event: ${event.summary}`);
}

export async function getCurrentEvents(): Promise<LocalEvent[]> {
    logger.log('Getting events happening now...');
    const events = await loadLocalEvents();
    const now = new Date();

    return events.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return eventStart <= now && eventEnd >= now && event.status !== 'cancelled';
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
/**
 * Retrieve events for a specific day from the local calendar.
 */
export async function getEvents(day?: string): Promise<LocalEvent[]> {
    logger.log('Getting events...');
    const events = await loadLocalEvents();
    const now = new Date();

    if (day === 'now') {
        // Return events happening now
        return events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return eventStart <= now && eventEnd >= now && event.status !== 'cancelled';
        }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }

    if (!day) {
        // No day specified, return all events starting after now (including today)
        return events.filter(event => {
            const eventStart = new Date(event.start);
            return eventStart >= now && event.status !== 'cancelled';
        }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    } else {
        // Day specified, return all events that fall on that weekday
        const dayMap: Record<string, number> = {
            sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
            thursday: 4, friday: 5, saturday: 6
        };
        const targetIndex = dayMap[day.toLowerCase()];
        return events.filter(event => {
            const eventStart = new Date(event.start);
            return eventStart.getDay() === targetIndex && event.status !== 'cancelled';
        }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }
}


export async function removeEvent(summary: string, date?: string, removeAll = false): Promise<number> {
    const events = await loadLocalEvents();
    let toRemove: LocalEvent[];
    if (date) {
        // Parse the date as UTC to avoid timezone shifting
        const targetDate = new Date(date);
        logger.log(`Removing events with summary "${summary}" on date ${targetDate.toISOString()}`);
        // Set time to midnight UTC (do not shift for local timezone)
        const targetTime = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
        logger.log(`Target date set to: ${new Date(targetTime).toISOString()}`);
        toRemove = events.filter(event => {
            const eventDate = new Date(event.start);
            const eventTime = Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate());
            logger.log(`Checking event: ${event.summary} on ${new Date(eventTime).toISOString()}`);
            return event.summary === summary && eventTime === targetTime;
        });
    } else {
        toRemove = events.filter(event => event.summary === summary);
    }
    logger.log(`Found ${toRemove.length} event(s) to remove: ${summary}${date ? ' on ' + date : ''}`);
    if (toRemove.length === 0) return 0;

    let filtered: LocalEvent[];
    if (removeAll) {
        if (date) {
            const targetDate = new Date(date);
            const targetTime = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
            filtered = events.filter(event => {
                if (event.summary !== summary) return true;
                const eventDate = new Date(event.start);
                const eventTime = Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate());
                return eventTime !== targetTime;
            });
        } else {
            filtered = events.filter(event => event.summary !== summary);
        }
    } else {
        let removed = false;
        filtered = events.filter(event => {
            if (!removed) {
                if (date) {
                    const eventDate = new Date(event.start);
                    const eventTime = Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate());
                    const targetDate = new Date(date);
                    const targetTime = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
                    if (event.summary === summary && eventTime === targetTime) {
                        removed = true;
                        return false;
                    }
                } else {
                    if (event.summary === summary) {
                        removed = true;
                        return false;
                    }
                }
            }
            return true;
        });
    }

    await saveLocalEvents(filtered);
    logger.log(`Removed ${toRemove.length} event(s): ${summary}${date ? ' on ' + date : ''}`);
    return toRemove.length;
}
