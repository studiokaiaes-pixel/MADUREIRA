import {
  Announcement,
  AuditLog,
  AuthResponse,
  CityOption,
  Congregation,
  Department,
  DigitalCredential,
  DocumentRequest,
  DocumentTemplate,
  EventItem,
  GlobalServerConfig,
  Member,
  MemberDocumentItem,
  MemberHistoryItem,
  MemberRequest,
  PendingRegistration,
  SecretaryStats,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceSettings,
  LocalSecretaryInfo,
} from './types';

let currentToken: string | null = localStorage.getItem('kryptos_auth_token');

export function setAuthToken(token: string | null) {
  currentToken = token;
  if (token) {
    localStorage.setItem('kryptos_auth_token', token);
  } else {
    localStorage.removeItem('kryptos_auth_token');
  }
}

export function getAuthToken(): string | null {
  if (!currentToken) {
    currentToken = localStorage.getItem('kryptos_auth_token');
  }
  return currentToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}: Error en la solicitud`);
  }

  return data as T;
}

export const api = {
  // Autenticación & Perfil
  async fetchCities(): Promise<CityOption[]> {
    return request<CityOption[]>('/api/public/cities');
  },

  // Portal Público Gratuito
  async fetchPublicCongregations(): Promise<Congregation[]> {
    return request<Congregation[]>('/api/public/congregations');
  },

  async fetchPublicCongregationDetails(id: number): Promise<{
    congregation: Congregation;
    events: EventItem[];
    announcements: Announcement[];
    departments: Department[];
  }> {
    return request<{
      congregation: Congregation;
      events: EventItem[];
      announcements: Announcement[];
      departments: Department[];
    }>(`/api/public/congregations/${id}`);
  },

  async fetchPublicEvents(congregationId?: number): Promise<EventItem[]> {
    const q = congregationId ? `?congregationId=${congregationId}` : '';
    return request<EventItem[]>(`/api/public/events${q}`);
  },

  async fetchPublicAnnouncements(congregationId?: number): Promise<Announcement[]> {
    const q = congregationId ? `?congregationId=${congregationId}` : '';
    return request<Announcement[]>(`/api/public/announcements${q}`);
  },

  async fetchPublicDepartments(congregationId?: number): Promise<Department[]> {
    const q = congregationId ? `?congregationId=${congregationId}` : '';
    return request<Department[]>(`/api/public/departments${q}`);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  async register(
    email: string,
    password: string,
    name: string,
    cityWorkspaceId: string
  ): Promise<{ success: boolean; pendingApproval: boolean; message: string; user?: User; token?: string }> {
    const res = await request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, cityWorkspaceId }),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async approveDemo(email: string): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/approve-demo', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async recoverPassword(payload: { email: string; idDocument: string; newPassword: string }): Promise<{ success: boolean; message: string; pastorName?: string }> {
    return request<{ success: boolean; message: string; pastorName?: string }>('/api/auth/recover-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async fetchMe(): Promise<{ user: User; member?: Member; credential?: DigitalCredential; preview?: any; workspace?: Workspace; congregation?: Congregation }> {
    return request<any>('/api/auth/me');
  },

  async logout(): Promise<{ success: boolean }> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignorar error al salir
    }
    setAuthToken(null);
    return { success: true };
  },

  // Dashboard de Secretaría
  async fetchSecretaryStats(): Promise<SecretaryStats> {
    return request<SecretaryStats>('/api/secretary/stats');
  },

  // Gestión de Miembros y Expedientes
  async fetchMembers(params?: { search?: string; status?: string; congregationId?: string }): Promise<Member[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.congregationId) q.set('congregationId', params.congregationId);
    return request<Member[]>(`/api/members?${q.toString()}`);
  },

  async fetchMemberDossier(id: number | string): Promise<{
    member: Member;
    history: MemberHistoryItem[];
    documents: MemberDocumentItem[];
    requests: DocumentRequest[];
    credential?: DigitalCredential;
  }> {
    return request<any>(`/api/members/${id}/dossier`);
  },

  async createMember(data: Partial<Member>): Promise<Member> {
    return request<Member>('/api/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMember(id: number | string, data: Partial<Member>): Promise<Member> {
    return request<Member>(`/api/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async transferMember(id: number | string, toCongregationId: number, reason: string): Promise<Member> {
    return request<Member>(`/api/members/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ toCongregationId, reason }),
    });
  },

  async updateMemberStatus(id: number | string, status: string, reason: string): Promise<Member> {
    return request<Member>(`/api/members/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  },

  // Secretaría Documental
  async fetchDocumentTemplates(): Promise<DocumentTemplate[]> {
    return request<DocumentTemplate[]>('/api/documents/templates');
  },

  async fetchDocumentRequests(params?: { status?: string; congregationId?: string }): Promise<DocumentRequest[]> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.congregationId) q.set('congregationId', params.congregationId);
    return request<DocumentRequest[]>(`/api/documents/requests?${q.toString()}`);
  },

  async createDocumentRequest(data: {
    templateCode: string;
    memberId: number;
    observations?: string;
    status?: string;
    documentTitle?: string;
  }): Promise<DocumentRequest> {
    return request<DocumentRequest>('/api/documents/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDocumentRequestStatus(
    id: number | string,
    status: string,
    observations?: string
  ): Promise<DocumentRequest> {
    return request<DocumentRequest>(`/api/documents/requests/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, observations }),
    });
  },

  // Directorio de Congregaciones
  async fetchCongregations(): Promise<Congregation[]> {
    return request<Congregation[]>('/api/congregations');
  },

  async createCongregation(data: Partial<Congregation>): Promise<Congregation> {
    return request<Congregation>('/api/congregations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCongregation(id: number | string, data: Partial<Congregation>): Promise<Congregation> {
    return request<Congregation>(`/api/congregations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Departamentos y Ministerios
  async fetchDepartments(): Promise<Department[]> {
    return request<Department[]>('/api/departments');
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    return request<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Cultos y Eventos
  async fetchEvents(): Promise<EventItem[]> {
    return request<EventItem[]>('/api/events');
  },

  async createEvent(data: Partial<EventItem>): Promise<EventItem> {
    return request<EventItem>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async registerEventAttendance(eventId: number, memberId: number): Promise<{ success: boolean; message: string }> {
    return request(`/api/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    });
  },

  // Comunicaciones y Avisos
  async fetchAnnouncements(): Promise<Announcement[]> {
    return request<Announcement[]>('/api/announcements');
  },

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    return request<Announcement>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Atención al Miembro
  async fetchMemberRequests(): Promise<MemberRequest[]> {
    return request<MemberRequest[]>('/api/member-requests');
  },

  async createMemberRequest(data: { category: string; subject: string; description: string; isConfidential?: boolean }): Promise<MemberRequest> {
    return request<MemberRequest>('/api/member-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async respondMemberRequest(id: number | string, responseText: string): Promise<MemberRequest> {
    return request<MemberRequest>(`/api/member-requests/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ responseText }),
    });
  },

  // Credencial Digital
  async fetchDigitalCredential(memberId: number | string): Promise<DigitalCredential> {
    return request<DigitalCredential>(`/api/members/${memberId}/credential`);
  },

  // Auditoría Institucional
  async fetchAuditLogs(): Promise<AuditLog[]> {
    return request<AuditLog[]>('/api/audit-logs');
  },

  // Vista Previa de Supervisión (Superadmin)
  async startPreview(targetAdminId: string): Promise<any> {
    return request('/api/root/preview/start', {
      method: 'POST',
      body: JSON.stringify({ targetAdminId }),
    });
  },

  async stopPreview(): Promise<any> {
    return request('/api/root/preview/stop', { method: 'POST' });
  },

  // Espacio del Administrador Local
  async fetchAdminWorkspace(): Promise<Workspace> {
    return request<Workspace>('/api/admin/workspace');
  },

  async addAdminMember(name: string, email: string, role: string): Promise<WorkspaceMember> {
    return request<WorkspaceMember>('/api/admin/members', {
      method: 'POST',
      body: JSON.stringify({ name, email, role }),
    });
  },

  async removeAdminMember(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/admin/members/${id}`, {
      method: 'DELETE',
    });
  },

  async updateAdminSettings(settings: WorkspaceSettings): Promise<WorkspaceSettings> {
    return request<WorkspaceSettings>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async fetchAdminCongregation(): Promise<Congregation | null> {
    return request<Congregation | null>('/api/admin/congregation');
  },

  async updateAdminCongregation(data: Partial<Congregation>): Promise<Congregation> {
    return request<Congregation>('/api/admin/congregation', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Gestión del Secretario de la Filial (Cada Admin tiene su propio Secretario)
  async fetchLocalSecretary(): Promise<LocalSecretaryInfo | null> {
    return request<LocalSecretaryInfo | null>('/api/admin/secretary');
  },

  async saveLocalSecretary(data: { name: string; email: string; password?: string }): Promise<LocalSecretaryInfo> {
    return request<LocalSecretaryInfo>('/api/admin/secretary', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Gestión de Aprobación de Registros (Local Admin & Root)
  async approveRegistration(memberId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/registrations/${memberId}/approve`, {
      method: 'POST',
    });
  },

  async rejectRegistration(memberId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/registrations/${memberId}/reject`, {
      method: 'POST',
    });
  },

  // Métodos Exclusivos de Root Console
  async fetchRootAdmins(): Promise<{ admin: User; workspace?: Workspace }[]> {
    return request<{ admin: User; workspace?: Workspace }[]>('/api/root/admins');
  },

  async fetchGlobalConfig(): Promise<GlobalServerConfig> {
    return request<GlobalServerConfig>('/api/root/config');
  },

  async fetchPendingRegistrations(): Promise<PendingRegistration[]> {
    return request<PendingRegistration[]>('/api/root/pending-registrations');
  },

  async updateAdminFeatures(adminId: string, features: string[]): Promise<any> {
    return request(`/api/root/admins/${adminId}/features`, {
      method: 'PUT',
      body: JSON.stringify({ features }),
    });
  },

  async updateGlobalConfig(data: Partial<GlobalServerConfig>): Promise<{ success: boolean; globalConfig: GlobalServerConfig }> {
    return request<{ success: boolean; globalConfig: GlobalServerConfig }>('/api/root/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async purgeTraces(): Promise<{ success: boolean; message: string; purgedAt: string }> {
    return request<{ success: boolean; message: string; purgedAt: string }>('/api/root/purge', {
      method: 'POST',
    });
  },

  async resetDemo(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/root/reset-demo', {
      method: 'POST',
    });
  },

  async createRootAdmin(data: {
    name: string;
    email: string;
    password: string;
    city?: string;
    congregationId?: number | string;
    role?: string;
    assignedFeature?: string;
    workspaceName?: string;
    enabledFeatures?: string[];
  }): Promise<any> {
    return request('/api/root/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
