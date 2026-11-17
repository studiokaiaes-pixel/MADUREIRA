import React from 'react';

interface PreviewBannerProps {
  targetAdminName: string | null;
  onExitPreview: () => void;
}

export const PreviewBanner: React.FC<PreviewBannerProps> = ({
  targetAdminName,
  onExitPreview,
}) => {
  return (
    <div className="w-full bg-white text-black py-2.5 px-6 border-b border-white/20 transition-all z-30 sticky top-16 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
          <div className="text-[13px] font-medium text-black">
            <span className="font-bold">MODO VISTA PREVIA</span> · Supervisando terminal de{' '}
            <span className="font-bold underline">{targetAdminName || 'Administrador'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[12px] text-neutral-600 hidden md:inline">
            Acciones en modo sigilo · Cero huella en registros visibles
          </span>
          <button
            onClick={onExitPreview}
            className="px-4 py-1.5 text-[12px] font-semibold rounded-xl bg-black text-white hover:bg-neutral-800 transition-colors shadow-sm"
          >
            Salir de Vista Previa ✕
          </button>
        </div>
      </div>
    </div>
  );
};
