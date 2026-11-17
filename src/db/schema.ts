import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. CONGREGACIONES / FILIALES ECLESIÁSTICAS
export const congregations = pgTable('congregations', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  nif: text('nif'),
  address: text('address'),
  postalCode: text('postal_code'),
  phone: text('phone'),
  email: text('email'),
  pastorName: text('pastor_name'),
  secretaryName: text('secretary_name'),
  serviceSchedules: text('service_schedules'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. USUARIOS CON CONTROL DE ACCESO JERÁRQUICO
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('member'), // superadmin | general_secretary | general_pastor | local_secretary | local_pastor | pastor_advisor | secretary | member
  congregationId: integer('congregation_id').references(() => congregations.id),
  assignedFeature: text('assigned_feature'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. EXPEDIENTES DE MIEMBROS
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  congregationId: integer('congregation_id').references(() => congregations.id).notNull(),
  memberNumber: text('member_number').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  photoUrl: text('photo_url'),
  birthDate: text('birth_date'),
  nationality: text('nationality').default('Brasileña'),
  idDocument: text('id_document'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  admissionDate: text('admission_date'),
  baptismDate: text('baptism_date'),
  status: text('status').notNull().default('active'), // pending | active | inactive | transferred | suspended | deceased
  pastorResponsible: text('pastor_responsible'),
  secretaryResponsible: text('secretary_responsible'),
  departmentName: text('department_name'),
  ministerialFunction: text('ministerial_function').default('Miembro en Plena Comunión'),
  observations: text('observations'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. HISTORIAL Y TRAZABILIDAD DEL MIEMBRO
export const memberHistory = pgTable('member_history', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').references(() => members.id).notNull(),
  changeType: text('change_type').notNull(),
  description: text('description').notNull(),
  performedBy: text('performed_by').notNull(),
  previousState: text('previous_state'),
  newState: text('new_state'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. DOCUMENTOS DIGITALES ARCHIVADOS DEL MIEMBRO
export const memberDocuments = pgTable('member_documents', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').references(() => members.id).notNull(),
  title: text('title').notNull(),
  documentType: text('document_type').notNull(),
  fileUrl: text('file_url'),
  fileHash: text('file_hash'),
  issuedBy: text('issued_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. PLANTILLAS DOCUMENTALES OFICIALES
export const documentTemplates = pgTable('document_templates', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  contentTemplate: text('content_template').notNull(),
  requiresPastoralSignature: boolean('requires_pastoral_signature').default(true),
  requiresQr: boolean('requires_qr').default(true),
  isActive: boolean('is_active').default(true),
});

// 7. SOLICITUDES Y EXPEDIENTES DOCUMENTALES
export const documentRequests = pgTable('document_requests', {
  id: serial('id').primaryKey(),
  dossierNumber: text('dossier_number').notNull().unique(),
  memberId: integer('member_id').references(() => members.id).notNull(),
  templateCode: text('template_code').notNull(),
  documentTitle: text('document_title').notNull(),
  congregationId: integer('congregation_id').references(() => congregations.id).notNull(),
  status: text('status').notNull().default('received'), // received | under_review | in_preparation | pending_approval | approved | rejected | delivered
  assignedTo: text('assigned_to'),
  observations: text('observations'),
  resolvedAt: timestamp('resolved_at'),
  verificationToken: text('verification_token'),
  pdfGeneratedUrl: text('pdf_generated_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. DEPARTAMENTOS Y MINISTERIOS
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  congregationId: integer('congregation_id').references(() => congregations.id),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  responsibleName: text('responsible_name'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. MIEMBROS ASOCIADOS A DEPARTAMENTOS
export const departmentMembers = pgTable('department_members', {
  id: serial('id').primaryKey(),
  departmentId: integer('department_id').references(() => departments.id).notNull(),
  memberId: integer('member_id').references(() => members.id).notNull(),
  roleInDepartment: text('role_in_department').default('member'),
  joinedAt: timestamp('joined_at').defaultNow(),
});

// 10. CULTOS Y EVENTOS ECLESIÁSTICOS
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  congregationId: integer('congregation_id').references(() => congregations.id),
  title: text('title').notNull(),
  eventType: text('event_type').notNull(),
  description: text('description'),
  location: text('location'),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at'),
  responsibleName: text('responsible_name'),
  maxCapacity: integer('max_capacity').default(500),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. ASISTENCIA E INSCRIPCIÓN A EVENTOS
export const eventAttendance = pgTable('event_attendance', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  memberId: integer('member_id').references(() => members.id).notNull(),
  registeredAt: timestamp('registered_at').defaultNow(),
  confirmedAttendance: boolean('confirmed_attendance').default(false),
  confirmedAt: timestamp('confirmed_at'),
});

// 12. COMUNICADOS Y ANUNCIOS INSTITUCIONALES
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  targetScope: text('target_scope').notNull().default('global'),
  congregationId: integer('congregation_id').references(() => congregations.id),
  authorName: text('author_name').notNull(),
  isPublished: boolean('is_published').default(true),
  publishedAt: timestamp('published_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
});

// 13. ATENCIÓN AL MIEMBRO (Peticiones, sugerencias, consultas)
export const memberRequests = pgTable('member_requests', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').references(() => members.id).notNull(),
  category: text('category').notNull(), // prayer_request | admin_inquiry | suggestion | info_request | private_secretary_comm
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  isConfidential: boolean('is_confidential').default(false),
  status: text('status').notNull().default('open'), // open | in_progress | answered | closed
  assignedTo: text('assigned_to'),
  responseText: text('response_text'),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. CREDENCIALES DIGITALES CON CÓDIGO QR
export const digitalCredentials = pgTable('digital_credentials', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').references(() => members.id).notNull().unique(),
  qrPayloadToken: text('qr_payload_token').notNull(),
  issueDate: text('issue_date').notNull(),
  expirationDate: text('expiration_date'),
  status: text('status').notNull().default('valid'), // valid | revoked | expired
  appleWalletReady: boolean('apple_wallet_ready').default(true),
  googleWalletReady: boolean('google_wallet_ready').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. NOTIFICACIONES DEL SISTEMA
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info'),
  readAt: timestamp('read_at'),
  linkUrl: text('link_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 16. REGISTROS DE AUDITORÍA INSTITUCIONAL
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  userName: text('user_name'),
  userRole: text('user_role'),
  congregationId: integer('congregation_id'),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  ipAddress: text('ip_address'),
  changesPayload: text('changes_payload'),
  createdAt: timestamp('created_at').defaultNow(),
});

// RELACIONES DRIZZLE
export const congregationsRelations = relations(congregations, ({ many }) => ({
  users: many(users),
  members: many(members),
  departments: many(departments),
  events: many(events),
  announcements: many(announcements),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  congregation: one(congregations, {
    fields: [users.congregationId],
    references: [congregations.id],
  }),
  notifications: many(notifications),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  congregation: one(congregations, {
    fields: [members.congregationId],
    references: [congregations.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  history: many(memberHistory),
  documents: many(memberDocuments),
  documentRequests: many(documentRequests),
  departmentMembers: many(departmentMembers),
  eventAttendance: many(eventAttendance),
  memberRequests: many(memberRequests),
  credential: one(digitalCredentials, {
    fields: [members.id],
    references: [digitalCredentials.memberId],
  }),
}));
