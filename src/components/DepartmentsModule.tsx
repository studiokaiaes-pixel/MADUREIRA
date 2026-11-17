import React, { useState, useEffect } from 'react';
import { Layers, Plus, Users, Building2, CheckCircle2, Search } from 'lucide-react';
import { api } from '../api';
import { Department, User } from '../types';

interface DepartmentsModuleProps {
  currentUser: User;
}

export const DepartmentsModule: React.FC<DepartmentsModuleProps> = ({ currentUser }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ministerial');
  const [responsibleName, setResponsibleName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const list = await api.fetchDepartments();
      setDepartments(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createDepartment({
        name,
        description,
        category,
        responsibleName: responsibleName || currentUser.name,
        congregationId: Number(currentUser.congregationId || 1),
      });
      setMessage(`Departamento "${name}" constituido exitosamente.`);
      setName('');
      setDescription('');
      setResponsibleName('');
      setShowModal(false);
      loadDepartments();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.responsibleName && d.responsibleName.toLowerCase().includes(search.toLowerCase())) ||
    (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'administrativo': return 'Administrativo';
      case 'ministerial': return 'Ministerial';
      case 'juventude': return 'Juventud';
      case 'educacao': return 'Educación / EBD';
      default: return 'General';
    }
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                ESTRUCTURA MINISTERIAL & ÓRGANOS AUXILIARES
              </span>
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
              Departamentos y Ministerios
            </h1>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
              Organización canónica de los departamentos activos de la sede: juventud, diaconato, enseñanza bíblica y secretaría.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="h-[44px] px-5 text-[14px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Departamento</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 text-[14px] text-white flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-[12px] text-[#8E8E93] hover:text-white">✕</button>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="flex items-center gap-4 bg-[#121214] border border-white/10 rounded-2xl px-4 py-3">
        <Search className="w-4 h-4 text-[#8E8E93]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar departamento por nombre, líder o función..."
          className="bg-transparent text-[14px] text-white focus:outline-none w-full"
        />
        <span className="text-[12px] text-[#8E8E93] font-mono shrink-0">
          {filtered.length} departamento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid de Departamentos */}
      {loading ? (
        <div className="text-center py-16 text-[#8E8E93] text-[14px]">Cargando departamentos...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-[#121214] border border-white/10 rounded-3xl text-center space-y-2">
          <Layers className="w-8 h-8 text-[#8E8E93] mx-auto mb-2 opacity-50" />
          <div className="text-[16px] font-bold text-white">No se encontraron departamentos</div>
          <p className="text-[14px] text-[#8E8E93]">Cree el primer departamento ministerial para esta filial.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="p-6 bg-[#121214] border border-white/10 rounded-2xl space-y-4 hover:border-white/20 transition-all shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1C1C1E] border border-white/10 text-neutral-300">
                    {getCategoryLabel(d.category)}
                  </span>
                  <h3 className="text-[18px] font-bold text-white tracking-tight pt-1">{d.name}</h3>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2" />
              </div>

              {d.description && (
                <p className="text-[13px] text-[#8E8E93] leading-relaxed">{d.description}</p>
              )}

              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#8E8E93]">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Responsable: <strong className="text-white">{d.responsibleName || 'Pastor Dirigente'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{d.congregationName || 'Filial Local'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Departamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-[20px] font-bold tracking-tight text-white">Nuevo Departamento Ministerial</h3>
              <button onClick={() => setShowModal(false)} className="text-[#8E8E93] hover:text-white text-[13px]">Cerrar ✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Nombre del Departamento</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Departamento de Misiones y Evangelismo"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                >
                  <option value="ministerial">Ministerial</option>
                  <option value="juventude">Juventud</option>
                  <option value="educacao">Educación / Escuela Bíblica</option>
                  <option value="administrativo">Administrativo</option>
                  <option value="comunhao">Comunión y Familia</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Líder / Responsable Oficial</label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  placeholder="Ej. Ev. Marcos Vinicius"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Descripción de Actividades</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Finalidad canónica y propósitos del departamento..."
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-[13px] text-[#8E8E93] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[44px] px-6 text-[14px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Constituyendo...' : 'Constituir Departamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
