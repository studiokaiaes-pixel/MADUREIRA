import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  FileCheck,
  Calendar,
  Building2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';
import { api } from '../api';
import { NavSection, SecretaryStats, User } from '../types';

interface SecretaryDashboardProps {
  currentUser: User;
  onNavigate: (section: NavSection) => void;
}

export const SecretaryDashboard: React.FC<SecretaryDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [stats, setStats] = useState<SecretaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchSecretaryStats()
      .then((data) => setStats(data))
      .catch((err) => console.error('Error al cargar stats:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-orange-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                ADM MADUREIRA · SISTEMA INTEGRAL DE SECRETARÍA
              </span>
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
              Panel Administrativo de Secretaría
            </h1>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
              Bienvenido, <strong className="text-white">{currentUser.name}</strong>. {
                currentUser.role === 'pastor_advisor'
                  ? `Tiene asignada la supervisión pastoral específica de: ${(currentUser.assignedFeature || 'expedientes')
                      .split(',')
                      .map((f) => f.trim().toUpperCase())
                      .filter(Boolean)
                      .join(', ')} en esta filial.`
                  : currentUser.role === 'secretary' || currentUser.role === 'local_secretary'
                  ? 'Panel de secretaría operativa (Admin Junior) para gestión de miembros, expedientes canónicos y eventos de culto.'
                  : 'Gestione los expedientes de miembros, emisión de certificados oficiales, directorio de congregaciones y cultos eclesiásticos.'
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {currentUser.role === 'pastor_advisor' ? (
              (currentUser.assignedFeature || 'expedientes')
                .split(',')
                .map((f) => f.trim())
                .filter(Boolean)
                .map((feat) => (
                  <button
                    key={feat}
                    onClick={() => onNavigate(feat as any)}
                    className="h-[42px] px-5 text-[13px] font-semibold bg-amber-400 text-black hover:bg-amber-300 rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <span>Acceder a {feat.toUpperCase()}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                ))
            ) : (
              <>
                <button
                  onClick={() => onNavigate('miembros')}
                  className="h-[42px] px-4 text-[13px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Alta de Miembro</span>
                </button>
                <button
                  onClick={() => onNavigate('documentacion')}
                  className="h-[42px] px-4 text-[13px] font-semibold bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-white rounded-xl transition-all flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Emitir Documento</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-[#121214] border border-white/10 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Miembros</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-[24px] font-bold text-white tracking-tight">
            {loading ? '...' : stats?.totalMembers || 0}
          </div>
          <div className="text-[11px] text-[#8E8E93]">Expedientes en base</div>
        </div>

        <div className="p-4 bg-[#121214] border border-white/10 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Activos</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[24px] font-bold text-emerald-400 tracking-tight">
            {loading ? '...' : stats?.activeMembers || 0}
          </div>
          <div className="text-[11px] text-[#8E8E93]">En plena comunión</div>
        </div>

        <div className="p-4 bg-[#121214] border border-white/10 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Por Aceptar</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-[24px] font-bold text-amber-300 tracking-tight">
            {loading ? '...' : stats?.pendingMembers || 0}
          </div>
          <div className="text-[11px] text-[#8E8E93]">Pendientes secretaría</div>
        </div>

        <div className="p-4 bg-[#121214] border border-white/10 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Documentos</span>
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-[24px] font-bold text-white tracking-tight">
            {loading ? '...' : stats?.pendingDocumentRequests || 0}
          </div>
          <div className="text-[11px] text-[#8E8E93]">Trámites en curso</div>
        </div>

        <div className="p-4 bg-[#121214] border border-white/10 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Filiales</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-[24px] font-bold text-white tracking-tight">
            {loading ? '...' : stats?.totalCongregations || 0}
          </div>
          <div className="text-[11px] text-[#8E8E93]">Sedes eclesiásticas</div>
        </div>

        <div className="p-4 bg-[#121214] border border-white/10 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Eventos</span>
            <Calendar className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-[24px] font-bold text-white tracking-tight">
            {loading ? '...' : stats?.upcomingEvents || 0}
          </div>
          <div className="text-[11px] text-[#8E8E93]">Cultos programados</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('miembros')}
          className="p-6 bg-[#121214] border border-white/10 rounded-3xl hover:border-white/20 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-white">
              <Users className="w-5 h-5 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-[18px] font-bold text-white tracking-tight">Gestión de Miembros</h3>
          <p className="text-[13px] text-[#8E8E93] mt-1 leading-relaxed">
            Filtre por estado, congregación y consulte los expedientes individuales con historial y ficha.
          </p>
        </div>

        <div
          onClick={() => onNavigate('documentacion')}
          className="p-6 bg-[#121214] border border-white/10 rounded-3xl hover:border-white/20 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-white">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-[18px] font-bold text-white tracking-tight">Secretaría Documental</h3>
          <p className="text-[13px] text-[#8E8E93] mt-1 leading-relaxed">
            Cartas de recomendación, traslado, certificados de membresía con sello QR y validación oficial.
          </p>
        </div>

        <div
          onClick={() => onNavigate('credenciales')}
          className="p-6 bg-[#121214] border border-white/10 rounded-3xl hover:border-white/20 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-[18px] font-bold text-white tracking-tight">Credencial Digital Oficial</h3>
          <p className="text-[13px] text-[#8E8E93] mt-1 leading-relaxed">
            Carnet eclesiástico digital con código QR seguro, preparado para Apple Wallet y Google Wallet.
          </p>
        </div>
      </div>

      {/* Recent Activity / Audit Log Table */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-[18px] font-bold text-white tracking-tight">Trazabilidad y Auditoría Reciente</h2>
            <p className="text-[13px] text-[#8E8E93]">Registro inmutable de acciones administrativas en la plataforma</p>
          </div>
          <button
            onClick={() => onNavigate('auditoria')}
            className="text-[12px] font-semibold text-white hover:underline flex items-center gap-1"
          >
            <span>Ver Registro Completo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[13px] text-[#8E8E93]">Cargando registro de operaciones...</div>
        ) : (stats?.recentAuditLogs || []).length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[#8E8E93]">No hay registros de actividad recientes.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats?.recentAuditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-[13px] font-semibold text-white">{log.action}</div>
                  <div className="text-[11px] text-[#8E8E93] flex items-center gap-2">
                    <span>{log.userName || 'Usuario'}</span>
                    <span>·</span>
                    <span className="uppercase">{log.userRole}</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#8E8E93] shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
