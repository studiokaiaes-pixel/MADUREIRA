import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  QrCode,
  Eye,
  FileText,
  Building2,
  X,
  Send,
  Mail,
} from 'lucide-react';
import { api } from '../api';
import {
  Congregation,
  DocumentRequest,
  DocumentRequestStatus,
  DocumentTemplate,
  Member,
  User,
} from '../types';
import { CartasModal } from './CartasModal';
import { parseLetterObservations } from '../utils/letterTemplates';

interface DocumentationModuleProps {
  currentUser: User;
}

export const DocumentationModule: React.FC<DocumentationModuleProps> = ({
  currentUser,
}) => {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal Nueva Solicitud
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('REC_LETTER');
  const [selectedMemberId, setSelectedMemberId] = useState<number>(1);
  const [requestObservations, setRequestObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Visor Documento Oficial
  const [viewingRequest, setViewingRequest] = useState<DocumentRequest | null>(null);

  // Modal Cartas & Modelos
  const [showCartasModal, setShowCartasModal] = useState(false);
  const [cartasInitialTab, setCartasInitialTab] = useState<'modelos' | 'redactar' | 'solicitudes'>('modelos');
  const [cartasInitialRequest, setCartasInitialRequest] = useState<DocumentRequest | null>(null);
  const [adminCongregation, setAdminCongregation] = useState<Congregation | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqList, tempLi, memList, cong] = await Promise.all([
        api.fetchDocumentRequests({
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        }),
        api.fetchDocumentTemplates(),
        api.fetchMembers(),
        api.fetchAdminCongregation().catch(() => null),
      ]);
      setRequests(reqList);
      setTemplates(tempLi);
      setMembers(memList);
      if (cong) setAdminCongregation(cong);
      if (memList.length > 0) {
        setSelectedMemberId(memList[0].id);
      }
    } catch (err) {
      console.error('Error al cargar documentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createDocumentRequest({
        templateCode: selectedTemplate,
        memberId: selectedMemberId,
        observations: requestObservations,
      });
      setShowRequestModal(false);
      setRequestObservations('');
      loadData();
    } catch (err: any) {
      alert(`Error al registrar trámite: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: DocumentRequestStatus) => {
    try {
      await api.updateDocumentRequestStatus(id, newStatus);
      loadData();
    } catch (err: any) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  const getStatusBadge = (status: DocumentRequestStatus) => {
    switch (status) {
      case 'received':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-neutral-500/20 text-neutral-300 border border-neutral-500/30">RECIBIDA</span>;
      case 'under_review':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">EN REVISIÓN</span>;
      case 'in_preparation':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">EN PREPARACIÓN</span>;
      case 'pending_approval':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">PENDIENTE VISTO BUENO</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">APROBADA</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">ENTREGADA</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/30">RECHAZADA</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-white/10 text-white">{status}</span>;
    }
  };

  const isSecondaryPastor = currentUser.role === 'pastor_advisor';
  const isSecretaryOnly = ['local_secretary', 'secretary'].includes(currentUser.role);
  const requiresPastorApproval = isSecretaryOnly || isSecondaryPastor;
  const isPastorOrAdmin = ['admin', 'superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'root'].includes(currentUser.role);
  const canManage = requiresPastorApproval || isPastorOrAdmin;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-orange-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                SECRETARÍA DOCUMENTAL
              </span>
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
              Central de Emisión Documental
            </h1>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
              Cartas de recomendación, certificados oficiales de membresía, presentación y traslado con verificación mediante código QR.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCartasInitialRequest(null);
                setCartasInitialTab('modelos');
                setShowCartasModal(true);
              }}
              className="h-[44px] px-4 text-[14px] font-semibold bg-[#D59573] text-black hover:bg-[#e0a382] rounded-2xl transition-all shadow-sm flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Modelos y Cartas</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRequestModal(true)}
              className="h-[44px] px-5 text-[14px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-2xl transition-all shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Solicitar Trámite</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="pt-3 border-t border-white/5 flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'Todos los Trámites' },
            { id: 'received', label: 'Recibidas' },
            { id: 'in_preparation', label: 'En Preparación' },
            { id: 'pending_approval', label: 'Pendientes Aprobación' },
            { id: 'approved', label: 'Aprobadas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`py-1.5 px-3.5 text-[13px] font-semibold rounded-xl transition-all ${
                selectedStatus === tab.id
                  ? 'bg-[#2C2C2E] text-white shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Requests List */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 text-[13px] text-[#8E8E93]">
          <span>Mostrando <strong className="text-white">{requests.length}</strong> solicitudes documentales</span>
          <span>Ciclo formal de validación eclesiástica</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[14px] text-[#8E8E93]">Cargando solicitudes...</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-[#8E8E93]">
            No hay trámites documentales registrados en esta sección.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-5 bg-[#161618] border border-white/5 hover:border-white/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[16px] font-bold text-white tracking-tight truncate">
                      {req.documentTitle}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="text-[13px] text-[#8E8E93] flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{req.memberName}</span>
                    <span>·</span>
                    <span className="font-mono text-neutral-400">{req.dossierNumber}</span>
                    <span>·</span>
                    <span>{req.congregationName}</span>
                    <span>·</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  {req.observations && (
                    <div className="text-[12px] text-neutral-400 italic">
                      Nota: {parseLetterObservations(req.observations).summary}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewingRequest(req)}
                    className="h-[38px] px-3.5 text-[12px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Documento</span>
                  </button>

                  {requiresPastorApproval && ['received', 'under_review', 'in_preparation'].includes(req.status) && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'pending_approval')}
                      className="h-[38px] px-3.5 text-[12px] font-semibold bg-[#D59573] hover:bg-[#e0a382] text-black rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar al Pastor</span>
                    </button>
                  )}

                  {requiresPastorApproval && req.status === 'pending_approval' && (
                    <span className="text-[11px] text-amber-300 flex items-center gap-1 px-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Esperando aprobación pastoral</span>
                    </span>
                  )}

                  {isPastorOrAdmin && !requiresPastorApproval && req.status !== 'approved' && req.status !== 'delivered' && req.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'delivered')}
                      className="h-[38px] px-3.5 text-[12px] font-semibold bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprobar y Enviar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Solicitar Trámite Documental */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-[20px] font-bold tracking-tight text-white">Solicitud de Documento Eclesiástico</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-[#8E8E93] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Tipo de Documento Oficial *</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none"
                >
                  {templates.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.title} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              {canManage && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Miembro Solicitante *</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.memberNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Observaciones / Destino del Documento</label>
                <textarea
                  rows={3}
                  value={requestObservations}
                  onChange={(e) => setRequestObservations(e.target.value)}
                  placeholder="Ej. Dirigido a la convención nacional o cambio de congregación."
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="h-[42px] px-4 text-[13px] font-semibold text-[#8E8E93] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[42px] px-5 text-[13px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl"
                >
                  {submitting ? 'Generando Trámite...' : 'Emitir Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visor de Documento Oficial con Formato Institucional y QR */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white text-black rounded-3xl p-8 sm:p-12 shadow-2xl my-6 space-y-8 border border-neutral-300">
            {/* Cabecera Oficial Eclesiástica */}
            <div className="text-center space-y-2 border-b-2 border-black pb-6">
              <div className="w-12 h-12 rounded-2xl bg-black text-white font-bold text-2xl flex items-center justify-center mx-auto mb-2">
                ✝
              </div>
              <div className="text-[18px] font-bold tracking-tight uppercase">
                ASSEMBLEIA DE DEUS · MINISTÉRIO DE MADUREIRA
              </div>
              <div className="text-[12px] font-semibold tracking-wider uppercase text-neutral-600">
                CONVENÇÃO NACIONAL DAS ASSEMBLEIAS DE DEUS NO BRASIL (CONAMAD)
              </div>
              <div className="text-[11px] text-neutral-500 font-mono">
                {viewingRequest.congregationName || 'Sede Central Oficial'}
              </div>
            </div>

            {/* Número de Expediente & Fecha */}
            <div className="flex items-center justify-between text-[12px] text-neutral-600 font-mono border-b border-neutral-200 pb-3">
              <span>EXPEDIENTE: <strong className="text-black">{viewingRequest.dossierNumber}</strong></span>
              <span>FECHA DE EMISIÓN: <strong className="text-black">{new Date(viewingRequest.createdAt).toLocaleDateString()}</strong></span>
            </div>

            {/* Título Oficial */}
            <div className="text-center py-2">
              <h2 className="text-[22px] font-extrabold uppercase tracking-tight text-neutral-900 underline underline-offset-8">
                {viewingRequest.documentTitle}
              </h2>
            </div>

            {/* Cuerpo del Documento Oficial */}
            <div className="text-[14px] leading-relaxed text-neutral-800 space-y-4 text-justify font-serif">
              <p>
                Por medio del presente instrumento eclesiástico oficial, la <strong>Secretaría de la Assembleia de Deus Ministério de Madureira</strong> hace constar y certifica que el hermano(a) <strong>{viewingRequest.memberName}</strong>, titular de la matrícula eclesiástica número <strong>{viewingRequest.memberNumber}</strong>, es miembro debidamente registrado y activo en nuestra corporación religiosa.
              </p>
              <p>
                El interesado se encuentra en plena comunión con el cuerpo ministerial, observando la doctrina apostólica, el orden institucional y participando de las actividades regulares de la filial de <strong>{viewingRequest.congregationName}</strong>.
              </p>
              {viewingRequest.observations && (
                <p className="p-3 bg-neutral-100 rounded-xl text-[13px] font-sans border-l-4 border-black">
                  <strong>Observaciones administrativas autorizadas:</strong> {parseLetterObservations(viewingRequest.observations).summary}
                </p>
              )}
              <p>
                Se expide el presente documento a solicitud de la parte interesada para los fines eclesiásticos o institucionales que fueren necesarios.
              </p>
            </div>

            {/* Bloque de Firmas y Código QR de Verificación */}
            <div className="pt-8 border-t border-neutral-200 grid grid-cols-2 gap-8 items-end">
              <div className="space-y-2 text-center">
                <div className="border-b border-black w-48 mx-auto" />
                <div className="text-[12px] font-bold text-black uppercase">Pastor Presidente Regional</div>
                <div className="text-[10px] text-neutral-500">Gabinete Pastoral ADM Madureira</div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-16 h-16 bg-neutral-100 border border-neutral-300 rounded-xl flex items-center justify-center p-1">
                  <QrCode className="w-12 h-12 text-black" />
                </div>
                <div className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider text-center">
                  CÓDIGO DE VALIDACIÓN OFICIAL<br />
                  <strong className="text-black">{viewingRequest.verificationToken || 'VALIDADO'}</strong>
                </div>
              </div>
            </div>

            {/* Controles del Modal */}
            <div className="pt-4 flex items-center justify-between border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                className="text-[13px] font-semibold text-neutral-600 hover:text-black"
              >
                Cerrar Visor
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="h-[42px] px-6 text-[13px] font-semibold bg-black text-white hover:bg-neutral-800 rounded-2xl flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Exportar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
          onUpdated={loadData}
          onShowToast={() => {}}
        />
      )}
    </div>
  );
};
