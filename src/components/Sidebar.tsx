import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  Building2,
  Layers,
  CalendarCheck,
  Megaphone,
  HeartHandshake,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Settings,
  SlidersHorizontal,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { NavSection, User } from '../types';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentUser: User;
  onLogout: () => void;
  onViewPublicPortal?: () => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  currentUser,
  onLogout,
  onViewPublicPortal,
  onClose,
  isMobileDrawer = false,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isMember = currentUser.role === 'member';
  const isSecretary = currentUser.role === 'secretary' || currentUser.role === 'local_secretary';
  const isAdvisor = currentUser.role === 'pastor_advisor';
  const advisorFeatures = (currentUser.assignedFeature || 'expedientes')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  // Catálogo de ítems del bloque principal
  const allMenuItems: { id: NavSection; label: string; icon: any }[] = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { id: 'miembros', label: 'Miembros', icon: Users },
    { id: 'expedientes', label: isMember ? 'Mi Expediente' : 'Expedientes', icon: FileText },
    { id: 'documentacion', label: 'Documentación', icon: FileCheck },
    { id: 'eventos', label: 'Cultos y Eventos', icon: CalendarCheck },
    { id: 'comunicaciones', label: 'Comunicaciones', icon: Megaphone },
    { id: 'atencion', label: 'Atención al Miembro', icon: HeartHandshake },
    { id: 'credenciales', label: 'Credencial Digital', icon: CreditCard },
    { id: 'gestion_filial', label: 'Gestión de Filial', icon: SlidersHorizontal },
  ];

  const primaryMenuItems = allMenuItems.filter((item) => {
    if (isAdvisor) {
      const expanded = new Set(advisorFeatures);
      if (expanded.has('expedientes')) expanded.add('miembros');
      return item.id === 'inicio' || expanded.has(item.id);
    }
    if (isSecretary) {
      return ['inicio', 'miembros', 'expedientes', 'documentacion', 'eventos', 'credenciales'].includes(item.id);
    }
    if (isMember) {
      return ['inicio', 'expedientes', 'eventos', 'atencion', 'credenciales'].includes(item.id);
    }
    return true;
  });

  const handleItemClick = (id: NavSection) => {
    onSelectSection(id);
    if (onClose) onClose();
  };

  return (
    <aside
      className={`w-72 sm:w-64 bg-[#0a0a0c] border-r border-white/10 flex flex-col shrink-0 select-none z-40 transition-transform ${
        isMobileDrawer ? 'h-full' : 'h-screen sticky top-0'
      }`}
    >
      {/* Brand Header con Avatar [AV] del Pastor (1) */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#0d0e12]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
            <span>✝</span>
          </div>
          <div className="min-w-0">
            <div className="text-[13px] sm:text-[14px] font-bold text-white tracking-tight leading-tight truncate">
              ADM MADUREIRA
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#8E8E93] font-semibold mt-0.5 truncate">
              {isAdvisor
                ? `PASTOR ASESOR · ${advisorFeatures.map((f) => f.toUpperCase()).join(' · ')}`
                : isSecretary
                ? 'SECRETARÍA (ADMIN JUNIOR)'
                : isMember
                ? 'PORTAL DEL MIEMBRO'
                : 'SECRETARÍA ECLESIÁSTICA'}
            </div>
          </div>
        </div>

        {/* Avatar del pastor (1) */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-sky-500/20 border border-white/20 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm">
          {getInitials(currentUser.name || 'Alexander Vance')}
        </div>
      </div>

      {/* Navigation List (CSS selector 2) */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93]">
          MENÚ PRINCIPAL
        </div>

        {primaryMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-[#8E8E93]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-black shrink-0" />}
            </button>
          );
        })}

        {/* Separador Visual y Herramientas Administrativas */}
        {!isSecretary && !isAdvisor && !isMember && (
          <div className="pt-3 pb-1 border-t border-white/10 mt-3">
            {/* 21. Configuración */}
            <button
              onClick={() => handleItemClick('configuracion')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                currentSection === 'configuracion'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Settings className={`w-4 h-4 shrink-0 ${currentSection === 'configuracion' ? 'text-black' : 'text-[#8E8E93]'}`} />
                <span className="truncate">Configuración</span>
              </div>
              {currentSection === 'configuracion' && <ChevronRight className="w-3.5 h-3.5 text-black shrink-0" />}
            </button>

            {/* 23. Auditoría Completa */}
            <button
              onClick={() => handleItemClick('auditoria')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer mt-1 ${
                currentSection === 'auditoria'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#8E8E93] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className={`w-4 h-4 shrink-0 ${currentSection === 'auditoria' ? 'text-black' : 'text-[#8E8E93]'}`} />
                <span className="truncate">Auditoría completa</span>
              </div>
              {currentSection === 'auditoria' && <ChevronRight className="w-3.5 h-3.5 text-black shrink-0" />}
            </button>
          </div>
        )}

        {/* 22. Portal Público */}
        {onViewPublicPortal && (
          <div className="pt-2">
            <button
              onClick={() => {
                onViewPublicPortal();
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base shrink-0">🌐</span>
                <span className="truncate">Portal Público</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-sky-400/60 shrink-0" />
            </button>
          </div>
        )}
      </nav>

      {/* User Footer Card (CSS selector 3 - Bloque de usuario 20) */}
      <div className="p-3 border-t border-white/10 bg-[#101115]">
        <div className="p-3 bg-[#16181e] border border-white/10 rounded-2xl space-y-2.5 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-sky-500/20 border border-white/20 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
              {getInitials(currentUser.name || 'Alexander Vance')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] font-semibold truncate">
                {currentUser.role === 'pastor_advisor'
                  ? `PASTOR ASESOR (${advisorFeatures.map((f) => f.toUpperCase()).join(', ')})`
                  : currentUser.role === 'secretary' || currentUser.role === 'local_secretary'
                  ? 'SECRETARIO (ADMIN JR)'
                  : currentUser.role === 'general_pastor' || currentUser.role === 'local_pastor'
                  ? 'PASTOR ADMINISTRADOR'
                  : currentUser.role === 'member'
                  ? 'MIEMBRO EN COMUNIÓN'
                  : 'ADMINISTRADOR'}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full h-8 text-[11px] font-semibold text-[#8E8E93] hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
