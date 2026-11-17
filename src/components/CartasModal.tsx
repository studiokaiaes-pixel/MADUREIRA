import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Clock,
  ShieldCheck,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '../api';
import { Congregation, DocumentRequest, Member, User } from '../types';
import { resolveFichaChurchInfo } from '../utils/generateFichaPdf';
import {
  ACTIVE_LETTER_TEMPLATES,
  LetterFieldValues,
  LetterTemplateDef,
  buildLetterSummary,
  createDefaultLetterValues,
  findLetterTemplate,
  formatLetterFooterLine,
  formatLetterHeaderAddress,
  formatSpanishLongDate,
  generateLetterPdf,
  parseLetterObservations,
  serializeLetterObservations,
} from '../utils/letterTemplates';

interface CartasModalProps {
  currentUser?: User;
  members: Member[];
  congregation?: Congregation | null;
  initialTab?: 'modelos' | 'redactar' | 'solicitudes';
  initialRequest?: DocumentRequest | null;
  onClose: () => void;
  onUpdated: () => void;
  onShowToast: (msg: string) => void;
}

interface LetterSheetPreviewProps {
  template: LetterTemplateDef;
  values: LetterFieldValues;
  congregation?: Congregation | null;
  pastorName?: string;
  secretaryName?: string;
  dateStr?: string;
  dossierNumber?: string;
}

const LetterSheetPreview: React.FC<LetterSheetPreviewProps> = ({
  template,
  values,
  congregation,
  pastorName,
  secretaryName,
  dateStr,
}) => {
  const churchInfo = resolveFichaChurchInfo(congregation);
  const rendered = template.buildDocument({
    values,
    churchName: churchInfo.name,
    pastorName: pastorName || congregation?.pastorName || 'Pr. Valdomiro dos Santos da Silva',
  });

  const displayDate = dateStr || formatSpanishLongDate();
  const displayPastor = pastorName || congregation?.pastorName || 'Pr. Valdomiro dos Santos da Silva';
  const displaySecretary = secretaryName || congregation?.secretaryName || 'Patricia Pereira Santos';

  return (
    <div className="bg-white text-black rounded-xl p-6 sm:p-8 space-y-4 shadow-xl border border-neutral-300 text-[12px]">
      {/* Cabecera Oficial */}
      <div className="flex items-center gap-3 border-b border-neutral-400 pb-3.5">
        <img
          src="/assets/aistudio/image003_7f3b24a6.png"
          alt="Logo ADMM"
          className="w-11 h-auto object-contain shrink-0"
        />
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-tight text-neutral-900">
            IGLESIA ASAMBLEA DE DIOS MINISTERIO MADUREIRA
          </div>
          <div className="text-[10.5px] text-neutral-600">
            {formatLetterHeaderAddress(congregation)}
          </div>
          <div className="text-[10.5px] text-neutral-600">NIF: {churchInfo.nif}</div>
        </div>
      </div>

      {/* Título y subtítulo */}
      <div className="text-center pt-1 space-y-0.5">
        <h4 className="text-[16px] font-extrabold uppercase tracking-wide text-black">
          {template.documentTitle}
        </h4>
        {rendered.subHeader && (
          <div className="text-[10.5px] text-neutral-600">{rendered.subHeader}</div>
        )}
      </div>

      {/* Fecha */}
      <div className="space-y-0.5 text-[11.5px]">
        <div className="font-medium text-neutral-900">
          {churchInfo.city || 'Madrid'}, {displayDate}
        </div>
      </div>

      {/* Saludo y cuerpo fijo del modelo */}
      <div className="space-y-3 text-[11.5px] leading-relaxed text-neutral-900 text-justify">
        <p className="text-left font-medium">{rendered.greeting}</p>

        {rendered.paragraphsBeforeTable.map((p, idx) => (
          <p key={`pre-${idx}`}>{p}</p>
        ))}

        {rendered.bullets && rendered.bullets.length > 0 && (
          <ul className="list-disc pl-6 space-y-1 text-left">
            {rendered.bullets.map((b, idx) => (
              <li key={`bul-${idx}`}>{b}</li>
            ))}
          </ul>
        )}

        {rendered.hasGuestTable && (
          <div className="overflow-x-auto pt-1 pb-1">
            <table className="w-full border-collapse border border-neutral-500 text-[10.5px]">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-neutral-500 px-2 py-1.5 text-center font-bold">
                    Nombre completo
                  </th>
                  <th className="border border-neutral-500 px-2 py-1.5 text-center font-bold">
                    Pasaporte
                  </th>
                  <th className="border border-neutral-500 px-2 py-1.5 text-center font-bold">
                    Fecha de nacimiento
                  </th>
                  <th className="border border-neutral-500 px-2 py-1.5 text-center font-bold">
                    Nacionalidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {(values.guests && values.guests.length > 0
                  ? values.guests
                  : [
                      {
                        fullName: '[INVITADO 1]',
                        passport: '[N.º PASAPORTE]',
                        birthDate: '[DD/MM/AAAA]',
                        nationality: '[NACIONALIDAD]',
                      },
                    ]
                ).map((g, idx) => (
                  <tr key={idx}>
                    <td className="border border-neutral-500 px-2 py-1.5 text-center">
                      {g.fullName || '—'}
                    </td>
                    <td className="border border-neutral-500 px-2 py-1.5 text-center">
                      {g.passport || '—'}
                    </td>
                    <td className="border border-neutral-500 px-2 py-1.5 text-center">
                      {g.birthDate || '—'}
                    </td>
                    <td className="border border-neutral-500 px-2 py-1.5 text-center">
                      {g.nationality || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rendered.paragraphsAfterTable.map((p, idx) => (
          <p key={`post-${idx}`}>{p}</p>
        ))}

        <p className="text-left pt-1">{rendered.closing}</p>
      </div>

      {/* Firmas */}
      <div className="pt-8 grid grid-cols-2 gap-6 text-center text-[10.5px]">
        <div className="space-y-0.5">
          <div className="border-b border-neutral-500 w-40 mx-auto mb-1.5" />
          <div className="font-semibold text-neutral-800">{displayPastor}</div>
          <div className="text-neutral-600">Pastor Presidente</div>
        </div>
        <div className="space-y-0.5">
          <div className="border-b border-neutral-500 w-40 mx-auto mb-1.5" />
          <div className="font-semibold text-neutral-800">{displaySecretary}</div>
          <div className="text-neutral-600">Secretaria</div>
        </div>
      </div>

      {/* Pie de página dinámico */}
      <div className="border-t border-neutral-400 pt-2 text-center text-[9.5px] text-neutral-600">
        {formatLetterFooterLine(congregation)}
      </div>
    </div>
  );
};

export const CartasModal: React.FC<CartasModalProps> = ({
  currentUser,
  members,
  congregation,
  initialTab = 'modelos',
  initialRequest = null,
  onClose,
  onUpdated,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'modelos' | 'redactar' | 'solicitudes'>(initialTab);
  const [selectedModel, setSelectedModel] = useState<LetterTemplateDef>(ACTIVE_LETTER_TEMPLATES[0]);
  const [previewModel, setPreviewModel] = useState<LetterTemplateDef | null>(null);

  // Estado de campos estructurados (sin edición libre del texto oficial)
  const [selectedMemberId, setSelectedMemberId] = useState<number>(members[0]?.id || 1);
  const [fieldValues, setFieldValues] = useState<LetterFieldValues>(() =>
    createDefaultLetterValues(members[0], congregation)
  );
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Solicitudes y cola de aprobación pastoral
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<DocumentRequest | null>(initialRequest);

  const role = currentUser?.role || 'admin';
  const isSecondaryPastor = role === 'pastor_advisor';
  const isSecretaryOnly = role === 'secretary' || role === 'local_secretary';
  const requiresPastorApproval = isSecretaryOnly || isSecondaryPastor;
  const isPastorOrAdmin = [
    'admin',
    'local_pastor',
    'general_pastor',
    'general_secretary',
    'superadmin',
    'root',
  ].includes(role);

  const loadRequests = async () => {
    setLoadingReqs(true);
    try {
      const list = await api.fetchDocumentRequests();
      setRequests(
        list.filter(
          (r) =>
            r.templateCode.startsWith('carta_') ||
            r.documentTitle.toLowerCase().includes('carta')
        )
      );
    } catch {
      setRequests([]);
    } finally {
      setLoadingReqs(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const syncMemberIntoValues = (memId: number, current: LetterFieldValues): LetterFieldValues => {
    const m = members.find((item) => item.id === memId);
    if (!m) return current;
    return {
      ...current,
      nombreCompleto: `${m.firstName} ${m.lastName}`.trim(),
      documentoIdentidad: m.idDocument || current.documentoIdentidad,
      fechaIngreso: m.admissionDate ? m.admissionDate.slice(0, 7) : current.fechaIngreso,
      cargoMinisterio: m.ministerialFunction || current.cargoMinisterio || 'Miembro',
      nacionalidadInvitados: m.nationality || current.nacionalidadInvitados,
    };
  };

  const handleOpenComposeWithModel = (model: LetterTemplateDef, fromReq?: DocumentRequest) => {
    setSelectedModel(model);
    const targetMemberId = fromReq?.memberId || members[0]?.id || 1;
    const targetMember = members.find((m) => m.id === targetMemberId) || members[0];
    const baseDefaults = createDefaultLetterValues(targetMember, congregation);

    if (fromReq) {
      const parsed = parseLetterObservations(fromReq.observations);
      setFieldValues({
        ...baseDefaults,
        ...(parsed.values || {}),
        guests:
          parsed.values?.guests && parsed.values.guests.length > 0
            ? parsed.values.guests
            : baseDefaults.guests,
      });
    } else {
      setFieldValues(baseDefaults);
    }

    setSelectedMemberId(targetMemberId);
    setEditingRequestId(fromReq ? fromReq.id : null);
    setPreviewModel(null);
    setActiveTab('redactar');
  };

  const handleSendToPastor = async () => {
    setSubmitting(true);
    try {
      const payloadObs = serializeLetterObservations(
        buildLetterSummary(selectedModel, fieldValues),
        fieldValues
      );

      if (editingRequestId) {
        await api.updateDocumentRequestStatus(editingRequestId, 'pending_approval', payloadObs);
      } else {
        await api.createDocumentRequest({
          templateCode: selectedModel.code,
          documentTitle: selectedModel.title,
          memberId: selectedMemberId,
          observations: payloadObs,
          status: 'pending_approval',
        });
      }

      onShowToast('Carta enviada al Pastor para su aprobación.');
      setEditingRequestId(null);
      await loadRequests();
      onUpdated();
      setActiveTab('solicitudes');
    } catch (err: any) {
      onShowToast(err.message || 'Error al enviar la carta al Pastor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePastorApproveAndSend = async (reqId: number, currentObs?: string) => {
    if (!isPastorOrAdmin) return;
    setSubmitting(true);
    try {
      await api.updateDocumentRequestStatus(reqId, 'delivered', currentObs);
      onShowToast('Carta aprobada por el Pastor y enviada correctamente.');
      await loadRequests();
      onUpdated();
      setViewingRequest(null);
    } catch (err: any) {
      onShowToast(err.message || 'Error al aprobar y enviar la carta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePastorApproveNewDirect = async () => {
    if (!isPastorOrAdmin || requiresPastorApproval) return;
    setSubmitting(true);
    try {
      const payloadObs = serializeLetterObservations(
        buildLetterSummary(selectedModel, fieldValues),
        fieldValues
      );

      if (editingRequestId) {
        await api.updateDocumentRequestStatus(editingRequestId, 'delivered', payloadObs);
        setEditingRequestId(null);
      } else {
        const created = await api.createDocumentRequest({
          templateCode: selectedModel.code,
          documentTitle: selectedModel.title,
          memberId: selectedMemberId,
          observations: payloadObs,
          status: 'pending_approval',
        });
        await api.updateDocumentRequestStatus(created.id, 'delivered', payloadObs);
      }

      onShowToast('Carta aprobada por el Pastor y enviada correctamente.');
      await loadRequests();
      onUpdated();
      setActiveTab('solicitudes');
    } catch (err: any) {
      onShowToast(err.message || 'Error al aprobar y enviar la carta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePastorReject = async (reqId: number) => {
    if (!isPastorOrAdmin) return;
    setSubmitting(true);
    try {
      await api.updateDocumentRequestStatus(reqId, 'rejected');
      onShowToast('Carta devuelta / rechazada por el Pastor.');
      await loadRequests();
      onUpdated();
      setViewingRequest(null);
    } catch (err: any) {
      onShowToast(err.message || 'Error al rechazar la carta.');
    } finally {
      setSubmitting(false);
    }
  };

  const resolveRequestValues = (req: DocumentRequest): LetterFieldValues => {
    const m = members.find((item) => item.id === req.memberId);
    const defaults = createDefaultLetterValues(
      m || {
        firstName: (req.memberName || 'Miembro').split(' (' )[0],
        lastName: '',
        memberNumber: req.memberNumber,
      },
      congregation
    );
    const parsed = parseLetterObservations(req.observations);
    return {
      ...defaults,
      ...(parsed.values || {}),
      guests:
        parsed.values?.guests && parsed.values.guests.length > 0
          ? parsed.values.guests
          : defaults.guests,
    };
  };

  const pendingForPastorCount = requests.filter((r) => r.status === 'pending_approval').length;
  const incomingRequestsCount = requests.filter((r) =>
    ['received', 'under_review', 'in_preparation'].includes(r.status)
  ).length;

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            PENDIENTE APROBACIÓN PASTORAL
          </span>
        );
      case 'approved':
      case 'delivered':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            APROBADA Y ENVIADA
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            RECHAZADA
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            SOLICITADA (SECRETARÍA)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#161719] border border-white/15 rounded-[28px] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D59573]/20 border border-[#D59573]/40 flex items-center justify-center text-[#D59573]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-white tracking-tight">
                Cartas Oficiales &amp; Modelos
              </h3>
              <p className="text-[11px] text-[#8E8E93]">
                Modelos oficiales fijos · Secretaría prepara y envía al Pastor · El Pastor aprueba y envía
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#212328] text-[#8E8E93] hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="px-5 pt-3 pb-2 border-b border-white/5 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setPreviewModel(null);
              setViewingRequest(null);
              setActiveTab('modelos');
            }}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
              activeTab === 'modelos'
                ? 'bg-white text-black'
                : 'bg-[#212328] text-[#8E8E93] hover:text-white'
            }`}
          >
            Modelos de Carta ({ACTIVE_LETTER_TEMPLATES.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setPreviewModel(null);
              setViewingRequest(null);
              setActiveTab('redactar');
            }}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
              activeTab === 'redactar'
                ? 'bg-white text-black'
                : 'bg-[#212328] text-[#8E8E93] hover:text-white'
            }`}
          >
            Hacer Carta
          </button>

          <button
            type="button"
            onClick={() => {
              setPreviewModel(null);
              setViewingRequest(null);
              setActiveTab('solicitudes');
            }}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'solicitudes'
                ? 'bg-white text-black'
                : 'bg-[#212328] text-[#8E8E93] hover:text-white'
            }`}
          >
            <span>Pedidos y Aprobación</span>
            {pendingForPastorCount + incomingRequestsCount > 0 && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                  activeTab === 'solicitudes'
                    ? 'bg-black text-white'
                    : 'bg-[#D59573] text-black font-bold'
                }`}
              >
                {pendingForPastorCount + incomingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: MODELOS DE CARTA */}
          {activeTab === 'modelos' && !previewModel && (
            <div className="space-y-3">
              {ACTIVE_LETTER_TEMPLATES.map((model) => (
                <div
                  key={model.code}
                  className="bg-[#1C1D20] border border-white/10 hover:border-white/25 rounded-2xl p-4 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#D59573] font-bold">
                        {model.badge}
                      </span>
                      <h4 className="text-[15px] font-bold text-white">{model.title}</h4>
                      <p className="text-[12px] text-[#8E8E93]">{model.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPreviewModel(model)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#25272B] hover:bg-[#2F3238] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Modelo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenComposeWithModel(model)}
                      className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Hacer Carta</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VISTA PREVIA DE MODELO DE CARTA */}
          {activeTab === 'modelos' && previewModel && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPreviewModel(null)}
                  className="text-[12px] font-semibold text-[#8E8E93] hover:text-white"
                >
                  ← Volver a Modelos
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenComposeWithModel(previewModel)}
                  className="px-4 py-1.5 rounded-full bg-white text-black text-[12px] font-bold hover:bg-neutral-200"
                >
                  Usar este Modelo
                </button>
              </div>

              <LetterSheetPreview
                template={previewModel}
                values={createDefaultLetterValues(null, congregation)}
                congregation={congregation}
                pastorName={congregation?.pastorName}
                secretaryName={congregation?.secretaryName}
              />
            </div>
          )}

          {/* TAB 2: HACER / PREPARAR CARTA (CAMPOS ESTRUCTURADOS, SIN EDICIÓN DE TEXTO BASE) */}
          {activeTab === 'redactar' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93]">Modelo de Carta</label>
                  <select
                    value={selectedModel.code}
                    onChange={(e) => {
                      const found = findLetterTemplate(e.target.value);
                      setSelectedModel(found);
                    }}
                    className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none"
                  >
                    {ACTIVE_LETTER_TEMPLATES.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93]">Miembro Asociado</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => {
                      const nextId = Number(e.target.value);
                      setSelectedMemberId(nextId);
                      setFieldValues((prev) => syncMemberIntoValues(nextId, prev));
                    }}
                    className="w-full bg-[#1C1D20] border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.memberNumber} — {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campos del modelo seleccionado */}
              {(() => {
                const selectedMemberObj = members.find((m) => m.id === selectedMemberId) || members[0];
                const profileDefaults = createDefaultLetterValues(selectedMemberObj, congregation);
                const autoFilledFields = selectedModel.fields.filter(
                  (f) => f.source === 'member' && Boolean(String(profileDefaults[f.key] || '').trim())
                );
                const editableFields = selectedModel.fields.filter((f) => {
                  if (f.source === 'member') {
                    // Solo pedir el dato del usuario si falta en su ficha o si no está prellenado
                    return !String(profileDefaults[f.key] || '').trim();
                  }
                  return true;
                });

                return (
                  <div className="bg-[#1C1D20] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#D59573] font-bold">
                      Datos para completar — {selectedModel.title}
                    </div>

                    {autoFilledFields.length > 0 && (
                      <div className="bg-[#141517] border border-emerald-500/20 rounded-xl p-3 space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                          Datos del usuario rellenados automáticamente
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[11.5px] text-neutral-300">
                          {autoFilledFields.map((f) => (
                            <div key={f.key} className="truncate">
                              <span className="text-[#8E8E93]">{f.label}:</span>{' '}
                              <span className="text-white font-medium">
                                {String(fieldValues[f.key] || profileDefaults[f.key] || '')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editableFields.map((field) => (
                        <div
                          key={field.key}
                          className={`space-y-1 ${field.fullWidth ? 'sm:col-span-2' : ''}`}
                        >
                          <label className="text-[11px] font-medium text-[#8E8E93]">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            value={String(fieldValues[field.key] || '')}
                            onChange={(e) =>
                              setFieldValues((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={field.placeholder}
                            className="w-full bg-[#141517] border border-white/10 rounded-xl px-3 py-2 text-[12.5px] text-white focus:outline-none focus:border-[#D59573]/60"
                          />
                        </div>
                      ))}
                    </div>

                {/* Tabla editable de invitados para Modelo 5 */}
                {selectedModel.hasGuestTable && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white">
                        Relación de Invitados (Tabla de la Carta)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFieldValues((prev) => ({
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
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Añadir invitado</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {fieldValues.guests.map((guest, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center bg-[#141517] p-2 rounded-xl border border-white/5"
                        >
                          <input
                            type="text"
                            value={guest.fullName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldValues((prev) => {
                                const next = [...prev.guests];
                                next[idx] = { ...next[idx], fullName: val };
                                return { ...prev, guests: next };
                              });
                            }}
                            placeholder="Nombre completo"
                            className="sm:col-span-4 bg-[#1C1D20] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            value={guest.passport}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldValues((prev) => {
                                const next = [...prev.guests];
                                next[idx] = { ...next[idx], passport: val };
                                return { ...prev, guests: next };
                              });
                            }}
                            placeholder="N.º Pasaporte"
                            className="sm:col-span-3 bg-[#1C1D20] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            value={guest.birthDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldValues((prev) => {
                                const next = [...prev.guests];
                                next[idx] = { ...next[idx], birthDate: val };
                                return { ...prev, guests: next };
                              });
                            }}
                            placeholder="DD/MM/AAAA"
                            className="sm:col-span-2 bg-[#1C1D20] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            value={guest.nationality}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldValues((prev) => {
                                const next = [...prev.guests];
                                next[idx] = { ...next[idx], nationality: val };
                                return { ...prev, guests: next };
                              });
                            }}
                            placeholder="Nacionalidad"
                            className="sm:col-span-2 bg-[#1C1D20] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none"
                          />
                          {fieldValues.guests.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setFieldValues((prev) => ({
                                  ...prev,
                                  guests: prev.guests.filter((_, i) => i !== idx),
                                }))
                              }
                              className="sm:col-span-1 text-red-400 hover:text-red-300 flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
                  );
                })()}

              {/* Vista previa en vivo del modelo oficial fijo (no editable) */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-[#8E8E93]">
                  Vista Previa Oficial del Modelo (texto fijo institucional)
                </div>
                <LetterSheetPreview
                  template={selectedModel}
                  values={fieldValues}
                  congregation={congregation}
                  pastorName={congregation?.pastorName}
                  secretaryName={congregation?.secretaryName}
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#1C1D20] border border-amber-500/20 flex items-start gap-2.5 text-[11.5px] text-amber-200/90">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {requiresPastorApproval
                    ? 'Flujo obligatorio: Secretaría o Pastor Secundario completa los datos y envía al Pastor Titular. Antes de enviarla definitivamente, el Pastor debe aprobarla.'
                    : 'Emisión pastoral directa: Como Pastor Titular, puede completar los datos y aprobar y enviar la carta directamente.'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                {requiresPastorApproval && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSendToPastor}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-full bg-[#D59573] hover:bg-[#e0a382] text-black text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Enviando...' : 'Enviar al Pastor (Para Aprobación)'}</span>
                  </button>
                )}

                {isPastorOrAdmin && !requiresPastorApproval && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handlePastorApproveNewDirect}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-full bg-white hover:bg-neutral-200 text-black text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Aprobando y enviando...' : 'Aprobar y Enviar'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SOLICITUDES Y COLA DE APROBACIÓN PASTORAL */}
          {activeTab === 'solicitudes' && !viewingRequest && (
            <div className="space-y-3">
              {loadingReqs ? (
                <div className="py-12 text-center text-[13px] text-[#8E8E93]">
                  Cargando cartas y solicitudes...
                </div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <FileText className="w-8 h-8 text-[#8E8E93] mx-auto opacity-50" />
                  <div className="text-[13px] text-[#8E8E93]">
                    No hay cartas solicitadas o pendientes de aprobación.
                  </div>
                </div>
              ) : (
                requests.map((req) => {
                  const model = findLetterTemplate(req.templateCode || req.documentTitle);
                  const { summary } = parseLetterObservations(req.observations);
                  return (
                    <div
                      key={req.id}
                      className="bg-[#1C1D20] border border-white/10 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[14px] font-bold text-white">
                              {req.documentTitle}
                            </span>
                            {getStatusChip(req.status)}
                          </div>
                          <div className="text-[12px] text-[#8E8E93]">
                            <strong className="text-white">{req.memberName}</strong> ·{' '}
                            <span className="font-mono">{req.dossierNumber}</span>
                          </div>
                          {summary && (
                            <div className="text-[11px] text-neutral-400 italic">{summary}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setViewingRequest(req)}
                          className="py-1.5 px-3 rounded-xl bg-[#25272B] hover:bg-[#303339] text-white text-[12px] font-semibold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Carta</span>
                        </button>

                        {/* Si fue solicitada por un miembro (received/in_preparation): Secretaría o Pastor Secundario envía al Pastor; el Pastor Titular prepara y aprueba */}
                        {['received', 'under_review', 'in_preparation'].includes(req.status) && (
                          <button
                            type="button"
                            onClick={() => handleOpenComposeWithModel(model, req)}
                            className={`py-1.5 px-3 rounded-xl text-[12px] font-bold flex items-center gap-1.5 ${
                              requiresPastorApproval
                                ? 'bg-[#D59573] text-black hover:bg-[#e0a382]'
                                : 'bg-emerald-500 text-black hover:bg-emerald-400'
                            }`}
                          >
                            {requiresPastorApproval ? (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Preparar y Enviar al Pastor</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Preparar y Aprobar</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Si está pendiente de aprobación del Pastor: solo el Pastor Titular aprueba y envía */}
                        {req.status === 'pending_approval' && isPastorOrAdmin && !requiresPastorApproval && (
                          <>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handlePastorApproveAndSend(req.id, req.observations)}
                              className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[12px] font-bold flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobar y Enviar</span>
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handlePastorReject(req.id)}
                              className="py-1.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 text-[12px] font-semibold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </>
                        )}

                        {req.status === 'pending_approval' && requiresPastorApproval && (
                          <span className="text-[11px] text-amber-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Esperando aprobación del Pastor</span>
                          </span>
                        )}

                        {['approved', 'delivered'].includes(req.status) && (
                          <button
                            type="button"
                            onClick={() =>
                              generateLetterPdf({
                                template: model,
                                values: resolveRequestValues(req),
                                dossierNumber: req.dossierNumber,
                                verificationToken: req.verificationToken,
                                congregation,
                                pastorName: congregation?.pastorName || currentUser?.name,
                                secretaryName: congregation?.secretaryName,
                                dateStr: formatSpanishLongDate(req.createdAt),
                              })
                            }
                            className="py-1.5 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black text-[12px] font-bold flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar PDF</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* DETALLE / APROBACIÓN PASTORAL DE UNA CARTA ESPECÍFICA */}
          {activeTab === 'solicitudes' && viewingRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewingRequest(null)}
                  className="text-[12px] font-semibold text-[#8E8E93] hover:text-white"
                >
                  ← Volver a Solicitudes
                </button>
                {getStatusChip(viewingRequest.status)}
              </div>

              {(() => {
                const model = findLetterTemplate(
                  viewingRequest.templateCode || viewingRequest.documentTitle
                );
                const reqValues = resolveRequestValues(viewingRequest);

                return (
                  <>
                    <LetterSheetPreview
                      template={model}
                      values={reqValues}
                      congregation={congregation}
                      pastorName={congregation?.pastorName}
                      secretaryName={congregation?.secretaryName}
                      dateStr={formatSpanishLongDate(viewingRequest.createdAt)}
                      dossierNumber={viewingRequest.dossierNumber}
                    />

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {['received', 'under_review', 'in_preparation'].includes(
                        viewingRequest.status
                      ) && (
                        <button
                          type="button"
                          onClick={() => handleOpenComposeWithModel(model, viewingRequest)}
                          className={`py-2.5 px-4 rounded-full text-black text-[12px] font-bold flex items-center gap-1.5 ${
                            requiresPastorApproval
                              ? 'bg-[#D59573] hover:bg-[#e0a382]'
                              : 'bg-emerald-500 hover:bg-emerald-400'
                          }`}
                        >
                          {requiresPastorApproval ? (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Preparar y Enviar al Pastor</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Preparar y Aprobar</span>
                            </>
                          )}
                        </button>
                      )}

                      {viewingRequest.status === 'pending_approval' &&
                        isPastorOrAdmin &&
                        !requiresPastorApproval && (
                          <>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handlePastorReject(viewingRequest.id)}
                              className="py-2.5 px-4 rounded-full bg-red-950/60 text-red-300 border border-red-500/30 text-[12px] font-semibold"
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() =>
                                handlePastorApproveAndSend(
                                  viewingRequest.id,
                                  viewingRequest.observations
                                )
                              }
                              className="py-2.5 px-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-[12px] font-bold flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobar y Enviar Carta</span>
                            </button>
                          </>
                        )}

                      {['approved', 'delivered'].includes(viewingRequest.status) && (
                        <button
                          type="button"
                          onClick={() =>
                            generateLetterPdf({
                              template: model,
                              values: reqValues,
                              dossierNumber: viewingRequest.dossierNumber,
                              verificationToken: viewingRequest.verificationToken,
                              congregation,
                              pastorName: congregation?.pastorName || currentUser?.name,
                              secretaryName: congregation?.secretaryName,
                              dateStr: formatSpanishLongDate(viewingRequest.createdAt),
                            })
                          }
                          className="py-2.5 px-5 rounded-full bg-white text-black text-[12px] font-bold flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar PDF</span>
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
