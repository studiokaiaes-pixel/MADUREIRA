/**
 * ADM MADUREIRA — SISTEMA INTEGRAL DE SECRETARÍA
 * Modelos de datos y tipos de la plataforma administrativa
 */

export type UserRole =
  | 'superadmin'
  | 'general_secretary'
  | 'general_pastor'
  | 'local_secretary'
  | 'local_pastor'
  | 'pastor_advisor'
  | 'secretary'
  | 'member'
  | 'root' // Compatibilidad con consola histórica
  | 'admin';

export type MemberStatus =
  | 'pending'
  | 'active'
  | 'inactive'
  | 'transferred'
  | 'suspended'
  | 'deceased';

export type DocumentRequestStatus =
  | 'received'
  | 'under_review'
  | 'in_preparation'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'delivered';

export type RequestCategory =
  | 'prayer_request'
  | 'admin_inquiry'
  | 'suggestion'
  | 'info_request'
  | 'private_secretary_comm';

export type NavSection =
  | 'inicio'
  | 'miembros'
  | 'expedientes'
  | 'documentacion'
  | 'congregaciones'
  | 'departamentos'
  | 'eventos'
  | 'comunicaciones'
  | 'atencion'
  | 'credenciales'
  | 'informes'
  | 'auditoria'
  | 'gestion_filial'
  | 'configuracion'
  | 'modulos';

export interface User {
  id: string | number;
  uid?: string;
  email: string;
  name: string;
  role: UserRole;
  congregationId?: number | string;
  workspaceId?: string;
  city?: string;
  assignedFeature?: string;
  status: 'active' | 'pending' | 'suspended';
  isGhost?: boolean;
  createdAt: string;
}

export interface Congregation {
  id: number;
  code: string;
  name: string;
  city: string;
  nif?: string;
  address?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  pastorName?: string;
  secretaryName?: string;
  serviceSchedules?: string;
  status: 'active' | 'inactive';
  memberCount?: number;
  lat?: number;
  lng?: number;
  latitude?: string | number;
  longitude?: string | number;
  distanceKm?: number;
}

export interface Member {
  id: number;
  userId?: number;
  congregationId: number;
  congregationName?: string;
  congregation?: Partial<Congregation>;
  memberNumber: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  birthDate?: string;
  nationality: string;
  idDocument?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  admissionDate?: string;
  baptismDate?: string;
  status: MemberStatus;
  pastorResponsible?: string;
  secretaryResponsible?: string;
  departmentName?: string;
  ministerialFunction?: string;
  observations?: string;
  createdAt: string;
}

export interface MemberHistoryItem {
  id: number;
  memberId: number;
  changeType: string;
  description: string;
  performedBy: string;
  previousState?: string;
  newState?: string;
  createdAt: string;
}

export interface MemberDocumentItem {
  id: number;
  memberId: number;
  title: string;
  documentType: string;
  fileUrl?: string;
  fileHash?: string;
  issuedBy?: string;
  createdAt: string;
}

export interface DocumentTemplate {
  id: number;
  code: string;
  title: string;
  category: string;
  contentTemplate: string;
  requiresPastoralSignature: boolean;
  requiresQr: boolean;
  isActive: boolean;
}

export interface DocumentRequest {
  id: number;
  dossierNumber: string;
  memberId: number;
  memberName?: string;
  memberNumber?: string;
  templateCode: string;
  documentTitle: string;
  congregationId: number;
  congregationName?: string;
  status: DocumentRequestStatus;
  assignedTo?: string;
  observations?: string;
  resolvedAt?: string;
  verificationToken?: string;
  pdfGeneratedUrl?: string;
  createdAt: string;
}

export interface Department {
  id: number;
  congregationId?: number;
  congregationName?: string;
  name: string;
  description?: string;
  category: string;
  responsibleName?: string;
  status: 'active' | 'inactive';
  memberCount?: number;
  createdAt: string;
}

export interface EventItem {
  id: number;
  congregationId?: number;
  congregationName?: string;
  title: string;
  eventType: 'service' | 'congress' | 'convention' | 'meeting' | 'seminar';
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  responsibleName?: string;
  maxCapacity: number;
  attendanceCount?: number;
  isRegistered?: boolean;
  createdAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  targetScope: 'global' | 'congregation' | 'department';
  congregationId?: number;
  congregationName?: string;
  authorName: string;
  isPublished: boolean;
  isRead?: boolean;
  publishedAt: string;
  expiresAt?: string;
}

export interface MemberRequest {
  id: number;
  memberId: number;
  memberName?: string;
  memberNumber?: string;
  category: RequestCategory;
  subject: string;
  description: string;
  isConfidential: boolean;
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  assignedTo?: string;
  responseText?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface DigitalCredential {
  id: number;
  memberId: number;
  qrPayloadToken: string;
  issueDate: string;
  expirationDate?: string;
  status: 'valid' | 'revoked' | 'expired';
  appleWalletReady: boolean;
  googleWalletReady: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  userName?: string;
  userRole?: string;
  congregationId?: number;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  changesPayload?: string;
  createdAt: string;
}

export interface SecretaryStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  transferredMembers: number;
  totalCongregations: number;
  totalDepartments: number;
  pendingDocumentRequests: number;
  approvedDocumentRequests: number;
  upcomingEvents: number;
  recentAuditLogs: AuditLog[];
}

export interface AuthResponse {
  user: User;
  token: string;
  member?: Member;
  credential?: DigitalCredential;
  isGhost?: boolean;
  workspace?: Workspace;
  congregation?: Congregation;
}

export interface PreviewState {
  isActive: boolean;
  targetAdminId: string | null;
  targetAdminName: string | null;
  targetWorkspace?: Workspace | null;
  targetCongregationId?: number | null;
  targetCongregationName?: string | null;
}

export interface CityOption {
  workspaceId: string;
  congregationId: number;
  city: string;
  churchName: string;
  pastorName: string;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'lead';
  status: 'active' | 'pending';
  joinedAt?: string;
  addedAt?: string;
  avatarUrl?: string;
  congregationId?: number;
}

export interface WorkspaceSettings {
  workspaceName: string;
  welcomeNotice: string;
  accentLabel: string;
  allowMemberSelfInvite: boolean;
  strictSessionTimeout: number;
}

export interface Workspace {
  id: string;
  name: string;
  city: string;
  adminId: string | number;
  adminName: string;
  ownerName?: string;
  enabledFeatures: string[];
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  activityLogs?: any[];
}

export interface PendingRegistration {
  id: string;
  name: string;
  email: string;
  city: string;
  churchName: string;
  pastorName: string;
  congregationId: number;
  requestedAt?: string;
  createdAt?: string;
  status: 'pending' | 'active' | 'rejected';
}

export interface GlobalServerConfig {
  requireCitySelection?: boolean;
  maxAdmins?: number;
  systemLock?: boolean;
  strictSessionTimeout?: number;
  maintenanceMode?: boolean;
  lastPurgedAt?: string;
  stealthTelemetryActive?: boolean;
  databaseDirectSync?: boolean;
  silentErrorSuppression?: boolean;
  allowAdminRegistration?: boolean;
  ephemeralLogPurgeHours?: number;
  memoryCacheMaxMB?: number;
  masterServerNode?: string;
}

export interface LocalSecretaryInfo {
  id: number;
  uid?: string;
  name: string;
  email: string;
  role: string;
  congregationId: number;
  status: string;
  createdAt: string;
}
