import React from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenCredentials?: () => void;
  onViewPublicPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onOpenCredentials, onViewPublicPortal }) => {
  return (
    <header className="w-full border-b border-white/[0.08] bg-[#000000]/80 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (estilo Taskk / iOS) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-white overflow-hidden p-1 shadow-sm">
            <img
              src="/assets/aistudio/logo_madureira_white_transparent.png"
              alt="Logo AD Madureira"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[16px] tracking-tight text-white select-none">
              AD MADUREIRA
            </span>
            {user?.isGhost && (
              <span className="text-[10px] tracking-wider uppercase font-semibold text-neutral-400 bg-[#1C1C1E] border border-white/10 px-2.5 py-0.5 rounded-full">
                ROOT SIGILO
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-neutral-400">
          <span className="text-neutral-500">EST. 1929</span>
          <span className="text-neutral-700">·</span>
          <span className="text-neutral-400">MINISTÉRIO DE MADUREIRA</span>
          <span className="text-neutral-700">·</span>
          <span className="text-neutral-500">CONAMAD</span>
        </nav>

        {/* Zone 3: Primary Action / Account */}
        <div className="flex items-center gap-3 shrink-0">
          {onViewPublicPortal && (
            <button
              onClick={onViewPublicPortal}
              className="text-[12px] font-semibold px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors duration-200 inline-flex items-center gap-1.5"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">Portal Público</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[14px] text-white tracking-tight font-semibold">{user.name}</div>
                <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                  {user.role === 'root' ? 'Supervisão Geral' : 'Administrador'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-[13px] font-medium px-4 py-2 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-neutral-300 hover:text-white transition-colors duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenCredentials}
              className="text-[13px] font-medium px-4 py-2 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-neutral-300 hover:text-white transition-colors duration-200"
            >
              Credenciales Demo
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
