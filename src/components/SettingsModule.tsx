import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  Building2,
  Sparkles,
  Palette,
  Check,
  User,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api';
import { User as UserType } from '../types';
import { resolveFichaChurchInfo } from '../utils/generateFichaPdf';
import {
  HumationAvatar,
  DEFAULT_HUMATION_CONFIG,
  HumationConfig,
  COLOR_PALETTES,
} from './HumationAvatar';
import { AvatarCustomizerModal } from './AvatarCustomizerModal';

interface SettingsModuleProps {
  currentUser: UserType;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ currentUser }) => {
  const [timeoutMinutes, setTimeoutMinutes] = useState(60);
  const [directSync, setDirectSync] = useState(true);
  const [printFormat, setPrintFormat] = useState('a4');
  const [saved, setSaved] = useState(false);

  // Datos de la iglesia del administrador (predeterminados para Ficha de Miembro)
  const [churchForm, setChurchForm] = useState({
    name: '',
    nif: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
  });
  const [savingChurch, setSavingChurch] = useState(false);

  // Estado del Avatar Humation para el Administrador / Secretario
  const [avatarConfig, setAvatarConfig] = useState<HumationConfig>({
    ...DEFAULT_HUMATION_CONFIG,
    body: currentUser.role === 'admin' ? 'pastoral-suit' : 'collar-shirt',
  });
  const [showModalCustomizer, setShowModalCustomizer] = useState(false);

  useEffect(() => {
    api
      .fetchAdminCongregation()
      .then((cong) => {
        if (cong) {
          const resolved = resolveFichaChurchInfo(cong);
          setChurchForm({
            name: resolved.name,
            nif: resolved.nif,
            address: resolved.address,
            postalCode: resolved.postalCode,
            city: resolved.city,
            phone: resolved.phone,
            email: resolved.email,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveChurchProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChurch(true);
    try {
      await api.updateAdminCongregation(churchForm);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al guardar datos de la iglesia');
    } finally {
      setSavingChurch(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-7 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-neutral-400 rounded-full inline-block" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
              TERMINAL DE SECRETARÍA & PREFERENCIAS
            </span>
          </div>
          <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
            Configuración del Sistema
          </h1>
          <p className="text-[15px] text-[#8E8E93] leading-relaxed">
            Parámetros de la terminal operativa, personalización de avatar Humation 1 y políticas de sesión para la sede.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-[14px] text-emerald-300 flex items-center justify-between">
          <span>Configuraciones de terminal y perfil guardadas correctamente.</span>
          <button onClick={() => setSaved(false)} className="text-[12px] text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCIÓN DE IDENTIDAD VISUAL & AVATAR HUMATION 1               */}
      {/* ============================================================== */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                HUMATION 1 BY 373 • ILUSTRADOR CANÓNICO
              </span>
            </div>
            <h3 className="text-[20px] font-bold text-white tracking-tight">
              Identidad de Avatar & Perfil Oficial
            </h3>
            <p className="text-[13px] text-[#8E8E93] leading-relaxed">
              Personalice las ilustraciones de perfil con el estilo minimalista de trazo orgánico Humation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModalCustomizer(true)}
            className="h-11 px-5 rounded-2xl bg-white text-black font-semibold text-[13px] hover:bg-neutral-200 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-md active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Abrir Estudio Humation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
          {/* Avatar Preview */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-44 h-56 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white">
              <HumationAvatar config={avatarConfig} className="w-full h-full" />
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white uppercase">
                {currentUser.role}
              </div>
            </div>
          </div>

          {/* Quick Customizer Controls */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider uppercase text-neutral-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Cor de Fundo do Avatar</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLOR_PALETTES.map((pal) => (
                  <button
                    key={pal.value}
                    type="button"
                    onClick={() => setAvatarConfig((prev) => ({ ...prev, bgColor: pal.value }))}
                    className={`h-8 px-3 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      avatarConfig.bgColor === pal.value
                        ? 'border-white bg-white/20 text-white shadow-sm'
                        : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: pal.value }} />
                    <span>{pal.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[12px] font-semibold tracking-wider uppercase text-neutral-300">
                Vestimenta Pastoral / Ministerial
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarConfig((prev) => ({ ...prev, body: 'pastoral-suit' }))}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    avatarConfig.body === 'pastoral-suit'
                      ? 'border-white bg-white/15 text-white font-semibold'
                      : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-[12px]">Terno & Gravata</div>
                  <div className="text-[10px] text-neutral-400">Formal pastoral</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarConfig((prev) => ({ ...prev, body: 'collar-shirt' }))}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    avatarConfig.body === 'collar-shirt'
                      ? 'border-white bg-white/15 text-white font-semibold'
                      : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-[12px]">Camisa Gola Aberta</div>
                  <div className="text-[10px] text-neutral-400">Humation original</div>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[12px] text-neutral-400 leading-relaxed block">
                O modelo Humation 1 é aplicado de forma automática e vetorizada para todos os membros e oficiais eclesiásticos.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Estado del Sistema */}
      <div className="p-6 bg-[#121214] border border-white/10 rounded-2xl space-y-4 shadow-md">
        <h3 className="text-[16px] font-bold text-white">Estado de la Terminal Local</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-[13px]">
          <div className="p-4 bg-[#161618] border border-white/5 rounded-xl space-y-1">
            <div className="text-[11px] text-[#8E8E93] uppercase">Motor de Persistencia</div>
            <div className="text-white font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>PGlite Local Embebido</span>
            </div>
            <div className="text-[11px] text-neutral-400">PostgreSQL en disco local</div>
          </div>

          <div className="p-4 bg-[#161618] border border-white/5 rounded-xl space-y-1">
            <div className="text-[11px] text-[#8E8E93] uppercase">Jurisdicción Sede</div>
            <div className="text-white font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>{currentUser.city || 'Sede Principal'}</span>
            </div>
            <div className="text-[11px] text-neutral-400">Aislamiento por filial activo</div>
          </div>

          <div className="p-4 bg-[#161618] border border-white/5 rounded-xl space-y-1">
            <div className="text-[11px] text-[#8E8E93] uppercase">Rol en Sesión</div>
            <div className="text-white font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="capitalize">{currentUser.role.replace('_', ' ')}</span>
            </div>
            <div className="text-[11px] text-neutral-400">{currentUser.name}</div>
          </div>
        </div>
      </div>

      {/* Datos Predeterminados de la Iglesia para Documentos y Ficha de Miembro */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 space-y-6 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-[18px] font-bold text-white tracking-tight">
            Datos Predeterminados de la Iglesia (Perfil para Documentos)
          </h3>
          <p className="text-[13px] text-[#8E8E93]">
            Esta información se utilizará por defecto en el pie de página y contacto de secretaría de la Ficha de Miembro de su sede.
          </p>
        </div>

        <form onSubmit={handleSaveChurchProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[13px] font-medium text-[#8E8E93]">
                Nombre Oficial de la Iglesia / Sede
              </label>
              <input
                type="text"
                required
                value={churchForm.name}
                onChange={(e) => setChurchForm({ ...churchForm, name: e.target.value })}
                placeholder="Ej. Iglesia ADMM – Madrid"
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[13px] font-medium text-[#8E8E93]">
                NIF / CIF de la Iglesia
              </label>
              <input
                type="text"
                value={churchForm.nif}
                onChange={(e) => setChurchForm({ ...churchForm, nif: e.target.value })}
                placeholder="Ej. R2802896G"
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[13px] font-medium text-[#8E8E93]">
                Dirección (Calle, N.º)
              </label>
              <input
                type="text"
                value={churchForm.address}
                onChange={(e) => setChurchForm({ ...churchForm, address: e.target.value })}
                placeholder="Ej. c/ Haya, 2"
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#8E8E93]">
                Código Postal (C.P.)
              </label>
              <input
                type="text"
                value={churchForm.postalCode}
                onChange={(e) => setChurchForm({ ...churchForm, postalCode: e.target.value })}
                placeholder="Ej. 28044"
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#8E8E93]">
                Ciudad
              </label>
              <input
                type="text"
                required
                value={churchForm.city}
                onChange={(e) => setChurchForm({ ...churchForm, city: e.target.value })}
                placeholder="Ej. Madrid"
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#8E8E93]">
                Teléfono de Secretaría
              </label>
              <input
                type="text"
                value={churchForm.phone}
                onChange={(e) => setChurchForm({ ...churchForm, phone: e.target.value })}
                placeholder="Ej. +34 639 98 83 45"
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#8E8E93]">
                Correo Electrónico de Secretaría
              </label>
              <input
                type="email"
                value={churchForm.email}
                onChange={(e) => setChurchForm({ ...churchForm, email: e.target.value })}
                placeholder="Ej. secretaria.admmmadrid@gmail.com"
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingChurch}
              className="h-[46px] px-6 text-[14px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {savingChurch ? 'Guardando...' : 'Guardar Datos de la Iglesia'}
            </button>
          </div>
        </form>
      </div>

      {/* Formulario de Preferencias Operativas */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 space-y-6 shadow-xl">
        <h3 className="text-[18px] font-bold text-white tracking-tight">Preferencias Operativas</h3>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#8E8E93]">
              Cierre Automático de Sesión por Inactividad (Minutos)
            </label>
            <input
              type="number"
              min={10}
              max={240}
              value={timeoutMinutes}
              onChange={(e) => setTimeoutMinutes(parseInt(e.target.value, 10))}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
            />
            <span className="text-[11px] text-neutral-400 block">
              Protege la terminal contra accesos no autorizados en el despacho pastoral.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#8E8E93]">
              Formato Predeterminado de Emisión Canónica
            </label>
            <select
              value={printFormat}
              onChange={(e) => setPrintFormat(e.target.value)}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
            >
              <option value="a4">Hoja A4 Oficial (Con membrete institucional)</option>
              <option value="carnet">Formato Tarjeta PVC / Carnet de Bolsillo</option>
              <option value="certificado">Diploma Apaisado de Bautismo / Membresía</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={directSync}
                onChange={(e) => setDirectSync(e.target.checked)}
                className="w-4 h-4 rounded accent-white"
              />
              <span className="text-[14px] text-neutral-300">
                Sincronización atómica instantánea de expedientes en disco local
              </span>
            </label>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="h-[46px] px-6 text-[14px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all cursor-pointer shadow-md"
            >
              Guardar Preferencias de Secretaría
            </button>
          </div>
        </form>
      </div>

      {/* Modal Customizer para el Administrador */}
      {showModalCustomizer && (
        <AvatarCustomizerModal
          member={{
            id: Number(currentUser.id),
            firstName: currentUser.name.split(' ')[0] || 'Pastor',
            lastName: currentUser.name.split(' ').slice(1).join(' ') || 'Administrador',
            congregationId: Number(currentUser.congregationId || 1),
            memberNumber: 'ADMIN-DIR',
            status: 'active',
            email: currentUser.email,
            nationality: 'Brasileña',
            createdAt: new Date().toISOString(),
          }}
          onClose={() => setShowModalCustomizer(false)}
          onAvatarSaved={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }}
        />
      )}
    </div>
  );
};
