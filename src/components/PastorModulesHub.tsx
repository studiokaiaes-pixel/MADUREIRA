import React from 'react';
import {
  FileText,
  FileCheck,
  Layers,
  CalendarCheck,
  Megaphone,
  HeartHandshake,
  SlidersHorizontal,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
  Settings,
  Users,
  Building2,
} from 'lucide-react';
import { NavSection, User } from '../types';

interface PastorModulesHubProps {
  currentUser: User;
  onNavigate: (section: NavSection) => void;
  onBack?: () => void;
}

export const PastorModulesHub: React.FC<PastorModulesHubProps> = ({
  currentUser,
  onNavigate,
  onBack,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 animate-fadeIn select-none font-sans">
      {/* Barra Superior */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <button
          onClick={onBack || (() => onNavigate('inicio'))}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#8E8E93] hover:text-white transition-colors py-1 px-2.5 rounded-full hover:bg-white/5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Módulos</span>
        </button>
        <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] uppercase">
          PANEL PASTORAL
        </span>
      </div>

      {/* Cabecera de Rol (24) */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1C1F26] to-[#121418] border border-white/15 flex items-center justify-center text-white font-bold text-[16px] shadow-md shrink-0">
            {getInitials(currentUser.name || 'Alexander Vance')}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-white tracking-tight truncate">
                Pastor Administrador
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-white/10 text-emerald-300 border border-emerald-400/20 shrink-0">
                ADMIN
              </span>
            </div>
            <div className="text-[12px] text-[#8E8E93] truncate">
              Acceso total · Secretaría Eclesiástica
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: GESTIÓN (25) */}
      <div className="space-y-3">
        <div className="px-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8E8E93]">
          GESTIÓN
        </div>
        <div className="space-y-2">
          {/* Expedientes */}
          <button
            onClick={() => onNavigate('expedientes')}
            className="w-full p-4 rounded-2xl bg-[#121214] hover:bg-[#18181c] border border-white/10 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-white tracking-tight">Expedientes</div>
                <div className="text-[12px] text-[#8E8E93] truncate">Altas, traslados y bajas</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 text-[12px] font-bold text-white flex items-center justify-center">
                2
              </span>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Documentación */}
          <button
            onClick={() => onNavigate('documentacion')}
            className="w-full p-4 rounded-2xl bg-[#121214] hover:bg-[#18181c] border border-white/10 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-white tracking-tight">Documentación</div>
                <div className="text-[12px] text-[#8E8E93] truncate">Certificados y cartas</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 text-[12px] font-bold text-neutral-400 flex items-center justify-center">
                0
              </span>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Cultos y Eventos */}
          <button
            onClick={() => onNavigate('eventos')}
            className="w-full p-4 rounded-2xl bg-[#121214] hover:bg-[#18181c] border border-white/10 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-white tracking-tight">Cultos y Eventos</div>
                <div className="text-[12px] text-[#8E8E93] truncate">Agenda de las 4 filiales</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 text-[12px] font-bold text-white flex items-center justify-center">
                5
              </span>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* SECCIÓN 2: COMUNIDAD (26) */}
      <div className="space-y-3">
        <div className="px-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8E8E93]">
          COMUNIDAD
        </div>
        <div className="space-y-2">
          {/* Comunicaciones */}
          <button
            onClick={() => onNavigate('comunicaciones')}
            className="w-full p-4 rounded-2xl bg-[#121214] hover:bg-[#18181c] border border-white/10 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-white tracking-tight">Comunicaciones</div>
                <div className="text-[12px] text-[#8E8E93] truncate">Avisos y boletines</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 text-[12px] font-bold text-neutral-400 flex items-center justify-center">
                0
              </span>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Atención al Miembro */}
          <button
            onClick={() => onNavigate('atencion')}
            className="w-full p-4 rounded-2xl bg-[#121214] hover:bg-[#18181c] border border-white/10 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-white tracking-tight">Atención al Miembro</div>
                <div className="text-[12px] text-[#8E8E93] truncate">Pedidos pastorales</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-[12px] font-bold text-amber-300 border border-amber-500/30 flex items-center justify-center">
                1
              </span>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Gestión de Filial */}
          <button
            onClick={() => onNavigate('gestion_filial')}
            className="w-full p-4 rounded-2xl bg-[#121214] hover:bg-[#18181c] border border-white/10 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-white tracking-tight">Gestión de Filial</div>
                <div className="text-[12px] text-[#8E8E93] truncate">4 sedes activas</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 text-[12px] font-bold text-white flex items-center justify-center">
                4
              </span>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* AVISO DE APROBACIONES PENDIENTES (27) */}
      <div
        onClick={() => onNavigate('miembros')}
        className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#1C1416] to-[#121214] border border-red-500/30 flex items-center justify-between gap-3 cursor-pointer hover:border-red-500/50 transition-all shadow-lg group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-white tracking-tight">
              2 altas pendientes de aprobación
            </div>
            <div className="text-[12px] text-red-300/80">
              Requiere firma del pastor
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </div>

      {/* Accesos rápidos de Configuración y Auditoría */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => onNavigate('auditoria')}
          className="p-3.5 rounded-2xl bg-[#121214] hover:bg-[#18181c] border border-white/10 flex items-center gap-3 text-left transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-neutral-400" />
          <span className="text-[13px] font-semibold text-white">Auditoría</span>
        </button>
        <button
          onClick={() => onNavigate('configuracion')}
          className="p-3.5 rounded-2xl bg-[#121214] hover:bg-[#18181c] border border-white/10 flex items-center gap-3 text-left transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          <span className="text-[13px] font-semibold text-white">Ajustes</span>
        </button>
      </div>
    </div>
  );
};
