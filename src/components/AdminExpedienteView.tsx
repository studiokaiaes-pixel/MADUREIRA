import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FileCheck,
  CreditCard,
  Download,
  X,
  Printer,
  ShieldCheck,
  Calendar,
  Building2,
  UserCheck,
} from 'lucide-react';
import { Member } from '../types';

export type ExpedienteSubView =
  | 'resumen'
  | 'datos'
  | 'editar'
  | 'documentos'
  | 'detalle_documento'
  | 'actividad';

export interface ExpedienteDocumentItem {
  id: string;
  title: string;
  date: string;
  status: 'Entregada' | 'Entregado' | 'Emitida' | 'Pendiente';
  type: string;
  category: 'recomendacion' | 'bautismo' | 'membresia' | 'traslado';
}

interface AdminExpedienteViewProps {
  member: Member;
  onBack: () => void;
  onNavigateToCredencial: () => void;
  onEmitirDocumento: () => void;
  onDownloadFicha: (m: Member) => void;
  onUpdateMember: (updated: Member) => void;
  onShowToast: (msg: string) => void;
}

export const AdminExpedienteView: React.FC<AdminExpedienteViewProps> = ({
  member,
  onBack,
  onNavigateToCredencial,
  onEmitirDocumento,
  onDownloadFicha,
  onUpdateMember,
  onShowToast,
}) => {
  // Sub-vista activa dentro de Expediente (las 6 pantallas del diseño oficial)
  const [activeSubTab, setActiveSubTab] = useState<ExpedienteSubView>('resumen');

  // Historial de navegación interna para volver limpiamente con la flecha '<'
  const [previousSubTab, setPreviousSubTab] = useState<ExpedienteSubView>('resumen');

  // Documento seleccionado para 05 · DETALLE DEL DOCUMENTO
  const [selectedDoc, setSelectedDoc] = useState<ExpedienteDocumentItem>({
    id: 'doc-rec-01',
    title: 'Carta de Recomendación',
    date: '11/11/2026',
    status: 'Entregada',
    type: 'Recomendación Canónica Eclesiástica',
    category: 'recomendacion',
  });

  // Modal para "Ver documento" (Vista previa oficial)
  const [showDocPreviewModal, setShowDocPreviewModal] = useState(false);

  // Formulario para 03 · EDITAR EXPEDIENTE
  const [editForm, setEditForm] = useState({
    fullName: '',
    congregation: 'Madureira',
    branch: 'Sede 01',
    function: 'Pastor Administrador',
    department: 'Clero · CONAMAD',
    communionSince: '12/03/2019',
  });

  // Sincronizar formulario de edición cuando cambia el miembro
  useEffect(() => {
    if (member) {
      const isPastor = member.ministerialFunction?.includes('Pastor');
      const fullName = isPastor
        ? (member.firstName.startsWith('Pr.') ? `${member.firstName} ${member.lastName}` : `Pr. ${member.firstName} ${member.lastName}`)
        : `${member.firstName} ${member.lastName}`;

      setEditForm({
        fullName,
        congregation: member.congregationName || 'Madureira',
        branch: 'Sede 01',
        function: member.ministerialFunction || (isPastor ? 'Pastor Administrador' : 'Miembro'),
        department: member.departmentName || 'Clero · CONAMAD',
        communionSince: member.admissionDate
          ? new Date(member.admissionDate).toLocaleDateString('es-ES')
          : '12/03/2019',
      });
    }
  }, [member]);

  // Lista canónica de documentos del miembro
  const memberDocuments: ExpedienteDocumentItem[] = [
    {
      id: 'doc-01',
      title: 'Carta de Recomendación',
      date: '11/11/2026',
      status: 'Entregada',
      type: 'Recomendación Ministerial',
      category: 'recomendacion',
    },
    {
      id: 'doc-02',
      title: 'Certificado de Bautismo',
      date: '04/06/2024',
      status: 'Entregado',
      type: 'Certificación Bautismal por Inmersión',
      category: 'bautismo',
    },
  ];

  // Datos calculados del miembro
  const isPastor = member.ministerialFunction?.includes('Pastor');
  const displayTitleName = isPastor
    ? (member.firstName.startsWith('Pr.') ? `${member.firstName} ${member.lastName}` : `Pr. ${member.firstName} ${member.lastName}`)
    : `${member.firstName} ${member.lastName}`;
  const initials = `${member.firstName[0] || 'A'}${member.lastName[0] || 'V'}`;
  const expCode = member.memberNumber || 'EXP-0001';
  const isAdmin = isPastor || member.ministerialFunction?.includes('Administrador');

  // Navegación segura hacia atrás
  const handleHeaderBack = () => {
    if (activeSubTab === 'editar') {
      setActiveSubTab(previousSubTab);
    } else if (activeSubTab === 'detalle_documento') {
      setActiveSubTab('documentos');
    } else if (activeSubTab !== 'resumen') {
      setActiveSubTab('resumen');
    } else {
      onBack();
    }
  };

  // Guardar cambios del expediente (03 · EDITAR EXPEDIENTE)
  const handleSaveExpediente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) return;

    let cleanName = editForm.fullName.replace(/^Pr\.\s*/i, '').trim();
    const parts = cleanName.split(' ');
    const firstName = parts[0] || member.firstName;
    const lastName = parts.slice(1).join(' ') || member.lastName;

    const updated: Member = {
      ...member,
      firstName,
      lastName,
      congregationName: editForm.congregation,
      ministerialFunction: editForm.function,
      departmentName: editForm.department,
    };

    onUpdateMember(updated);
    onShowToast('Expediente actualizado exitosamente.');
    setActiveSubTab('resumen');
  };

  // Abrir detalle del documento (05)
  const handleOpenDocDetail = (doc: ExpedienteDocumentItem) => {
    setSelectedDoc(doc);
    setPreviousSubTab(activeSubTab);
    setActiveSubTab('detalle_documento');
  };

  // Abrir vista de edición (03)
  const handleOpenEdit = () => {
    setPreviousSubTab(activeSubTab);
    setActiveSubTab('editar');
  };

  // Título de la cabecera según la pantalla activa
  const getHeaderTitle = () => {
    switch (activeSubTab) {
      case 'datos':
        return 'Datos del miembro';
      case 'editar':
        return 'Editar expediente';
      case 'detalle_documento':
        return 'Documento';
      case 'documentos':
      case 'actividad':
      case 'resumen':
      default:
        return 'Expediente';
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Header con botón Back, Título central y etiqueta ADM */}
      <div className="flex items-center justify-between pb-1 select-none">
        <button
          type="button"
          onClick={handleHeaderBack}
          aria-label="Volver"
          className="w-8 h-8 rounded-full bg-[#161719] border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h2 className="text-[17px] sm:text-[18px] font-bold text-white tracking-tight">
          {getHeaderTitle()}
        </h2>

        <span className="text-[11px] font-mono font-semibold text-[#8E8E93] tracking-wider uppercase">
          ADM
        </span>
      </div>

      {/* 2. Cabecera del Miembro y Píldoras de Navegación (En 01 Resumen, 02 Datos, 04 Documentos, 06 Actividad) */}
      {activeSubTab !== 'editar' && activeSubTab !== 'detalle_documento' && (
        <div className="space-y-3.5">
          {/* Ficha compacta de identificación */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#212328] border border-white/10 flex items-center justify-center text-white text-[13px] font-bold shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight truncate">
                  {displayTitleName}
                </div>
                <div className="text-[11px] text-[#8E8E93] font-mono truncate">
                  {expCode} · {isAdmin ? 'ADMIN' : 'MIEMBRO'}
                </div>
              </div>
            </div>

            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-[#214833] text-[#34D399] border border-[#34D399]/30 shrink-0">
              ACTIVO
            </span>
          </div>

          {/* Píldoras de Pestaña: RESUMEN | DATOS | DOCUMENTOS | ACTIVIDAD */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-[11px] font-semibold no-scrollbar">
            {[
              { id: 'resumen', label: 'RESUMEN' },
              { id: 'datos', label: 'DATOS' },
              { id: 'documentos', label: 'DOCUMENTOS' },
              { id: 'actividad', label: 'ACTIVIDAD' },
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id as ExpedienteSubView)}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'bg-[#161719] text-[#8E8E93] border border-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 01 · EXPEDIENTE / RESUMEN                                */}
      {/* ========================================================= */}
      {activeSubTab === 'resumen' && (
        <div className="space-y-4 animate-fadeIn">
          {/* INFORMACIÓN ECLESIÁSTICA */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold px-1">
              INFORMACIÓN ECLESIÁSTICA
            </div>

            <div className="bg-[#161719] border border-white/10 rounded-[22px] p-4 space-y-2.5 shadow-md text-[12px]">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[#8E8E93]">Congregación</span>
                <span className="text-white font-medium">{member.congregationName || 'Madureira'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[#8E8E93]">Filial</span>
                <span className="text-white font-medium">Sede 01</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[#8E8E93]">Función</span>
                <span className="text-white font-medium">{member.ministerialFunction || 'Pastor Administrador'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[#8E8E93]">Estado</span>
                <span className="text-[#34D399] font-medium">Activo</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#8E8E93]">En comunión desde</span>
                <span className="text-white font-medium font-mono">
                  {member.admissionDate ? new Date(member.admissionDate).toLocaleDateString('es-ES') : '12/03/2019'}
                </span>
              </div>
            </div>
          </div>

          {/* HISTORIAL DOCUMENTAL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold">
                HISTORIAL DOCUMENTAL
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('documentos')}
                className="text-[11px] text-[#8E8E93] hover:text-white cursor-pointer font-medium tracking-tight"
              >
                VER TODOS &gt;
              </button>
            </div>

            <div className="bg-[#161719] border border-white/10 rounded-[22px] p-4 space-y-2.5 shadow-md">
              {memberDocuments.map((doc, idx) => (
                <div
                  key={doc.id}
                  onClick={() => handleOpenDocDetail(doc)}
                  className={`flex items-center justify-between cursor-pointer group transition-colors py-1 ${
                    idx !== 0 ? 'border-t border-white/5 pt-2' : ''
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-[13px] font-bold text-white group-hover:text-amber-400 transition-colors">
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-[#8E8E93]">
                      Emitida · {doc.date} · {doc.status}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Botón Inferior: Editar expediente */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="w-full py-3.5 rounded-full bg-white text-black font-bold text-[13px] hover:bg-neutral-200 transition-all shadow-md active:scale-95 cursor-pointer text-center"
            >
              Editar expediente
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 02 · DATOS DEL MIEMBRO                                   */}
      {/* ========================================================= */}
      {activeSubTab === 'datos' && (
        <div className="space-y-4 animate-fadeIn">
          {/* IDENTIFICACIÓN */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold px-1">
              IDENTIFICACIÓN
            </div>

            <div className="bg-[#161719] border border-white/10 rounded-[22px] p-4 space-y-2.5 shadow-md text-[12px]">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[#8E8E93]">Nombre</span>
                <span className="text-white font-medium">{displayTitleName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[#8E8E93]">Expediente</span>
                <span className="text-white font-medium font-mono">{expCode}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#8E8E93]">Estado</span>
                <span className="text-[#34D399] font-medium">Activo</span>
              </div>
            </div>
          </div>

          {/* VINCULACIÓN ECLESIÁSTICA */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold px-1">
              VINCULACIÓN ECLESIÁSTICA
            </div>

            <div className="bg-[#161719] border border-white/10 rounded-[22px] p-4 space-y-2.5 shadow-md text-[12px]">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[#8E8E93]">Congregación</span>
                <span className="text-white font-medium">{member.congregationName || 'Madureira'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[#8E8E93]">Filial</span>
                <span className="text-white font-medium">Sede 01</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[#8E8E93]">Función</span>
                <span className="text-white font-medium">{member.ministerialFunction || 'Pastor Administrador'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#8E8E93]">Comunión desde</span>
                <span className="text-white font-medium font-mono">
                  {member.admissionDate ? new Date(member.admissionDate).toLocaleDateString('es-ES') : '12/03/2019'}
                </span>
              </div>
            </div>
          </div>

          {/* Botón Inferior: Editar datos */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="w-full py-3.5 rounded-full bg-white text-black font-bold text-[13px] hover:bg-neutral-200 transition-all shadow-md active:scale-95 cursor-pointer text-center"
            >
              Editar datos
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 03 · EDITAR EXPEDIENTE                                    */}
      {/* ========================================================= */}
      {activeSubTab === 'editar' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Título y descripción de la sección de edición */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold">
              DATOS ECLESIÁSTICOS
            </div>
            <h2 className="text-[25px] sm:text-[27px] font-bold text-white tracking-tight leading-tight">
              Actualizar expediente.
            </h2>
            <p className="text-[13px] text-[#8E8E93] leading-relaxed">
              Revisa la información antes de guardar los cambios.
            </p>
          </div>

          {/* Formulario de actualización */}
          <form onSubmit={handleSaveExpediente} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8E8E93]">Nombre completo</label>
              <input
                type="text"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full bg-[#1C1D20] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8E8E93]">Congregación</label>
              <select
                value={editForm.congregation}
                onChange={(e) => setEditForm({ ...editForm, congregation: e.target.value })}
                className="w-full bg-[#1C1D20] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-white/30 cursor-pointer transition-colors"
              >
                <option value="Madureira">Madureira</option>
                <option value="Sede Madrid">Sede Madrid</option>
                <option value="Filial Barcelona">Filial Barcelona</option>
                <option value="Filial Valencia">Filial Valencia</option>
                <option value="Campo Grande">Campo Grande</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8E8E93]">Filial</label>
              <select
                value={editForm.branch}
                onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                className="w-full bg-[#1C1D20] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-white/30 cursor-pointer transition-colors"
              >
                <option value="Sede 01">Sede 01</option>
                <option value="Sede Central">Sede Central</option>
                <option value="Sub-sede Norte">Sub-sede Norte</option>
                <option value="Sub-sede Sur">Sub-sede Sur</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8E8E93]">Función</label>
              <select
                value={editForm.function}
                onChange={(e) => setEditForm({ ...editForm, function: e.target.value })}
                className="w-full bg-[#1C1D20] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-white/30 cursor-pointer transition-colors"
              >
                {isPastor && (
                  <>
                    <option value="Pastor Administrador">Pastor Administrador</option>
                    <option value="Pastor Presidente">Pastor Presidente</option>
                    <option value="Pastor Auxiliar">Pastor Auxiliar</option>
                  </>
                )}
                <option value="Evangelista">Evangelista</option>
                <option value="Presbítero">Presbítero</option>
                <option value="Diácono">Diácono</option>
                <option value="Obrero">Obrero</option>
                <option value="Miembro">Miembro</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8E8E93]">En comunión desde</label>
              <input
                type="text"
                value={editForm.communionSince}
                onChange={(e) => setEditForm({ ...editForm, communionSince: e.target.value })}
                placeholder="DD/MM/AAAA"
                className="w-full bg-[#1C1D20] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white font-mono focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {/* Botón Guardar cambios */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-white text-black font-bold text-[13px] hover:bg-neutral-200 transition-all shadow-md active:scale-95 cursor-pointer text-center"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 04 · DOCUMENTOS                                          */}
      {/* ========================================================= */}
      {activeSubTab === 'documentos' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Cabecera de Documentos con contador */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <h3 className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight">
                Documentos
              </h3>
              <p className="text-[12px] text-[#8E8E93]">
                Historial asociado a este miembro.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#212328] border border-white/5 text-[#8E8E93] text-[11px] font-mono shrink-0">
              {memberDocuments.length} registros
            </span>
          </div>

          {/* Listado de Documentos del Miembro */}
          <div className="space-y-2">
            {/* Carta de Recomendación */}
            <div
              onClick={() => handleOpenDocDetail(memberDocuments[0])}
              className="bg-[#161719] border border-white/10 hover:border-white/25 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] group shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#2D241E] text-[#F59E0B] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-white tracking-tight truncate group-hover:text-amber-400 transition-colors">
                    Carta de Recomendación
                  </div>
                  <div className="text-[11px] text-[#8E8E93] truncate">
                    11/11/2026 · Entregada
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors shrink-0" />
            </div>

            {/* Certificado de Bautismo */}
            <div
              onClick={() => handleOpenDocDetail(memberDocuments[1])}
              className="bg-[#161719] border border-white/10 hover:border-white/25 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] group shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#212328] text-white flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-white tracking-tight truncate group-hover:text-neutral-100 transition-colors">
                    Certificado de Bautismo
                  </div>
                  <div className="text-[11px] text-[#8E8E93] truncate">
                    04/06/2024 · Entregado
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors shrink-0" />
            </div>
          </div>

          {/* Sección CREDENCIAL */}
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-mono tracking-wider uppercase text-[#8E8E93] font-semibold px-1">
              CREDENCIAL
            </div>

            <div
              onClick={onNavigateToCredencial}
              className="bg-[#161719] border border-white/10 hover:border-white/25 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] group shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#261E38] text-[#A78BFA] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-white tracking-tight truncate group-hover:text-purple-300 transition-colors">
                    Credencial digital
                  </div>
                  <div className="text-[11px] text-[#8E8E93] truncate">
                    Consultar credencial del miembro
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors shrink-0" />
            </div>
          </div>

          {/* Botón Inferior: Emitir documento */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onEmitirDocumento}
              className="w-full py-3.5 rounded-full bg-white text-black font-bold text-[13px] hover:bg-neutral-200 transition-all shadow-md active:scale-95 cursor-pointer text-center"
            >
              Emitir documento
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 05 · DETALLE DEL DOCUMENTO                                */}
      {/* ========================================================= */}
      {activeSubTab === 'detalle_documento' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Card Hero Grande (Estilo caja azul oscuro elegante de la foto) */}
          <div className="bg-gradient-to-br from-[#1C2533] to-[#121A24] border border-blue-500/20 rounded-[28px] p-6 space-y-3.5 shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-inner">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[25px] sm:text-[27px] font-bold text-white tracking-tight leading-tight">
                {selectedDoc.title}
              </h2>
              <p className="text-[13px] text-white/70 leading-relaxed">
                Documento asociado al expediente del miembro.
              </p>
            </div>
          </div>

          {/* Tabla de Metadatos del Documento */}
          <div className="bg-[#161719] border border-white/10 rounded-[22px] p-4 space-y-2.5 shadow-md text-[12px]">
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-[#8E8E93]">Miembro</span>
              <span className="text-white font-medium">{displayTitleName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-[#8E8E93]">Expediente</span>
              <span className="text-white font-medium font-mono">{expCode}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-[#8E8E93]">Fecha de emisión</span>
              <span className="text-white font-medium font-mono">{selectedDoc.date}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[#8E8E93]">Estado</span>
              <span className="text-[#34D399] font-medium">{selectedDoc.status}</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDocPreviewModal(true)}
              className="w-full py-3.5 rounded-full bg-white text-black font-bold text-[13px] hover:bg-neutral-200 transition-all shadow-md active:scale-95 cursor-pointer text-center"
            >
              Ver documento
            </button>
            <button
              type="button"
              onClick={() => onDownloadFicha(member)}
              className="w-full py-3.5 rounded-full bg-[#212328] hover:bg-[#2b2e35] text-white border border-white/10 font-bold text-[13px] transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 06 · ACTIVIDAD Y TRAZABILIDAD                             */}
      {/* ========================================================= */}
      {activeSubTab === 'actividad' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Cabecera de Actividad */}
          <div className="space-y-0.5 pt-1">
            <h3 className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight">
              Actividad
            </h3>
            <p className="text-[12px] text-[#8E8E93]">
              Historial de acciones del expediente.
            </p>
          </div>

          {/* Timeline de eventos con puntos ámbar y líneas conectadas */}
          <div className="bg-[#161719] border border-white/10 rounded-[24px] p-5 shadow-xl">
            <div className="border-l-2 border-white/10 ml-2 pl-4 space-y-6 relative py-1">
              {/* Evento 1 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#F59E0B] ring-4 ring-[#161719]" />
                <div className="space-y-0.5">
                  <div className="text-[13px] font-bold text-white">
                    Carta de Recomendación
                  </div>
                  <div className="text-[11px] text-[#8E8E93]">
                    Emitida · 11/11/2026 · Entregada
                  </div>
                </div>
              </div>

              {/* Evento 2 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#F59E0B] ring-4 ring-[#161719]" />
                <div className="space-y-0.5">
                  <div className="text-[13px] font-bold text-white">
                    Certificado de Bautismo
                  </div>
                  <div className="text-[11px] text-[#8E8E93]">
                    Emitido · 04/06/2024 · Entregado
                  </div>
                </div>
              </div>

              {/* Evento 3 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#F59E0B] ring-4 ring-[#161719]" />
                <div className="space-y-0.5">
                  <div className="text-[13px] font-bold text-white">
                    En comunión desde
                  </div>
                  <div className="text-[11px] text-[#8E8E93] font-mono">
                    {member.admissionDate ? new Date(member.admissionDate).toLocaleDateString('es-ES') : '12/03/2019'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nota al pie de la propuesta oficial */}
          <div className="text-[11px] text-[#8E8E93] leading-relaxed px-1 text-center sm:text-left">
            Diseño propuesto: la trazabilidad detallada requiere registrar cada acción y su responsable en el sistema.
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CANÓNICO: VISTA PREVIA DEL DOCUMENTO OFICIAL        */}
      {/* ========================================================= */}
      {showDocPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#161719] border border-white/15 rounded-[28px] p-6 space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                <h3 className="text-[16px] font-bold text-white tracking-tight">
                  Documento Eclesiástico Canónico
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDocPreviewModal(false)}
                className="text-[#8E8E93] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificado con membrete oficial */}
            <div className="bg-[#121315] border border-white/10 rounded-2xl p-5 space-y-4 text-center">
              <div className="space-y-1">
                <div className="text-[14px] font-bold text-white uppercase tracking-wider">
                  ASSEMBLEIA DE DEUS — MINISTÉRIO DE MADUREIRA
                </div>
                <div className="text-[10px] font-mono text-[#8E8E93] tracking-widest uppercase">
                  CONAMAD · FILIAL {member.congregationName?.toUpperCase() || 'MADRID'}
                </div>
              </div>

              <div className="py-2 border-y border-white/10 space-y-1">
                <div className="text-[18px] font-bold text-[#F59E0B]">
                  {selectedDoc.title}
                </div>
                <div className="text-[11px] text-[#8E8E93] font-mono">
                  REGISTRO CANÓNICO: {expCode}-{selectedDoc.id.toUpperCase()}
                </div>
              </div>

              <p className="text-[12px] text-neutral-300 leading-relaxed text-justify px-2">
                Por la presente certificamos que el hermano/a <strong className="text-white">{displayTitleName}</strong>, con número de expediente <strong className="text-white">{expCode}</strong>, se encuentra en plena comunión canónica y ministerial con la iglesia Assembleia de Deus Ministério de Madureira, cumpliendo con fidelidad los estatutos eclesiásticos de CONAMAD.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-4 text-[10px] text-[#8E8E93] border-t border-white/5">
                <div>
                  <div className="border-b border-white/20 pb-1 font-mono text-white">
                    {displayTitleName}
                  </div>
                  <div className="pt-1">Titular</div>
                </div>
                <div>
                  <div className="border-b border-white/20 pb-1 font-mono text-white">
                    Pr. Administrador Titular
                  </div>
                  <div className="pt-1">Secretaría General</div>
                </div>
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDocPreviewModal(false)}
                className="flex-1 py-3 rounded-full bg-[#212328] hover:bg-[#2b2e35] text-white text-[13px] font-semibold transition-all cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDocPreviewModal(false);
                  onDownloadFicha(member);
                }}
                className="flex-1 py-3 rounded-full bg-white hover:bg-neutral-200 text-black text-[13px] font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-black" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
