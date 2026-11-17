import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  ChevronRight,
  ChevronLeft,
  Plus,
  FileText,
  FileCheck,
  CreditCard,
  Layers,
  CalendarCheck,
  Megaphone,
  HeartHandshake,
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
  User as UserIcon,
  MapPin,
  Church,
} from 'lucide-react';
import { api } from '../api';
import {
  Announcement,
  Congregation,
  DigitalCredential,
  DocumentRequest,
  DocumentTemplate,
  EventItem,
  Member,
  MemberDocumentItem,
  MemberHistoryItem,
  MemberRequest,
  User,
} from '../types';
import { generateCredentialPdf } from '../utils/generateCredentialPdf';
import { generateFichaPdf } from '../utils/generateFichaPdf';
import {
  ACTIVE_LETTER_TEMPLATES,
  LetterFieldValues,
  buildLetterSummary,
  createDefaultLetterValues,
  findLetterTemplate,
  formatSpanishLongDate,
  generateLetterPdf,
  parseLetterObservations,
  serializeLetterObservations,
} from '../utils/letterTemplates';
import { EditMemberFichaModal } from './EditMemberFichaModal';
import { OfficialMemberFichaModal } from './OfficialMemberFichaModal';
import { VisualCredentialCard } from './VisualCredentialCard';
import { AdminExpedienteView } from './AdminExpedienteView';

interface MemberPortalProps {
  currentUser: User;
  onLogout: () => void;
  onViewPublicPortal?: () => void;
}

export type MemberScreenId =
  | 'inicio'
  | 'credencial'
  | 'expediente'
  | 'documentos'
  | 'eventos'
  | 'comunicados'
  | 'atencion'
  | 'configuracion';

export const MemberPortal: React.FC<MemberPortalProps> = ({
  currentUser,
  onLogout,
  onViewPublicPortal,
}) => {
  const [activeScreen, setActiveScreen] = useState<MemberScreenId>('inicio');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Estados de datos del miembro
  const [member, setMember] = useState<Member | null>(null);
  const [memberCongregation, setMemberCongregation] = useState<Congregation | null>(null);
  const [credential, setCredential] = useState<DigitalCredential | null>(null);
  const [docRequests, setDocRequests] = useState<DocumentRequest[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [memberRequests, setMemberRequests] = useState<MemberRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de eventos
  const [eventFilter, setEventFilter] = useState<'NOV' | 'CULTOS' | 'ENSAYOS' | 'REUNIONES'>('NOV');

  // Modales
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>(
    ACTIVE_LETTER_TEMPLATES[0]?.code || 'carta_recomendacion'
  );
  const [docObservations, setDocObservations] = useState('');
  const [letterValues, setLetterValues] = useState<LetterFieldValues>(() =>
    createDefaultLetterValues(null, null)
  );
  const [docFormError, setDocFormError] = useState<string | null>(null);
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const [showReqModal, setShowReqModal] = useState(false);
  const [reqCategory, setReqCategory] = useState<'prayer_request' | 'admin_inquiry' | 'suggestion'>('prayer_request');
  const [reqSubject, setReqSubject] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  const [showFichaModal, setShowFichaModal] = useState(false);
  const [showEditFichaModal, setShowEditFichaModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat integrado de atención pastoral
  const [memberChatInput, setMemberChatInput] = useState('');
  const [memberMessages, setMemberMessages] = useState<Array<{ id: string; sender: 'member' | 'pastor'; text: string; time: string }>>([
    {
      id: 'm-1',
      sender: 'member',
      text: 'Solicito visita y oración por mi familia esta semana si es posible.',
      time: '19:04',
    },
    {
      id: 'm-2',
      sender: 'pastor',
      text: 'Paz del Señor, hermana María. Con gusto agendamos la visita pastoral para este jueves a las 18:00h.',
      time: '19:15',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendMemberMessage = (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : memberChatInput).trim();
    if (!textToSend) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg = {
      id: `m-${Date.now()}`,
      sender: 'member' as const,
      text: textToSend,
      time: timeStr,
    };
    setMemberMessages((prev) => [...prev, newMsg]);
    setMemberChatInput('');

    setTimeout(() => {
      setMemberMessages((prev) => [
        ...prev,
        {
          id: `p-${Date.now()}`,
          sender: 'pastor' as const,
          text: 'Amén. He recibido tu mensaje, hermana. Lo tengo presente y te respondo en breve.',
          time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
        },
      ]);
    }, 1200);
  };

  // Cargar datos del miembro
  const loadData = async () => {
    try {
      setLoading(true);
      const [meRes, docs, tmpls, ann, evts, reqs] = await Promise.all([
        api.fetchMe().catch(() => null),
        api.fetchDocumentRequests().catch(() => []),
        api.fetchDocumentTemplates().catch(() => []),
        api.fetchPublicAnnouncements().catch(() => []),
        api.fetchPublicEvents().catch(() => []),
        api.fetchMemberRequests().catch(() => []),
      ]);

      if (meRes?.member) {
        setMember(meRes.member);
      }
      if ((meRes as any)?.congregation) {
        setMemberCongregation((meRes as any).congregation);
      }
      if (!meRes?.member) {
        // Fallback miembro padrão (María Souza ou nome do usuário)
        const fallbackMember: Member = {
          id: typeof currentUser.id === 'number' ? currentUser.id : 2,
          congregationId: 1,
          congregationName: 'Madureira',
          memberNumber: 'EXP-0002',
          firstName: currentUser.name.split(' ')[0] || 'María',
          lastName: currentUser.name.split(' ').slice(1).join(' ') || 'Souza',
          status: 'active',
          nationality: 'Española',
          admissionDate: '2024-06-04',
          baptismDate: '2023-11-20',
          phone: '+34 699 888 777',
          email: currentUser.email || 'maria.souza@admadureira.org',
          city: 'Madrid',
          departmentName: 'Música & Alabanza',
          ministerialFunction: 'Miembro',
          createdAt: new Date().toISOString(),
        };
        setMember(fallbackMember);
      }

      if (meRes?.credential) {
        setCredential(meRes.credential);
      }

      setDocRequests(docs);
      setTemplates(tmpls);
      setAnnouncements(ann);
      setEvents(evts);
      setMemberRequests(reqs);
    } catch (err: any) {
      console.error('Error cargando datos del miembro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      const [docs, reqs] = await Promise.all([
        api.fetchDocumentRequests().catch(() => null),
        api.fetchMemberRequests().catch(() => null),
      ]);
      if (docs) {
        setDocRequests((prev) => {
          const prevReady = prev.filter((d) => ['approved', 'delivered'].includes(d.status)).length;
          const nextReady = docs.filter((d) => ['approved', 'delivered'].includes(d.status)).length;
          if (nextReady > prevReady) {
            showToast('Tu carta o documento ha sido aprobado y enviado.');
          }
          return docs;
        });
      }
      if (reqs) {
        setMemberRequests((prev) => {
          const prevAns = prev.filter((r) => r.status === 'answered').length;
          const nextAns = reqs.filter((r) => r.status === 'answered').length;
          if (nextAns > prevAns) {
            showToast('Tienes una nueva respuesta pastoral.');
          }
          return reqs;
        });
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const [seenDocKeys, setSeenDocKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`admm_seen_docs_${currentUser.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [seenMsgKeys, setSeenMsgKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`admm_seen_msgs_${currentUser.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (activeScreen === 'documentos' && docRequests.length > 0) {
      const keys = docRequests.map((d) => `${d.id}:${d.status}`);
      setSeenDocKeys(keys);
      try {
        localStorage.setItem(`admm_seen_docs_${currentUser.id}`, JSON.stringify(keys));
      } catch {}
    }
  }, [activeScreen, docRequests, currentUser.id]);

  useEffect(() => {
    if (activeScreen === 'atencion' && memberRequests.length > 0) {
      const keys = memberRequests.map((r) => `${r.id}:${r.status}`);
      setSeenMsgKeys(keys);
      try {
        localStorage.setItem(`admm_seen_msgs_${currentUser.id}`, JSON.stringify(keys));
      } catch {}
    }
  }, [activeScreen, memberRequests, currentUser.id]);

  const hasDocAlert = useMemo(
    () =>
      docRequests.some(
        (d) =>
          ['approved', 'delivered', 'rejected'].includes(d.status) &&
          !seenDocKeys.includes(`${d.id}:${d.status}`)
      ),
    [docRequests, seenDocKeys]
  );

  const hasMessageAlert = useMemo(
    () =>
      memberRequests.some(
        (r) => r.status === 'answered' && !seenMsgKeys.includes(`${r.id}:${r.status}`)
      ),
    [memberRequests, seenMsgKeys]
  );

  const activeMember: Member = useMemo(() => {
    if (member) return member;
    return {
      id: typeof currentUser.id === 'number' ? currentUser.id : 2,
      congregationId: 1,
      congregationName: 'Madureira',
      memberNumber: 'EXP-0002',
      firstName: currentUser.name.split(' ')[0] || 'María',
      lastName: currentUser.name.split(' ').slice(1).join(' ') || 'Souza',
      status: 'active',
      nationality: 'Española',
      admissionDate: '2024-06-04',
      baptismDate: '2023-11-20',
      phone: '+34 699 888 777',
      email: currentUser.email || 'maria.souza@admadureira.org',
      city: 'Madrid',
      departmentName: 'Música & Alabanza',
      ministerialFunction: 'Miembro',
      createdAt: new Date().toISOString(),
    };
  }, [member, currentUser]);

  const initials = useMemo(() => {
    const f = activeMember.firstName?.[0] || 'M';
    const l = activeMember.lastName?.[0] || 'S';
    return (f + l).toUpperCase();
  }, [activeMember]);

  // Generar Credencial PDF
  const handleDownloadCredential = async () => {
    try {
      showToast('Generando Credencial Oficial CONAMAD en PDF...');
      await generateCredentialPdf(activeMember, credential);
      showToast('Credencial descargada correctamente.');
    } catch (err: any) {
      console.error(err);
      alert('Error al generar la credencial: ' + err.message);
    }
  };

  // Generar Ficha Oficial A4 en PDF
  const handleDownloadFicha = async () => {
    try {
      showToast('Generando Ficha Oficial A4 en PDF...');
      await generateFichaPdf(activeMember);
      showToast('Ficha oficial descargada con éxito.');
    } catch (err: any) {
      console.error(err);
      setShowFichaModal(true);
    }
  };

  const openDocRequestModal = (templateCode: string) => {
    setSelectedTemplateCode(templateCode);
    setLetterValues(createDefaultLetterValues(activeMember, memberCongregation));
    setDocObservations('');
    setDocFormError(null);
    setShowDocModal(true);
  };

  // Solicitar documento oficial
  const handleRequestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocFormError(null);

    const isLetter = selectedTemplateCode.startsWith('carta_');
    let finalObservations = docObservations;
    let documentTitle: string | undefined;

    if (isLetter) {
      const model = findLetterTemplate(selectedTemplateCode);
      documentTitle = model.title;

      // Verificar que todos los campos requeridos (datos faltantes del perfil o datos del pedido) estén completos
      const missingFields = model.fields.filter((f) => {
        if (f.source === 'registry' || !f.required) return false;
        const val = String(letterValues[f.key] || '').trim();
        return val.length === 0;
      });

      if (missingFields.length > 0) {
        setDocFormError(
          `Complete los datos necesarios antes de solicitar: ${missingFields
            .slice(0, 3)
            .map((f) => f.label)
            .join(', ')}${missingFields.length > 3 ? '...' : ''}.`
        );
        return;
      }

      if (model.hasGuestTable) {
        const validGuest = letterValues.guests.some((g) => g.fullName.trim() && g.passport.trim());
        if (!validGuest) {
          setDocFormError('Debe añadir al menos un invitado con nombre completo y pasaporte.');
          return;
        }
      }

      finalObservations = serializeLetterObservations(
        buildLetterSummary(model, letterValues),
        letterValues
      );
    }

    setSubmittingDoc(true);
    try {
      await api.createDocumentRequest({
        templateCode: selectedTemplateCode,
        documentTitle,
        memberId: activeMember.id,
        observations: finalObservations,
      });
      setShowDocModal(false);
      setDocObservations('');
      setDocFormError(null);
      showToast('Solicitud enviada a la Secretaría Eclesiástica.');
      const updated = await api.fetchDocumentRequests();
      setDocRequests(updated);
    } catch (err: any) {
      setDocFormError(err.message || 'Error al enviar solicitud');
    } finally {
      setSubmittingDoc(false);
    }
  };

  // Enviar petición pastoral confidencial
  const handleCreateMemberRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqSubject.trim() || !reqDescription.trim()) return;
    setSubmittingReq(true);
    try {
      await api.createMemberRequest({
        category: reqCategory,
        subject: reqSubject,
        description: reqDescription,
        isConfidential: true,
      });
      setShowReqModal(false);
      setReqSubject('');
      setReqDescription('');
      showToast('Petición pastoral enviada en estricto sigilo al pastor.');
      const updated = await api.fetchMemberRequests();
      setMemberRequests(updated);
    } catch (err: any) {
      alert(`Error al enviar petición: ${err.message}`);
    } finally {
      setSubmittingReq(false);
    }
  };

  const isPending = activeMember.status === 'pending' || currentUser.status === 'pending';

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

      {/* Main Container — Mismo formato de la foto */}
      <div className="w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] lg:max-w-[580px] mx-auto flex-1 flex flex-col px-4 pt-3 pb-24 relative">
        {/* Barra Superior Integrada */}
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
          <div className="flex flex-col items-center cursor-pointer" onClick={() => setActiveScreen('inicio')}>
            <span className="font-bold text-[14px] sm:text-[15px] tracking-tight text-white uppercase flex items-center gap-1.5">
              <span>✝</span>
              <span>ADM MADUREIRA</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest text-[#8E8E93] uppercase">
              PORTAL DO MEMBRO · {activeMember.congregationName || 'SEDE MADRID'}
            </span>
          </div>

          {/* Avatar del Miembro */}
          <button
            type="button"
            onClick={() => setActiveScreen('expediente')}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1C1F26] to-[#121418] border border-white/15 flex items-center justify-center text-white font-bold text-[13px] shadow-sm hover:border-white/30 transition-all cursor-pointer"
          >
            {initials}
          </button>
        </header>

        {/* PANTALLA: INICIO (Adaptada para el Miembro con el mismo lenguaje de la foto) */}
        {activeScreen === 'inicio' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Tarjeta de Bienvenida del Miembro */}
            <div className="bg-[#161719] border border-white/10 rounded-[26px] p-5 sm:p-6 space-y-3.5 shadow-xl relative overflow-hidden">
              <div className="space-y-1">
                <div className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold">
                  PORTAL DO MEMBRO OFICIAL
                </div>
                <h1 className="text-[25px] sm:text-[27px] font-bold tracking-tight text-white leading-tight">
                  Secretaría Eclesiástica
                </h1>
                <p className="text-[13px] sm:text-[14px] text-[#8E8E93] leading-relaxed">
                  Bienvenido, <strong className="text-white font-semibold">{activeMember.firstName} {activeMember.lastName}</strong>. Consulte su credencial canónica, expediente y trámites.
                </p>
              </div>

              {/* Botones de Cabecera estilo Píldora de la foto */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadFicha}
                  className="h-10 px-4 text-[13px] font-bold bg-white text-black hover:bg-neutral-200 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4 stroke-[2.5]" />
                  <span>Mi Ficha A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocModal(true)}
                  className="h-10 px-4 text-[13px] font-semibold bg-[#212328] hover:bg-[#2c2f36] text-white border border-white/10 rounded-full transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Pedir Documento</span>
                </button>
              </div>
            </div>

            {/* Aviso si está pendiente */}
            {isPending && (
              <div className="bg-[#161719] border border-[#EE6E6E]/40 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EE6E6E]/15 border border-[#EE6E6E]/30 flex items-center justify-center text-[#EE6E6E] shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white tracking-tight">Expediente en Homologación</div>
                  <div className="text-[11px] text-[#8E8E93]">El pastor o secretaría formalizarán su alta pronto.</div>
                </div>
              </div>
            )}

            {/* TARJETA VISUAL DIRECTA DEL MIEMBRO (Sin bloque 6-KPI ni contenedor de fondo innecesario) */}
            <div className="space-y-2.5">
              <div
                onClick={() => setActiveScreen('credencial')}
                className="cursor-pointer hover:scale-[1.01] transition-transform shadow-2xl"
                title="Haga clic para ver credencial completa y descargar PDF"
              >
                <VisualCredentialCard member={activeMember} />
              </div>

              <div className="flex items-center justify-between px-1.5 text-[11px] text-[#8E8E93]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                  <span className="font-mono text-white/90 font-medium">
                    CREDENCIAL HOMOLOGADA · {activeMember.memberNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCredential}
                  className="font-bold text-white hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>

            {/* Trazabilidad Canónica Reciente */}
            <div className="bg-[#161719] border border-white/10 rounded-[26px] p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold">
                  HISTORIAL ECLESIÁSTICO RECIENTE
                </span>
                <span onClick={() => setActiveScreen('expediente')} className="text-[11px] text-[#8E8E93] hover:text-white cursor-pointer font-medium">
                  Ver todo &gt;
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#1C1D20] border border-white/5 rounded-2xl space-y-0.5">
                  <div className="text-[13px] font-semibold text-white tracking-tight">
                    Credencial Digital CONAMAD Validada
                  </div>
                  <div className="text-[11px] text-[#8E8E93] font-mono">
                    Secretaría · Sede Central · Activa
                  </div>
                </div>

                <div className="p-3 bg-[#1C1D20] border border-white/5 rounded-2xl space-y-0.5">
                  <div className="text-[13px] font-semibold text-white tracking-tight">
                    Comunión Eclesiástica en {activeMember.congregationName || 'Madureira'}
                  </div>
                  <div className="text-[11px] text-[#8E8E93] font-mono">
                    Admisión Canónica · {activeMember.admissionDate || '2024-06-04'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA: CREDENCIAL DIGITAL (Idéntica a Screen 11 de la foto) */}
        {activeScreen === 'credencial' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Credencial Digital</h2>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#212328] border border-white/10 flex items-center justify-center text-white text-[11px] font-bold">
                {initials}
              </div>
            </div>

            {/* Tarjeta con QR y datos de credencial */}
            <div className="bg-[#161719] border border-white/10 rounded-[28px] p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[14px] tracking-tight text-white block">ADM MADUREIRA</span>
                  <span className="text-[9px] font-mono text-[#8E8E93] tracking-wider uppercase block">
                    FILIAL CONAMAD · {activeMember.congregationName || 'MADRID'}
                  </span>
                </div>
                <span className="px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full bg-[#214833] text-[#34D399] border border-[#34D399]/40">
                  VÁLIDA
                </span>
              </div>

              {/* RENDER DE LA TARJETA VISUAL REAL CONAMAD */}
              <div className="py-1">
                <VisualCredentialCard member={activeMember} />
              </div>

              {/* Botón Descargar PDF de Credencial */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadCredential}
                  className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-neutral-200 text-black text-[13px] font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 shadow-md"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>Descargar PDF (Credencial con sello oficial)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA: EXPEDIENTE (6 PANTALLAS OFICIALES: RESUMEN, DATOS, EDITAR, DOCUMENTOS, DETALLE DOCUMENTO, ACTIVIDAD) */}
        {activeScreen === 'expediente' && (
          <AdminExpedienteView
            member={activeMember}
            onBack={() => setActiveScreen('inicio')}
            onNavigateToCredencial={() => setActiveScreen('credencial')}
            onEmitirDocumento={() => setShowDocModal(true)}
            onDownloadFicha={handleDownloadFicha}
            onUpdateMember={(updated) => {
              setMember(updated);
            }}
            onShowToast={showToast}
          />
        )}

        {/* PANTALLA: DOCUMENTOS (Idéntica a Screen 13 de la foto) */}
        {activeScreen === 'documentos' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Documentación</h2>
              </div>
              <button
                type="button"
                onClick={() => openDocRequestModal(selectedTemplateCode)}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Dos tarjetas cuadradas: Certificados y Cartas */}
            <div className="grid grid-cols-2 gap-3">
              <div
                aria-disabled="true"
                className="bg-[#161719] border border-white/10 rounded-2xl p-4 space-y-3 opacity-45 cursor-not-allowed select-none shadow-sm relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#13314A] border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-white/10 text-[#8E8E93] border border-white/10">
                    Deshabilitado
                  </span>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white tracking-tight">
                    Certificados
                  </div>
                  <div className="text-[11px] text-[#8E8E93] leading-tight mt-0.5">
                    Función deshabilitada
                  </div>
                </div>
              </div>

              <div
                onClick={() => openDocRequestModal('carta_recomendacion')}
                className="bg-[#161719] border border-white/10 hover:border-white/20 rounded-2xl p-4 space-y-3 cursor-pointer transition-all shadow-sm group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D59573]/20 border border-[#D59573]/40 flex items-center justify-center text-[#D59573]">
                  <Mail className="w-5 h-5" />
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
            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2 font-semibold">
                <span>MIS TRÁMITES EN CURSO</span>
                <span>{docRequests.filter((d) => !['approved', 'delivered', 'rejected'].includes(d.status)).length}</span>
              </div>

              {docRequests.filter((d) => !['approved', 'delivered', 'rejected'].includes(d.status)).length === 0 ? (
                <div className="bg-[#161719] border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-white tracking-tight">Sin trámites pendientes</div>
                    <div className="text-[11px] text-[#8E8E93]">Sus solicitudes se tramitan en secretaría</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {docRequests
                    .filter((d) => !['approved', 'delivered', 'rejected'].includes(d.status))
                    .map((d) => (
                      <div key={d.id} className="bg-[#161719] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-white truncate">{d.documentTitle || d.templateCode}</div>
                          <div className="text-[11px] text-[#8E8E93] truncate">
                            {d.status === 'pending_approval' ? 'Enviada al Pastor para firma' : 'En revisión · Secretaría local'}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full shrink-0 ${
                          d.status === 'pending_approval'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/10 text-white'
                        }`}>
                          {d.status === 'pending_approval' ? 'APROBACIÓN PASTOR' : 'EN REVISIÓN'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* ÚLTIMO EMITIDO */}
            {(() => {
              const deliveredLetter = docRequests.find(
                (d) =>
                  ['approved', 'delivered'].includes(d.status) &&
                  (d.templateCode.startsWith('carta_') || d.documentTitle.toLowerCase().includes('carta'))
              );
              return (
                <div className="pt-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2 font-semibold">
                    ÚLTIMO EMITIDO
                  </div>
                  <div
                    onClick={() => {
                      if (deliveredLetter) {
                        const model = findLetterTemplate(deliveredLetter.templateCode || deliveredLetter.documentTitle);
                        const parsed = parseLetterObservations(deliveredLetter.observations);
                        const vals = {
                          ...createDefaultLetterValues(activeMember, memberCongregation),
                          ...(parsed.values || {}),
                        };
                        generateLetterPdf({
                          template: model,
                          values: vals,
                          dossierNumber: deliveredLetter.dossierNumber,
                          verificationToken: deliveredLetter.verificationToken,
                          congregation: memberCongregation,
                          pastorName: memberCongregation?.pastorName,
                          secretaryName: memberCongregation?.secretaryName,
                          dateStr: formatSpanishLongDate(deliveredLetter.createdAt),
                        });
                      } else {
                        handleDownloadFicha();
                      }
                    }}
                    className="bg-[#161719] border border-white/10 hover:border-white/20 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div>
                      <div className="text-[13px] font-bold text-white tracking-tight">
                        {deliveredLetter?.documentTitle || 'Carta de Recomendación Oficial'}
                      </div>
                      <div className="text-[11px] text-[#8E8E93]">
                        {deliveredLetter
                          ? `${new Date(deliveredLetter.createdAt).toLocaleDateString('es-ES')} · Aprobada y lista para descargar`
                          : '11/11/2026 · Validada con sello canónico'}
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-[#8E8E93]" />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* PANTALLA: CULTOS Y EVENTOS (Idéntica a Screen 15 de la foto) */}
        {activeScreen === 'eventos' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Cultos y Eventos</h2>
              </div>
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
          </div>
        )}

        {/* PANTALLA: COMUNICADOS (Idéntica a Screen 16 de la foto) */}
        {activeScreen === 'comunicados' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Comunicaciones</h2>
              </div>
            </div>

            <div className="bg-[#161719] border border-white/10 rounded-[26px] p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EE6E6E]/20 text-[#EE6E6E] flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-white">Boletín Oficial de Filial</div>
                  <div className="text-[11px] text-[#8E8E93]">Publicado por la Secretaría General</div>
                </div>
              </div>
              <p className="text-[13px] text-white/90 leading-relaxed">
                "Informamos a toda a comunidade e visitantes que os cultos públicos acontecem regularmente e as secretarias estão abertas para atendimento e oração."
              </p>
            </div>
          </div>
        )}

        {/* PANTALLA: ATENCIÓN AL MIEMBRO / CHAT INTEGRADO EN EL FLUJO (SIN POPUPS FLOTANTES) */}
        {activeScreen === 'atencion' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header del Chat */}
            <div className="flex items-center justify-between pb-1 select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveScreen('inicio')}
                  className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-[#212328] border border-white/10 flex items-center justify-center text-[#6A65A5] font-bold text-xs shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-white tracking-tight truncate flex items-center gap-1.5">
                    <span>Pr. Alexander Vance</span>
                    <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse shrink-0" />
                  </div>
                  <div className="text-[10px] text-[#8E8E93] font-mono truncate">
                    Gabinete Pastoral · Sede Madureira
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
                  CANAL CONFIDENCIAL DIRECTO
                </span>
              </div>

              {/* Burbujas de Conversación */}
              <div className="space-y-3 min-h-[190px] max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
                {memberMessages.map((msg) => {
                  const isMember = msg.sender === 'member';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 ${
                        isMember ? 'items-end ml-auto max-w-[88%]' : 'items-start max-w-[88%]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[11px] font-bold text-[#8E8E93]">
                          {isMember ? `${activeMember.firstName} ${activeMember.lastName}` : 'Pr. Alexander Vance'}
                        </span>
                        <span className="text-[9px] font-mono text-[#8E8E93]/60">{msg.time}</span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                          isMember
                            ? 'bg-white text-black font-medium rounded-tr-sm'
                            : 'bg-[#1C1D20] border border-white/10 text-white rounded-tl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {isMember && (
                        <div className="text-[9px] font-mono text-[#34D399] px-1 flex items-center gap-1">
                          <span>✓✓ Entregado</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Atajos Rápidos de Petición para el Miembro */}
              <div className="pt-1 border-t border-white/5 space-y-1.5">
                <div className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold">
                  PETICIONES RÁPIDAS
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSendMemberMessage('Pastor, solicito oración especial por salud en mi familia.')}
                    className="px-3 py-1.5 rounded-full bg-[#1C1D20] hover:bg-[#25272b] text-neutral-200 border border-white/10 whitespace-nowrap transition-colors cursor-pointer"
                  >
                    🙏 Oración por salud
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMemberMessage('Pastor, ¿sería posible agendar una visita pastoral a mi casa esta semana?')}
                    className="px-3 py-1.5 rounded-full bg-[#1C1D20] hover:bg-[#25272b] text-neutral-200 border border-white/10 whitespace-nowrap transition-colors cursor-pointer"
                  >
                    🏠 Visita pastoral
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMemberMessage('Paz del Señor, Pastor. Quisiera conversar en el gabinete pastoral.')}
                    className="px-3 py-1.5 rounded-full bg-[#1C1D20] hover:bg-[#25272b] text-neutral-200 border border-white/10 whitespace-nowrap transition-colors cursor-pointer"
                  >
                    📖 Cita en gabinete
                  </button>
                </div>
              </div>

              {/* Barra de Entrada de Mensaje Integrada en el Flujo */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={memberChatInput}
                  onChange={(e) => setMemberChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMemberMessage();
                    }
                  }}
                  placeholder="Escriba un mensaje al Pastor Vance..."
                  className="flex-1 bg-[#1C1D20] text-[13px] text-white placeholder-[#8E8E93] px-4 py-3 rounded-2xl border border-white/10 focus:border-white/30 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  disabled={!memberChatInput.trim()}
                  onClick={() => handleSendMemberMessage()}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 active:scale-95 ${
                    memberChatInput.trim()
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Registro Formal Alternativo */}
            <div className="bg-[#161719] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-[12px]">
              <div className="text-[#8E8E93] leading-relaxed">
                ¿Necesita registrar una solicitud formal ante la secretaría?
              </div>
              <button
                type="button"
                onClick={() => setShowReqModal(true)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[11px] font-bold shrink-0 transition-colors"
              >
                Abrir Formulario
              </button>
            </div>
          </div>
        )}

        {/* 08 · MENÚ COMPLETO DEL MIEMBRO (DRAWER) — Exacto a Screen 08 */}
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
                      PORTAL DO MEMBRO
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

              {/* LISTA CON PÍLDORA BLANCA ACTIVA */}
              <nav className="flex-1 py-4 space-y-1">
                <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] font-semibold">
                  MENU PRINCIPAL
                </div>

                {[
                  { id: 'inicio', label: 'Inicio', icon: Grid },
                  { id: 'credencial', label: 'Mi Credencial', icon: CreditCard },
                  { id: 'expediente', label: 'Mi Expediente & Ficha', icon: FileText },
                  { id: 'documentos', label: 'Documentación & Trámites', icon: FileCheck },
                  { id: 'eventos', label: 'Cultos y Eventos', icon: CalendarCheck },
                  { id: 'comunicados', label: 'Comunicaciones & Avisos', icon: Megaphone },
                  { id: 'atencion', label: 'Atención Pastoral (Oración)', icon: HeartHandshake },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  const showRedDot =
                    (item.id === 'documentos' && hasDocAlert) ||
                    (item.id === 'atencion' && hasMessageAlert);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveScreen(item.id as MemberScreenId);
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

                {onViewPublicPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onViewPublicPortal();
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 text-[13px] font-semibold rounded-full text-[#8E8E93] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 shrink-0 text-[#8E8E93]" />
                    <span>Portal Público</span>
                  </button>
                )}
              </nav>

              {/* Footer del Drawer: María Souza + Cerrar Sesión */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1C1F26] to-[#121418] border border-white/15 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-white truncate">
                      {activeMember.firstName} {activeMember.lastName}
                    </div>
                    <div className="text-[10px] font-mono text-[#8E8E93] uppercase">
                      {activeMember.memberNumber} · MIEMBRO
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onLogout();
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

        {/* BARRA INFERIOR FIJA DE 5 DESTINOS (Idéntica a la foto) */}
        <nav className="fixed bottom-0 inset-x-0 bg-[#101112]/95 backdrop-blur-xl border-t border-white/10 z-30 py-2 px-4 select-none">
          <div className="max-w-[480px] mx-auto flex items-center justify-around">
            <button
              type="button"
              onClick={() => setActiveScreen('inicio')}
              className={`flex flex-col items-center gap-1 min-w-[54px] py-1 transition-all cursor-pointer ${
                activeScreen === 'inicio' ? 'text-white font-bold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="text-[10px]">Inicio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('expediente')}
              className={`flex flex-col items-center gap-1 min-w-[54px] py-1 transition-all cursor-pointer ${
                activeScreen === 'expediente' ? 'text-white font-bold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px]">Miembros</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('documentos')}
              className={`flex flex-col items-center gap-1 min-w-[54px] py-1 transition-all cursor-pointer ${
                activeScreen === 'documentos' ? 'text-white font-bold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <div className="relative">
                <FileCheck className="w-4 h-4" />
                {hasDocAlert && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#101112] animate-pulse" />
                )}
              </div>
              <span className="text-[10px]">Docs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('credencial')}
              className={`flex flex-col items-center gap-1 min-w-[54px] py-1 transition-all cursor-pointer ${
                activeScreen === 'credencial' ? 'text-white font-bold' : 'text-[#8E8E93] hover:text-white'
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
                {hasMessageAlert && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#101112] animate-pulse" />
                )}
              </div>
              <span className="text-[10px]">Más</span>
            </button>
          </div>
        </nav>
      </div>

      {/* MODAL SOLICITAR DOCUMENTO */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#161719] border border-white/15 rounded-[28px] p-6 space-y-4 shadow-2xl animate-fadeIn my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-[18px] font-bold text-white tracking-tight">Solicitar Documento Canónico</h3>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="text-[#8E8E93] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestDocument} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Tipo de Documento</label>
                <select
                  value={selectedTemplateCode}
                  onChange={(e) => {
                    setSelectedTemplateCode(e.target.value);
                    setLetterValues(createDefaultLetterValues(activeMember, memberCongregation));
                    setDocFormError(null);
                  }}
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                >
                  {ACTIVE_LETTER_TEMPLATES.map((lt) => (
                    <option key={lt.code} value={lt.code}>
                      {lt.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplateCode.startsWith('carta_') ? (
                (() => {
                  const model = findLetterTemplate(selectedTemplateCode);
                  // Campos del miembro ya rellenados automáticamente desde su perfil
                  const autoFilledMemberFields = model.fields.filter(
                    (f) => f.source === 'member' && Boolean(String(createDefaultLetterValues(activeMember, memberCongregation)[f.key] || '').trim())
                  );
                  // Campos que faltan en su perfil + campos específicos que necesita la carta
                  const neededFields = model.fields.filter((f) => {
                    if (f.source === 'registry') return false;
                    if (f.source === 'request') return true;
                    const profileDefaults = createDefaultLetterValues(activeMember, memberCongregation);
                    return !String(profileDefaults[f.key] || '').trim();
                  });

                  return (
                    <div className="space-y-3">
                      {/* Resumen automático de datos del usuario */}
                      <div className="bg-[#1C1D20] border border-emerald-500/20 rounded-2xl p-3 space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                          Datos de tu usuario rellenados automáticamente
                        </div>
                        <div className="text-[11.5px] text-neutral-300 space-y-0.5">
                          {autoFilledMemberFields.map((f) => (
                            <div key={f.key}>
                              <span className="text-[#8E8E93]">{f.label}:</span>{' '}
                              <span className="text-white font-medium">{String(letterValues[f.key] || '')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Datos adicionales solicitados antes de enviar */}
                      {neededFields.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="text-[11px] font-semibold text-[#D59573]">
                            Complete estos datos para generar la carta:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {neededFields.map((f) => (
                              <div key={f.key} className={`space-y-1 ${f.fullWidth ? 'sm:col-span-2' : ''}`}>
                                <label className="text-[11px] font-medium text-[#8E8E93]">
                                  {f.label} {f.required ? '*' : ''}
                                </label>
                                <input
                                  type="text"
                                  value={String(letterValues[f.key] || '')}
                                  onChange={(e) => {
                                    setDocFormError(null);
                                    setLetterValues((prev) => ({
                                      ...prev,
                                      [f.key]: e.target.value,
                                    }));
                                  }}
                                  placeholder={f.placeholder}
                                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3 py-2 text-[12.5px] text-white focus:outline-none focus:border-[#D59573]/60"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Invitados si pide Carta de Invitación (Invitados / Evento) */}
                      {model.hasGuestTable && (
                        <div className="space-y-2 pt-1 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-white">Invitados *</span>
                            <button
                              type="button"
                              onClick={() =>
                                setLetterValues((prev) => ({
                                  ...prev,
                                  guests: [
                                    ...prev.guests,
                                    {
                                      fullName: '',
                                      passport: '',
                                      birthDate: '',
                                      nationality: prev.nacionalidadInvitados || '',
                                    },
                                  ],
                                }))
                              }
                              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold"
                            >
                              + Añadir invitado
                            </button>
                          </div>
                          {letterValues.guests.map((guest, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-2 bg-[#1C1D20] p-2.5 rounded-xl border border-white/10">
                              <input
                                type="text"
                                value={guest.fullName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLetterValues((prev) => {
                                    const next = [...prev.guests];
                                    next[idx] = { ...next[idx], fullName: val };
                                    return { ...prev, guests: next };
                                  });
                                }}
                                placeholder="Nombre completo *"
                                className="bg-[#141517] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none"
                              />
                              <input
                                type="text"
                                value={guest.passport}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLetterValues((prev) => {
                                    const next = [...prev.guests];
                                    next[idx] = { ...next[idx], passport: val };
                                    return { ...prev, guests: next };
                                  });
                                }}
                                placeholder="N.º Pasaporte *"
                                className="bg-[#141517] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none"
                              />
                              <input
                                type="text"
                                value={guest.birthDate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLetterValues((prev) => {
                                    const next = [...prev.guests];
                                    next[idx] = { ...next[idx], birthDate: val };
                                    return { ...prev, guests: next };
                                  });
                                }}
                                placeholder="Nacimiento (DD/MM/AAAA)"
                                className="bg-[#141517] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none"
                              />
                              <input
                                type="text"
                                value={guest.nationality}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLetterValues((prev) => {
                                    const next = [...prev.guests];
                                    next[idx] = { ...next[idx], nationality: val };
                                    return { ...prev, guests: next };
                                  });
                                }}
                                placeholder="Nacionalidad"
                                className="bg-[#141517] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93]">Motivo / Observaciones</label>
                  <textarea
                    rows={3}
                    value={docObservations}
                    onChange={(e) => setDocObservations(e.target.value)}
                    placeholder="Especifique el fin de la solicitud o sede de destino..."
                    className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none resize-none"
                  />
                </div>
              )}

              {docFormError && (
                <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/30 text-[11.5px] text-red-300">
                  {docFormError}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-[#212328] text-white text-[13px] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingDoc}
                  className="flex-1 py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-neutral-200 transition-all shadow-sm disabled:opacity-50"
                >
                  {submittingDoc ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PETICIÓN PASTORAL CONFIDENCIAL */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161719] border border-white/15 rounded-[28px] p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-[18px] font-bold text-white tracking-tight">Petición Pastoral Confidencial</h3>
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className="text-[#8E8E93] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMemberRequest} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Tipo de Petición</label>
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value as any)}
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                >
                  <option value="prayer_request">Pedido de Oración & Salud</option>
                  <option value="admin_inquiry">Visita Pastoral a Familia</option>
                  <option value="suggestion">Consejería Espiritual</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Asunto Breve</label>
                <input
                  type="text"
                  required
                  value={reqSubject}
                  onChange={(e) => setReqSubject(e.target.value)}
                  placeholder="Ej. Oración por salud familiar"
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8E8E93]">Descripción confidencial para el Pastor</label>
                <textarea
                  rows={3}
                  required
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  placeholder="Comparta su petición con confianza..."
                  className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-[#1C1D20] rounded-xl text-[11px] text-[#8E8E93] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Canal 100% privado y exclusivo con el pastor de la congregación.</span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-[#212328] text-white text-[13px] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="flex-1 py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-neutral-200 transition-all shadow-sm disabled:opacity-50"
                >
                  {submittingReq ? 'Enviando...' : 'Enviar al Pastor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR FICHA CANÓNICA */}
      {showEditFichaModal && (
        <EditMemberFichaModal
          member={activeMember}
          currentUser={currentUser}
          onClose={() => setShowEditFichaModal(false)}
          onSaved={(updated) => {
            setMember(updated);
            setShowEditFichaModal(false);
            showToast('Ficha de miembro actualizada exitosamente.');
          }}
        />
      )}

      {/* MODAL FICHA OFICIAL A4 PARA IMPRIMIR */}
      {showFichaModal && (
        <OfficialMemberFichaModal
          member={activeMember}
          onClose={() => setShowFichaModal(false)}
        />
      )}
    </div>
  );
};
