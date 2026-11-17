import React, { useState } from 'react';
import {
  X,
  Check,
  Palette,
  ArrowLeft,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  HumationConfig,
  DEFAULT_HUMATION_CONFIG,
  HEAD_OPTIONS,
  BODY_OPTIONS,
  ITEM_OPTIONS,
  GLASSES_OPTIONS,
  COLOR_PALETTES,
  HumationAvatar,
  generateHumationDataUrl,
} from './HumationAvatar';
import { api } from '../api';
import { Member } from '../types';

interface AvatarCustomizerModalProps {
  member: Member;
  onClose: () => void;
  onAvatarSaved: (newPhotoUrl: string) => void;
  isInline?: boolean;
}

type TabType = 'head' | 'body' | 'item' | 'glasses';

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  member,
  onClose,
  onAvatarSaved,
  isInline = false,
}) => {
  // Parse initial config or fallback to default
  const [config, setConfig] = useState<HumationConfig>(() => {
    return { ...DEFAULT_HUMATION_CONFIG };
  });

  const [activeTab, setActiveTab] = useState<TabType>('head');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveToProfile = async () => {
    setSaving(true);
    try {
      const dataUrl = generateHumationDataUrl(config);
      await api.updateMember(member.id, { photoUrl: dataUrl });
      onAvatarSaved(dataUrl);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (!isInline) onClose();
      }, 1200);
    } catch (err: any) {
      alert('Erro ao salvar avatar: ' + (err.message || 'Erro de comunicação'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const dataUrl = generateHumationDataUrl(config);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `avatar-humation-${member.firstName.toLowerCase()}.svg`;
    link.click();
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_HUMATION_CONFIG });
  };

  const content = (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-black font-sans select-none">
      {/* ============================================================== */}
      {/* CABEÇALHO (Fiel à foto: "Humation 1 by 373" com botões)        */}
      {/* ============================================================== */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-neutral-200/80 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors text-black"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-[17px] font-bold text-black tracking-tight leading-none">
              Humation 1
            </h2>
            <span className="text-[11px] text-neutral-400 font-medium">
              by 373 • Assembleia de Deus Madureira
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-black text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
            title="Baixar Avatar em SVG"
          >
            <Download className="w-4 h-4" />
          </button>
          {!isInline && (
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-700 flex items-center justify-center transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* ============================================================== */}
      {/* ÁREA DE PRÉ-VISUALIZAÇÃO AO VIVO (Canvas Humation)             */}
      {/* ============================================================== */}
      <div className="relative p-6 sm:p-8 flex items-center justify-center bg-[#F4F4F5] border-b border-neutral-200/70">
        <div className="relative w-48 h-60 sm:w-56 sm:h-72 rounded-3xl overflow-hidden shadow-sm border border-neutral-300/60 bg-white">
          <HumationAvatar config={config} className="w-full h-full" />

          {/* Botão Flutuante de Paleta de Cores (Exato como na foto!) */}
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-black/10 shadow-md flex items-center justify-center text-neutral-800 hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Mudar Cor de Fundo"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>

        {/* Seletor Suspenso de Cores de Fundo */}
        {showColorPicker && (
          <div className="absolute bottom-4 z-30 p-3 bg-white/95 backdrop-blur-xl border border-neutral-200 rounded-2xl shadow-xl flex items-center gap-2 animate-fadeIn">
            {COLOR_PALETTES.map((pal) => (
              <button
                key={pal.value}
                type="button"
                onClick={() => {
                  setConfig((prev) => ({ ...prev, bgColor: pal.value }));
                  setShowColorPicker(false);
                }}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  config.bgColor === pal.value ? 'border-black scale-105 shadow-sm' : 'border-neutral-300'
                }`}
                style={{ backgroundColor: pal.value }}
                title={pal.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* ABAS DE CATEGORIA: Head | Body | Item | Glasses                */}
      {/* ============================================================== */}
      <div className="flex items-center justify-around border-b border-neutral-200 bg-white px-2">
        {(
          [
            { id: 'head', label: 'Head' },
            { id: 'body', label: 'Body' },
            { id: 'item', label: 'Item' },
            { id: 'glasses', label: 'Glasses' },
          ] as { id: TabType; label: string }[]
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-4 text-[14px] font-semibold transition-all relative cursor-pointer ${
                isActive ? 'text-black font-bold' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-2 h-0.5 bg-black rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* GRADE DE OPÇÕES (3 colunas com cartões idênticos ao print)     */}
      {/* ============================================================== */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white space-y-4">
        {/* Grade para HEAD (Cabelos) */}
        {activeTab === 'head' && (
          <div className="grid grid-cols-3 gap-3">
            {HEAD_OPTIONS.map((opt) => {
              const isSelected = config.head === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, head: opt.id }))}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative bg-neutral-50/70 hover:bg-neutral-100 ${
                    isSelected
                      ? 'border-2 border-black shadow-md bg-neutral-100/80 scale-[1.02]'
                      : 'border border-neutral-200/80'
                  }`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20">
                    <HumationAvatar
                      config={{ ...config, head: opt.id, body: 'collar-shirt', item: 'none', glasses: 'none', bgColor: '#FFFFFF' }}
                      className="w-full h-full pointer-events-none"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-600 font-medium truncate mt-1 max-w-full px-1">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-black" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Grade para BODY (Roupas) */}
        {activeTab === 'body' && (
          <div className="grid grid-cols-3 gap-3">
            {BODY_OPTIONS.map((opt) => {
              const isSelected = config.body === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, body: opt.id }))}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative bg-neutral-50/70 hover:bg-neutral-100 ${
                    isSelected
                      ? 'border-2 border-black shadow-md bg-neutral-100/80 scale-[1.02]'
                      : 'border border-neutral-200/80'
                  }`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20">
                    <HumationAvatar
                      config={{ ...config, body: opt.id, item: 'none', bgColor: '#FFFFFF' }}
                      className="w-full h-full pointer-events-none"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-600 font-medium truncate mt-1 max-w-full px-1">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-black" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Grade para ITEM (Acessórios e Símbolos Eclesiásticos) */}
        {activeTab === 'item' && (
          <div className="grid grid-cols-3 gap-3">
            {ITEM_OPTIONS.map((opt) => {
              const isSelected = config.item === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, item: opt.id }))}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative bg-neutral-50/70 hover:bg-neutral-100 ${
                    isSelected
                      ? 'border-2 border-black shadow-md bg-neutral-100/80 scale-[1.02]'
                      : 'border border-neutral-200/80'
                  }`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20">
                    <HumationAvatar
                      config={{ ...config, item: opt.id, bgColor: '#FFFFFF' }}
                      className="w-full h-full pointer-events-none"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-600 font-medium truncate mt-1 max-w-full px-1">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-black" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Grade para GLASSES (Óculos) */}
        {activeTab === 'glasses' && (
          <div className="grid grid-cols-3 gap-3">
            {GLASSES_OPTIONS.map((opt) => {
              const isSelected = config.glasses === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, glasses: opt.id }))}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative bg-neutral-50/70 hover:bg-neutral-100 ${
                    isSelected
                      ? 'border-2 border-black shadow-md bg-neutral-100/80 scale-[1.02]'
                      : 'border border-neutral-200/80'
                  }`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20">
                    <HumationAvatar
                      config={{ ...config, glasses: opt.id, bgColor: '#FFFFFF' }}
                      className="w-full h-full pointer-events-none"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-600 font-medium truncate mt-1 max-w-full px-1">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-black" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* BARRA INFERIOR DE CONFIRMAÇÃO                                  */}
      {/* ============================================================== */}
      <footer className="p-4 sm:p-5 bg-white border-t border-neutral-200 flex items-center justify-between gap-3 sticky bottom-0">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restaurar</span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={handleSaveToProfile}
          className={`flex-1 h-12 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
            saveSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-black text-white hover:bg-neutral-800 active:scale-98'
          }`}
        >
          {saveSuccess ? (
            <>
              <Check className="w-5 h-5 text-white" />
              <span>Avatar Salvo com Sucesso!</span>
            </>
          ) : saving ? (
            <span>Atualizando Ficha...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Salvar no Meu Perfil & Ficha</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );

  if (isInline) {
    return (
      <div className="w-full rounded-3xl overflow-hidden border border-neutral-200 shadow-2xl">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-md h-[92vh] max-h-[820px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col">
        {content}
      </div>
    </div>
  );
};
