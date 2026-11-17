import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Clock, User, Filter, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { AuditLog, User as UserType } from '../types';

interface AuditModuleProps {
  currentUser: UserType;
}

export const AuditModule: React.FC<AuditModuleProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const list = await api.fetchAuditLogs();
      setLogs(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.userName && l.userName.toLowerCase().includes(search.toLowerCase())) ||
    (l.entityType && l.entityType.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                SEGURIDAD & TRAZABILIDAD INSTITUCIONAL
              </span>
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
              Libro Canónico de Auditoría
            </h1>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
              Registro inmutable de todas las acciones ministeriales, altas de miembros, aprobaciones y expedición de documentos.
            </p>
          </div>

          <button
            onClick={loadLogs}
            className="h-[44px] px-5 text-[14px] font-semibold bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar Trazas</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-4 bg-[#121214] border border-white/10 rounded-2xl px-4 py-3">
        <Search className="w-4 h-4 text-[#8E8E93]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por acción, usuario o entidad afectada..."
          className="bg-transparent text-[14px] text-white focus:outline-none w-full"
        />
        <span className="text-[12px] text-[#8E8E93] font-mono shrink-0">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla de Auditoría */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-16 text-[#8E8E93] text-[14px]">Cargando registro de auditoría...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#8E8E93]">No se encontraron eventos en el registro.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#161618] text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                  <th className="py-4 px-6">Marca Temporal</th>
                  <th className="py-4 px-6">Autor / Rol</th>
                  <th className="py-4 px-6">Acción Canónica</th>
                  <th className="py-4 px-6">Entidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[13px]">
                {filtered.map((log) => {
                  const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('es-ES') : '';

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-mono text-neutral-400 whitespace-nowrap text-[12px]">
                        {dateStr}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.userName || 'Sistema'}</div>
                        <div className="text-[11px] text-[#8E8E93] uppercase tracking-wider font-mono">
                          {log.userRole || 'system'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-neutral-200">
                        {log.action}
                      </td>
                      <td className="py-4 px-6 font-mono text-[12px] text-[#8E8E93] whitespace-nowrap">
                        {log.entityType ? (
                          <span className="bg-[#1C1C1E] border border-white/10 px-2 py-0.5 rounded text-neutral-300">
                            {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
