import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Phone, Mail, Clock, User as UserIcon, X, Users } from 'lucide-react';
import { api } from '../api';
import { Congregation, User } from '../types';

interface CongregationsModuleProps {
  currentUser: User;
}

export const CongregationsModule: React.FC<CongregationsModuleProps> = ({ currentUser }) => {
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    postalCode: '',
    phone: '',
    email: '',
    pastorName: '',
    secretaryName: '',
    serviceSchedules: 'Domingo: 09h e 18h | Quarta: 19h30',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await api.fetchCongregations();
      setCongregations(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCongregation(formData);
      setShowModal(false);
      setFormData({
        name: '',
        city: '',
        address: '',
        postalCode: '',
        phone: '',
        email: '',
        pastorName: '',
        secretaryName: '',
        serviceSchedules: 'Domingo: 09h e 18h | Quarta: 19h30',
      });
      loadData();
    } catch (err: any) {
      alert(`Error al registrar congregación: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = ['superadmin', 'general_secretary', 'root'].includes(currentUser.role);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-orange-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                DIRECTORIO DE CONGREGACIONES
              </span>
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
              Sedes &amp; Filiales Eclesiásticas
            </h1>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
              Administración de todas las iglesias de ADM Madureira con sus pastores presidentes, secretarios responsables y horarios de culto.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="h-[44px] px-5 text-[14px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-2xl transition-all shadow-sm flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Congregación</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Congregations */}
      {loading ? (
        <div className="py-16 text-center text-[14px] text-[#8E8E93]">Cargando sedes eclesiásticas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {congregations.map((cong) => (
            <div
              key={cong.id}
              className="bg-[#121214] border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-white/10 text-white">
                    📍 {cong.city}
                  </span>
                  <span className="text-[11px] font-mono text-[#8E8E93]">{cong.code}</span>
                </div>

                <div>
                  <h3 className="text-[18px] font-bold text-white tracking-tight leading-snug">
                    {cong.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#8E8E93] mt-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cong.address || 'Dirección de la Sede'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#161618] border border-white/5 rounded-2xl space-y-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Pastor Dirigente:</span>
                    <span className="font-semibold text-white">{cong.pastorName || 'Pr. Regional'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Secretaría:</span>
                    <span className="text-neutral-300">{cong.secretaryName || 'Secretaría Oficial'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Miembros Registrados:</span>
                    <span className="font-bold text-emerald-400 tabular-nums">{cong.memberCount || 0}</span>
                  </div>
                </div>

                {cong.serviceSchedules && (
                  <div className="flex items-start gap-2 text-[12px] text-[#8E8E93] pt-1">
                    <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{cong.serviceSchedules}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#8E8E93]">
                <span>{cong.phone || '+55 (21) 3390-8800'}</span>
                <span className="text-emerald-400 font-semibold uppercase">Filial Activa</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nueva Congregación */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-[20px] font-bold text-white">Constituir Nueva Congregación</h3>
              <button onClick={() => setShowModal(false)} className="text-[#8E8E93] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Nombre Oficial de la Iglesia *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. AD Madureira — Sede Salvador"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Ciudad / Municipio *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ej. Salvador, Curitiba, Belém"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Pastor Presidente Dirigente *</label>
                <input
                  type="text"
                  required
                  value={formData.pastorName}
                  onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                  placeholder="Ej. Pr. Silas Pereira"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Secretario(a) Responsable</label>
                <input
                  type="text"
                  value={formData.secretaryName}
                  onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                  placeholder="Ej. Diác. Rodrigo Tavares"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8E8E93]">Dirección Completa</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, Número, Bairro"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-[42px] px-4 text-[13px] font-semibold text-[#8E8E93] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[42px] px-5 text-[13px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl"
                >
                  {submitting ? 'Guardando...' : 'Crear Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
