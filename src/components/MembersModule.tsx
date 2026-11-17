import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ChevronRight,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { api } from '../api';
import { Congregation, Member, MemberStatus, User } from '../types';
import { DEFAULT_HUMATION_DATA_URL } from './HumationAvatar';

interface MembersModuleProps {
  currentUser: User;
  onSelectMember: (memberId: number) => void;
}

export const MembersModule: React.FC<MembersModuleProps> = ({
  currentUser,
  onSelectMember,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCongregation, setSelectedCongregation] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal Nuevo Miembro
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    congregationId: currentUser.congregationId || 1,
    idDocument: '',
    birthDate: '',
    admissionDate: new Date().toISOString().split('T')[0],
    baptismDate: '',
    departmentName: 'Juventude Madureira (UMAD)',
    ministerialFunction: 'Miembro en Plena Comunión',
    address: '',
    city: '',
    postalCode: '',
    observations: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const [membersData, congData] = await Promise.all([
        api.fetchMembers({
          search: search || undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          congregationId: selectedCongregation !== 'all' ? selectedCongregation : undefined,
        }),
        api.fetchCongregations(),
      ]);
      setMembers(membersData);
      setCongregations(congData);
    } catch (err) {
      console.error('Error al cargar miembros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [selectedStatus, selectedCongregation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMembers();
  };

  const handleApproveRegistration = async (e: React.MouseEvent, memberId: number, memberName: string) => {
    e.stopPropagation();
    try {
      setProcessingId(memberId);
      await api.approveRegistration(String(memberId));
      await loadMembers();
    } catch (err: any) {
      alert(`Error al aprobar registro de ${memberName}: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRegistration = async (e: React.MouseEvent, memberId: number, memberName: string) => {
    e.stopPropagation();
    if (!confirm(`¿Desea descartar y denegar la solicitud de registro de ${memberName}?`)) return;
    try {
      setProcessingId(memberId);
      await api.rejectRegistration(String(memberId));
      await loadMembers();
    } catch (err: any) {
      alert(`Error al descartar registro: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createMember({
        ...formData,
        congregationId: Number(formData.congregationId),
        status: 'active',
      });
      setShowModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        congregationId: currentUser.congregationId || 1,
        idDocument: '',
        birthDate: '',
        admissionDate: new Date().toISOString().split('T')[0],
        baptismDate: '',
        departmentName: 'Juventude Madureira (UMAD)',
        ministerialFunction: 'Miembro en Plena Comunión',
        address: '',
        city: '',
        postalCode: '',
        observations: '',
      });
      loadMembers();
    } catch (err: any) {
      alert(`Error al dar de alta el miembro: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">ACTIVO</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">PENDIENTE</span>;
      case 'transferred':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">TRASLADADO</span>;
      case 'suspended':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/30">SUSPENDIDO</span>;
      case 'inactive':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-neutral-500/20 text-neutral-300 border border-neutral-500/30">INACTIVO</span>;
      case 'deceased':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">FALLECIDO</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-white/10 text-white">{status}</span>;
    }
  };

  const canCreate = ['superadmin', 'general_secretary', 'local_secretary', 'root'].includes(currentUser.role);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Section Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-orange-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                GESTIÓN DE MIEMBROS
              </span>
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
              Registro General de Membresía
            </h1>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
              Consulte expedientes oficiales, valide inscripciones eclesiásticas y supervise la asignación ministerial de cada hermano.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="h-[44px] px-5 text-[14px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-2xl transition-all shadow-sm flex items-center gap-2 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Miembro</span>
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-3 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="bg-[#1C1C1E] p-1 rounded-2xl inline-flex flex-wrap gap-1 border border-white/5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'active', label: 'Activos' },
              { id: 'pending', label: 'Pendientes' },
              { id: 'transferred', label: 'Trasladados' },
              { id: 'suspended', label: 'Suspendidos' },
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

          {/* Search & Congregation Filter */}
          <div className="flex items-center gap-3">
            <select
              value={selectedCongregation}
              onChange={(e) => setSelectedCongregation(e.target.value)}
              className="bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/40"
            >
              <option value="all">Todas las Sedes</option>
              {congregations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.city} — {c.name}
                </option>
              ))}
            </select>

            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, número o email..."
                className="bg-[#1C1C1E] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 w-64 transition-colors"
              />
              <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-2.5" />
            </form>
          </div>
        </div>
      </div>

      {/* Member List Grid */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 text-[13px] text-[#8E8E93]">
          <span>Mostrando <strong className="text-white">{members.length}</strong> expedientes</span>
          <span>Clic en un miembro para ver su expediente</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[14px] text-[#8E8E93]">Cargando expedientes...</div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-[#8E8E93]">
            No se encontraron miembros con los criterios seleccionados.
          </div>
        ) : (
          <div className="space-y-2.5">
            {members.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMember(m.id)}
                className="p-4 bg-[#161618] hover:bg-[#1a1a1d] border border-white/5 hover:border-white/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={m.photoUrl || DEFAULT_HUMATION_DATA_URL}
                    alt={m.firstName}
                    className="w-11 h-11 rounded-2xl object-cover border border-white/10 shrink-0 bg-[#F4F4F5]"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[15px] font-bold text-white tracking-tight truncate group-hover:text-white">
                        {m.firstName} {m.lastName}
                      </span>
                      {getStatusBadge(m.status)}
                    </div>
                    <div className="text-[12px] text-[#8E8E93] flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-neutral-300">{m.memberNumber}</span>
                      <span>·</span>
                      <span>{m.congregationName || 'Sede'}</span>
                      <span>·</span>
                      <span>{m.ministerialFunction || 'Miembro'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {m.status === 'pending' && canCreate && (
                    <div className="flex items-center gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={processingId === m.id}
                        onClick={(e) => handleApproveRegistration(e, m.id, `${m.firstName} ${m.lastName}`)}
                        className="px-3 py-1.5 rounded-xl bg-white text-black text-[12px] font-bold hover:bg-neutral-200 shadow transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Aprobar</span>
                      </button>
                      <button
                        type="button"
                        disabled={processingId === m.id}
                        onClick={(e) => handleRejectRegistration(e, m.id, `${m.firstName} ${m.lastName}`)}
                        className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-red-500/40 text-[#8E8E93] hover:text-red-400 text-[12px] font-medium transition-all"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}

                  <div className="text-right hidden sm:block text-[12px] text-[#8E8E93]">
                    <div>Ingreso: {m.admissionDate || 'N/D'}</div>
                    <div className="text-[11px] text-neutral-400">{m.email || 'Sin correo'}</div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#202022] group-hover:bg-white group-hover:text-black flex items-center justify-center text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Nuevo Miembro */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-[20px] font-bold tracking-tight text-white">Alta de Nuevo Miembro</h3>
                <p className="text-[13px] text-[#8E8E93]">Apertura oficial de expediente en la Secretaría Eclesiástica</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#8E8E93] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Nombre(s) *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ej. Lucas Daniel"
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ej. Silva Menezes"
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="miembro@admadureira.org"
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+55 (21) 98888-0000"
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Congregación / Filial *</label>
                  <select
                    value={formData.congregationId}
                    onChange={(e) => setFormData({ ...formData, congregationId: Number(e.target.value) })}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  >
                    {congregations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.city} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Documento de Identidad (RG / DNI / CPF)</label>
                  <input
                    type="text"
                    value={formData.idDocument}
                    onChange={(e) => setFormData({ ...formData, idDocument: e.target.value })}
                    placeholder="RG-00.000.000-0"
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Fecha de Bautismo en Aguas</label>
                  <input
                    type="date"
                    value={formData.baptismDate}
                    onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#8E8E93]">Función Ministerial</label>
                  <input
                    type="text"
                    value={formData.ministerialFunction}
                    onChange={(e) => setFormData({ ...formData, ministerialFunction: e.target.value })}
                    placeholder="Ej. Diácono, Obrero, Colaborador"
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-[44px] px-5 text-[13px] font-semibold text-[#8E8E93] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[44px] px-6 text-[14px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-2xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Guardando Expediente...' : 'Crear Miembro Oficial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
