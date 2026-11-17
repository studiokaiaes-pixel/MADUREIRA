import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Church,
  FileCheck,
  History,
  FileSpreadsheet,
  ArrowLeft,
  Printer,
  ArrowRightLeft,
  ShieldAlert,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { api } from '../api';
import { OfficialMemberFichaModal } from './OfficialMemberFichaModal';
import { generateFichaPdf } from '../utils/generateFichaPdf';
import { DEFAULT_HUMATION_DATA_URL } from './HumationAvatar';
import {
  Congregation,
  DigitalCredential,
  DocumentRequest,
  Member,
  MemberDocumentItem,
  MemberHistoryItem,
  User,
} from '../types';

interface MemberDossierViewProps {
  memberId: number;
  currentUser: User;
  onBack: () => void;
}

export const MemberDossierView: React.FC<MemberDossierViewProps> = ({
  memberId,
  currentUser,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'ecclesiastical' | 'documents' | 'history' | 'requests'>('personal');
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<MemberHistoryItem[]>([]);
  const [documents, setDocuments] = useState<MemberDocumentItem[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [credential, setCredential] = useState<DigitalCredential | null>(null);
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Modal Traslado
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetCongregationId, setTargetCongregationId] = useState<number>(1);
  const [transferReason, setTransferReason] = useState('');

  // Modal Estado
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('active');
  const [statusReason, setStatusReason] = useState('');

  // Modal Ficha Oficial Canónica (Word Modelo)
  const [showFichaModal, setShowFichaModal] = useState(false);

  const loadDossier = async () => {
    try {
      setLoading(true);
      const [dossier, congList] = await Promise.all([
        api.fetchMemberDossier(memberId),
        api.fetchCongregations(),
      ]);
      setMember(dossier.member);
      setHistory(dossier.history);
      setDocuments(dossier.documents);
      setRequests(dossier.requests);
      setCredential(dossier.credential || null);
      setCongregations(congList);
    } catch (err: any) {
      console.error('Error al cargar expediente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDossier();
  }, [memberId]);

  const handlePrintFicha = () => {
    setShowFichaModal(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.transferMember(memberId, targetCongregationId, transferReason);
      setShowTransferModal(false);
      setTransferReason('');
      setMessage('Traslado eclesiástico ejecutado y archivado en el expediente.');
      setTimeout(() => setMessage(null), 4000);
      loadDossier();
    } catch (err: any) {
      alert(`Error al trasladar: ${err.message}`);
    }
  };

  const handleExecuteStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateMemberStatus(memberId, targetStatus, statusReason);
      setShowStatusModal(false);
      setStatusReason('');
      setMessage(`Estado de membresía actualizado a "${targetStatus}".`);
      setTimeout(() => setMessage(null), 4000);
      loadDossier();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center max-w-4xl mx-auto space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
        <div className="text-[14px] text-[#8E8E93]">Cargando expediente digital...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-24 text-center max-w-4xl mx-auto space-y-4">
        <div className="text-[18px] font-bold text-white">Expediente no encontrado</div>
        <button
          onClick={onBack}
          className="px-5 py-2 text-[13px] font-semibold bg-white text-black rounded-xl hover:bg-neutral-200"
        >
          Volver a Miembros
        </button>
      </div>
    );
  }

  const canManage = ['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'local_secretary', 'root'].includes(currentUser.role);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button & Dossier Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13px] font-medium text-[#8E8E93] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Registro General</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón 1 (CSS selector 1): Generar Ficha Oficial (Abre el visor interactivo de la Ficha Canónica A4) */}
          <button
            onClick={handlePrintFicha}
            title="Generar Ficha Oficial de Miembro con formato canónico (Word/PDF)"
            className="h-[38px] px-3.5 text-[12px] font-semibold bg-[#DA4814] hover:bg-[#e6521e] text-white rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generar Ficha</span>
          </button>

          {/* Botón 2 (CSS selector 2): Descarga directa de la Ficha Oficial en PDF */}
          <button
            onClick={async () => {
              if (member) {
                try {
                  await generateFichaPdf(member);
                  setMessage('Ficha Oficial de Miembro generada y descargada en PDF.');
                  setTimeout(() => setMessage(null), 4000);
                } catch {
                  setShowFichaModal(true);
                }
              }
            }}
            title="Descargar Ficha Oficial en formato PDF"
            className="h-[38px] px-3.5 text-[12px] font-semibold bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#DA4814]/40 text-[#DA4814] hover:text-white rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#DA4814]" />
            <span>Descargar PDF</span>
          </button>

          {canManage && (
            <>
              <button
                onClick={() => setShowTransferModal(true)}
                className="h-[38px] px-3.5 text-[12px] font-semibold bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-white rounded-xl flex items-center gap-1.5 transition-all"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                <span>Traslado</span>
              </button>

              <button
                onClick={() => setShowStatusModal(true)}
                className="h-[38px] px-3.5 text-[12px] font-semibold bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-white rounded-xl flex items-center gap-1.5 transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Estado</span>
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-[13px] text-emerald-300">
          ✓ {message}
        </div>
      )}

      {/* Member Hero Banner */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={member.photoUrl || DEFAULT_HUMATION_DATA_URL}
              alt={member.firstName}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-white/15 shrink-0 shadow-lg bg-[#F4F4F5]"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-white leading-tight">
                  {member.firstName} {member.lastName}
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {member.status}
                </span>
              </div>
              <div className="text-[13px] text-[#8E8E93] flex flex-wrap items-center gap-3">
                <span className="font-semibold text-white">Nº {member.memberNumber}</span>
                <span>·</span>
                <span className="text-neutral-300">📍 {member.congregationName || 'Sede'}</span>
                <span>·</span>
                <span>{member.ministerialFunction || 'Miembro'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 bg-[#161618] border border-white/10 rounded-2xl text-right min-w-[140px]">
              <div className="text-[10px] font-semibold uppercase text-[#8E8E93]">ADMISIÓN OFICIAL</div>
              <div className="text-[14px] font-bold text-white mt-0.5">{member.admissionDate || 'N/D'}</div>
            </div>
          </div>
        </div>

        {/* 5 Tabs de Navegación del Expediente */}
        <div className="pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
          {[
            { id: 'personal', label: '1. Información Personal', icon: UserIcon },
            { id: 'ecclesiastical', label: '2. Información Eclesiástica', icon: Church },
            { id: 'documents', label: `3. Documentos (${documents.length})`, icon: FileCheck },
            { id: 'history', label: `4. Historial (${history.length})`, icon: History },
            { id: 'requests', label: `5. Solicitudes (${requests.length})`, icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-4 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#8E8E93] hover:text-white bg-[#1C1C1E]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-[#8E8E93]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Información Personal */}
      {activeTab === 'personal' && (
        <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 space-y-6 shadow-xl">
          <h3 className="text-[18px] font-bold tracking-tight text-white">Datos Biográficos &amp; Civiles</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Nombre Completo</div>
              <div className="text-[15px] font-medium text-white">{member.firstName} {member.lastName}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Documento de Identificación</div>
              <div className="text-[15px] font-medium text-white">{member.idDocument || 'No registrado'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Fecha de Nacimiento</div>
              <div className="text-[15px] font-medium text-white">{member.birthDate || 'No registrada'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Nacionalidad</div>
              <div className="text-[15px] font-medium text-white">{member.nationality || 'Brasileña'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Correo Electrónico</div>
              <div className="text-[15px] font-medium text-white">{member.email || 'Sin correo'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Teléfono Móvil / WhatsApp</div>
              <div className="text-[15px] font-medium text-white">{member.phone || 'No registrado'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1 md:col-span-2">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Dirección Residencial</div>
              <div className="text-[15px] font-medium text-white">
                {member.address ? `${member.address}, ${member.city || ''} (C.P. ${member.postalCode || ''})` : 'Dirección no especificada'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Información Eclesiástica */}
      {activeTab === 'ecclesiastical' && (
        <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 space-y-6 shadow-xl">
          <h3 className="text-[18px] font-bold tracking-tight text-white">Historial de Membresía &amp; Ministerio</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Congregación Actual</div>
              <div className="text-[15px] font-bold text-white">{member.congregationName || 'Filial Principal'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Número Oficial de Matrícula</div>
              <div className="text-[15px] font-bold text-white font-mono">{member.memberNumber}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Fecha de Bautismo en Aguas</div>
              <div className="text-[15px] font-medium text-white">{member.baptismDate || 'Pendiente de bautismo'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Fecha de Admisión en Comunión</div>
              <div className="text-[15px] font-medium text-white">{member.admissionDate || 'N/D'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Función / Cargo Ministerial</div>
              <div className="text-[15px] font-medium text-white">{member.ministerialFunction || 'Miembro'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Pastor Dirigente Responsable</div>
              <div className="text-[15px] font-medium text-white">{member.pastorResponsible || 'Gabinete Pastoral'}</div>
            </div>

            <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1">
              <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Secretario Responsable</div>
              <div className="text-[15px] font-medium text-white">{member.secretaryResponsible || 'Secretaría Oficial'}</div>
            </div>

            {member.observations && (
              <div className="p-4 bg-[#161618] border border-white/5 rounded-2xl space-y-1 md:col-span-2">
                <div className="text-[11px] font-semibold uppercase text-[#8E8E93]">Observaciones Eclesiásticas</div>
                <div className="text-[14px] text-neutral-300 leading-relaxed">{member.observations}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Documentos */}
      {activeTab === 'documents' && (
        <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-[18px] font-bold tracking-tight text-white">Documentación Digital Archivada</h3>
              <p className="text-[13px] text-[#8E8E93]">Certificados oficiales emitidos y copias resguardadas</p>
            </div>
            <span className="text-[12px] font-semibold text-[#8E8E93]">{documents.length} documentos</span>
          </div>

          {documents.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#8E8E93]">
              No existen documentos emitidos formalmente para este expediente todavía.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 bg-[#161618] border border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[14px] font-bold text-white">{doc.title}</div>
                    <div className="text-[12px] text-[#8E8E93]">
                      <span>Tipo: {doc.documentType}</span> · <span>Emitido por: {doc.issuedBy || 'Secretaría'}</span> · <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full">
                    OFICIAL Y VERIFICADO
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Historial */}
      {activeTab === 'history' && (
        <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 space-y-6 shadow-xl">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-[18px] font-bold tracking-tight text-white">Trazabilidad &amp; Historial de Movimientos</h3>
            <p className="text-[13px] text-[#8E8E93]">Registro inmutable de traslados, ascensos ministeriales y modificaciones</p>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#8E8E93]">No hay registros históricos para este expediente.</div>
          ) : (
            <div className="relative pl-6 border-l border-white/10 space-y-6">
              {history.map((h) => (
                <div key={h.id} className="relative space-y-1">
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#121214]" />
                  <div className="text-[14px] font-bold text-white">{h.description}</div>
                  <div className="text-[12px] text-[#8E8E93] flex items-center gap-2">
                    <span>Responsable: <strong className="text-neutral-300">{h.performedBy}</strong></span>
                    <span>·</span>
                    <span>{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Solicitudes */}
      {activeTab === 'requests' && (
        <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 space-y-6 shadow-xl">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-[18px] font-bold tracking-tight text-white">Trámites Documentales Asociados</h3>
            <p className="text-[13px] text-[#8E8E93]">Solicitudes cursadas y estado de emisión</p>
          </div>

          {requests.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#8E8E93]">No hay solicitudes documentales en trámite.</div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="p-4 bg-[#161618] border border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[14px] font-bold text-white">{r.documentTitle}</div>
                    <div className="text-[12px] text-[#8E8E93]">
                      <span>Exp: {r.dossierNumber}</span> · <span>Fecha: {new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-white/10 text-white uppercase">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Traslado */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-5 shadow-2xl">
            <h3 className="text-[18px] font-bold text-white">Traslado Oficial de Congregación</h3>
            <p className="text-[13px] text-[#8E8E93]">
              Transfiera formalmente el expediente de <strong className="text-white">{member.firstName} {member.lastName}</strong> a otra filial autorizada.
            </p>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Congregación de Destino *</label>
                <select
                  value={targetCongregationId}
                  onChange={(e) => setTargetCongregationId(Number(e.target.value))}
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none"
                >
                  {congregations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.city} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Motivo del Traslado *</label>
                <textarea
                  required
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Ej. Cambio de domicilio por motivos laborales, acordado con pastorado."
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2 text-[13px] text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="text-[13px] font-medium text-[#8E8E93] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[42px] px-5 text-[13px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl"
                >
                  Autorizar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Estado */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-5 shadow-2xl">
            <h3 className="text-[18px] font-bold text-white">Transición de Estado Eclesiástico</h3>
            <p className="text-[13px] text-[#8E8E93]">
              Actualice el estatus eclesiástico oficial del expediente.
            </p>

            <form onSubmit={handleExecuteStatusChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Nuevo Estado *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none"
                >
                  <option value="active">Activo (En plena comunión)</option>
                  <option value="pending">Pendiente de Aprobación</option>
                  <option value="inactive">Inactivo (Sin asistencia continuada)</option>
                  <option value="suspended">Suspendido (Disciplina pastoral)</option>
                  <option value="deceased">Fallecido (Con el Señor)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Observaciones / Resolución</label>
                <textarea
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Detalles sobre el acuerdo pastoral de cambio de estado."
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2 text-[13px] text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="text-[13px] font-medium text-[#8E8E93] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[42px] px-5 text-[13px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl"
                >
                  Guardar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Oficial de Miembro (Canónica según modelo de Word) */}
      {showFichaModal && member && (
        <OfficialMemberFichaModal
          member={member}
          onClose={() => setShowFichaModal(false)}
        />
      )}
    </div>
  );
};
