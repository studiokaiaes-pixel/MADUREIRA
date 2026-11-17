import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Terminal,
  Shield,
  Clock,
  Megaphone,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Search,
  Plus,
  UserCheck,
  Users,
  Check,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Lock,
  Layers,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Sliders,
  X,
  Download
} from 'lucide-react';
import { api } from '../api';
import {
  Announcement,
  Congregation,
  GlobalServerConfig,
  Member,
  PendingRegistration,
  User,
  Workspace,
} from '../types';
import { OfficialMemberFichaModal } from './OfficialMemberFichaModal';
import {
  AccessCredentialPdfPayload,
  buildAccessCredentialModelData,
  generateAccessCredentialPdf,
} from '../utils/generateAccessCredentialPdf';

interface RootConsoleProps {
  currentUser: User;
  onStartPreview: (adminId: string) => void;
}

interface AdminWithWorkspace {
  admin: User;
  workspace?: Workspace;
}

const AVAILABLE_FEATURES = [
  {
    code: 'member_management',
    name: 'Gestión y Alta de Miembros',
    description: 'Permite invitar, enrolar y administrar miembros en la filial.',
    category: 'core',
  },
  {
    code: 'activity_audit',
    name: 'Visor de Auditoría y Trazas',
    description: 'Permite inspeccionar los registros de actividad locales.',
    category: 'security',
  },
  {
    code: 'workspace_customization',
    name: 'Personalización de Espacio',
    description: 'Permite modificar nombre de filial, avisos y políticas.',
    category: 'core',
  },
  {
    code: 'api_tokens',
    name: 'Llaves de API del Espacio',
    description: 'Generación y rotación de tokens de integración externa.',
    category: 'tools',
  },
  {
    code: 'export_data',
    name: 'Exportación Cifrada de Registros',
    description: 'Descarga de informes sellados criptográficamente.',
    category: 'tools',
  },
  {
    code: 'strict_session_ip',
    name: 'Validación Estricta de IP',
    description: 'Cierra sesiones activas si se detecta cambio de red.',
    category: 'security',
  },
];

// Ícono SVG de Carpeta Exacto del Modelo Gráfico
const FolderGraphicIcon = ({ className = "w-12 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 52 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Pestaña trasera de la carpeta */}
    <path
      d="M3 9C3 6.23858 5.23858 4 8 4H20.1716C21.4976 4 22.7695 4.52679 23.7071 5.46447L26.5355 8.29289C27.4732 9.23058 28.7451 9.75736 30.0711 9.75736H44C46.7614 9.75736 49 11.9959 49 14.7574V34C49 36.7614 46.7614 39 44 39H8C5.23858 39 3 36.7614 3 34V9Z"
      fill="#26262A"
    />
    {/* Cuerpo frontal con relieve sutil */}
    <path
      d="M3 14C3 11.7909 4.79086 10 7 10H45C47.2091 10 49 11.7909 49 14V34C49 36.7614 46.7614 39 44 39H8C5.23858 39 3 36.7614 3 34V14Z"
      fill="#3A3A40"
    />
    {/* Borde superior brillante */}
    <path
      d="M4 14.5H48"
      stroke="rgba(255,255,255,0.14)"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

export const RootConsole: React.FC<RootConsoleProps> = ({ currentUser, onStartPreview }) => {
  // Navegación principal estilo maqueta: 'igrejas' | 'registros' | 'avisos' | 'auditoria'
  const [activeTab, setActiveTab] = useState<'igrejas' | 'registros' | 'avisos' | 'auditoria'>('igrejas');
  
  // Vista dentro de una carpeta de iglesia (Pantalla 02)
  const [selectedCongregation, setSelectedCongregation] = useState<Congregation | null>(null);
  const [congregationSection, setCongregationSection] = useState<'overview' | 'admins' | 'members' | 'requests' | 'announcements' | 'config'>('overview');
  const [congregationMembers, setCongregationMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMemberForFicha, setSelectedMemberForFicha] = useState<Member | null>(null);

  const loadMembersForCongregation = async (congId: number) => {
    try {
      setLoadingMembers(true);
      const res = await api.fetchMembers({ congregationId: String(congId) });
      setCongregationMembers(res);
    } catch (err: any) {
      console.error('Error al cargar miembros de filial:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Modo de visualización: Marco móvil o Vista fluida
  const [viewMode, setViewMode] = useState<'mobile' | 'fluid'>('fluid');

  // Búsqueda en explorador
  const [churchSearch, setChurchSearch] = useState('');

  // Datos del backend
  const [adminsList, setAdminsList] = useState<AdminWithWorkspace[]>([]);
  const [congregationsList, setCongregationsList] = useState<Congregation[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [globalConfig, setGlobalConfig] = useState<GlobalServerConfig | null>(null);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [processingRegId, setProcessingRegId] = useState<string | null>(null);

  // Estados de Crear Aviso (Pantallas 05 y 06)
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);
  const [noticeStep, setNoticeStep] = useState<'form' | 'preview'>('form');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeScope, setNoticeScope] = useState<'global' | 'congregation'>('global');
  const [noticeCongregationId, setNoticeCongregationId] = useState<string>('');
  const [submittingNotice, setSubmittingNotice] = useState(false);

  // Estados de Crear Administrador (Pantallas 08, 09 y PDF de Credenciales)
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminStep, setAdminStep] = useState<'form' | 'permissions' | 'created'>('form');
  const [createdCredentialPayload, setCreatedCredentialPayload] =
    useState<AccessCredentialPdfPayload | null>(null);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [copiedNewAdminPassword, setCopiedNewAdminPassword] = useState(false);
  const [newAdminRole, setNewAdminRole] = useState<'local_pastor' | 'pastor_advisor' | 'secretary'>('local_pastor');
  const [newAdminCongId, setNewAdminCongId] = useState<string>('');
  const [newAdminCity, setNewAdminCity] = useState('');
  const [newAdminWorkspaceName, setNewAdminWorkspaceName] = useState('');
  const [assignedFeatures, setAssignedFeatures] = useState<string[]>(['expedientes']);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'member_management',
    'activity_audit',
    'workspace_customization',
  ]);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  // Cargar datos del servidor
  const loadData = async () => {
    try {
      setLoading(true);
      const [admins, config, registrations, announcements, congs] = await Promise.all([
        api.fetchRootAdmins(),
        api.fetchGlobalConfig(),
        api.fetchPendingRegistrations(),
        api.fetchAnnouncements(),
        api.fetchCongregations(),
      ]);
      setAdminsList(admins);
      setGlobalConfig(config);
      setPendingRegistrations(registrations);
      setAnnouncementsList(announcements);
      setCongregationsList(congs);
      if (congs.length > 0 && !newAdminCongId) {
        setNewAdminCongId(String(congs[0].id));
      }
    } catch (err: any) {
      setStatusMessage(`Error de comunicación: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Alternar función para un admin
  const toggleFeature = async (adminId: string | number, featureCode: string, currentFeatures: string[]) => {
    const idStr = String(adminId);
    const updated = currentFeatures.includes(featureCode)
      ? currentFeatures.filter((f) => f !== featureCode)
      : [...currentFeatures, featureCode];

    try {
      await api.updateAdminFeatures(idStr, updated);
      setAdminsList((prev) =>
        prev.map((item) => {
          if (String(item.admin.id) === idStr && item.workspace) {
            return {
              ...item,
              workspace: {
                ...item.workspace,
                enabledFeatures: updated,
              },
            };
          }
          return item;
        })
      );
      setStatusMessage(`Permisos actualizados silenciosamente.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  // Aceptar registro
  const handleApproveRegistrationRoot = async (id: string | number) => {
    try {
      const idStr = String(id);
      setProcessingRegId(idStr);
      const res = await api.approveRegistration(idStr);
      setStatusMessage(res.message);
      setTimeout(() => setStatusMessage(null), 4000);
      const [updatedRegs, updatedAdmins] = await Promise.all([
        api.fetchPendingRegistrations(),
        api.fetchRootAdmins(),
      ]);
      setPendingRegistrations(updatedRegs);
      setAdminsList(updatedAdmins);
    } catch (err: any) {
      setStatusMessage(`Error al aceptar: ${err.message}`);
    } finally {
      setProcessingRegId(null);
    }
  };

  // Rechazar registro
  const handleRejectRegistrationRoot = async (id: string | number, name: string) => {
    if (!confirm(`¿Descartar centralmente la solicitud de ${name}?`)) return;
    try {
      const idStr = String(id);
      setProcessingRegId(idStr);
      const res = await api.rejectRegistration(idStr);
      setStatusMessage(res.message);
      setTimeout(() => setStatusMessage(null), 4000);
      const updatedRegs = await api.fetchPendingRegistrations();
      setPendingRegistrations(updatedRegs);
    } catch (err: any) {
      setStatusMessage(`Error al descartar: ${err.message}`);
    } finally {
      setProcessingRegId(null);
    }
  };

  // Purgar trazas
  const handlePurgeTraces = async () => {
    try {
      const res = await api.purgeTraces();
      setStatusMessage(`${res.message} (Hora: ${res.purgedAt})`);
      if (globalConfig) {
        setGlobalConfig({ ...globalConfig, lastPurgedAt: res.purgedAt });
      }
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error en purga: ${err.message}`);
    }
  };

  // Actualizar config global
  const handleUpdateConfig = async (key: keyof GlobalServerConfig, value: any) => {
    if (!globalConfig) return;
    try {
      const res = await api.updateGlobalConfig({ [key]: value });
      setGlobalConfig(res.globalConfig);
      setStatusMessage(`Parámetro interno actualizado.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  // Crear comunicado oficial
  const handleConfirmPublishNotice = async () => {
    if (!noticeTitle || !noticeContent) return;
    setSubmittingNotice(true);
    try {
      await api.createAnnouncement({
        title: noticeTitle,
        content: noticeContent,
        targetScope: noticeScope,
        congregationId: noticeScope === 'global' ? undefined : (noticeCongregationId ? Number(noticeCongregationId) : undefined),
        authorName: 'Suporte do Sistema',
      });
      setIsCreatingNotice(false);
      setNoticeStep('form');
      setNoticeTitle('');
      setNoticeContent('');
      const updated = await api.fetchAnnouncements();
      setAnnouncementsList(updated);
      setStatusMessage('Aviso oficial publicado com sucesso.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Erro ao publicar: ${err.message}`);
    } finally {
      setSubmittingNotice(false);
    }
  };

  // Crear administrador
  const handleConfirmCreateAdmin = async () => {
    const isNewCity = newAdminCongId === 'new_city';
    if (isNewCity && !newAdminCity) {
      alert('Informe a cidade da nova filial.');
      return;
    }
    setSubmittingAdmin(true);
    try {
      const selectedCong = congregationsList.find((c) => String(c.id) === String(newAdminCongId));
      const churchDisplayName = isNewCity
        ? newAdminWorkspaceName || `AD Madureira — Sede ${newAdminCity}`
        : selectedCong?.name || newAdminWorkspaceName || 'Iglesia / Sede AD Madureira';

      const res = await api.createRootAdmin({
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        role: newAdminRole,
        congregationId: isNewCity ? undefined : (selectedCong ? selectedCong.id : undefined),
        assignedFeature: newAdminRole === 'pastor_advisor' ? assignedFeatures.join(',') : undefined,
        city: isNewCity ? newAdminCity : (selectedCong?.city || newAdminCity),
        workspaceName: churchDisplayName,
        enabledFeatures: selectedFeatures,
      });

      const enabledModuleNames = AVAILABLE_FEATURES.filter((f) =>
        selectedFeatures.includes(f.code)
      ).map((f) => f.name);

      const credentialPayload: AccessCredentialPdfPayload = {
        fullName: newAdminName.trim(),
        email: res?.admin?.email || newAdminEmail.trim().toLowerCase(),
        tempPassword: newAdminPassword,
        role: newAdminRole,
        churchName: churchDisplayName,
        accessUrl: typeof window !== 'undefined' ? window.location.origin : '',
        assignedFeatures: [...assignedFeatures],
        enabledModuleNames,
        issuerName: currentUser?.name || 'Administración General',
        issuerTitle: 'Presidencia / Administración General',
      };

      setCreatedCredentialPayload(credentialPayload);
      setAdminStep('created');
      generateAccessCredentialPdf(credentialPayload).catch(() => {});

      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setShowNewAdminPassword(false);
      setCopiedNewAdminPassword(false);
      setNewAdminRole('local_pastor');
      setAssignedFeatures(['expedientes']);
      await loadData();
      setStatusMessage('Administrador aprovisionado y PDF de credenciales generado.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Erro ao aprovisionar: ${err.message}`);
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // Filtrado de iglesias
  const filteredCongregations = congregationsList.filter((cong) => {
    if (!churchSearch) return true;
    const q = churchSearch.toLowerCase();
    return (
      cong.name.toLowerCase().includes(q) ||
      cong.city.toLowerCase().includes(q) ||
      String(cong.id).includes(q)
    );
  });

  return (
    <div className="w-full flex-1 bg-transparent text-white flex flex-col items-center py-4 sm:py-6 px-3 sm:px-6">
      {/* Control Superior Oculto */}
      <div className="hidden" aria-hidden="true">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] font-mono tracking-wider uppercase text-neutral-400">
            SUPERVISÃO ROOT · TERMINAL MASTER
          </span>
        </div>
      </div>

      {/* Contenedor Principal (Fundido completamente con el fondo) */}
      <div
        className={`w-full transition-all duration-300 ${
          viewMode === 'mobile'
            ? 'max-w-[430px] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden bg-black/80 backdrop-blur-2xl relative'
            : 'max-w-4xl bg-transparent border-0 shadow-none overflow-hidden'
        }`}
      >
        {/* Barra de Estado Estilo iOS (Visível em Vista Móvel) */}
        {viewMode === 'mobile' && (
          <div className="pt-3 px-7 pb-2 flex items-center justify-between text-[13px] font-semibold tracking-tight text-white/90 select-none">
            <span>9:41</span>
            <div className="w-28 h-4 bg-black rounded-full" />
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-mono">5G</span>
              <div className="w-5 h-2.5 border border-white/80 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-full bg-white rounded-2xs" />
              </div>
            </div>
          </div>
        )}

        {/* Notificación de Estado Flotante */}
        {statusMessage && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-[#1C1C1E] border border-white/15 text-[13px] text-neutral-200 flex items-center justify-between gap-2 shadow-lg animate-fade-in z-20">
            <span className="font-mono text-[12px]">{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-neutral-400 hover:text-white text-xs cursor-pointer px-1.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------
            CONTENIDO DINÁMICO SEGÚN PESTAÑA O VISTA INTERIOR DE CARPETA
            ------------------------------------------------------------- */}

        {/* CASO A: VISTA INTERIOR DE UNA IGLESIA (Pantalla 02: PASTA DA IGREJA) */}
        {selectedCongregation ? (
          <div className="p-5 sm:p-7 space-y-6">
            {/* Header com botão voltar e badge ROOT */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedCongregation(null);
                  setCongregationSection('overview');
                }}
                className="flex items-center gap-1.5 text-[14px] font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{selectedCongregation.name}</span>
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[11px] font-mono font-semibold tracking-wider text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>ROOT</span>
              </div>
            </div>

            {/* Breadcrumb Terminal */}
            <div className="font-mono text-[12px] text-neutral-500 tracking-wide flex items-center gap-1.5">
              <span>root</span>
              <span>/</span>
              <span>igrejas</span>
              <span>/</span>
              <span className="text-neutral-300">{selectedCongregation.city.toLowerCase()}</span>
            </div>

            {/* Banner da Pasta com Ícone Grande */}
            <div className="space-y-3">
              <FolderGraphicIcon className="w-16 h-14" />
              <div>
                <h1 className="text-[26px] font-bold tracking-tight text-white">
                  {selectedCongregation.name}
                </h1>
                <p className="text-[13px] text-neutral-400 mt-0.5">
                  Sede {String(selectedCongregation.id).padStart(2, '0')} · {selectedCongregation.city}
                  <span className="block text-neutral-500 text-[12px] mt-0.5">
                    Administração, ministros e informações canônicas da filial.
                  </span>
                </p>
              </div>
            </div>

            {/* Seletor de Sub-Pastas da Igreja */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                <span>PASTAS E ACESSOS</span>
                <span>SEDE {String(selectedCongregation.id).padStart(2, '0')}</span>
              </div>

              <div className="bg-[#121214] border border-white/10 rounded-2xl divide-y divide-white/[0.06] overflow-hidden">
                {/* 1. Administradores da sede */}
                <button
                  onClick={() => setCongregationSection(congregationSection === 'admins' ? 'overview' : 'admins')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-300">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">Administradores</div>
                      <div className="text-[12px] text-neutral-400">Usuários e permissões da sede</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${congregationSection === 'admins' ? 'rotate-90' : ''}`} />
                </button>

                {congregationSection === 'admins' && (
                  <div className="p-4 bg-black/40 space-y-3 border-t border-white/[0.06]">
                    {adminsList
                      .filter((a) => String(a.admin.congregationId) === String(selectedCongregation.id))
                      .map(({ admin }) => (
                        <div
                          key={admin.id}
                          onClick={() => onStartPreview(String(admin.id))}
                          className="p-3.5 bg-[#18181A] rounded-xl border border-white/10 hover:border-amber-400/40 hover:bg-[#202024] flex items-center justify-between cursor-pointer group transition-all"
                          title="Abrir vista previa fantasma de este administrador"
                        >
                          <div>
                            <div className="text-[13px] font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                              <span>{admin.name}</span>
                              <Eye className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <div className="text-[11px] font-mono text-neutral-400">{admin.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {admin.role === 'pastor_advisor' ? 'ASESOR' : admin.role === 'secretary' ? 'SECRETÁRIO' : 'TITULAR'}
                            </span>
                            <span className="text-[11px] font-medium text-neutral-400 group-hover:text-white flex items-center gap-1 bg-white/[0.06] group-hover:bg-amber-400/20 group-hover:text-amber-300 px-2 py-1 rounded-lg transition-colors">
                              <span>Abrir Painel</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    <button
                      onClick={() => {
                        setNewAdminCongId(String(selectedCongregation.id));
                        setIsCreatingAdmin(true);
                      }}
                      className="w-full py-2.5 text-[12px] font-semibold text-neutral-200 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Convidar novo administrador para esta sede</span>
                    </button>
                  </div>
                )}

                {/* 2. Membros da sede */}
                <button
                  onClick={() => {
                    const next = congregationSection === 'members' ? 'overview' : 'members';
                    setCongregationSection(next);
                    if (next === 'members') {
                      loadMembersForCongregation(selectedCongregation.id);
                    }
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-300">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">Membros da sede</div>
                      <div className="text-[12px] text-neutral-400">Expedientes e membros cadastrados</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {congregationMembers.length > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 border border-white/10">
                        {congregationMembers.length}
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${congregationSection === 'members' ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {congregationSection === 'members' && (
                  <div className="p-4 bg-black/40 space-y-3 border-t border-white/[0.06]">
                    {loadingMembers ? (
                      <div className="text-center py-4 text-[12px] text-neutral-500 font-mono">
                        Carregando membros da filial...
                      </div>
                    ) : congregationMembers.length === 0 ? (
                      <div className="text-center py-4 text-[12px] text-neutral-500">
                        Nenhum membro cadastrado nesta sede ainda.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {congregationMembers.map((member) => (
                          <div
                            key={member.id}
                            onClick={() => setSelectedMemberForFicha(member)}
                            className="p-3 bg-[#18181A] rounded-xl border border-white/10 hover:border-amber-400/40 hover:bg-[#202024] flex items-center justify-between cursor-pointer group transition-all"
                            title="Ver ficha canônica oficial do membro"
                          >
                            <div>
                              <div className="text-[13px] font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                                <span>{member.firstName} {member.lastName}</span>
                                <Eye className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                              </div>
                              <div className="text-[11px] font-mono text-neutral-400">
                                {member.memberNumber || `EXP-${String(member.id).padStart(4, '0')}`} · {member.departmentName || 'Clero / Geral'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                                member.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {member.status === 'active' ? 'ATIVO' : member.status}
                              </span>
                              <span className="text-[11px] font-medium text-neutral-400 group-hover:text-white flex items-center gap-1 bg-white/[0.06] group-hover:bg-amber-400/20 group-hover:text-amber-300 px-2 py-1 rounded-lg transition-colors">
                                <span>Ver Ficha</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Solicitações da sede */}
                <button
                  onClick={() => setCongregationSection(congregationSection === 'requests' ? 'overview' : 'requests')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-300">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">Solicitações</div>
                      <div className="text-[12px] text-neutral-400">Registros em análise</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingRegistrations.filter(r => r.city.toLowerCase() === selectedCongregation.city.toLowerCase()).length > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {pendingRegistrations.filter(r => r.city.toLowerCase() === selectedCongregation.city.toLowerCase()).length}
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${congregationSection === 'requests' ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {congregationSection === 'requests' && (
                  <div className="p-4 bg-black/40 space-y-3 border-t border-white/[0.06]">
                    {pendingRegistrations.filter(r => r.city.toLowerCase() === selectedCongregation.city.toLowerCase()).length === 0 ? (
                      <div className="text-center py-4 text-[12px] text-neutral-500">
                        Sem solicitações pendentes para esta sede.
                      </div>
                    ) : (
                      pendingRegistrations
                        .filter(r => r.city.toLowerCase() === selectedCongregation.city.toLowerCase())
                        .map((reg) => (
                          <div key={reg.id} className="p-3 bg-[#18181A] rounded-xl border border-white/10 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[13px] font-semibold text-white">{reg.name}</div>
                              <div className="text-[11px] text-neutral-400">{reg.email}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleApproveRegistrationRoot(reg.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white text-black hover:bg-neutral-200 cursor-pointer"
                              >
                                Aprovar
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {/* 3. Comunicados da sede */}
                <button
                  onClick={() => setCongregationSection(congregationSection === 'announcements' ? 'overview' : 'announcements')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-300">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">Comunicados</div>
                      <div className="text-[12px] text-neutral-400">Avisos publicados para a sede</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${congregationSection === 'announcements' ? 'rotate-90' : ''}`} />
                </button>

                {congregationSection === 'announcements' && (
                  <div className="p-4 bg-black/40 space-y-3 border-t border-white/[0.06]">
                    {announcementsList.filter(a => a.congregationId === selectedCongregation.id || a.targetScope === 'global').length === 0 ? (
                      <div className="text-center py-4 text-[12px] text-neutral-500">
                        Nenhum comunicado ativo para esta sede.
                      </div>
                    ) : (
                      announcementsList
                        .filter(a => a.congregationId === selectedCongregation.id || a.targetScope === 'global')
                        .map((ann) => (
                          <div key={ann.id} className="p-3 bg-[#18181A] rounded-xl border border-white/10 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-bold text-white">{ann.title}</span>
                              <span className="text-[10px] font-mono text-neutral-500">
                                {ann.targetScope === 'global' ? 'GLOBAL' : 'SEDE'}
                              </span>
                            </div>
                            <p className="text-[12px] text-neutral-300 line-clamp-2">{ann.content}</p>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {/* 4. Configurações e Módulos da Igreja */}
                <button
                  onClick={() => setCongregationSection(congregationSection === 'config' ? 'overview' : 'config')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-300">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">Configurações</div>
                      <div className="text-[12px] text-neutral-400">Informações e módulos da igreja</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${congregationSection === 'config' ? 'rotate-90' : ''}`} />
                </button>

                {congregationSection === 'config' && (
                  <div className="p-4 bg-black/40 space-y-3 border-t border-white/[0.06]">
                    <div className="text-[11px] font-mono uppercase text-neutral-400">
                      Módulos Habilitados para a Sede:
                    </div>
                    {(() => {
                      const adminMatch = adminsList.find((a) => String(a.admin.congregationId) === String(selectedCongregation.id));
                      const currentFeatures = adminMatch?.workspace?.enabledFeatures || [];
                      return (
                        <div className="space-y-2">
                          {AVAILABLE_FEATURES.map((feat) => {
                            const isEnabled = currentFeatures.includes(feat.code);
                            return (
                              <div
                                key={feat.code}
                                onClick={() => {
                                  if (adminMatch) {
                                    toggleFeature(adminMatch.admin.id, feat.code, currentFeatures);
                                  }
                                }}
                                className="p-3 bg-[#18181A] rounded-xl border border-white/10 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all"
                              >
                                <div>
                                  <div className="text-[13px] font-semibold text-white">{feat.name}</div>
                                  <div className="text-[11px] text-neutral-400">{feat.description}</div>
                                </div>
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    isEnabled
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-white/[0.06] text-neutral-500'
                                  }`}
                                >
                                  {isEnabled ? 'ATIVO' : 'INATIVO'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Snippet Terminal Estilo Maqueta (Screen 02) */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                ACESSO
              </div>
              <div className="bg-[#121214] border border-white/10 rounded-2xl p-4 font-mono text-[12px] text-neutral-300 space-y-1">
                <div className="text-white flex items-center gap-1.5">
                  <span className="text-neutral-500">root@adm:~$</span>
                  <span className="text-emerald-400 font-semibold">open igreja</span>
                </div>
                <div className="text-neutral-500 text-[11px]">&gt; acesso sujeito a permissões</div>
                <div className="text-neutral-500 text-[11px]">&gt; ações registradas para auditoria</div>
              </div>

              {/* Botão de Vista Previa / Simulação */}
              {(() => {
                const adminMatch = adminsList.find((a) => String(a.admin.congregationId) === String(selectedCongregation.id));
                return (
                  <button
                    onClick={() => {
                      if (adminMatch) {
                        onStartPreview(String(adminMatch.admin.id));
                      } else {
                        alert('Nenhum administrador titular configurado para esta sede.');
                      }
                    }}
                    className="w-full mt-3 py-3.5 px-4 bg-white text-black hover:bg-neutral-200 rounded-2xl font-semibold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Inspecionar Filial em Modo Simulado</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                );
              })()}
            </div>
          </div>
        ) : activeTab === 'igrejas' ? (
          /* -------------------------------------------------------------
              TELA 01: EXPLORADOR DE IGREJAS (TELA INICIAL ROOT)
              ------------------------------------------------------------- */
          <div className="p-5 sm:p-7 space-y-6">
            {/* Header com ADM MADUREIRA e Badge ● ROOT */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreatingAdmin(true)}
                  className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
                  title="Aprovisionar Administrador"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="text-[14px] font-bold tracking-tight text-white uppercase">
                  ADM MADUREIRA
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[11px] font-mono font-semibold tracking-wider text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>ROOT</span>
              </div>
            </div>

            {/* Breadcrumb Terminal */}
            <div className="font-mono text-[12px] text-neutral-500 tracking-wide flex items-center gap-1.5">
              <span>root</span>
              <span>/</span>
              <span>igrejas</span>
              <span>/</span>
              <span className="text-neutral-300">visão geral</span>
            </div>

            {/* Título Principal de Impacto */}
            <div className="space-y-1">
              <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-white leading-tight">
                Suas igrejas,
                <br />
                em um só lugar.
              </h1>
              <p className="text-[13px] text-neutral-400">
                Selecione uma pasta para administrar sua sede.
              </p>
            </div>

            {/* Barra de Pesquisa de Pastas */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={churchSearch}
                onChange={(e) => setChurchSearch(e.target.value)}
                placeholder="Buscar igreja..."
                className="w-full bg-[#141416] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all font-sans"
              />
              {churchSearch && (
                <button
                  onClick={() => setChurchSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Grade de Pastas das Igrejas (PASTAS DAS IGREJAS) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                <span>PASTAS DAS IGREJAS</span>
                <span>{String(filteredCongregations.length).padStart(2, '0')} PASTAS</span>
              </div>

              {filteredCongregations.length === 0 ? (
                <div className="p-8 text-center bg-[#121214] border border-white/10 rounded-2xl text-[13px] text-neutral-500">
                  Nenhuma sede encontrada para "{churchSearch}".
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  {filteredCongregations.map((cong, idx) => (
                    <button
                      key={cong.id}
                      onClick={() => {
                        setSelectedCongregation(cong);
                        setCongregationSection('overview');
                        loadMembersForCongregation(cong.id);
                      }}
                      className="bg-transparent border-0 shadow-none p-2.5 text-left space-y-2.5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer group flex flex-col items-start"
                    >
                      <FolderGraphicIcon className="w-20 h-16 transition-transform group-hover:scale-105 drop-shadow-md" />
                      <div className="space-y-0.5">
                        <div className="text-[15px] font-bold text-white tracking-tight leading-snug">
                          {cong.city}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                          SEDE {String(cong.id).padStart(2, '0')} {idx === 0 ? '· PRINCIPAL' : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fila de Trabalho (FILA DE TRABALHO) */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                FILA DE TRABALHO
              </div>

              <div className="space-y-2.5">
                {/* 1. Aprovação de Registros */}
                <button
                  onClick={() => setActiveTab('registros')}
                  className="w-full p-4 bg-[#121214] border border-white/10 hover:border-white/20 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-300">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">Aprovação de registros</div>
                      <div className="text-[12px] text-neutral-400">Solicitações aguardando análise</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 border border-white/10">
                      {String(pendingRegistrations.length).padStart(2, '0')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </div>
                </button>

                {/* 2. Avisos de Suporte */}
                <button
                  onClick={() => setActiveTab('avisos')}
                  className="w-full p-4 bg-[#121214] border border-white/10 hover:border-white/20 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-300">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">Avisos de suporte</div>
                      <div className="text-[12px] text-neutral-400">Comunicados institucionais</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'registros' ? (
          /* -------------------------------------------------------------
              TELA: APROVAÇÃO DE REGISTROS (FILA CENTRAL)
              ------------------------------------------------------------- */
          <div className="p-5 sm:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab('igrejas')}
                className="flex items-center gap-1.5 text-[14px] font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Registros</span>
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[11px] font-mono font-semibold tracking-wider text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>ROOT</span>
              </div>
            </div>

            <div className="font-mono text-[12px] text-neutral-500 tracking-wide flex items-center gap-1.5">
              <span>root</span>
              <span>/</span>
              <span>sistema</span>
              <span>/</span>
              <span className="text-neutral-300">registros</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-[26px] font-bold tracking-tight text-white">
                Fila de aprovação.
              </h1>
              <p className="text-[13px] text-neutral-400">
                Validação sigilosa de novos membros e credenciais solicitadas.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                <span>SOLICITAÇÕES PENDENTES</span>
                <span>{String(pendingRegistrations.length).padStart(2, '0')} FILA</span>
              </div>

              {pendingRegistrations.length === 0 ? (
                <div className="p-10 text-center bg-[#121214] border border-white/10 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-[14px] font-semibold text-white">Fila limpa</div>
                  <p className="text-[12px] text-neutral-400">
                    Todas as solicitações de filiais foram processadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 bg-[#121214] border border-white/10 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[14px] font-bold text-white">{reg.name}</div>
                          <div className="text-[11px] font-mono text-neutral-400">{reg.email}</div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {reg.city}
                        </span>
                      </div>

                      <div className="text-[12px] text-neutral-400 flex items-center gap-2">
                        <span>Filial: {reg.churchName}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                        <button
                          disabled={processingRegId === reg.id}
                          onClick={() => handleApproveRegistrationRoot(reg.id)}
                          className="flex-1 py-2 text-[12px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {processingRegId === reg.id ? 'Aprovando...' : 'Aprovar Registro'}
                        </button>
                        <button
                          disabled={processingRegId === reg.id}
                          onClick={() => handleRejectRegistrationRoot(reg.id, reg.name)}
                          className="px-3 py-2 text-[12px] font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'avisos' ? (
          /* -------------------------------------------------------------
              TELA 04, 05, 06: AVISOS DE SUPORTE
              ------------------------------------------------------------- */
          <div className="p-5 sm:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (isCreatingNotice) {
                    setIsCreatingNotice(false);
                    setNoticeStep('form');
                  } else {
                    setActiveTab('igrejas');
                  }
                }}
                className="flex items-center gap-1.5 text-[14px] font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isCreatingNotice ? 'Voltar' : 'Avisos de suporte'}</span>
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[11px] font-mono font-semibold tracking-wider text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>ROOT</span>
              </div>
            </div>

            {/* Se está no fluxo de criação de aviso (Pantallas 05 e 06) */}
            {isCreatingNotice ? (
              noticeStep === 'form' ? (
                /* Tela 05: Escreva seu comunicado */
                <div className="space-y-5 animate-fade-in">
                  <div className="font-mono text-[12px] text-neutral-500 tracking-wide flex items-center gap-1.5">
                    <span>root</span>
                    <span>/</span>
                    <span>avisos</span>
                    <span>/</span>
                    <span className="text-neutral-300">novo</span>
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-[26px] font-bold tracking-tight text-white">
                      Escreva seu comunicado.
                    </h1>
                    <p className="text-[13px] text-neutral-400">
                      Defina o conteúdo e quem deverá recebê-lo.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                        TÍTULO
                      </label>
                      <input
                        type="text"
                        value={noticeTitle}
                        onChange={(e) => setNoticeTitle(e.target.value)}
                        placeholder="Ex.: Aviso importante para as sedes"
                        className="w-full bg-[#121214] border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                        MENSAGEM
                      </label>
                      <textarea
                        rows={4}
                        value={noticeContent}
                        onChange={(e) => setNoticeContent(e.target.value)}
                        placeholder="Escreva o comunicado oficial..."
                        className="w-full bg-[#121214] border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                        DESTINATÁRIOS
                      </label>
                      <select
                        value={noticeScope}
                        onChange={(e) => setNoticeScope(e.target.value as any)}
                        className="w-full bg-[#121214] border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/30 cursor-pointer"
                      >
                        <option value="global">Todas as igrejas</option>
                        <option value="congregation">Filial específica</option>
                      </select>
                    </div>

                    {noticeScope === 'congregation' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                          SELECIONE A SEDE
                        </label>
                        <select
                          value={noticeCongregationId}
                          onChange={(e) => setNoticeCongregationId(e.target.value)}
                          className="w-full bg-[#121214] border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/30 cursor-pointer"
                        >
                          <option value="">Selecione uma filial...</option>
                          {congregationsList.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.city} — {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                        REMETENTE PÚBLICO
                      </label>
                      <div className="w-full bg-[#121214] border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-neutral-300 font-medium">
                        Suporte do Sistema
                      </div>
                    </div>

                    <button
                      disabled={!noticeTitle || !noticeContent}
                      onClick={() => setNoticeStep('preview')}
                      className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 rounded-2xl font-semibold text-[14px] transition-all disabled:opacity-40 cursor-pointer shadow-md mt-2"
                    >
                      Revisar aviso
                    </button>

                    <p className="text-[11px] text-neutral-500 text-center">
                      O autor responsável e a publicação ficam registrados na auditoria sigilosa.
                    </p>
                  </div>
                </div>
              ) : (
                /* Tela 06: Tudo pronto para publicar? (Revisar aviso) */
                <div className="space-y-5 animate-fade-in">
                  <div className="font-mono text-[12px] text-neutral-500 tracking-wide flex items-center gap-1.5">
                    <span>root</span>
                    <span>/</span>
                    <span>avisos</span>
                    <span>/</span>
                    <span className="text-neutral-300">revisar</span>
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-[26px] font-bold tracking-tight text-white">
                      Tudo pronto
                      <br />
                      para publicar?
                    </h1>
                    <p className="text-[13px] text-neutral-400">
                      Confira o texto, o remetente e o alcance.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                      PRÉ-VISUALIZAÇÃO
                    </div>

                    <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 border border-white/10">
                          {noticeScope === 'global' ? 'GLOBAL / TODAS AS SEDES' : 'FILIAL ESPECÍFICA'}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400">RASCUNHO</span>
                      </div>

                      <div className="text-[16px] font-bold text-white">{noticeTitle}</div>
                      <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
                        {noticeContent}
                      </p>

                      <div className="text-[11px] text-neutral-500 pt-2 border-t border-white/[0.06]">
                        Remetente: <span className="text-neutral-300">Suporte do Sistema</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                        DESTINATÁRIOS
                      </div>
                      <div className="p-3.5 bg-[#121214] border border-white/10 rounded-2xl flex items-center gap-3">
                        <Folder className="w-4 h-4 text-neutral-400" />
                        <div>
                          <div className="text-[13px] font-semibold text-white">
                            {noticeScope === 'global' ? 'Todas as Igrejas' : 'Sede Selecionada'}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {congregationsList.length} sedes cadastradas
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3">
                      <button
                        disabled={submittingNotice}
                        onClick={handleConfirmPublishNotice}
                        className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 rounded-2xl font-semibold text-[14px] transition-all disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {submittingNotice ? 'Publicando...' : 'Confirmar e publicar'}
                      </button>
                      <button
                        onClick={() => setNoticeStep('form')}
                        className="w-full py-3 bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 rounded-2xl font-medium text-[13px] transition-all cursor-pointer"
                      >
                        Voltar e editar
                      </button>
                    </div>

                    <p className="text-[11px] text-neutral-500 text-center">
                      A publicação fica registrada, incluindo o responsável.
                    </p>
                  </div>
                </div>
              )
            ) : (
              /* Tela 04: Lista de Avisos de Suporte */
              <div className="space-y-5">
                <div className="font-mono text-[12px] text-neutral-500 tracking-wide flex items-center gap-1.5">
                  <span>root</span>
                  <span>/</span>
                  <span>sistema</span>
                  <span>/</span>
                  <span className="text-neutral-300">avisos</span>
                </div>

                <div className="space-y-1">
                  <h1 className="text-[26px] font-bold tracking-tight text-white">
                    Comunicados,
                    <br />
                    com clareza.
                  </h1>
                  <p className="text-[13px] text-neutral-400">
                    Envie avisos institucionais para todas as igrejas ou para uma sede específica.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsCreatingNotice(true);
                    setNoticeStep('form');
                  }}
                  className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 rounded-2xl font-semibold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Emitir aviso de suporte</span>
                </button>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                    <span>AVISOS PUBLICADOS</span>
                    <span>{String(announcementsList.length).padStart(2, '0')} AVISOS</span>
                  </div>

                  {announcementsList.length === 0 ? (
                    <div className="p-8 text-center bg-[#121214] border border-white/10 rounded-2xl text-[13px] text-neutral-500">
                      Nenhum comunicado ativo.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {announcementsList.map((ann) => (
                        <div
                          key={ann.id}
                          className="p-4 bg-[#121214] border border-white/10 rounded-2xl space-y-2 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 border border-white/10 uppercase">
                              {ann.targetScope === 'global' ? 'GLOBAL / TODAS AS SEDES' : `FILIAL / SEDE ${ann.congregationId || 1}`}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">EXEMPLO</span>
                          </div>

                          <div className="text-[14px] font-bold text-white">{ann.title}</div>
                          <p className="text-[12px] text-neutral-400 line-clamp-2">{ann.content}</p>

                          <div className="text-[11px] text-neutral-500 pt-1">
                            Remetente: <span className="text-neutral-400">{ann.authorName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* -------------------------------------------------------------
              TELA 03: ATIVIDADE / AUDITORIA (TERMINAL SOMENTE LEITURA)
              ------------------------------------------------------------- */
          <div className="p-5 sm:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab('igrejas')}
                className="flex items-center gap-1.5 text-[14px] font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atividade</span>
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[11px] font-mono font-semibold tracking-wider text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>ROOT</span>
              </div>
            </div>

            <div className="font-mono text-[12px] text-neutral-500 tracking-wide flex items-center gap-1.5">
              <span>root</span>
              <span>/</span>
              <span>sistema</span>
              <span>/</span>
              <span className="text-neutral-300">auditoria</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-[26px] font-bold tracking-tight text-white">
                Transparência
                <br />
                no comando.
              </h1>
              <p className="text-[13px] text-neutral-400">
                Consulte a atividade administrativa e a fila de revisão.
              </p>
            </div>

            {/* Widget de Terminal Monospace Exato da Maqueta (Screen 03) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                <span>TERMINAL · SOMENTE LEITURA</span>
              </div>

              <div className="bg-[#0D0D0E] border border-white/15 rounded-2xl p-4 font-mono text-[12px] space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span>activity.log</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500">VISUALIZAÇÃO</span>
                </div>

                <div className="space-y-1 text-[11px] text-neutral-300">
                  <div>
                    <span className="text-neutral-500">[--:--:--]</span> <span className="text-sky-400 font-semibold">INFO</span> sistema pronto
                  </div>
                  <div>
                    <span className="text-neutral-500">[--:--:--]</span> <span className="text-amber-400 font-semibold">PEND</span> {pendingRegistrations.length} revisão(ões) pendente(s)
                  </div>
                  <div>
                    <span className="text-neutral-500">[--:--:--]</span> <span className="text-sky-400 font-semibold">INFO</span> {congregationsList.length} igrejas disponíveis
                  </div>
                  <div>
                    <span className="text-neutral-500">[--:--:--]</span> <span className="text-emerald-400 font-semibold">AUDIT</span> acesso root autorizado
                  </div>
                  <div className="pt-1 text-white flex items-center gap-1">
                    <span className="text-neutral-500">root@adm:~$</span>
                    <span className="inline-block w-2 h-3.5 bg-emerald-400 animate-pulse ml-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Acompanhamento */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                ACOMPANHAMENTO
              </div>

              <div className="space-y-2">
                <div
                  onClick={() => setActiveTab('registros')}
                  className="p-3.5 bg-[#121214] border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">Aprovação de registros</div>
                      <div className="text-[11px] text-neutral-400">
                        {pendingRegistrations.length} solicitação(ões) para análise
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300">
                    {String(pendingRegistrations.length).padStart(2, '0')}
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('avisos')}
                  className="p-3.5 bg-[#121214] border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] text-neutral-300 flex items-center justify-center">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">Avisos de suporte</div>
                      <div className="text-[11px] text-neutral-400">Comunicados institucionais</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>

                <div
                  onClick={() => {
                    if (globalConfig) {
                      handleUpdateConfig('stealthTelemetryActive', !globalConfig.stealthTelemetryActive);
                    }
                  }}
                  className="p-3.5 bg-[#121214] border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] text-neutral-300 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">Modo Fantasma</div>
                      <div className="text-[11px] text-neutral-400">Sem rastros visíveis em filiais</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    ATIVO
                  </span>
                </div>
              </div>

              {/* Botões de Ação de Auditoria */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handlePurgeTraces}
                  className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer shadow-md"
                >
                  Purgar trazas silenciosas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            BOTTOM TAB BAR / BARRA DE NAVEGAÇÃO INFERIOR
            Estilo exato da Maqueta (Igrejas, Registros, Avisos, Auditoria)
            ------------------------------------------------------------- */}
        <div className="border-t border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl px-4 py-3 flex items-center justify-around sticky bottom-0 z-30">
          {/* Aba 1: Igrejas */}
          <button
            onClick={() => {
              setSelectedCongregation(null);
              setIsCreatingNotice(false);
              setActiveTab('igrejas');
            }}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-3 ${
              activeTab === 'igrejas' && !selectedCongregation
                ? 'text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span className="text-[10px] font-medium tracking-tight">Igrejas</span>
          </button>

          {/* Aba 2: Registros */}
          <button
            onClick={() => {
              setSelectedCongregation(null);
              setIsCreatingNotice(false);
              setActiveTab('registros');
            }}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-3 relative ${
              activeTab === 'registros'
                ? 'text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <div className="relative">
              <CheckCircle2 className="w-4 h-4" />
              {pendingRegistrations.length > 0 && (
                <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight">Registros</span>
          </button>

          {/* Aba 3: Avisos */}
          <button
            onClick={() => {
              setSelectedCongregation(null);
              setActiveTab('avisos');
            }}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-3 ${
              activeTab === 'avisos'
                ? 'text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span className="text-[10px] font-medium tracking-tight">Avisos</span>
          </button>

          {/* Aba 4: Auditoria */}
          <button
            onClick={() => {
              setSelectedCongregation(null);
              setIsCreatingNotice(false);
              setActiveTab('auditoria');
            }}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-3 ${
              activeTab === 'auditoria'
                ? 'text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-medium tracking-tight">Auditoria</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODAL: APROVISIONAR NOVO ADMINISTRADOR (PANTALLAS 08 E 09)
          ------------------------------------------------------------- */}
      {isCreatingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full ${adminStep === 'created' ? 'max-w-xl' : 'max-w-md'} bg-[#121214] border border-white/15 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl my-8`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-mono text-neutral-400">root / administradores</span>
              </div>
              <button
                onClick={() => {
                  setIsCreatingAdmin(false);
                  setAdminStep('form');
                  setCreatedCredentialPayload(null);
                }}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {adminStep === 'form' ? (
              /* Tela 08: Convide um administrador */
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-[22px] font-bold tracking-tight text-white">
                    Convide um
                    <br />
                    administrador.
                  </h3>
                  <p className="text-[12px] text-neutral-400">
                    Informe os dados básicos e a igreja responsável.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-400">
                      NOME COMPLETO
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Digite o nome do administrador"
                      className="w-full bg-[#18181A] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-400">
                      CORREIO ELETRÔNICO
                    </label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="nome@exemplo.com"
                      className="w-full bg-[#18181A] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-mono uppercase text-neutral-400">
                        SENHA INICIAL
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
                          const lower = 'abcdefghijkmnopqrstuvwxyz';
                          const digits = '23456789';
                          const symbols = '@#$%&*!';
                          const all = upper + lower + digits + symbols;
                          const pick = (pool: string) => {
                            const buf = new Uint32Array(1);
                            crypto.getRandomValues(buf);
                            return pool[buf[0] % pool.length];
                          };
                          const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
                          for (let i = 0; i < 8; i++) chars.push(pick(all));
                          for (let i = chars.length - 1; i > 0; i--) {
                            const buf = new Uint32Array(1);
                            crypto.getRandomValues(buf);
                            const j = buf[0] % (i + 1);
                            [chars[i], chars[j]] = [chars[j], chars[i]];
                          }
                          setNewAdminPassword(chars.join(''));
                          setShowNewAdminPassword(true);
                          setCopiedNewAdminPassword(false);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white transition-all cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Generar contraseña</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewAdminPassword ? 'text' : 'password'}
                        required
                        value={newAdminPassword}
                        onChange={(e) => {
                          setNewAdminPassword(e.target.value);
                          setCopiedNewAdminPassword(false);
                        }}
                        placeholder="••••••••••••"
                        className="w-full bg-[#18181A] border border-white/10 rounded-xl pl-3.5 pr-16 py-2.5 text-[13px] font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {newAdminPassword && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(newAdminPassword).catch(() => {});
                              setCopiedNewAdminPassword(true);
                              setTimeout(() => setCopiedNewAdminPassword(false), 1800);
                            }}
                            title="Copiar contraseña"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            {copiedNewAdminPassword ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowNewAdminPassword((prev) => !prev)}
                          title={showNewAdminPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          {showNewAdminPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-400">
                      IGREJA / SEDE
                    </label>
                    <select
                      value={newAdminCongId}
                      onChange={(e) => setNewAdminCongId(e.target.value)}
                      className="w-full bg-[#18181A] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-white/30 cursor-pointer"
                    >
                      {congregationsList.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.city} — {c.name}
                        </option>
                      ))}
                      <option value="new_city">[+] Cadastrar nova cidade/filial...</option>
                    </select>
                  </div>

                  {newAdminCongId === 'new_city' && (
                    <div className="space-y-2 p-3 bg-white/[0.04] rounded-xl border border-white/10">
                      <input
                        type="text"
                        placeholder="Nome da Cidade (ex: Sevilha, Valência)"
                        value={newAdminCity}
                        onChange={(e) => {
                          setNewAdminCity(e.target.value);
                          setNewAdminWorkspaceName(`AD Madureira — Sede ${e.target.value}`);
                        }}
                        className="w-full bg-[#18181A] border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-400">
                      FUNÇÃO
                    </label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as any)}
                      className="w-full bg-[#18181A] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-white/30 cursor-pointer"
                    >
                      <option value="local_pastor">Pastor Titular (Administrador da Igreja)</option>
                      <option value="pastor_advisor">Pastor Asesor / Secundario (Múltiplas Funções)</option>
                      <option value="secretary">Secretário (Admin Junior: Membros e Eventos)</option>
                    </select>
                  </div>

                  {newAdminRole === 'pastor_advisor' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-amber-300">
                          Funções Específicas (pode selecionar mais de uma):
                        </label>
                        <span className="text-[10px] font-mono text-amber-200/80">
                          {assignedFeatures.length} selec.
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {[
                          { id: 'expedientes', label: 'Expedientes e Membros' },
                          { id: 'eventos', label: 'Cultos e Eventos' },
                          { id: 'atencion', label: 'Atendimento Pastoral' },
                          { id: 'documentacion', label: 'Documentação e Cartas' },
                          { id: 'comunicaciones', label: 'Comunicações' },
                          { id: 'credenciales', label: 'Credencial Digital' },
                        ].map((fn) => {
                          const active = assignedFeatures.includes(fn.id);
                          return (
                            <button
                              key={fn.id}
                              type="button"
                              onClick={() =>
                                setAssignedFeatures((prev) => {
                                  if (prev.includes(fn.id)) {
                                    return prev.length > 1 ? prev.filter((item) => item !== fn.id) : prev;
                                  }
                                  return [...prev, fn.id];
                                })
                              }
                              className={`px-2.5 py-1.5 rounded-lg border text-left text-[11.5px] font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                active
                                  ? 'bg-amber-400/20 border-amber-400/60 text-white'
                                  : 'bg-[#18181A] border-white/10 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <span className="truncate">{fn.label}</span>
                              <span
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${
                                  active ? 'bg-amber-400 text-black' : 'border border-white/25'
                                }`}
                              >
                                {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      disabled={!newAdminName || !newAdminEmail || !newAdminPassword}
                      onClick={() => setAdminStep('permissions')}
                      className="w-full py-3 bg-white text-black hover:bg-neutral-200 rounded-xl font-semibold text-[13px] transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Revisar permissões
                    </button>
                  </div>

                  <p className="text-[11px] text-neutral-500 text-center">
                    Não é necessário compartilhar uma senha inicial publicamente.
                  </p>
                </div>
              </div>
            ) : adminStep === 'permissions' ? (
              /* Tela 09: Definir permissões */
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-[22px] font-bold tracking-tight text-white">
                    Acesso certo,
                    <br />
                    para cada função.
                  </h3>
                  <p className="text-[12px] text-neutral-400">
                    Revise o que esta pessoa poderá fazer.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-neutral-400">
                    ESCOPO DO ACESSO
                  </div>
                  <div className="p-3 bg-[#18181A] border border-white/10 rounded-xl flex items-center gap-2.5">
                    <Folder className="w-4 h-4 text-neutral-400" />
                    <div>
                      <div className="text-[13px] font-semibold text-white">
                        {congregationsList.find((c) => String(c.id) === String(newAdminCongId))?.city || newAdminCity || 'Sede'}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {newAdminName} ({newAdminRole === 'pastor_advisor' ? `pastor_advisor: ${assignedFeatures.join(', ')}` : newAdminRole})
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-neutral-400">
                    PERMISSÕES DE MÓDULOS
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {AVAILABLE_FEATURES.map((feat) => {
                      const isSelected = selectedFeatures.includes(feat.code);
                      return (
                        <div
                          key={feat.code}
                          onClick={() => {
                            setSelectedFeatures((prev) =>
                              prev.includes(feat.code)
                                ? prev.filter((c) => c !== feat.code)
                                : [...prev, feat.code]
                            );
                          }}
                          className="p-2.5 bg-[#18181A] border border-white/10 rounded-xl flex items-center justify-between cursor-pointer hover:border-white/25 transition-all"
                        >
                          <div>
                            <div className="text-[12px] font-medium text-white">{feat.name}</div>
                            <div className="text-[10px] text-neutral-500">{feat.description}</div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-black'
                              : 'border-white/20'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    disabled={submittingAdmin}
                    onClick={handleConfirmCreateAdmin}
                    className="w-full py-3 bg-white text-black hover:bg-neutral-200 rounded-xl font-semibold text-[13px] transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {submittingAdmin ? 'Aprovisionando...' : 'Aprovisionar Administrador'}
                  </button>
                  <button
                    onClick={() => setAdminStep('form')}
                    className="w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 rounded-xl text-[12px] font-medium cursor-pointer"
                  >
                    Voltar e editar dados
                  </button>
                </div>

                <p className="text-[11px] text-neutral-500 text-center">
                  A conta fica pendente até a pessoa aceitar o convite. Todas as alterações são auditadas.
                </p>
              </div>
            ) : (
              /* Documento de Credenciales de Acceso generado para descargar y enviar */
              createdCredentialPayload &&
              (() => {
                const model = buildAccessCredentialModelData(createdCredentialPayload);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-[18px] font-bold text-white tracking-tight">
                            Credenciales generadas
                          </h3>
                          <p className="text-[11px] text-neutral-400">
                            {model.modelHeading} · Listo para descargar y enviar
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Hoja oficial de vista previa */}
                    <div className="bg-white text-black rounded-2xl p-5 space-y-3 border border-neutral-300 text-[11.5px] max-h-[55vh] overflow-y-auto shadow-lg">
                      <div className="border-b border-neutral-300 pb-2.5">
                        <div className="text-[12px] font-extrabold uppercase tracking-tight text-neutral-900">
                          CREDENCIALES DE ACCESO · SISTEMA DE MADUREIRA 3.0
                        </div>
                        <div className="text-[10.5px] font-bold text-red-700">
                          Documento confidencial · No compartir credenciales
                        </div>
                      </div>

                      <div className="font-bold text-neutral-900">{model.subject}</div>
                      <p className="text-neutral-800 leading-relaxed">{model.intro}</p>

                      <div className="border border-neutral-300 rounded-lg overflow-hidden divide-y divide-neutral-300 text-[11px]">
                        <div className="grid grid-cols-3">
                          <div className="bg-neutral-100 px-2.5 py-1.5 font-bold">Usuario / correo</div>
                          <div className="col-span-2 px-2.5 py-1.5 font-mono font-bold break-all">
                            {createdCredentialPayload.email}
                          </div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="bg-neutral-100 px-2.5 py-1.5 font-bold">Enlace de acceso</div>
                          <div className="col-span-2 px-2.5 py-1.5 break-all">
                            {createdCredentialPayload.accessUrl}
                          </div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="bg-neutral-100 px-2.5 py-1.5 font-bold">Contraseña temporal</div>
                          <div className="col-span-2 px-2.5 py-1.5 font-mono font-bold">
                            {createdCredentialPayload.tempPassword}
                          </div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="bg-neutral-100 px-2.5 py-1.5 font-bold">Rol asignado</div>
                          <div className="col-span-2 px-2.5 py-1.5">{model.roleLabel}</div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="bg-neutral-100 px-2.5 py-1.5 font-bold">{model.functionsTitle}</div>
                          <div className="col-span-2 px-2.5 py-1.5">{model.functionsText}</div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="bg-neutral-100 px-2.5 py-1.5 font-bold">Fecha de emisión</div>
                          <div className="col-span-2 px-2.5 py-1.5">{model.issuedDate}</div>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-[10.5px] text-amber-950 leading-snug">
                        {model.securityInstructions}
                      </div>

                      <div className="pt-1 text-[10.5px] text-neutral-700">
                        <div>Atentamente,</div>
                        <div className="font-bold text-neutral-900">
                          {model.issuerName} · {model.issuerTitle}
                        </div>
                        <div>{model.convention}</div>
                      </div>

                      <div className="border-t border-neutral-300 pt-2 text-[10px] text-neutral-700 space-y-2">
                        <div className="font-semibold">
                          Acuse de recibo: Declaro haber recibido las credenciales y me comprometo a usarlas conforme a las instrucciones de seguridad.
                        </div>
                        <div>
                          Nombre y firma del receptor: ____________________________ Fecha: ____ / ____ / ________
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => generateAccessCredentialPdf(createdCredentialPayload)}
                        className="flex-1 py-3 px-4 bg-white text-black hover:bg-neutral-200 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar PDF para Enviar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingAdmin(false);
                          setAdminStep('form');
                          setCreatedCredentialPayload(null);
                        }}
                        className="py-3 px-5 bg-white/[0.08] hover:bg-white/[0.14] text-white rounded-xl text-[13px] font-semibold cursor-pointer"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Modal: Ficha Canônica Oficial do Membro */}
      {selectedMemberForFicha && (
        <OfficialMemberFichaModal
          member={selectedMemberForFicha}
          onClose={() => setSelectedMemberForFicha(null)}
        />
      )}
    </div>
  );
};
