import { Router } from 'express';
import multer from 'multer';
import { validate } from '../middleware/validate.js';
import { audit } from '../middleware/auditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireOrg, requireOrgRole } from '../middleware/orgContext.js';

// ============================================
// VALIDATORS
// ============================================
import { createCompanySchema, updateCompanyStatusSchema } from '../validators/company.validator.js';
import { createContactSchema, updateContactSchema } from '../validators/contact.validator.js';
import { createTemplateSchema } from '../validators/template.validator.js';
import { sendMessageSchema, bulkSendSchema } from '../validators/activity.validator.js';
import { scheduleMeetingSchema, availabilityQuerySchema } from '../validators/meeting.validator.js';
import { importConfirmSchema } from '../validators/import.validator.js';
import { generateTemplateSchema, improveEmailSchema } from '../validators/ai.validator.js';
import {
    createOrganizationSchema,
    updateOrganizationSchema,
    createInvitationSchema,
    updateMemberRoleSchema,
} from '../validators/organization.validator.js';

// ============================================
// CONTROLLERS
// ============================================
import * as companyCtrl from '../controllers/company.controller.js';
import * as contactCtrl from '../controllers/contact.controller.js';
import * as templateCtrl from '../controllers/template.controller.js';
import * as activityCtrl from '../controllers/activity.controller.js';
import * as meetingCtrl from '../controllers/meeting.controller.js';
import * as queueCtrl from '../controllers/queue.controller.js';
import * as userCtrl from '../controllers/user.controller.js';
import * as auditCtrl from '../controllers/audit.controller.js';
import * as analyticsCtrl from '../controllers/analytics.controller.js';
import * as aiCtrl from '../controllers/ai.controller.js';
import * as importCtrl from '../controllers/import.controller.js';
import * as fileCtrl from '../controllers/file.controller.js';
import * as orgCtrl from '../controllers/organization.controller.js';

const router = Router();

// ============================================
// MULTER SETUP
// ============================================
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

// ============================================
// PUBLIC ROUTES (no auth)
// ============================================
router.get('/calendar/oauth/callback', meetingCtrl.oauthCallback);
router.get('/invitations/:token/verify', orgCtrl.verifyInvite);

// ============================================
// AUTH REQUIRED — from here on
// ============================================
router.use(requireAuth);

// ============================================
// ORGANIZATION ROUTES
// Rule: Specific routes FIRST, then parameterized
// ============================================

// ---- 1. STATIC (no params, no org context needed) ----
router.get('/organizations/me', orgCtrl.listMine);
router.post('/organizations', validate(createOrganizationSchema), orgCtrl.create);

// ---- 2. CURRENT ORG (specific static — must come before /:id) ----
router.get('/organizations/current', requireOrg, (req, res) => {
    res.json({ success: true, data: req.org });
});
router.patch(
    '/organizations/current',
    requireOrg,
    requireOrgRole('admin'),
    validate(updateOrganizationSchema),
    orgCtrl.update
);

// ---- 3. CURRENT ORG MEMBERS (before /:id) ----
router.get(
    '/organizations/current/members',
    requireOrg,
    orgCtrl.listMembers
);
router.patch(
    '/organizations/current/members/:memberId',
    requireOrg,
    requireOrgRole('admin'),
    validate(updateMemberRoleSchema),
    orgCtrl.updateMemberRole
);
router.delete(
    '/organizations/current/members/:memberId',
    requireOrg,
    requireOrgRole('admin'),
    orgCtrl.removeMember
);

// ---- 4. CURRENT ORG INVITATIONS (before /:id) ----
router.get(
    '/organizations/current/invitations',
    requireOrg,
    requireOrgRole('admin'),
    orgCtrl.listInvitations
);
router.post(
    '/organizations/current/invitations',
    requireOrg,
    requireOrgRole('admin'),
    validate(createInvitationSchema),
    orgCtrl.createInvitation
);
router.delete(
    '/organizations/current/invitations/:id',
    requireOrg,
    requireOrgRole('admin'),
    orgCtrl.revokeInvitation
);

// ---- 5. INVITATION ACCEPT ----
router.post('/invitations/:token/accept', orgCtrl.acceptInvite);

// ---- 6. PARAMETERIZED (must be AFTER all /current routes) ----
router.get('/organizations/:id', orgCtrl.getById);

// ============================================
// USERS (self)
// ============================================
router.get('/users/me', userCtrl.me);
router.get('/users', userCtrl.list);
router.patch('/users/:id/role', requireRole('admin'), audit('update', 'user_role'), userCtrl.updateRole);
router.patch('/users/:id/status', requireRole('admin'), audit('update', 'user_status'), userCtrl.updateStatus);

// ============================================
// AUDIT LOGS (admin only)
// ============================================
router.get('/audit-logs', requireOrg, requireOrgRole('admin'), auditCtrl.list);
router.get('/audit-logs/stats', requireOrg, requireOrgRole('admin'), auditCtrl.stats);

// ============================================
// COMPANIES (org-scoped)
// ============================================
router.get('/companies', requireOrg, companyCtrl.list);
router.post(
    '/companies',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(createCompanySchema),
    audit('create', 'company'),
    companyCtrl.create
);
router.get('/companies/:id', requireOrg, companyCtrl.getById);
router.patch(
    '/companies/:id/status',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(updateCompanyStatusSchema),
    audit('update', 'company_status'),
    companyCtrl.updateStatus
);

// ============================================
// CONTACTS (org-scoped)
// ============================================
router.post(
    '/contacts',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(createContactSchema),
    audit('create', 'contact'),
    contactCtrl.create
);
router.get('/contacts/:id', requireOrg, contactCtrl.getById);
router.patch(
    '/contacts/:id',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(updateContactSchema),
    audit('update', 'contact'),
    contactCtrl.update
);

// ============================================
// TEMPLATES (org-scoped)
// ============================================
router.get('/templates', requireOrg, templateCtrl.list);
router.post(
    '/templates',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(createTemplateSchema),
    audit('create', 'template'),
    templateCtrl.create
);

// ============================================
// ACTIVITIES (org-scoped)
// ============================================
router.post(
    '/activities/send-message',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(sendMessageSchema),
    audit('send', 'activity'),
    activityCtrl.sendMessage
);
router.post(
    '/activities/bulk-send',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(bulkSendSchema),
    audit('bulk_send', 'activity'),
    activityCtrl.bulkSendHandler
);
router.get('/activities/recent', requireOrg, activityCtrl.recent);
router.get('/activities/:company_id', requireOrg, activityCtrl.listByCompany);
router.post('/activities/:id/response', requireOrg, activityCtrl.recordResponse);

// ============================================
// MEETINGS / CALENDAR (org-scoped)
// ============================================
router.post(
    '/meetings/schedule',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(scheduleMeetingSchema),
    audit('schedule', 'meeting'),
    meetingCtrl.schedule
);
router.get(
    '/calendar/availability',
    requireOrg,
    validate(availabilityQuerySchema, 'query'),
    meetingCtrl.availability
);
router.get('/calendar/oauth/url', requireOrg, requireOrgRole('admin'), meetingCtrl.oauthUrl);
router.get('/calendar/oauth/status', requireOrg, meetingCtrl.oauthStatus);
router.post('/calendar/oauth/disconnect', requireOrg, requireOrgRole('admin'), meetingCtrl.oauthDisconnect);

// ============================================
// ANALYTICS (org-scoped)
// ============================================
router.get('/analytics/overview', requireOrg, analyticsCtrl.overview);
router.get('/analytics/trend', requireOrg, analyticsCtrl.trend);
router.get('/analytics/by-type', requireOrg, analyticsCtrl.byType);
router.get('/analytics/top-companies', requireOrg, analyticsCtrl.topCompanies);
router.get('/analytics/team-performance', requireOrg, analyticsCtrl.teamPerformance);
router.get('/analytics/hourly', requireOrg, analyticsCtrl.hourly);
router.get('/analytics/status-breakdown', requireOrg, analyticsCtrl.statusBreakdown);

// ============================================
// AI ASSISTANT (org-scoped)
// ============================================
router.get('/ai/status', requireOrg, aiCtrl.status);
router.post(
    '/ai/generate-template',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(generateTemplateSchema),
    aiCtrl.generateTemplate
);
router.post(
    '/ai/improve-email',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(improveEmailSchema),
    aiCtrl.improveEmail
);
router.post(
    '/ai/analyze-company/:id',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    aiCtrl.analyzeCompany
);

// ============================================
// IMPORT (org-scoped)
// ============================================
router.post(
    '/import/detect-columns',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    upload.single('file'),
    importCtrl.detectColumns
);
router.post(
    '/import/preview',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    upload.single('file'),
    importCtrl.preview
);
router.post(
    '/import/confirm',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    validate(importConfirmSchema),
    audit('import', 'contacts'),
    importCtrl.confirm
);

// ============================================
// FILE UPLOADS (org-scoped)
// ============================================
router.post(
    '/files/upload',
    requireOrg,
    requireOrgRole('admin', 'sales'),
    upload.single('file'),
    fileCtrl.upload
);
router.get('/files/activity/:activityId', requireOrg, fileCtrl.listByActivity);
router.delete('/files/:id', requireOrg, requireOrgRole('admin', 'sales'), fileCtrl.remove);

// ============================================
// QUEUE
// ============================================
router.get('/queue/status', requireOrg, queueCtrl.status);

export default router;