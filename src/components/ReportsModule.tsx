import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileCheck, Calendar, Download, TrendingUp, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { SecretaryStats, User } from '../types';

interface ReportsModuleProps {
  currentUser: User;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<SecretaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchSecretaryStats()
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const total = stats?.totalMembers || 1;
  const activePercent = Math.round(((stats?.activeMembers || 0) / total) * 100);
  const pendingPercent = Math.round(((stats?.pendingMembers || 0) / total) * 100);

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                ESTADÍSTICA ECLESIÁSTICA & REPORTES
              </span>
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
              Informes Canónicos de Secretaría
            </h1>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
              Consolidado de censo de membresía, expedición de certificados, asistencia a cultos y crecimiento institucional.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="h-[44px] px-5 text-[14px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Informe PDF</span>
          </button>
        </div>
      </div>

      {/* Grid Resumen Métrico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-[#121214] border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Censo de Miembros</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight">{stats?.totalMembers || 0}</div>
          <div className="text-[12px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats?.activeMembers || 0} en comunión activa</span>
          </div>
        </div>

        <div className="p-6 bg-[#121214] border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Trámites Emitidos</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight">{stats?.approvedDocumentRequests || 0}</div>
          <div className="text-[12px] text-[#8E8E93]">{stats?.pendingDocumentRequests || 0} en revisión canónica</div>
        </div>

        <div className="p-6 bg-[#121214] border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sedes Registradas</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight">{stats?.totalCongregations || 3}</div>
          <div className="text-[12px] text-[#8E8E93]">Filiales activas</div>
        </div>

        <div className="p-6 bg-[#121214] border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cultos en Agenda</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight">{stats?.upcomingEvents || 0}</div>
          <div className="text-[12px] text-[#8E8E93]">Actividades litúrgicas</div>
        </div>
      </div>

      {/* Desglose Gráfico de Estado de Membresía */}
      <div className="p-7 bg-[#121214] border border-white/10 rounded-3xl space-y-6 shadow-xl">
        <h3 className="text-[18px] font-bold text-white tracking-tight">Distribución del Rol de Miembros</h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-white font-medium">Miembros en Plena Comunión ({stats?.activeMembers || 0})</span>
              <span className="text-emerald-400 font-bold">{activePercent}%</span>
            </div>
            <div className="w-full h-3 bg-[#1C1C1E] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${activePercent}%` }} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-white font-medium">Solicitudes Pendientes de Homologación ({stats?.pendingMembers || 0})</span>
              <span className="text-amber-400 font-bold">{pendingPercent}%</span>
            </div>
            <div className="w-full h-3 bg-[#1C1C1E] rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pendingPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5 text-[13px]">
          <div className="p-4 bg-[#161618] rounded-xl border border-white/5 space-y-1">
            <span className="text-[#8E8E93] text-[11px] uppercase block">Emisión Documental</span>
            <span className="text-white font-bold block">100% Digital Cifrada</span>
            <span className="text-[#8E8E93] text-[12px]">Con verificación QR instantánea</span>
          </div>

          <div className="p-4 bg-[#161618] rounded-xl border border-white/5 space-y-1">
            <span className="text-[#8E8E93] text-[11px] uppercase block">Jurisdicción Pastoral</span>
            <span className="text-white font-bold block">Aislamiento por Sede</span>
            <span className="text-[#8E8E93] text-[12px]">Cada pastor gobierna su filial</span>
          </div>

          <div className="p-4 bg-[#161618] rounded-xl border border-white/5 space-y-1">
            <span className="text-[#8E8E93] text-[11px] uppercase block">Trazabilidad</span>
            <span className="text-white font-bold block">Auditoría Inmutable</span>
            <span className="text-[#8E8E93] text-[12px]">Registros sellados en servidor</span>
          </div>
        </div>
      </div>
    </div>
  );
};
