import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  CreditCard,
  Grid,
} from 'lucide-react';
import { NavSection } from '../types';

interface PastorMobileTabBarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenMore?: () => void;
}

export const PastorMobileTabBar: React.FC<PastorMobileTabBarProps> = ({
  currentSection,
  onSelectSection,
  onOpenMore,
}) => {
  const tabs: {
    id: NavSection;
    label: string;
    icon: any;
    isMore?: boolean;
  }[] = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { id: 'miembros', label: 'Miembros', icon: Users },
    { id: 'documentacion', label: 'Docs', icon: FileCheck },
    { id: 'credenciales', label: 'Credencial', icon: CreditCard },
    { id: 'modulos', label: 'Más', icon: Grid, isMore: true },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#0c0d11]/95 backdrop-blur-xl border-t border-white/10 z-40 px-3 py-2 flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          currentSection === tab.id ||
          (tab.id === 'miembros' && currentSection === 'expedientes') ||
          (tab.isMore &&
            ![
              'inicio',
              'miembros',
              'expedientes',
              'documentacion',
              'credenciales',
            ].includes(currentSection));

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.isMore && onOpenMore) {
                onOpenMore();
              } else {
                onSelectSection(tab.id);
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
              isActive ? 'text-white' : 'text-[#8E8E93] hover:text-neutral-300'
            }`}
          >
            <div
              className={`w-9 h-7 rounded-full flex items-center justify-center transition-colors ${
                isActive ? 'bg-white/15 text-white' : 'text-[#8E8E93]'
              }`}
            >
              <Icon className="w-4 h-4 stroke-[2]" />
            </div>
            <span
              className={`text-[10px] tracking-tight ${
                isActive ? 'font-bold text-white' : 'font-medium text-[#8E8E93]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
