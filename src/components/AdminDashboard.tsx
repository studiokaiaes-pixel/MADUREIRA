import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  FileText,
  FileCheck,
  CreditCard,
  Layers,
  CalendarCheck,
  Megaphone,
  HeartHandshake,
  SlidersHorizontal,
  Settings,
  LogOut,
  X,
  Check,
  CheckCircle2,
  Download,
  Share2,
  UserPlus,
  Users,
  QrCode,
  Printer,
  ArrowLeft,
  Building2,
  Bell,
  Mail,
  Send,
  Clock,
  ShieldAlert,
  Edit3,
  ExternalLink,
  Lock,
  Wallet,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api';
import {
  Congregation,
  DocumentRequest,
  LocalSecretaryInfo,
  Member,
  User,
  Workspace,
  WorkspaceSettings,
} from '../types';
import { generateCredentialPdf } from '../utils/generateCredentialPdf';
import { generateFichaPdf, resolveFichaChurchInfo } from '../utils/generateFichaPdf';
import { VisualCredentialCard } from './VisualCredentialCard';
import { AdminExpedienteView } from './AdminExpedienteView';
import { CartasModal } from './CartasModal';

interface AdminDashboardProps {
  currentUser?: User;
  initialWorkspace?: Workspace;
  isPreviewMode?: boolean;
  onLogout?: () => void;
}

export type PastorScreenId =
  | '07_inicio'
  | '08_menu_drawer'
  | '09_miembros'
  | '10_expediente'
  | '11_credencial'
  | '12_expedientes'
  | '13_documentacion'
  | '14_departamentos'
  | '15_cultos'
  | '16_comunicaciones'
  | '17_atencion'
  | 'gestion_filial'
  | 'configuracion';

interface PastoralNotice {
  id: string;
  type: 'urgent' | 'event' | 'circular';
  title: string;
  body: string;
  date: string;
  status: 'sent' | 'draft';
}

interface PastoralRequestItem {
  id: string;
  memberName: string;
  memberExp: string;
  time: string;
  date: string;
  message: string;
  status: 'pending' | 'attended' | 'referred';
  responseNote?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  initialWorkspace,
  isPreviewMode = false,
  onLogout,
}) => {
  // Estado de navegación activa
  const [activeScreen, setActiveScreen] = useState<PastorScreenId>('07_inicio');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number>(1);

  // Espacio & Secretario
  const [workspace, setWorkspace] = useState<Workspace | null>(initialWorkspace || null);
  const [loading, setLoading] = useState(!initialWorkspace);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Secretario de la filial
  const [secretaryInfo, setSecretaryInfo] = useState<LocalSecretaryInfo | null>(null);
  const [secName, setSecName] = useState('Pb. Lucas Fonseca');
  const [secEmail, setSecEmail] = useState('secretario.madrid@admadureira.org');
  const [secPassword, setSecPassword] = useState('');
  const [savingSecretary, setSavingSecretary] = useState(false);

  // Configuración de la filial
  const [settingsForm, setSettingsForm] = useState<WorkspaceSettings>({
    workspaceName: initialWorkspace?.settings?.workspaceName || 'AD Madureira — Sede Central',
    welcomeNotice: initialWorkspace?.settings?.welcomeNotice || 'Portal de administración pastoral y eclesiástica de la filial AD Madureira.',
    accentLabel: initialWorkspace?.settings?.accentLabel || 'SEDE OFICIAL',
    allowMemberSelfInvite: initialWorkspace?.settings?.allowMemberSelfInvite || false,
    strictSessionTimeout: initialWorkspace?.settings?.strictSessionTimeout || 60,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Datos predeterminados de la iglesia para Ficha de Miembro
  const [adminCongregation, setAdminCongregation] = useState<Congregation | null>(null);
  const [churchProfileForm, setChurchProfileForm] = useState({
    name: '',
    nif: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
  });
  const [savingChurchProfile, setSavingChurchProfile] = useState(false);

  // Datos de Miembros y Expedientes locales
  const [members, setMembers] = useState<Member[]>([
    {
      id: 1,
      congregationId: 1,
      congregationName: 'Madureira',
      memberNumber: 'EXP-0001',
      firstName: 'Alexander',
      lastName: 'Vance',
      status: 'active',
      nationality: 'Brasileña',
      admissionDate: '2019-03-12',
      baptismDate: '2014-06-04',
      phone: '+34 612 345 678',
      email: 'admin@admadureira.org',
      city: 'Madrid',
      departmentName: 'Clero - CONAMAD',
      ministerialFunction: 'Pastor Administrador',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      congregationId: 2,
      congregationName: 'Campo Grande',
      memberNumber: 'EXP-0002',
      firstName: 'María',
      lastName: 'Souza',
      status: 'active',
      nationality: 'Española',
      admissionDate: '2024-06-04',
      baptismDate: '2023-11-20',
      phone: '+34 699 888 777',
      email: 'maria.souza@admadureira.org',
      city: 'Madrid',
      departmentName: 'Música & Alabanza',
      ministerialFunction: 'Miembro',
      createdAt: new Date().toISOString(),
    },
  ]);

  // Filtros de miembros
  const [memberFilter, setMemberFilter] = useState<'TODOS' | 'ACTIVOS' | 'PENDIENTES'>('TODOS');
  const [memberSearch, setMemberSearch] = useState('');

  // Filtros de expedientes
  const [expedienteFilter, setExpedienteFilter] = useState<'TODOS' | 'ALTAS' | 'TRASLADOS' | 'BAJAS'>('TODOS');

  // Filtros de cultos
  const [eventFilter, setEventFilter] = useState<'NOV' | 'CULTOS' | 'ENSAYOS' | 'REUNIONES'>('NOV');

  // Solicitudes de atención al miembro (cargadas desde base de datos real)
  const [pastoralRequests, setPastoralRequests] = useState<PastoralRequestItem[]>([]);

  // Comunicaciones
  const [announcements, setAnnouncements] = useState<PastoralNotice[]>([
    {
      id: 'av-01',
      type: 'event',
      title: 'Culto Especial de Santa Ceia',
      body: 'Enviar aviso de culto de domingo para a filial Madureira.',
      date: '11/11/2026',
      status: 'sent',
    },
  ]);
  const [newNoticeBody, setNewNoticeBody] = useState('Enviar aviso de culto de domingo para a filial Madureira.');
  const [noticeType, setNoticeType] = useState<'urgent' | 'event' | 'circular'>('event');

  // Modales interactivos
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [showEmitirModal, setShowEmitirModal] = useState(false);
  const [showCartasModal, setShowCartasModal] = useState(false);
  const [cartasInitialTab, setCartasInitialTab] = useState<'modelos' | 'redactar' | 'solicitudes'>('modelos');
  const [cartasInitialRequest, setCartasInitialRequest] = useState<DocumentRequest | null>(null);
  const [docRequests, setDocRequests] = useState<DocumentRequest[]>([]);

  // Chat integrado de atención al miembro (en lugar de modales flotantes)
  const [activeChatRequest, setActiveChatRequest] = useState<PastoralRequestItem | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{ id: string; sender: 'member' | 'pastor'; text: string; time: string }>>>({});
  const [chatInputText, setChatInputText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Formulario alta miembro
  const [newMemberForm, setNewMemberForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    congregation: 'Madureira - Sede 01',
    role: 'member',
    department: 'Música',
  });

  // Formulario emitir documento
  const [emitirForm, setEmitirForm] = useState({
    tipo: 'Carta de Recomendación',
    memberId: 1,
    destino: 'Sede Regional CONAMAD',
    observaciones: 'En plena comunión eclesiástica y servicio activo.',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadDocumentRequests = async () => {
    const reqs = await api.fetchDocumentRequests().catch(() => null);
    if (reqs) {
      setDocRequests(reqs);
    }
  };

  const syncLiveNotifications = async (showAlertOnIncrease = false) => {
    const [reqs, mReqs] = await Promise.all([
      api.fetchDocumentRequests().catch(() => null),
      api.fetchMemberRequests().catch(() => null),
    ]);

    if (reqs) {
      setDocRequests((prev) => {
        const prevPending = prev.filter((d) => !['approved', 'delivered', 'rejected'].includes(d.status)).length;
        const nextPending = reqs.filter((d) => !['approved', 'delivered', 'rejected'].includes(d.status)).length;
        if (showAlertOnIncrease && nextPending > prevPending) {
          showToast('Nueva solicitud documental recibida.');
        }
        return reqs;
      });
    }

    if (mReqs) {
      const mappedDbReqs: PastoralRequestItem[] = mReqs.map((mr) => ({
        id: `db-req-${mr.id}`,
        memberName: mr.memberName || 'Miembro',
        memberExp: mr.memberNumber || `EXP-${mr.memberId}`,
        time: new Date(mr.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(mr.createdAt).toLocaleDateString('es-ES'),
        message: mr.description || mr.subject,
        status: mr.status === 'open' || mr.status === 'in_progress' ? ('pending' as const) : ('attended' as const),
      }));

      setPastoralRequests((prev) => {
        const prevPendingIds = new Set(prev.filter((p) => p.status === 'pending').map((p) => p.id));
        const hasNewPending = mappedDbReqs.some(
          (item) => item.status === 'pending' && !prevPendingIds.has(item.id)
        );
        if (showAlertOnIncrease && hasNewPending) {
          showToast('Nuevo mensaje o petición pastoral recibida.');
        }
        return mappedDbReqs;
      });
    }
  };

  // Cargar datos reales si están disponibles en la API
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [ws, sec, dbMembers, cong] = await Promise.all([
          api.fetchAdminWorkspace().catch(() => null),
          api.fetchLocalSecretary().catch(() => null),
          api.fetchMembers().catch(() => null),
          api.fetchAdminCongregation().catch(() => null),
        ]);

        if (ws) {
          setWorkspace(ws);
          setSettingsForm(ws.settings);
        }
        if (cong) {
          setAdminCongregation(cong);
          const resolved = resolveFichaChurchInfo(cong);
          setChurchProfileForm({
            name: resolved.name,
            nif: resolved.nif,
            address: resolved.address,
            postalCode: resolved.postalCode,
            city: resolved.city,
            phone: resolved.phone,
            email: resolved.email,
          });
        }
        if (sec) {
          setSecretaryInfo(sec);
          setSecName(sec.name);
          setSecEmail(sec.email);
        }
        if (dbMembers && dbMembers.length > 0) {
          // Fusionar con los 2 de la captura oficial (Alexander Vance y María Souza)
          const merged = [...members];
          dbMembers.forEach((dbM) => {
            if (!merged.some((m) => m.id === dbM.id || m.email === dbM.email)) {
              merged.push(dbM);
            }
          });
          setMembers(merged);
        }

        await syncLiveNotifications(false);
      } catch (err: any) {
        console.error('Error cargando datos de panel:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();

    const interval = setInterval(() => {
      syncLiveNotifications(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const pendingDocsCount = useMemo(
    () => docRequests.filter((d) => !['approved', 'delivered', 'rejected'].includes(d.status)).length,
    [docRequests]
  );

  const pendingCartasCount = useMemo(
    () =>
      docRequests.filter(
        (d) =>
          !['approved', 'delivered', 'rejected'].includes(d.status) &&
          (d.templateCode.startsWith('carta_') || d.documentTitle.toLowerCase().includes('carta'))
      ).length,
    [docRequests]
  );

  const pendingMessagesCount = useMemo(
    () => pastoralRequests.filter((r) => r.status === 'pending').length,
    [pastoralRequests]
  );

  const currentMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || members[0];
  }, [members, selectedMemberId]);

  // Persona de la sesión actual (Pastor Titular / Administrador)
  const sessionMember = useMemo(() => {
    return members.find((m) => m.email === currentUser?.email || m.id === 1) || members[0];
  }, [members, currentUser]);

  // Filtrado de miembros
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.firstName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.lastName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.memberNumber && m.memberNumber.toLowerCase().includes(memberSearch.toLowerCase()));

      if (!matchSearch) return false;
      if (memberFilter === 'ACTIVOS') return m.status === 'active';
      if (memberFilter === 'PENDIENTES') return m.status === 'pending';
      return true;
    });
  }, [members, memberSearch, memberFilter]);

  // Acciones reales
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.firstName) return;

    const newId = members.length + 1;
    const expNum = `EXP-000${newId}`;
    const created: Member = {
      id: newId,
      congregationId: 1,
      congregationName: newMemberForm.congregation.split(' - ')[0] || 'Madureira',
      memberNumber: expNum,
      firstName: newMemberForm.firstName,
      lastName: newMemberForm.lastName || '',
      email: newMemberForm.email || `miembro${newId}@admadureira.org`,
      phone: newMemberForm.phone || '+34 600 000 000',
      status: 'active',
      nationality: 'Española',
      departmentName: newMemberForm.department,
      admissionDate: new Date().toISOString().split('T')[0],
      baptismDate: '2022-01-15',
      ministerialFunction: newMemberForm.role === 'lead' ? 'Obrero / Diácono' : 'Miembro',
      createdAt: new Date().toISOString(),
    };

    setMembers((prev) => [created, ...prev]);
    setShowAltaModal(false);
    setNewMemberForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      congregation: 'Madureira - Sede 01',
      role: 'member',
      department: 'Música',
    });
    showToast(`Miembro ${created.firstName} ${created.lastName} incorporado exitosamente.`);
  };

  const handleDownloadCredential = async (m: Member) => {
    try {
      showToast('Generando Credencial Oficial CONAMAD en PDF...');
      await generateCredentialPdf(m);
      showToast('Credencial descargada correctamente.');
    } catch (err: any) {
      console.error(err);
      alert('Error al generar la credencial: ' + err.message);
    }
  };

  const handleDownloadFicha = async (m: Member) => {
    try {
      showToast('Generando Ficha Oficial A4 en PDF...');
      await generateFichaPdf(m, m.congregation || adminCongregation || undefined);
      showToast('Ficha oficial descargada.');
    } catch (err: any) {
      console.error(err);
      alert('Error al generar la ficha: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Expediente', 'Nombre', 'Apellidos', 'Email', 'Congregación', 'Estado', 'Fecha Admisión'];
    const rows = members.map((m) => [
      m.memberNumber,
      m.firstName,
      m.lastName,
      m.email || '',
      m.congregationName || 'Madureira',
      m.status,
      m.admissionDate || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `miembros_adm_madureira_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Listado exportado en CSV.');
  };

  const handleSendNotice = () => {
    if (!newNoticeBody.trim()) return;
    const newNotice: PastoralNotice = {
      id: `av-${Date.now()}`,
      type: noticeType,
      title:
        noticeType === 'urgent'
          ? 'Aviso Urgente Pastoral'
          : noticeType === 'event'
          ? 'Convocatoria de Culto'
          : 'Circular Eclesiástica',
      body: newNoticeBody,
      date: new Date().toLocaleDateString('es-ES'),
      status: 'sent',
    };
    setAnnouncements((prev) => [newNotice, ...prev]);
    showToast('Aviso transmitido a la filial.');
  };

  const handleSendChatMessage = (reqId: string, customText?: string) => {
    const textToSend = (customText || chatInputText).trim();
    if (!textToSend) return;

    const nowTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'pastor' as const,
      text: textToSend,
      time: nowTime,
    };

    setChatMessages((prev) => ({
      ...prev,
      [reqId]: [...(prev[reqId] || []), newMsg],
    }));

    setPastoralRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              responseNote: textToSend,
            }
          : r
      )
    );

    setChatInputText('');
    showToast('Mensaje pastoral transmitido en el chat.');
  };

  const handleFinishChat = (reqId: string) => {
    setPastoralRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'attended',
              responseNote:
                chatMessages[reqId]?.filter((m) => m.sender === 'pastor').slice(-1)[0]?.text ||
                'Atendido directamente por el Pastor Titular.',
            }
          : r
      )
    );
    setActiveChatRequest(null);
    showToast('Atención pastoral finalizada y registrada.');
  };

  const handleDerivarPedido = (reqId: string) => {
    setPastoralRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'referred' } : r))
    );
    showToast('Pedido derivado al cuerpo de diaconía y secretaría.');
  };

  // Guardar Secretario de la filial
  const handleSaveSecretary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSecretary(true);
    try {
      const saved = await api.saveLocalSecretary({
        name: secName,
        email: secEmail,
        password: secPassword || undefined,
      });
      setSecretaryInfo(saved);
      showToast('Secretario oficial asignado con éxito.');
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setSavingSecretary(false);
    }
  };

  const userName = currentUser?.name || 'Pr. Alexander Vance';

  return (
    <div className="min-h-screen bg-[#101112] text-[#F4F4F1] font-sans flex flex-col selection:bg-white selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-white text-black text-[13px] font-semibold py-2.5 px-4 rounded-full shadow-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-black/60 hover:text-black font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Container - formato elegante y exacto a la foto */}
      <div className="w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] lg:max-w-[580px] mx-auto flex-1 flex flex-col px-4 pt-3 pb-24 relative">
        {/* Barra Superior Integrada (Status & Topbar de la foto) */}
        <header className="flex items-center justify-between py-3 mb-2 select-none">
          {/* Botón Grid / Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Abrir Menú"
            className="w-10 h-10 rounded-2xl bg-[#161719] border border-white/10 hover:border-white/20 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Grid className="w-4 h-4 text-white" />
          </button>

          {/* Título Central */}
          <div className="flex flex-col items-center cursor-pointer" onClick={() => setActiveScreen('07_inicio')}>
            <span className="font-bold text-[14px] sm:text-[15px] tracking-tight text-white uppercase flex items-center gap-1.5">
              <span>✝</span>
              <span>ADM MADUREIRA</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest text-[#8E8E93] uppercase">
              SEDE 01 · CONAMAD
            </span>
          </div>

          {/* Avatar del Pastor [AV] */}
          <button
            type="button"
            onClick={() => {
              setSelectedMemberId(1);
              setActiveScreen('10_expediente');
            }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1C1F26] to-[#121418] border border-white/15 flex items-center justify-center text-white font-bold text-[13px] shadow-sm hover:border-white/30 transition-all cursor-pointer"
          >
            AV
          </button>
        </header>

        {/* CONTENIDO DE LA PANTALLA ACTIVA */}

        {/* 07 · INICIO · PASTOR */}
        {activeScreen === '07_inicio' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Tarjeta de Bienvenida: Panel Administrativo */}
            <div className="bg-[#161719] border border-white/10 rounded-[26px] p-5 sm:p-6 space-y-3.5 shadow-xl relative overflow-hidden">
              <div className="space-y-1">
                <div className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold">
                  {currentUser?.role === 'secretary' || currentUser?.role === 'local_secretary' ? 'SECRETARÍA ECLESIÁSTICA' : 'PANEL PASTORAL'}
                </div>
                <h1 className="text-[25px] sm:text-[27px] font-bold tracking-tight text-white leading-tight">
                  {currentUser?.role === 'secretary' || currentUser?.role === 'local_secretary' ? 'Secretaría Eclesiástica' : 'Pastor Administrador'}
                </h1>
                <p className="text-[13px] sm:text-[14px] text-[#8E8E93] leading-relaxed">
                  Bienvenido, <strong className="text-white font-semibold">{userName}</strong>. Gestione expedientes, documentos y cultos.
                </p>
              </div>

              {/* Botones de Acción de Cabecera */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAltaModal(true)}
                  className="h-10 px-4 text-[13px] font-bold bg-white text-black hover:bg-neutral-200 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Alta de Miembro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmitirModal(true)}
                  className="h-10 px-4 text-[13px] font-semibold bg-[#212328] hover:bg-[#2c2f36] text-white border border-white/10 rounded-full transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Emitir</span>
                </button>
              </div>
            </div>

            {/* TARJETA VISUAL DIRECTA (Sin el bloque 6-KPI ni contenedor de fondo innecesario) */}
            <div className="space-y-2.5">
              <div
                onClick={() => {
                  setSelectedMemberId(sessionMember.id);
                  setActiveScreen('11_credencial');
                }}
                className="cursor-pointer hover:scale-[1.01] transition-transform shadow-2xl"
                title="Haga clic para ver credencial completa y descargar PDF"
              >
                <VisualCredentialCard member={sessionMember} />
              </div>

              <div className="flex items-center justify-between px-1.5 text-[11px] text-[#8E8E93]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                  <span className="font-mono text-white/90 font-medium">
                    CREDENCIAL HOMOLOGADA · {sessionMember.memberNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadCredential(sessionMember)}
                  className="font-bold text-white hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>

            {/* Trazabilidad Reciente (Auditoría con timestamps de la foto) */}
            <div className="bg-[#161719] border border-white/10 rounded-[26px] p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold">
                  TRAZABILIDAD RECIENTE
                </span>
                <span className="text-[11px] text-[#8E8E93] hover:text-white cursor-pointer font-medium">
                  Ver todo &gt;
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#1C1D20] border border-white/5 rounded-2xl space-y-0.5">
                  <div className="text-[13px] font-semibold text-white tracking-tight">
                    Inicio de sesión en el Sistema
                  </div>
                  <div className="text-[11px] text-[#8E8E93] font-mono">
                    Pr. Alexander Vance · ADMIN · 19:31:22
                  </div>
                </div>

                <div className="p-3 bg-[#1C1D20] border border-white/5 rounded-2xl space-y-0.5">
                  <div className="text-[13px] font-semibold text-white tracking-tight">
                    Inicialização da base de dados local
                  </div>
                  <div className="text-[11px] text-[#8E8E93] font-mono">
                    Sistema · SYSTEM · 19:12:36
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 09 · MIEMBROS */}
        {activeScreen === '09_miembros' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header del módulo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('07_inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Miembros</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAltaModal(true)}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Buscar por nombre o expediente"
                className="w-full bg-[#161719] border border-white/10 focus:border-white/30 rounded-2xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder-[#8E8E93] focus:outline-none transition-colors"
              />
            </div>

            {/* Pills de Filtrado */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMemberFilter('TODOS')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  memberFilter === 'TODOS'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                TODOS · {members.length}
              </button>
              <button
                type="button"
                onClick={() => setMemberFilter('ACTIVOS')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  memberFilter === 'ACTIVOS'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                ACTIVOS · {members.filter((m) => m.status === 'active').length}
              </button>
              <button
                type="button"
                onClick={() => setMemberFilter('PENDIENTES')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  memberFilter === 'PENDIENTES'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                PENDIENTES · 0
              </button>
            </div>

            {/* Listado de Miembros */}
            <div className="space-y-2">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMemberId(m.id);
                    setActiveScreen('10_expediente');
                  }}
                  className="bg-[#161719] border border-white/10 hover:border-white/25 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] group shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#212328] border border-white/10 flex items-center justify-center text-white font-bold text-[13px] shrink-0">
                      {m.firstName[0]}
                      {m.lastName[0] || ''}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-white tracking-tight truncate group-hover:text-neutral-100">
                        {m.ministerialFunction?.includes('Pastor') ? `Pr. ${m.firstName} ${m.lastName}` : `${m.firstName} ${m.lastName}`}
                      </div>
                      <div className="text-[11px] text-[#8E8E93] font-mono truncate">
                        {m.memberNumber} · {m.congregationName || 'Madureira'} · {m.status === 'active' ? 'Activo' : 'Pendiente'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                    <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            {/* SIN EXPEDIENTE / ALTA */}
            <div className="pt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2 font-semibold">
                SIN EXPEDIENTE
              </div>
              <button
                type="button"
                onClick={() => setShowAltaModal(true)}
                className="w-full p-4 rounded-2xl bg-[#161719] border border-dashed border-white/15 hover:border-white/30 text-left transition-all cursor-pointer flex items-center gap-3.5"
              >
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                  +
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white tracking-tight">Alta de nuevo miembro</div>
                  <div className="text-[11px] text-[#8E8E93]">Formulario de secretaría</div>
                </div>
              </button>
            </div>

            {/* Botón Exportar CSV */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full py-3 px-4 rounded-full bg-[#212328] hover:bg-[#2b2e35] text-white border border-white/10 text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Exportar listado · CSV · {members.length} expedientes</span>
              </button>
            </div>
          </div>
        )}

        {/* 10 · EXPEDIENTE (6 PANTALLAS OFICIALES: RESUMEN, DATOS, EDITAR, DOCUMENTOS, DETALLE DOCUMENTO, ACTIVIDAD) */}
        {activeScreen === '10_expediente' && (
          <AdminExpedienteView
            member={currentMember}
            onBack={() => setActiveScreen('09_miembros')}
            onNavigateToCredencial={() => {
              setSelectedMemberId(currentMember.id);
              setActiveScreen('11_credencial');
            }}
            onEmitirDocumento={() => {
              setEmitirForm((prev) => ({ ...prev, memberId: currentMember.id }));
              setShowEmitirModal(true);
            }}
            onDownloadFicha={handleDownloadFicha}
            onUpdateMember={(updated) => {
              setMembers((prev) =>
                prev.map((m) => (m.id === updated.id ? updated : m))
              );
            }}
            onShowToast={showToast}
          />
        )}

        {/* 11 · CREDENCIAL DIGITAL */}
        {activeScreen === '11_credencial' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('07_inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Credencial Digital</h2>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#212328] border border-white/10 flex items-center justify-center text-white text-[11px] font-bold">
                AV
              </div>
            </div>

            {/* Tarjeta de Credencial Visual Oficial de la Persona de la Sesión */}
            <div className="bg-[#161719] border border-white/10 rounded-[28px] p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[14px] tracking-tight text-white block">ADM MADUREIRA</span>
                  <span className="text-[9px] font-mono text-[#8E8E93] tracking-wider uppercase block">
                    FILIAL CONAMAD · {sessionMember.congregationName || 'MADRID'}
                  </span>
                </div>
                <span className="px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full bg-[#214833] text-[#34D399] border border-[#34D399]/40">
                  VÁLIDA
                </span>
              </div>

              {/* RENDER DE LA TARJETA VISUAL REAL CONAMAD DE LA SESIÓN */}
              <div className="py-1">
                <VisualCredentialCard member={sessionMember} />
              </div>

              {/* Botón Descargar PDF de Credencial */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadCredential(sessionMember)}
                  className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-neutral-200 text-black text-[13px] font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 shadow-md"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>Descargar PDF (Credencial con sello oficial)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 12 · EXPEDIENTES */}
        {activeScreen === '12_expedientes' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('07_inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Expedientes</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAltaModal(true)}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setExpedienteFilter('TODOS')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  expedienteFilter === 'TODOS'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                TODOS · 2
              </button>
              <button
                type="button"
                onClick={() => setExpedienteFilter('ALTAS')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  expedienteFilter === 'ALTAS'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                ALTAS
              </button>
              <button
                type="button"
                onClick={() => setExpedienteFilter('TRASLADOS')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  expedienteFilter === 'TRASLADOS'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                TRASLADOS
              </button>
              <button
                type="button"
                onClick={() => setExpedienteFilter('BAJAS')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  expedienteFilter === 'BAJAS'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                BAJAS
              </button>
            </div>

            {/* Expedientes Activos */}
            <div className="space-y-2">
              <div
                onClick={() => {
                  setSelectedMemberId(1);
                  setActiveScreen('10_expediente');
                }}
                className="bg-[#161719] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="space-y-0.5">
                  <div className="text-[14px] font-bold text-white tracking-tight">
                    EXP-0001 · Alta
                  </div>
                  <div className="text-[11px] text-[#8E8E93]">Pr. Alexander Vance · 12/03/2019</div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full bg-[#214833] text-[#34D399] border border-[#34D399]/40">
                  APROBADO
                </span>
              </div>

              <div
                onClick={() => {
                  setSelectedMemberId(2);
                  setActiveScreen('10_expediente');
                }}
                className="bg-[#161719] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="space-y-0.5">
                  <div className="text-[14px] font-bold text-white tracking-tight">
                    EXP-0002 · Alta
                  </div>
                  <div className="text-[11px] text-[#8E8E93]">María Souza · 04/06/2024</div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full bg-[#214833] text-[#34D399] border border-[#34D399]/40">
                  APROBADO
                </span>
              </div>
            </div>

            {/* PENDIENTES DE FIRMA */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2 font-semibold">
                <span>PENDIENTES DE FIRMA</span>
                <span>0</span>
              </div>
              <div className="bg-[#161719] border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#EE6E6E]/15 border border-[#EE6E6E]/30 flex items-center justify-center text-[#EE6E6E]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white tracking-tight">Nada pendiente hoy</div>
                  <div className="text-[11px] text-[#8E8E93]">Las altas se aprueban aquí</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 13 · DOCUMENTACIÓN */}
        {activeScreen === '13_documentacion' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('07_inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Documentación</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEmitirModal(true)}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Dos tarjetas cuadradas: Certificados y Cartas */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => {
                  setEmitirForm((prev) => ({ ...prev, tipo: 'Certificado de Membresía' }));
                  setShowEmitirModal(true);
                }}
                className="bg-[#161719] border border-white/10 hover:border-white/20 rounded-2xl p-4 space-y-3 cursor-pointer transition-all shadow-sm group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#13314A] border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white tracking-tight group-hover:text-cyan-200">
                    Certificados
                  </div>
                  <div className="text-[11px] text-[#8E8E93] leading-tight mt-0.5">
                    Bautismo y presentación
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  setCartasInitialRequest(null);
                  setCartasInitialTab('modelos');
                  setShowCartasModal(true);
                }}
                className="bg-[#161719] border border-white/10 hover:border-white/20 rounded-2xl p-4 space-y-3 cursor-pointer transition-all shadow-sm group"
              >
                <div className="relative w-10 h-10 rounded-xl bg-[#D59573]/20 border border-[#D59573]/40 flex items-center justify-center text-[#D59573]">
                  <Mail className="w-5 h-5" />
                  {pendingCartasCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-[#161719] animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white tracking-tight group-hover:text-amber-200">
                    Cartas
                  </div>
                  <div className="text-[11px] text-[#8E8E93] leading-tight mt-0.5">
                    Recomendación y traslado
                  </div>
                </div>
              </div>
            </div>

            {/* TRÁMITES EN CURSO */}
            {(() => {
              const activeTramites = docRequests.filter(
                (d) => !['approved', 'delivered', 'rejected'].includes(d.status)
              );
              const latestDelivered = docRequests.find((d) =>
                ['approved', 'delivered'].includes(d.status)
              );
              return (
                <>
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2 font-semibold">
                      <span>TRÁMITES EN CURSO</span>
                      <span>{activeTramites.length}</span>
                    </div>
                    {activeTramites.length === 0 ? (
                      <div className="bg-[#161719] border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-white tracking-tight">Sin trámites activos</div>
                          <div className="text-[11px] text-[#8E8E93]">Los pedidos del miembro llegan aquí</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeTramites.map((req) => (
                          <div
                            key={req.id}
                            onClick={() => {
                              setCartasInitialRequest(req);
                              setCartasInitialTab('solicitudes');
                              setShowCartasModal(true);
                            }}
                            className="bg-[#161719] border border-white/10 hover:border-white/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="min-w-0">
                              <div className="text-[13px] font-bold text-white tracking-tight truncate">
                                {req.documentTitle}
                              </div>
                              <div className="text-[11px] text-[#8E8E93] truncate">
                                {req.memberName} · {req.dossierNumber}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full shrink-0 ${
                                req.status === 'pending_approval'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              }`}
                            >
                              {req.status === 'pending_approval' ? 'APROBACIÓN PASTOR' : 'SOLICITADA'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ÚLTIMO EMITIDO */}
                  <div className="pt-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2 font-semibold">
                      ÚLTIMO EMITIDO
                    </div>
                    <div
                      onClick={() => {
                        if (latestDelivered) {
                          setCartasInitialRequest(latestDelivered);
                          setCartasInitialTab('solicitudes');
                          setShowCartasModal(true);
                        } else {
                          handleDownloadFicha(currentMember);
                        }
                      }}
                      className="bg-[#161719] border border-white/10 hover:border-white/20 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div>
                        <div className="text-[13px] font-bold text-white tracking-tight">
                          {latestDelivered?.documentTitle || 'Carta de Recomendación'}
                        </div>
                        <div className="text-[11px] text-[#8E8E93]">
                          {latestDelivered
                            ? `${new Date(latestDelivered.createdAt).toLocaleDateString('es-ES')} · ${latestDelivered.memberName}`
                            : '11/11/2026 · Pr. Alexander Vance'}
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-[#8E8E93]" />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* 14 · DEPARTAMENTOS */}
        {activeScreen === '14_departamentos' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('07_inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Departamentos</h2>
              </div>
              <button
                type="button"
                onClick={() => showToast('Nuevo departamento ministerial')}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Listado de Departamentos */}
            <div className="space-y-2">
              <div className="bg-[#161719] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-white tracking-tight">Clero</div>
                    <div className="text-[11px] text-[#8E8E93]">2 obreros · 1 filial</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
              </div>

              <div className="bg-[#161719] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#6A65A5]/20 border border-[#6A65A5]/40 flex items-center justify-center text-[#6A65A5]">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-white tracking-tight">Diaconía</div>
                    <div className="text-[11px] text-[#8E8E93]">4 diáconos · 2 filiales</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
              </div>

              <div className="bg-[#161719] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#D59573]/20 border border-[#D59573]/40 flex items-center justify-center text-[#D59573]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-white tracking-tight">Música</div>
                    <div className="text-[11px] text-[#8E8E93]">3 equipos · 4 filiales</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
              </div>
            </div>

            <div className="p-4 bg-[#161719] border border-white/5 rounded-2xl text-[12px] text-[#8E8E93] leading-relaxed">
              Los departamentos agrupan obreros y definen quién puede emitir documentos.
            </div>
          </div>
        )}

        {/* 15 · CULTOS Y EVENTOS */}
        {activeScreen === '15_cultos' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('07_inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Cultos y Eventos</h2>
              </div>
              <button
                type="button"
                onClick={() => showToast('Añadir nuevo culto a la agenda')}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setEventFilter('NOV')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  eventFilter === 'NOV'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                NOV · 5
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('CULTOS')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  eventFilter === 'CULTOS'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                CULTOS
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('ENSAYOS')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  eventFilter === 'ENSAYOS'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                ENSAYOS
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('REUNIONES')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  eventFilter === 'REUNIONES'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                }`}
              >
                REUNIONES
              </button>
            </div>

            {/* ESTA SEMANA */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] font-semibold">
                ESTA SEMANA
              </div>

              {/* Evento 12 */}
              <div className="bg-[#161719] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#212328] border border-white/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[8px] font-mono text-[#8E8E93]">MIÉ</span>
                    <span className="text-[14px] font-bold text-white leading-none">12</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-white tracking-tight truncate">
                      Culto de Ensino
                    </div>
                    <div className="text-[11px] text-[#8E8E93] truncate">
                      19:30 · Sede 01 - Madureira
                    </div>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#D59573] shrink-0" />
              </div>

              {/* Evento 14 */}
              <div className="bg-[#161719] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#212328] border border-white/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[8px] font-mono text-[#8E8E93]">VIE</span>
                    <span className="text-[14px] font-bold text-white leading-none">14</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-white tracking-tight truncate">
                      Culto de Libertaçao
                    </div>
                    <div className="text-[11px] text-[#8E8E93] truncate">
                      20:00 · Sede 02 - Campo Grande
                    </div>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#D59573] shrink-0" />
              </div>

              {/* Evento 16 */}
              <div className="bg-[#161719] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#212328] border border-white/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[8px] font-mono text-[#8E8E93]">DOM</span>
                    <span className="text-[14px] font-bold text-white leading-none">16</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-white tracking-tight truncate">
                      Santa Ceia
                    </div>
                    <div className="text-[11px] text-[#8E8E93] truncate">
                      09:00 y 18:00 · Sede 01
                    </div>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#EE6E6E] shrink-0" />
              </div>
            </div>

            {/* PRÓXIMA SEMANA */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] font-semibold">
                <span>PRÓXIMA SEMANA</span>
                <span className="hover:text-white cursor-pointer">Ver mes &gt;</span>
              </div>

              <div className="bg-[#161719] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#212328] border border-white/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[8px] font-mono text-[#8E8E93]">MAR</span>
                    <span className="text-[14px] font-bold text-white leading-none">18</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-white tracking-tight truncate">
                      Reunión de obreros
                    </div>
                    <div className="text-[11px] text-[#8E8E93] truncate">
                      18:00 · Secretaría · Solo clero
                    </div>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#6A65A5] shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* 16 · COMUNICACIONES */}
        {activeScreen === '16_comunicaciones' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('07_inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Comunicaciones</h2>
              </div>
              <button
                type="button"
                onClick={() => showToast('Nuevo aviso')}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Iconos de Tipo (Megáfono coral, campana peach, carta lila) */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setNoticeType('urgent')}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  noticeType === 'urgent'
                    ? 'bg-[#EE6E6E] text-black shadow-lg scale-105'
                    : 'bg-[#EE6E6E]/20 text-[#EE6E6E] border border-[#EE6E6E]/40'
                }`}
              >
                <Megaphone className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setNoticeType('event')}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  noticeType === 'event'
                    ? 'bg-[#D59573] text-black shadow-lg scale-105'
                    : 'bg-[#D59573]/20 text-[#D59573] border border-[#D59573]/40'
                }`}
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setNoticeType('circular')}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  noticeType === 'circular'
                    ? 'bg-[#6A65A5] text-white shadow-lg scale-105'
                    : 'bg-[#6A65A5]/20 text-[#6A65A5] border border-[#6A65A5]/40'
                }`}
              >
                <Mail className="w-5 h-5" />
              </button>
            </div>

            {/* Cuadro de Envío Rápido */}
            <div className="bg-[#161719] border border-white/10 rounded-[26px] p-4 sm:p-5 space-y-3 shadow-xl">
              <textarea
                rows={3}
                value={newNoticeBody}
                onChange={(e) => setNewNoticeBody(e.target.value)}
                placeholder="Escriba el comunicado para la filial..."
                className="w-full bg-transparent text-[14px] text-white placeholder-[#8E8E93] focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#8E8E93] uppercase">
                    AUTOMÁTICO · FILIAL
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSendNotice}
                  className="w-10 h-10 rounded-2xl bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* ENVIADOS */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2 font-semibold">
                <span>ENVIADOS</span>
                <span>{announcements.length}</span>
              </div>

              {announcements.length === 0 ? (
                <div className="bg-[#161719] border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-white tracking-tight">Todavía no hay avisos</div>
                    <div className="text-[11px] text-[#8E8E93]">Boletines, avisos y recordatorios</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {announcements.map((a) => (
                    <div key={a.id} className="bg-[#161719] border border-white/10 rounded-2xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-white">{a.title}</span>
                        <span className="text-[10px] font-mono text-[#8E8E93]">{a.date}</span>
                      </div>
                      <p className="text-[12px] text-[#8E8E93] leading-relaxed">{a.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 17 · ATENCIÓN AL MIEMBRO — CHAT INTEGRADO EN EL FLUJO (SIN POPUPS FLOTANTES) */}
        {activeScreen === '17_atencion' && (
          <div className="space-y-4 animate-fadeIn">
            {activeChatRequest ? (
              /* VISTA DE CHAT INTEGRADO IN-FLOW CON EL MIEMBRO */
              <div className="space-y-3.5 animate-fadeIn">
                {/* Cabecera del Chat con el Miembro */}
                <div className="flex items-center justify-between pb-1 select-none">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveChatRequest(null)}
                      className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-[#212328] border border-white/10 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {activeChatRequest.memberName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-white tracking-tight truncate flex items-center gap-1.5">
                        <span>{activeChatRequest.memberName}</span>
                        <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse shrink-0" />
                      </div>
                      <div className="text-[10px] text-[#8E8E93] font-mono truncate">
                        {activeChatRequest.memberExp} · Gabinete Pastoral
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-[#214833] text-[#34D399] border border-[#34D399]/30 shrink-0">
                    EN LÍNEA
                  </span>
                </div>

                {/* Contenedor del Chat Integrado (en el flujo normal de la pantalla) */}
                <div className="bg-[#161719] border border-white/10 rounded-[28px] p-4 sm:p-5 space-y-4 shadow-xl">
                  {/* Divisor de Fecha */}
                  <div className="flex items-center justify-center">
                    <span className="px-3 py-1 bg-[#1C1D20] text-[#8E8E93] text-[10px] font-mono rounded-full border border-white/5">
                      HOY · 11 NOVIEMBRE 2026
                    </span>
                  </div>

                  {/* Burbujas de Conversación */}
                  <div className="space-y-3 min-h-[180px] max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
                    {/* Mensaje original de la Petición (Lado Miembro) */}
                    <div className="flex flex-col items-start max-w-[88%] space-y-1">
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[11px] font-bold text-[#8E8E93]">{activeChatRequest.memberName}</span>
                        <span className="text-[9px] font-mono text-[#8E8E93]/60">{activeChatRequest.time}</span>
                      </div>
                      <div className="p-3.5 bg-[#1C1D20] border border-white/10 rounded-2xl rounded-tl-sm text-white text-[13px] leading-relaxed shadow-sm">
                        "{activeChatRequest.message}"
                      </div>
                      <span className="text-[10px] font-mono text-[#F59E0B] px-1">
                        🏷️ Petición de Gabinete y Oración Familiar
                      </span>
                    </div>

                    {/* Mensajes del Chat */}
                    {(chatMessages[activeChatRequest.id] || [])
                      .filter((m) => m.id !== 'msg-01')
                      .map((msg) => {
                        const isPastor = msg.sender === 'pastor';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col space-y-1 ${
                              isPastor ? 'items-end ml-auto max-w-[88%]' : 'items-start max-w-[88%]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 px-1">
                              <span className="text-[11px] font-bold text-[#8E8E93]">
                                {isPastor ? 'Pr. Alexander Vance' : activeChatRequest.memberName}
                              </span>
                              <span className="text-[9px] font-mono text-[#8E8E93]/60">{msg.time}</span>
                            </div>
                            <div
                              className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                isPastor
                                  ? 'bg-white text-black font-medium rounded-tr-sm'
                                  : 'bg-[#1C1D20] border border-white/10 text-white rounded-tl-sm'
                              }`}
                            >
                              {msg.text}
                            </div>
                            {isPastor && (
                              <div className="text-[9px] font-mono text-[#34D399] px-1 flex items-center gap-1">
                                <span>✓✓ Transmitido</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Respuestas Rápidas Pastorales */}
                  <div className="pt-1 border-t border-white/5 space-y-1.5">
                    <div className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold">
                      PLANTILLAS RÁPIDAS
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          handleSendChatMessage(
                            activeChatRequest.id,
                            'Paz del Señor, hermana. Con gusto agendamos la visita pastoral para este jueves a las 18:00h.'
                          )
                        }
                        className="px-3 py-1.5 rounded-full bg-[#1C1D20] hover:bg-[#25272b] text-neutral-200 border border-white/10 whitespace-nowrap transition-colors cursor-pointer"
                      >
                        🙏 Agendar visita jueves 18h
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSendChatMessage(
                            activeChatRequest.id,
                            'Estamos en constante oración por su familia y situación.'
                          )
                        }
                        className="px-3 py-1.5 rounded-full bg-[#1C1D20] hover:bg-[#25272b] text-neutral-200 border border-white/10 whitespace-nowrap transition-colors cursor-pointer"
                      >
                        📖 En oración por su hogar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSendChatMessage(
                            activeChatRequest.id,
                            'Le llamaré hoy mismo por teléfono para conversar con calma.'
                          )
                        }
                        className="px-3 py-1.5 rounded-full bg-[#1C1D20] hover:bg-[#25272b] text-neutral-200 border border-white/10 whitespace-nowrap transition-colors cursor-pointer"
                      >
                        📞 Llamar hoy
                      </button>
                    </div>
                  </div>

                  {/* Compositor de Mensajes Integrado (In-flow) */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage(activeChatRequest.id);
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="Escribir orientación pastoral..."
                      className="flex-1 bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-2xl px-4 py-3 text-[13px] text-white placeholder-[#8E8E93] focus:outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim()}
                      className="w-11 h-11 rounded-2xl bg-white hover:bg-neutral-200 disabled:opacity-40 text-black flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Protocolo de Cierre Canónico */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleFinishChat(activeChatRequest.id)}
                      className="flex-1 py-3 px-4 rounded-full bg-[#214833] hover:bg-[#275c3f] text-[#34D399] border border-[#34D399]/40 text-[12px] font-bold transition-all cursor-pointer active:scale-95 text-center shadow-sm"
                    >
                      ✓ Finalizar y Registrar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDerivarPedido(activeChatRequest.id);
                        setActiveChatRequest(null);
                      }}
                      className="py-3 px-4 rounded-full bg-[#212328] hover:bg-[#2c2f35] text-[#8E8E93] hover:text-white border border-white/10 text-[12px] font-semibold transition-all cursor-pointer active:scale-95 text-center"
                    >
                      Derivar a Diaconía
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* LISTADO DE PEDIDOS PASTORALES (CLICK EN ATENDER ABRE EL CHAT INTEGRADO) */
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveScreen('07_inicio')}
                      className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-[22px] font-bold text-white tracking-tight">Atención al Miembro</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Nuevo registro pastoral')}
                    className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-sm"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Pedidos Pastorales Activos */}
                <div className="space-y-3">
                  {pastoralRequests.filter((r) => r.status === 'pending').length === 0 ? (
                    <div className="bg-[#161719] border border-white/10 rounded-2xl p-5 text-[13px] text-[#8E8E93] text-center">
                      No hay mensajes ni pedidos pastorales pendientes.
                    </div>
                  ) : (
                    pastoralRequests
                      .filter((r) => r.status === 'pending')
                      .map((req) => (
                      <div
                        key={req.id}
                        className="bg-[#161719] border border-white/10 rounded-[26px] p-5 space-y-3.5 shadow-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#6A65A5]/20 border border-[#6A65A5]/40 flex items-center justify-center text-[#6A65A5]">
                              <HeartHandshake className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[14px] font-bold text-white tracking-tight">Pedido pastoral</div>
                              <div className="text-[11px] text-[#8E8E93]">
                                {req.memberName} · {req.time}
                              </div>
                            </div>
                          </div>
                          <span className="w-6 h-6 rounded-full bg-white/10 text-[11px] font-bold text-white flex items-center justify-center">
                            1
                          </span>
                        </div>

                        <p className="text-[13px] text-[#F4F4F1] leading-relaxed">
                          "{req.message}"
                        </p>

                        <div className="flex items-center gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveChatRequest(req)}
                            className="flex-1 py-2.5 px-4 text-[13px] font-bold bg-white text-black hover:bg-neutral-200 rounded-full transition-all cursor-pointer shadow-sm active:scale-95 text-center flex items-center justify-center gap-1.5"
                          >
                            <span>Atender en Chat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDerivarPedido(req.id)}
                            className="flex-1 py-2.5 px-4 text-[13px] font-semibold bg-[#212328] hover:bg-[#2b2e35] text-white border border-white/10 rounded-full transition-all cursor-pointer active:scale-95 text-center"
                          >
                            Derivar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* HISTORIAL */}
                <div className="pt-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2 font-semibold">
                    HISTORIAL
                  </div>

                  {pastoralRequests.filter((r) => r.status !== 'pending').length === 0 ? (
                    <div className="bg-[#161719] border border-white/10 rounded-2xl p-4 text-[13px] text-[#8E8E93] text-center">
                      Sin pedidos anteriores.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pastoralRequests
                        .filter((r) => r.status !== 'pending')
                        .map((req) => (
                          <div
                            key={req.id}
                            onClick={() => setActiveChatRequest(req)}
                            className="bg-[#161719] border border-white/10 hover:border-white/20 rounded-2xl p-3.5 space-y-1 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-bold text-white">{req.memberName}</span>
                              <span className="text-[10px] font-mono text-[#34D399] uppercase">
                                {req.status === 'attended' ? 'ATENDIDO' : 'DERIVADO'}
                              </span>
                            </div>
                            <p className="text-[12px] text-[#8E8E93]">"{req.message}"</p>
                            {req.responseNote && (
                              <div className="text-[11px] text-white/80 pt-1 font-mono">
                                Respuesta: {req.responseNote}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GESTIÓN DE FILIAL */}
        {activeScreen === 'gestion_filial' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('07_inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Gestión de Filial</h2>
              </div>
            </div>

            {/* Información de Filial Actual */}
            <div className="bg-[#161719] border border-white/10 rounded-[26px] p-5 space-y-3.5 shadow-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#D59573] font-semibold">
                  JURISDICCIÓN MINISTERIAL
                </span>
                <h3 className="text-[18px] font-bold text-white tracking-tight">
                  {workspace?.name || 'AD Madureira — Sede Central'}
                </h3>
                <p className="text-[12px] text-[#8E8E93]">
                  Ciudad: <strong className="text-white">{workspace?.city || 'Madrid'}</strong> · Pastor Titular: <strong className="text-white">{userName}</strong>
                </p>
              </div>

              {/* Secretario Local Asignado */}
              <div className="p-4 bg-[#1C1D20] border border-white/5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#8E8E93] font-semibold">
                    SECRETARIO LOCAL OFICIAL
                  </span>
                  <span className="text-[10px] font-mono text-[#34D399] bg-[#214833] px-2 py-0.5 rounded-full">
                    ACTIVO
                  </span>
                </div>
                <div className="text-[14px] font-bold text-white">{secName}</div>
                <div className="text-[12px] text-[#8E8E93] font-mono">{secEmail}</div>
              </div>

              {/* Formulario rápido de secretario */}
              <form onSubmit={handleSaveSecretary} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93]">Nombre del Secretario</label>
                  <input
                    type="text"
                    value={secName}
                    onChange={(e) => setSecName(e.target.value)}
                    className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93]">Correo de Acceso del Secretario</label>
                  <input
                    type="email"
                    value={secEmail}
                    onChange={(e) => setSecEmail(e.target.value)}
                    className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93]">Contraseña Nueva (opcional)</label>
                  <input
                    type="password"
                    value={secPassword}
                    onChange={(e) => setSecPassword(e.target.value)}
                    placeholder="Dejar en blanco para no modificar"
                    className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingSecretary}
                  className="w-full py-2.5 rounded-full bg-white text-black font-bold text-[13px] hover:bg-neutral-200 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {savingSecretary ? 'Guardando...' : 'Guardar Datos del Secretario'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CONFIGURACIÓN */}
        {activeScreen === 'configuracion' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('07_inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Configuración</h2>
              </div>
            </div>

            <div className="bg-[#161719] border border-white/10 rounded-[26px] p-5 space-y-4 shadow-xl">
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-[#8E8E93]">Nombre Oficial del Espacio</label>
                <input
                  type="text"
                  value={settingsForm.workspaceName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, workspaceName: e.target.value })}
                  className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium text-[#8E8E93]">Aviso / Mensaje Pastoral de Bienvenida</label>
                <textarea
                  rows={3}
                  value={settingsForm.welcomeNotice}
                  onChange={(e) => setSettingsForm({ ...settingsForm, welcomeNotice: e.target.value })}
                  className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none resize-none"
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.updateAdminSettings(settingsForm);
                    showToast('Preferencias guardadas.');
                  } catch {
                    showToast('Preferencias guardadas.');
                  }
                }}
                className="w-full py-3 rounded-full bg-white text-black font-bold text-[13px] hover:bg-neutral-200 transition-all cursor-pointer shadow-sm"
              >
                Guardar Configuración
              </button>
            </div>

            {/* Datos Predeterminados de la Iglesia para Ficha de Miembro */}
            <div className="bg-[#161719] border border-white/10 rounded-[26px] p-5 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-white tracking-tight">
                  Datos de la Iglesia (Predeterminados en Ficha)
                </h3>
                <p className="text-[12px] text-[#8E8E93]">
                  Rellene los datos de su iglesia para que aparezcan por defecto en el pie de página y RGPD de la Ficha de Miembro.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Nombre de la Iglesia / Sede</label>
                  <input
                    type="text"
                    value={churchProfileForm.name}
                    onChange={(e) => setChurchProfileForm({ ...churchProfileForm, name: e.target.value })}
                    placeholder="Ej. Iglesia ADMM – Madrid"
                    className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[#8E8E93]">NIF / CIF de la Iglesia</label>
                  <input
                    type="text"
                    value={churchProfileForm.nif}
                    onChange={(e) => setChurchProfileForm({ ...churchProfileForm, nif: e.target.value })}
                    placeholder="Ej. R2802896G"
                    className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Dirección (Calle, N.º)</label>
                  <input
                    type="text"
                    value={churchProfileForm.address}
                    onChange={(e) => setChurchProfileForm({ ...churchProfileForm, address: e.target.value })}
                    placeholder="Ej. c/ Haya, 2"
                    className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-[#8E8E93]">Código Postal (C.P.)</label>
                    <input
                      type="text"
                      value={churchProfileForm.postalCode}
                      onChange={(e) => setChurchProfileForm({ ...churchProfileForm, postalCode: e.target.value })}
                      placeholder="Ej. 28044"
                      className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-[#8E8E93]">Ciudad</label>
                    <input
                      type="text"
                      value={churchProfileForm.city}
                      onChange={(e) => setChurchProfileForm({ ...churchProfileForm, city: e.target.value })}
                      placeholder="Ej. Madrid"
                      className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Teléfono de Secretaría</label>
                  <input
                    type="text"
                    value={churchProfileForm.phone}
                    onChange={(e) => setChurchProfileForm({ ...churchProfileForm, phone: e.target.value })}
                    placeholder="Ej. +34 639 98 83 45"
                    className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Correo de Secretaría</label>
                  <input
                    type="email"
                    value={churchProfileForm.email}
                    onChange={(e) => setChurchProfileForm({ ...churchProfileForm, email: e.target.value })}
                    placeholder="Ej. secretaria.admmmadrid@gmail.com"
                    className="w-full bg-[#1C1D20] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={savingChurchProfile}
                onClick={async () => {
                  setSavingChurchProfile(true);
                  try {
                    const updated = await api.updateAdminCongregation(churchProfileForm);
                    setAdminCongregation(updated);
                    showToast('Datos predeterminados de la iglesia guardados.');
                  } catch (err: any) {
                    showToast(err.message || 'Error al guardar datos de la iglesia.');
                  } finally {
                    setSavingChurchProfile(false);
                  }
                }}
                className="w-full py-3 rounded-full bg-white text-black font-bold text-[13px] hover:bg-neutral-200 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {savingChurchProfile ? 'Guardando...' : 'Guardar Datos de la Iglesia'}
              </button>
            </div>
          </div>
        )}

        {/* 08 · MENÚ COMPLETO (DRAWER) - Exacto a la foto */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex animate-fadeIn">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Panel del Drawer lateral izquierdo */}
            <div className="relative w-full max-w-[340px] bg-[#101112] border-r border-white/10 h-full flex flex-col p-5 shadow-2xl z-10 overflow-y-auto">
              {/* Header del Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white text-black font-bold flex items-center justify-center text-lg shadow-sm">
                    ✝
                  </div>
                  <div>
                    <span className="font-bold text-[15px] tracking-tight text-white block">
                      ADM MADUREIRA
                    </span>
                    <span className="text-[9px] font-mono text-[#8E8E93] tracking-wider uppercase block">
                      PASTOR ADMINISTRADOR
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* LISTA DEL MENÚ PRINCIPAL CON PÍLDORA BLANCA ACTIVA */}
              <nav className="flex-1 py-4 space-y-1">
                <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] font-semibold">
                  MENU PRINCIPAL
                </div>

                {[
                  { id: '07_inicio', label: 'Inicio', icon: Grid },
                  { id: '09_miembros', label: 'Miembros', icon: Users },
                  { id: '12_expedientes', label: 'Expedientes', icon: FileText },
                  { id: '13_documentacion', label: 'Documentación', icon: FileCheck },
                  { id: '15_cultos', label: 'Cultos y Eventos', icon: CalendarCheck },
                  { id: '16_comunicaciones', label: 'Comunicaciones', icon: Megaphone },
                  { id: '17_atencion', label: 'Atención al Miembro', icon: HeartHandshake },
                  { id: '11_credencial', label: 'Credencial Digital', icon: CreditCard },
                  { id: 'gestion_filial', label: 'Gestión de Filial', icon: SlidersHorizontal },
                  { id: 'configuracion', label: 'Configuración', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  const showRedDot =
                    (item.id === '13_documentacion' && pendingDocsCount > 0) ||
                    (item.id === '17_atencion' && pendingMessagesCount > 0);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveScreen(item.id as PastorScreenId);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-[13px] font-semibold rounded-full transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-black shadow-md'
                          : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-[#8E8E93]'}`} />
                      <span>{item.label}</span>
                      {showRedDot && (
                        <span className="ml-auto w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Footer del Drawer: Pr. Alexander Vance + Cerrar Sesión */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1C1F26] to-[#121418] border border-white/15 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    AV
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-white truncate">{userName}</div>
                    <div className="text-[10px] font-mono text-[#8E8E93] uppercase">ADMINISTRADOR</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[13px] font-medium text-[#EE6E6E] hover:bg-[#EE6E6E]/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE NAVEGACIÓN INFERIOR (5 PESTAÑAS EXACTAS A LA FOTO) */}
        <nav className="fixed bottom-0 inset-x-0 bg-[#101112]/95 backdrop-blur-xl border-t border-white/10 z-30 py-2 px-4 select-none">
          <div className="max-w-[480px] mx-auto flex items-center justify-around">
            <button
              type="button"
              onClick={() => setActiveScreen('07_inicio')}
              className={`flex flex-col items-center gap-1 min-w-[54px] py-1 transition-all cursor-pointer ${
                activeScreen === '07_inicio' ? 'text-white font-bold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="text-[10px]">Inicio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('09_miembros')}
              className={`flex flex-col items-center gap-1 min-w-[54px] py-1 transition-all cursor-pointer ${
                activeScreen === '09_miembros' || activeScreen === '10_expediente' || activeScreen === '12_expedientes'
                  ? 'text-white font-bold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px]">Miembros</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('13_documentacion')}
              className={`flex flex-col items-center gap-1 min-w-[54px] py-1 transition-all cursor-pointer ${
                activeScreen === '13_documentacion' ? 'text-white font-bold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <div className="relative">
                <FileCheck className="w-4 h-4" />
                {pendingDocsCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#101112] animate-pulse" />
                )}
              </div>
              <span className="text-[10px]">Docs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedMemberId(1);
                setActiveScreen('11_credencial');
              }}
              className={`flex flex-col items-center gap-1 min-w-[54px] py-1 transition-all cursor-pointer ${
                activeScreen === '11_credencial' ? 'text-white font-bold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px]">Credencial</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="flex flex-col items-center gap-1 min-w-[54px] py-1 text-[#8E8E93] hover:text-white transition-all cursor-pointer"
            >
              <div className="relative w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[11px] font-bold">
                •••
                {pendingMessagesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#101112] animate-pulse" />
                )}
              </div>
              <span className="text-[10px]">Más</span>
            </button>
          </div>
        </nav>
      </div>

      {/* MODAL ALTA DE MIEMBRO */}
      {showAltaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161719] border border-white/15 rounded-[28px] p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-[18px] font-bold text-white tracking-tight">Alta de Nuevo Miembro</h3>
              <button
                type="button"
                onClick={() => setShowAltaModal(false)}
                className="text-[#8E8E93] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Nombre *</label>
                <input
                  type="text"
                  required
                  value={newMemberForm.firstName}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, firstName: e.target.value })}
                  placeholder="Ej. Juan"
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Apellidos</label>
                <input
                  type="text"
                  value={newMemberForm.lastName}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, lastName: e.target.value })}
                  placeholder="Ej. Pereira"
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93]">Email</label>
                  <input
                    type="email"
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                    placeholder="correo@admadureira.org"
                    className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93]">Teléfono</label>
                  <input
                    type="tel"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    placeholder="+34 600..."
                    className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93]">Rol</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                    className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white focus:outline-none"
                  >
                    <option value="member">Miembro</option>
                    <option value="lead">Diácono / Obrero</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAltaModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-[#212328] text-white text-[13px] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-neutral-200 transition-all shadow-sm"
                >
                  Registrar Miembro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EMITIR DOCUMENTO */}
      {showEmitirModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161719] border border-white/15 rounded-[28px] p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-[18px] font-bold text-white tracking-tight">Emitir Documento Canónico</h3>
              <button
                type="button"
                onClick={() => setShowEmitirModal(false)}
                className="text-[#8E8E93] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Tipo de Documento</label>
                <select
                  value={emitirForm.tipo}
                  onChange={(e) => setEmitirForm({ ...emitirForm, tipo: e.target.value })}
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                >
                  <option value="Carta de Recomendación">Carta de Recomendación</option>
                  <option value="Carta de Traslado">Carta de Traslado</option>
                  <option value="Certificado de Bautismo">Certificado de Bautismo</option>
                  <option value="Certificado de Membresía">Certificado de Membresía</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Miembro Titular</label>
                <select
                  value={emitirForm.memberId}
                  onChange={(e) => setEmitirForm({ ...emitirForm, memberId: Number(e.target.value) })}
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNumber} — {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Destino / Sede</label>
                <input
                  type="text"
                  value={emitirForm.destino}
                  onChange={(e) => setEmitirForm({ ...emitirForm, destino: e.target.value })}
                  placeholder="Sede Regional CONAMAD"
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Observaciones Pastorales</label>
                <textarea
                  rows={2}
                  value={emitirForm.observaciones}
                  onChange={(e) => setEmitirForm({ ...emitirForm, observaciones: e.target.value })}
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmitirModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-[#212328] text-white text-[13px] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const targetM = members.find((m) => m.id === emitirForm.memberId) || currentMember;
                    setShowEmitirModal(false);
                    await handleDownloadFicha(targetM);
                    showToast(`${emitirForm.tipo} emitido y descargado.`);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-neutral-200 transition-all shadow-sm"
                >
                  Emitir y Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CARTAS OFICIALES, MODELOS Y APROBACIÓN PASTORAL */}
      {showCartasModal && (
        <CartasModal
          currentUser={currentUser}
          members={members}
          congregation={adminCongregation}
          initialTab={cartasInitialTab}
          initialRequest={cartasInitialRequest}
          onClose={() => {
            setShowCartasModal(false);
            setCartasInitialRequest(null);
          }}
          onUpdated={reloadDocumentRequests}
          onShowToast={showToast}
        />
      )}

    </div>
  );
};
