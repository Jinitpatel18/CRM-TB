import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { createActivity } from './activity.service.js';
import { enqueueMessage } from './queue.service.js';

export const bulkSend = async (payload, userId, orgId) => {
    const { contact_ids, template_id, activity_type, scheduled_for, variables, attachment_ids } = payload;

    const contacts = await query(
        `SELECT c.*, co.id AS company_id
     FROM contacts c
     JOIN companies co ON co.id = c.company_id
     WHERE c.id = ANY($1::int[]) AND co.organization_id = $2`,
        [contact_ids, orgId]
    );
    if (contacts.rows.length === 0) {
        throw new AppError('No valid contacts', 400, 'NO_CONTACTS');
    }

    const created = [];
    for (const contact of contacts.rows) {
        const activity = await createActivity(
            {
                company_id: contact.company_id,
                contact_id: contact.id,
                template_id,
                activity_type,
                scheduled_for,
                variables,
                attachment_ids,
            },
            userId,
            orgId
        );

        await enqueueMessage({
            activityId: activity.id,
            type: activity_type,
            scheduledFor: scheduled_for,
        });

        created.push(activity.id);
    }

    return { queued: created.length, activity_ids: created };
};