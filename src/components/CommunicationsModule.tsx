import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Shield, ShieldCheck, Building2, Globe, CheckCircle2, AlertTriangle, FileText, Lock } from 'lucide-react';
import { api } from '../api';
import { Announcement, User } from '../types';

interface CommunicationsModuleProps {
  currentUser: User;
}

export const CommunicationsModule: React.FC<CommunicationsModuleProps> = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetScope, setTargetScope] = useState<'global' | 'congregation' | 'department'>('congregation');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Reglas de emisión según rol
  const isRoot = ['root', 'superadmin'].includes(currentUser.role);
  const isAdmin = ['admin', 'local_pastor', 'general_pastor'].includes(currentUser.role);
  const isSecretary = ['local_secretary', 'general_secretary'].includes(currentUser.role);
  const canPublish = isRoot || isAdmin || isSecretary;

  // Identidad de emisión pública configurada
  const displayAuthorPreview = isRoot
    ? 'Soporte del Sistema'
    : isSecretary
    ? `${currentUser.name} (Secretaría)`
    : `${currentUser.name} (Pastor Dirigente)`;

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const list = await api.fetchAnnouncements();
      setAnnouncements(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createAnnouncement({
        title,
        content,
        targetScope: isRoot ? targetScope : 'congregation',
        congregationId: targetScope === 'global' ? undefined : Number(currentUser.congregationId || 1),
        authorName: displayAuthorPreview,
      });
      setMessage(
        isRoot
          ? 'Comunicado emitido exitosamente con remitente "Soporte del Sistema" (sigilo activo).'
          : 'Comunicado oficial emitido con éxito para la congregación.'
      );
      setTitle('');
      setContent('');
      setShowModal(false);
      loadAnnouncements();
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getAuthorBadge = (authorName: string) => {
    if (authorName.toLowerCase().includes('soporte')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Shield className="w-3 h-3 text-amber-400" />
          Soporte del Sistema
        </span>
      );
    }
    if (authorName.toLowerCase().includes('secretar')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <FileText className="w-3 h-3 text-purple-400" />
          {authorName}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
        <Building2 className="w-3 h-3 text-blue-400" />
        {authorName}
      </span>
    );
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-rose-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                BOLETINES & CIRCULARES CANÓNICAS
              </span>
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
              Comunicaciones Oficiales
            </h1>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
              Publicación de circulares, convocatorias de asamblea pastoral y anuncios canónicos emitidos exclusivamente por la Secretaría, Pastores Dirigentes y Soporte.
            </p>
          </div>

          {canPublish ? (
            <button
              onClick={() => setShowModal(true)}
              className="h-[44px] px-5 text-[14px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Comunicado</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#8E8E93]">
              <Lock className="w-4 h-4 text-neutral-400" />
              <span>Canal oficial de lectura para miembros</span>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 text-[14px] text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[12px] text-[#8E8E93] hover:text-white px-2">✕</button>
        </div>
      )}

      {/* Lista de Comunicados */}
      {loading ? (
        <div className="text-center py-16 text-[#8E8E93] text-[14px]">Cargando circulares oficiales...</div>
      ) : announcements.length === 0 ? (
        <div className="p-12 bg-[#121214] border border-white/10 rounded-3xl text-center space-y-2">
          <Megaphone className="w-8 h-8 text-[#8E8E93] mx-auto mb-2 opacity-50" />
          <div className="text-[16px] font-bold text-white">No hay comunicados publicados</div>
          <p className="text-[14px] text-[#8E8E93]">
            {canPublish ? 'Publique la primera circular canónica oficial.' : 'Aún no se han emitido circulares para esta sede.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => {
            const dateStr = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

            return (
              <div
                key={a.id}
                className="p-6 bg-[#121214] border border-white/10 rounded-2xl space-y-4 hover:border-white/20 transition-all shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                      a.targetScope === 'global'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}>
                      {a.targetScope === 'global' ? 'CIRCULAR NACIONAL' : 'FILIAL LOCAL'}
                    </span>
                    <span className="text-[12px] text-[#8E8E93] font-mono">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#8E8E93]">Emitido por:</span>
                    {getAuthorBadge(a.authorName)}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[20px] font-bold text-white tracking-tight">{a.title}</h3>
                  <div className="text-[14px] text-neutral-300 leading-relaxed whitespace-pre-wrap">{a.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Emitir Comunicado */}
      {showModal && canPublish && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-[20px] font-bold tracking-tight text-white">Emitir Comunicado Oficial</h3>
                <p className="text-[12px] text-[#8E8E93]">Válido únicamente para administradores, secretaría y soporte</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#8E8E93] hover:text-white text-[13px]">Cerrar ✕</button>
            </div>

            {/* Aviso de autoría según perfil */}
            {isRoot && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-amber-300 text-[12px] font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Emisión bajo: Soporte del Sistema</span>
                </div>
                <p className="text-[12px] text-amber-200/80 leading-relaxed">
                  Por regla de sigilo operativo, este comunicado se publicará automáticamente con el remitente <strong>"Soporte del Sistema"</strong> (nunca revelará la identidad Root ni alertará a los administradores).
                </p>
              </div>
            )}

            {isAdmin && !isRoot && (
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/25 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-blue-300 text-[12px] font-bold">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Emisión Pastoral: {currentUser.name} (Pastor Dirigente)</span>
                </div>
                <p className="text-[12px] text-blue-200/80 leading-relaxed">
                  Este comunicado se emitirá de manera exclusiva para los miembros de su congregación local asignada.
                </p>
              </div>
            )}

            {isSecretary && (
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/25 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-purple-300 text-[12px] font-bold">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Emisión de Secretaría: {currentUser.name} (Secretaría)</span>
                </div>
                <p className="text-[12px] text-purple-200/80 leading-relaxed">
                  Este aviso canónico llevará la firma oficial de la Secretaría para la filial local.
                </p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Título del Comunicado</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Convocatoria a Santa Cena Extraordinaria"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Alcance: Los administradores locales y secretarios quedan aislados a su congregación */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Alcance del Comunicado</label>
                {isRoot ? (
                  <select
                    value={targetScope}
                    onChange={(e: any) => setTargetScope(e.target.value)}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="global">Nacional / Todas las Sedes (Soporte General)</option>
                    <option value="congregation">Filial Local Específica</option>
                  </select>
                ) : (
                  <div className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-neutral-300 flex items-center justify-between">
                    <span>Filial Local (Esta Congregación)</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Aislamiento Activo
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Cuerpo del Comunicado</label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escriba el texto oficial de la circular o instrucción..."
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
                  {submitting ? 'Publicando...' : 'Publicar Circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
