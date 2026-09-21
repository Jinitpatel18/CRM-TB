import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { audit } from '../middleware/auditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import multer from 'multer';

// validators
import { createCompanySchema, updateCompanyStatusSchema } from '../validators/company.validator.js';
import { createContactSchema, updateContactSchema } from '../validators/contact.validator.js';
import { createTemplateSchema } from '../validators/template.validator.js';
import { sendMessageSchema, bulkSendSchema } from '../validators/activity.validator.js';
import { scheduleMeetingSchema, availabilityQuerySchema } from '../validators/meeting.validator.js';
import { importConfirmSchema } from '../validators/import.validator.js';

// controllers
import * as companyCtrl from '../controllers/company.controller.js';
import * as contactCtrl from '../controllers/contact.controller.js';
import * as templateCtrl from '../controllers/template.controller.js';
import * as activityCtrl from '../controllers/activity.controller.js';
import * as meetingCtrl from '../controllers/meeting.controller.js';
import * as queueCtrl from '../controllers/queue.controller.js';
import * as userCtrl from '../controllers/user.controller.js';
import * as auditCtrl from '../controllers/audit.controller.js';
import * as fileCtrl from '../controllers/file.controller.js';
import * as analyticsCtrl from '../controllers/analytics.controller.js';
import * as importCtrl from '../controllers/import.controller.js';



// ---- Analytics (admin + sales can view) ----
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

// ============================================
// PUBLIC — No auth required
// ============================================
router.get('/calendar/oauth/callback', meetingCtrl.oauthCallback);

// ============================================
// PROTECTED — Auth required
// ============================================
router.use(requireAuth);
// ---- File uploads ----
router.post(
    '/files/upload',
    requireRole('admin', 'sales'),
    upload.single('file'),
    fileCtrl.upload
);
router.get('/files/activity/:activityId', fileCtrl.listByActivity);
router.delete('/files/:id', requireRole('admin', 'sales'), fileCtrl.remove);

// ---- Users (self + admin) ----
router.get('/users/me', userCtrl.me);
router.get('/users', userCtrl.list);
router.patch('/users/:id/role', requireRole('admin'), audit('update', 'user_role'), userCtrl.updateRole);
router.patch('/users/:id/status', requireRole('admin'), audit('update', 'user_status'), userCtrl.updateStatus);

// ---- Audit Logs (admin only) ----
router.get('/audit-logs', requireRole('admin'), auditCtrl.list);
router.get('/audit-logs/stats', requireRole('admin'), auditCtrl.stats);

// ---- Companies ----
router.get('/companies', companyCtrl.list);
router.post('/companies', requireRole('admin', 'sales'), validate(createCompanySchema), audit('create', 'company'), companyCtrl.create);
router.get('/companies/:id', companyCtrl.getById);
router.patch(
    '/companies/:id/status',
    requireRole('admin', 'sales'),
    validate(updateCompanyStatusSchema),
    audit('update', 'company_status'),
    companyCtrl.updateStatus
);

// ---- Contacts ----
router.post('/contacts', requireRole('admin', 'sales'), validate(createContactSchema), audit('create', 'contact'), contactCtrl.create);
router.get('/contacts/:id', contactCtrl.getById);
router.patch('/contacts/:id', requireRole('admin', 'sales'), validate(updateContactSchema), audit('update', 'contact'), contactCtrl.update);

// ---- Templates ----
router.post('/templates', requireRole('admin', 'sales'), validate(createTemplateSchema), audit('create', 'template'), templateCtrl.create);

// ---- Activities ----
router.post('/activities/send-message', requireRole('admin', 'sales'), validate(sendMessageSchema), audit('send', 'activity'), activityCtrl.sendMessage);
router.post('/activities/bulk-send', requireRole('admin', 'sales'), validate(bulkSendSchema), audit('bulk_send', 'activity'), activityCtrl.bulkSendHandler);
router.get('/activities/recent', activityCtrl.recent);
router.get('/activities/:company_id', activityCtrl.listByCompany);
router.post('/activities/:id/response', activityCtrl.recordResponse);

// ---- Meetings ----
router.post('/meetings/schedule', requireRole('admin', 'sales'), validate(scheduleMeetingSchema), audit('schedule', 'meeting'), meetingCtrl.schedule);
router.get('/calendar/availability', validate(availabilityQuerySchema, 'query'), meetingCtrl.availability);
router.get('/calendar/oauth/url', requireRole('admin'), meetingCtrl.oauthUrl);
router.get('/calendar/oauth/status', meetingCtrl.oauthStatus);
router.post('/calendar/oauth/disconnect', requireRole('admin'), meetingCtrl.oauthDisconnect);

// ---- Queue ----
router.get('/queue/status', queueCtrl.status);

router.get('/analytics/overview', analyticsCtrl.overview);
router.get('/analytics/trend', analyticsCtrl.trend);
router.get('/analytics/by-type', analyticsCtrl.byType);
router.get('/analytics/top-companies', analyticsCtrl.topCompanies);
router.get('/analytics/team-performance', analyticsCtrl.teamPerformance);
router.get('/analytics/hourly', analyticsCtrl.hourly);
router.get('/analytics/status-breakdown', analyticsCtrl.statusBreakdown);

router.post(
    '/import/preview',
    requireRole('admin', 'sales'),
    upload.single('file'),
    importCtrl.preview
);
router.post(
    '/import/confirm',
    requireRole('admin', 'sales'),
    validate(importConfirmSchema),
    audit('import', 'contacts'),
    importCtrl.confirm
);

export default router;