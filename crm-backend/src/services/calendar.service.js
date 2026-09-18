import { google } from 'googleapis';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { withTransaction, query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
    getAuthUrl,
    exchangeCodeForTokens,
    getConnectedAccount,
    isConnected,
    disconnect,
    getAuthenticatedClient,
} from './googleAuth.service.js';

// Re-export auth functions for controller
export { getAuthUrl, exchangeCodeForTokens, getConnectedAccount, isConnected, disconnect };

const calendarClient = async () => {
    const auth = await getAuthenticatedClient();
    return google.calendar({ version: 'v3', auth });
};

export const getAvailability = async ({ from, to }) => {
    if (!(await isConnected())) {
        return []; // Not connected — return empty (no busy slots)
    }
    const cal = await calendarClient();
    const res = await cal.freebusy.query({
        requestBody: {
            timeMin: new Date(from).toISOString(),
            timeMax: new Date(to).toISOString(),
            items: [{ id: 'primary' }],
        },
    });
    return res.data.calendars.primary.busy || [];
};

export const scheduleMeeting = async (payload) =>
    withTransaction(async (client) => {
        const contacts = (
            await client.query(
                `SELECT c.*, cp.email_optin FROM contacts c
         LEFT JOIN contact_preferences cp ON cp.contact_id = c.id
         WHERE c.id = ANY($1::int[])`,
                [payload.contact_ids]
            )
        ).rows;
        if (!contacts.length) throw new AppError('No valid contacts', 400, 'NO_ATTENDEES');

        // 1. Create activity
        const activity = (
            await client.query(
                `INSERT INTO activities
       (company_id, contact_id, activity_type, subject, body, status, sent_by, scheduled_for, sent_at)
     VALUES ($1,$2,'Meeting'::activity_type,$3,$4,'Sent'::activity_status,$5,$6,NOW())
     RETURNING *`,
                [
                    payload.company_id,
                    contacts[0].id,
                    payload.title,
                    payload.description || '',
                    payload.organizer_id || null,
                    payload.start_time,
                ]
            )
        ).rows[0];

        // 2. Create real Google Calendar event (if connected)
        let googleEventId = null;
        let meetingLink = payload.meeting_link || null;
        let calendarStatus = 'simulated';

        if (await isConnected()) {
            try {
                const cal = await calendarClient();
                const attendees = contacts.filter((c) => c.email).map((c) => ({ email: c.email }));

                const event = await cal.events.insert({
                    calendarId: 'primary',
                    conferenceDataVersion: 1,
                    sendUpdates: 'all', // Send invites to attendees
                    requestBody: {
                        summary: payload.title,
                        description: payload.description || '',
                        location: payload.location,
                        start: { dateTime: new Date(payload.start_time).toISOString() },
                        end: { dateTime: new Date(payload.end_time).toISOString() },
                        attendees,
                        conferenceData: meetingLink
                            ? undefined
                            : { createRequest: { requestId: `crm-${activity.id}-${Date.now()}` } },
                    },
                });

                googleEventId = event.data.id;
                meetingLink = meetingLink || event.data.hangoutLink || null;
                calendarStatus = 'created';
                logger.info(`[calendar] Event created: ${googleEventId}`);
            } catch (err) {
                logger.error(`[calendar] Google event failed: ${err.message}`);
                calendarStatus = 'failed';
                // Don't throw — meeting is still saved locally
            }
        }

        // 3. Save calendar event
        const calendarEvent = (
            await client.query(
                `INSERT INTO calendar_events
           (activity_id, google_event_id, title, description, start_time, end_time,
            location, meeting_link, organizer_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
                [
                    activity.id,
                    googleEventId,
                    payload.title,
                    payload.description || null,
                    payload.start_time,
                    payload.end_time,
                    payload.location || null,
                    meetingLink,
                    payload.organizer_id || null,
                ]
            )
        ).rows[0];

        // 4. Add attendees
        for (const c of contacts) {
            await client.query(
                `INSERT INTO calendar_event_attendees (event_id, contact_id, rsvp_status)
         VALUES ($1,$2,'Pending'::rsvp_status)
         ON CONFLICT (event_id, contact_id) DO NOTHING`,
                [calendarEvent.id, c.id]
            );
        }

        return { activity, event: calendarEvent, attendees: contacts.map((c) => c.id), calendarStatus };
    });