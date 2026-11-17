import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Megaphone,
  BookOpen,
  Church,
  ChevronRight,
  Search,
  Clock,
  Phone,
  Mail,
  Check,
  User as UserIcon,
  Home,
  X,
  Compass,
  Users,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  FileText,
  Shield,
  Heart,
} from 'lucide-react';
import { api } from '../api';
import { Congregation, EventItem, Announcement, Department, User, Workspace } from '../types';
import { AuthForm } from './AuthForm';

export type PublicTab = 'inicio' | 'noticias' | 'congregacoes' | 'sobre' | 'perfil';

interface PublicPortalProps {
  currentUser: User | null;
  onOpenLogin?: () => void;
  onGoToDashboard?: () => void;
  onAuthSuccess?: (user: User, workspace?: Workspace) => void;
  onViewOnboarding?: () => void;
  initialTab?: PublicTab;
}

// Imagens padrão de alta fidelidade editorial para ilustrações
const DEFAULT_BIBLE_HERO =
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1200&auto=format&fit=crop';
const DEFAULT_CHURCH_HEADQUARTERS =
  'https://images.unsplash.com/photo-1548625361-1959828d0eb5?q=80&w=1000&auto=format&fit=crop';

const NEWS_THUMBNAILS = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=400&auto=format&fit=crop',
];

const CONGREGATION_THUMBNAILS: Record<string, string> = {
  madrid: 'https://images.unsplash.com/photo-1548625361-1959828d0eb5?q=80&w=400&auto=format&fit=crop',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=400&auto=format&fit=crop',
  rio: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=400&auto=format&fit=crop',
  sp: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?q=80&w=400&auto=format&fit=crop',
  brasilia: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=400&auto=format&fit=crop',
};

export const PublicPortal: React.FC<PublicPortalProps> = ({
  currentUser,
  onOpenLogin,
  onGoToDashboard,
  onAuthSuccess,
  onViewOnboarding,
  initialTab = 'inicio',
}) => {
  const [activeTab, setActiveTab] = useState<PublicTab>(initialTab);
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectNotice, setSelectNotice] = useState<string | null>(null);

  // Congregación de referencia guardada en el cliente
  const [selectedCongregationId, setSelectedCongregationId] = useState<number | null>(() => {
    const saved = localStorage.getItem('admadureira_public_congregation_id');
    return saved ? parseInt(saved, 10) : null;
  });

  // Modais de detalhe
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedCongregationDetail, setSelectedCongregationDetail] = useState<Congregation | null>(null);
  const [showSchedulesModal, setShowSchedulesModal] = useState(false);

  // Carga de dados públicos
  useEffect(() => {
    const loadPublicData = async () => {
      setLoading(true);
      try {
        const [congList, evList, annList, depList] = await Promise.all([
          api.fetchPublicCongregations().catch(() => []),
          api.fetchPublicEvents().catch(() => []),
          api.fetchPublicAnnouncements().catch(() => []),
          api.fetchPublicDepartments().catch(() => []),
        ]);

        setCongregations(congList);
        setEvents(evList);
        setAnnouncements(annList);
        setDepartments(depList);

        // Se não houver congregação selecionada, priorizar Madrid
        if (!selectedCongregationId && congList.length > 0) {
          const defaultCong = congList.find((c) => c.city.toLowerCase().includes('madrid')) || congList[0];
          setSelectedCongregationId(defaultCong.id);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do portal:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPublicData();
  }, [selectedCongregationId]);

  // Congregação ativa selecionada
  const currentSelectedCongregation = useMemo(() => {
    return (
      congregations.find((c) => c.id === selectedCongregationId) ||
      congregations.find((c) => c.city.toLowerCase().includes('madrid')) ||
      congregations[0] ||
      null
    );
  }, [congregations, selectedCongregationId]);

  const handleSelectCongregation = (cong: Congregation) => {
    setSelectedCongregationId(cong.id);
    localStorage.setItem('admadureira_public_congregation_id', String(cong.id));
    setSelectNotice(`Congregação "${cong.name}" selecionada como sua igreja de referência.`);
    setTimeout(() => setSelectNotice(null), 3500);
  };

  // Próximo evento destacado
  const nextEvent = events[0] || null;

  return (
    <div className="min-h-screen bg-black text-[#F3F3F3] flex flex-col font-sans select-none antialiased selection:bg-white/20">
      {/* Container Mobile Centralizado (Fiel ao mock de celular) */}
      <div
        className="w-full max-w-md mx-auto flex-1 flex flex-col relative px-4 pt-3 pb-24 bg-black"
        style={{ backgroundColor: '#000000' }}
      >
        {/* ============================================================ */}
        {/* AVISO TEMPORÁRIO DE SELEÇÃO                                 */}
        {/* ============================================================ */}
        {selectNotice && (
          <div className="mb-3 p-3 bg-black border border-emerald-500/30 rounded-2xl text-[12px] text-emerald-200 flex items-center justify-between gap-2 shadow-lg animate-fadeIn z-30">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{selectNotice}</span>
            </div>
            <button onClick={() => setSelectNotice(null)} className="text-neutral-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 1: INÍCIO (TELA 1 DO MOCKUP - PIXEL POR PIXEL)           */}
        {/* ============================================================ */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 animate-fadeIn">
            {/* 1. Header do Início: Logo + Nome da Igreja + Botão Presentación */}
            <div className="flex items-center justify-between pt-1 pb-1">
              <div className="flex items-center gap-2.5">
                {/* Ícone de Chama / Símbolo Madureira */}
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shadow-sm">
                  <img
                    src="/assets/aistudio/logo_madureira_white_transparent.png"
                    alt="Logo AD Madureira"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-bold text-[15px] tracking-tight text-white block leading-tight">
                    ADM MADUREIRA
                  </span>
                  <span className="text-[11px] text-[#8E8E93] tracking-wide block leading-tight">
                    {currentSelectedCongregation ? currentSelectedCongregation.name : 'Sede Europa - Madrid'}
                  </span>
                </div>
              </div>

              {/* Botão Pílula "Presentación" */}
              {onViewOnboarding && (
                <button
                  type="button"
                  onClick={onViewOnboarding}
                  className="text-[12px] font-medium text-white px-3.5 py-1.5 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Presentación
                </button>
              )}
            </div>

            {/* 2. Hero Section: Bíblia Aberta + "BIENVENIDO A Iglesia Vida Nueva" */}
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0E1015] shadow-2xl p-6 pt-10 pb-7 min-h-[220px] flex flex-col justify-end">
              {/* Imagem de Fundo: Bíblia com luz suave e transição para o preto */}
              <div
                className="absolute inset-0 bg-cover bg-center filter brightness-[0.45]"
                style={{
                  backgroundImage: `url('${DEFAULT_BIBLE_HERO}')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30" />

              <div className="relative z-10 space-y-1">
                <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#A1A1AA]">
                  BIENVENIDO A
                </div>
                <h1 className="text-[32px] sm:text-[34px] font-bold text-white tracking-tight leading-[1.1]">
                  Iglesia Vida Nueva
                </h1>
                <p className="text-[14px] text-[#A1A1AA] leading-snug pt-0.5">
                  Fe, familia y esperanza para tu ciudad.
                </p>
              </div>
            </div>

            {/* 3. Card Seletor de Congregação (Pin + Nome + Seta) */}
            <button
              type="button"
              onClick={() => setActiveTab('congregacoes')}
              className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] transition-all flex items-center justify-between gap-3 shadow-md group cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-white tracking-tight truncate">
                    {currentSelectedCongregation
                      ? currentSelectedCongregation.name
                      : 'Igreja Sede Europa (Madrid)'}
                  </div>
                  <div className="text-[11px] sm:text-[12px] text-[#8E8E93] truncate">
                    {currentSelectedCongregation
                      ? `${currentSelectedCongregation.city} • Toque para ver sedes y horarios`
                      : 'Madrid • Toque para ver sedes y horarios'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-[#71717A] group-hover:text-white transition-colors shrink-0" />
            </button>

            {/* 4. Seção: "Acceso libre" com Grid 2x2 exato do mockup */}
            <div className="space-y-2.5 pt-1">
              <div>
                <h2 className="text-[18px] font-bold text-white tracking-tight">
                  Acceso libre
                </h2>
                <p className="text-[12px] sm:text-[13px] text-[#8E8E93]">
                  Información para todos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* 1. Cultos */}
                <button
                  type="button"
                  onClick={() => setShowSchedulesModal(true)}
                  className="p-3.5 rounded-2xl bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] transition-all text-left flex flex-col justify-between h-[106px] group cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-white tracking-tight">
                      Cultos
                    </div>
                    <div className="text-[11px] text-[#8E8E93] truncate">
                      Confira nossos horários
                    </div>
                  </div>
                </button>

                {/* 2. Comunicados / Noticias */}
                <button
                  type="button"
                  onClick={() => setActiveTab('noticias')}
                  className="p-3.5 rounded-2xl bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] transition-all text-left flex flex-col justify-between h-[106px] group cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white">
                    <Megaphone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-white tracking-tight">
                      Comunicados
                    </div>
                    <div className="text-[11px] text-[#8E8E93] truncate">
                      Fique por dentro
                    </div>
                  </div>
                </button>

                {/* 3. Congregaciones */}
                <button
                  type="button"
                  onClick={() => setActiveTab('congregacoes')}
                  className="p-3.5 rounded-2xl bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] transition-all text-left flex flex-col justify-between h-[106px] group cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-white tracking-tight">
                      Congregações
                    </div>
                    <div className="text-[11px] text-[#8E8E93] truncate">
                      Nossas sedes
                    </div>
                  </div>
                </button>

                {/* 4. Sobre nosotros */}
                <button
                  type="button"
                  onClick={() => setActiveTab('sobre')}
                  className="p-3.5 rounded-2xl bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] transition-all text-left flex flex-col justify-between h-[106px] group cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white">
                    <Compass className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-white tracking-tight">
                      Sobre nós
                    </div>
                    <div className="text-[11px] text-[#8E8E93] truncate">
                      Conheça nossa fé
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 5. Seção: "Próximos eventos" */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-white tracking-tight">
                  Próximos eventos
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('noticias')}
                  className="text-[12px] font-medium text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                >
                  Ver todos →
                </button>
              </div>

              {/* Card de Evento */}
              <div
                onClick={() => setShowSchedulesModal(true)}
                className="w-full p-3.5 rounded-2xl bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] flex items-center justify-between gap-3 shadow-md cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Bloco de Data: DOM / 16 */}
                  <div className="w-13 h-13 rounded-xl bg-white/10 border border-white/5 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold tracking-wider text-[#A1A1AA] uppercase leading-none">
                      DOM
                    </span>
                    <span className="text-[20px] font-black text-white leading-none mt-1">
                      16
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-white tracking-tight truncate">
                      {nextEvent ? nextEvent.title : 'Culto Solene de Santa Ceia Geral'}
                    </div>
                    <div className="text-[12px] text-[#8E8E93] truncate mt-0.5">
                      {currentSelectedCongregation
                        ? `${currentSelectedCongregation.name} • 18:00h`
                        : 'Sede Central Madrid • 18:00h'}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4.5 h-4.5 text-[#71717A] shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 2: NOTÍCIAS (TELA 2 DO MOCKUP - PIXEL POR PIXEL)         */}
        {/* ============================================================ */}
        {activeTab === 'noticias' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header: Botão Circular Voltar + Título Centralizado "Noticias" */}
            <div className="relative flex items-center justify-center h-12">
              <button
                type="button"
                onClick={() => setActiveTab('inicio')}
                className="absolute left-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white cursor-pointer transition-colors"
                title="Voltar ao início"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-[17px] font-bold text-white tracking-tight">
                Noticias
              </h1>
            </div>

            {/* Subtítulo / Indicador de Localidade */}
            <div className="text-[11px] text-[#8E8E93] px-1 font-mono">
              16:30 • {currentSelectedCongregation ? currentSelectedCongregation.city : 'Madrid (Europa)'}
            </div>

            {/* Lista de Cards de Notícias Conforme a Imagem */}
            <div className="space-y-3">
              {announcements.length === 0 && !loading && (
                <div className="p-6 text-center text-[13px] text-neutral-400 bg-[#15171C] rounded-2xl border border-white/10">
                  Nenhum comunicado publicado no momento.
                </div>
              )}

              {announcements.map((ann, idx) => (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between gap-3.5 cursor-pointer transition-all active:scale-[0.99] shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Imagem Thumbnail Redonda Quadrada */}
                    <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 overflow-hidden shrink-0">
                      <img
                        src={NEWS_THUMBNAILS[idx % NEWS_THUMBNAILS.length]}
                        alt={ann.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h3 className="text-[14px] font-bold text-white leading-snug line-clamp-2">
                        {ann.title}
                      </h3>
                      <p className="text-[12px] text-[#8E8E93] line-clamp-1">
                        {ann.content}
                      </p>
                      <div className="text-[11px] font-medium text-emerald-400 pt-0.5">
                        {ann.authorName} • {currentSelectedCongregation?.city || 'Madrid'}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4.5 h-4.5 text-[#71717A] shrink-0" />
                </div>
              ))}

              {/* Itens fixos idênticos à maquete caso haja poucos comunicados no banco */}
              {announcements.length < 3 && (
                <>
                  <div
                    onClick={() =>
                      setSelectedAnnouncement({
                        id: 991,
                        title: 'Nuevo ciclo de estudio bíblico inicia este domingo',
                        content: 'Formação doutrinária contínua para toda a família e discipulado eclesiástico.',
                        authorName: 'Escola Bíblica',
                        targetScope: 'global',
                        isPublished: true,
                        publishedAt: new Date().toISOString(),
                      })
                    }
                    className="bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between gap-3.5 cursor-pointer transition-all active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 overflow-hidden shrink-0">
                        <img
                          src={NEWS_THUMBNAILS[0]}
                          alt="Estudio bíblico"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-[14px] font-bold text-white leading-snug">
                          Nuevo ciclo de estudio bíblico inicia este domingo
                        </h3>
                        <p className="text-[12px] text-[#8E8E93] line-clamp-1">
                          Escola Bíblica Dominical e discipulado contínuo
                        </p>
                        <div className="text-[11px] font-medium text-emerald-400 pt-0.5">
                          12:10h • Sede Madrid
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4.5 h-4.5 text-[#71717A] shrink-0" />
                  </div>

                  <div
                    onClick={() =>
                      setSelectedAnnouncement({
                        id: 992,
                        title: 'Celebramos 10 años de la iglesia en Europa',
                        content: 'Comemoração dos 10 anos de expansão ministerial Madureira na Europa com Santa Ceia.',
                        authorName: 'Secretaria Geral',
                        targetScope: 'global',
                        isPublished: true,
                        publishedAt: new Date().toISOString(),
                      })
                    }
                    className="bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between gap-3.5 cursor-pointer transition-all active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 overflow-hidden shrink-0">
                        <img
                          src={NEWS_THUMBNAILS[1]}
                          alt="Aniversário"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-[14px] font-bold text-white leading-snug">
                          Celebramos 10 años de la iglesia en Europa
                        </h3>
                        <p className="text-[12px] text-[#8E8E93] line-clamp-1">
                          Culto em ação de graças e comunhão ministerial
                        </p>
                        <div className="text-[11px] font-medium text-emerald-400 pt-0.5">
                          20:00h • Convocação Geral
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4.5 h-4.5 text-[#71717A] shrink-0" />
                  </div>

                  <div
                    onClick={() =>
                      setSelectedAnnouncement({
                        id: 993,
                        title: 'Oración por la ciudad: vigilia este viernes',
                        content: 'Vigília de clamor pelas famílias, enfermos e salvação de vidas em Madrid.',
                        authorName: 'Corpo Pastoral',
                        targetScope: 'global',
                        isPublished: true,
                        publishedAt: new Date().toISOString(),
                      })
                    }
                    className="bg-[#15171C] hover:bg-[#1A1D24] border border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between gap-3.5 cursor-pointer transition-all active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 overflow-hidden shrink-0">
                        <img
                          src={NEWS_THUMBNAILS[2]}
                          alt="Oração"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-[14px] font-bold text-white leading-snug">
                          Oración por la ciudad: vigilia este viernes
                        </h3>
                        <p className="text-[12px] text-[#8E8E93] line-clamp-1">
                          Clamor de madrugada com louvor e intercessão
                        </p>
                        <div className="text-[11px] font-medium text-emerald-400 pt-0.5">
                          23:00h • Templo Sede
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4.5 h-4.5 text-[#71717A] shrink-0" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 3: CONGREGAÇÕES (TELA 3 DO MOCKUP - PIXEL POR PIXEL)     */}
        {/* ============================================================ */}
        {activeTab === 'congregacoes' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header: Botão Circular Voltar + Título Centralizado "Congregaciones" */}
            <div className="relative flex items-center justify-center h-12">
              <button
                type="button"
                onClick={() => setActiveTab('inicio')}
                className="absolute left-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white cursor-pointer transition-colors"
                title="Voltar ao início"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-[17px] font-bold text-white tracking-tight">
                Congregaciones
              </h1>
            </div>

            {/* Subtítulo */}
            <div className="text-[11px] text-[#8E8E93] px-1 font-mono">
              0:300 • Sedes e filiais ativas CONAMAD
            </div>

            {/* 1. Card Destacado da Sede Principal (Com foto grande do edifício) */}
            <div
              onClick={() => {
                const madrid = congregations.find((c) => c.city.toLowerCase().includes('madrid')) || congregations[0];
                if (madrid) setSelectedCongregationDetail(madrid);
              }}
              className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl group cursor-pointer"
            >
              <div className="h-44 sm:h-48 w-full relative">
                <img
                  src={DEFAULT_CHURCH_HEADQUARTERS}
                  alt="Sede Principal"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />

                {/* Badge Pílula "Sede Principal" no canto superior esquerdo */}
                <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white border border-white/10 shadow-sm">
                  Sede Principal
                </span>

                {/* Título & Endereço na parte inferior */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="text-[18px] font-bold text-white leading-tight">
                    Sede Principal (Madrid)
                  </h2>
                  <p className="text-[12px] text-neutral-300 mt-0.5 truncate">
                    Calle de Atocha, 112 - Centro • Madrid, Espanha
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Lista de Outras Congregações */}
            <div className="space-y-2.5">
              {congregations.map((cong, idx) => {
                const isSelected = cong.id === selectedCongregationId;
                const thumbKey = cong.city.toLowerCase().includes('madrid')
                  ? 'madrid'
                  : cong.city.toLowerCase().includes('rio')
                  ? 'rio'
                  : cong.city.toLowerCase().includes('são paulo') || cong.city.toLowerCase().includes('sp')
                  ? 'sp'
                  : cong.city.toLowerCase().includes('bras')
                  ? 'brasilia'
                  : 'barcelona';

                const thumb = CONGREGATION_THUMBNAILS[thumbKey] || CONGREGATION_THUMBNAILS.barcelona;

                return (
                  <div
                    key={cong.id}
                    onClick={() => setSelectedCongregationDetail(cong)}
                    className={`bg-[#15171C] hover:bg-[#1A1D24] border ${
                      isSelected ? 'border-emerald-500/40 bg-[#15191C]' : 'border-white/[0.08]'
                    } rounded-2xl p-3.5 flex items-center justify-between gap-3.5 cursor-pointer transition-all active:scale-[0.99] shadow-sm`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-13 h-13 rounded-xl bg-white/10 border border-white/10 overflow-hidden shrink-0">
                        <img src={thumb} alt={cong.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14px] font-bold text-white truncate">
                            {cong.name}
                          </h3>
                          {isSelected && (
                            <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                              Ativa
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#8E8E93] truncate">
                          {cong.address || `${cong.city} • Espanha / Brasil`}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Pastor: {cong.pastorName || 'Pr. Carlos Oliveira'}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4.5 h-4.5 text-[#71717A] shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 4: SOBRE NÓS / NOSOTROS                                  */}
        {/* ============================================================ */}
        {activeTab === 'sobre' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header: Botão Circular Voltar + Título Centralizado "Nosotros" */}
            <div className="relative flex items-center justify-center h-12">
              <button
                type="button"
                onClick={() => setActiveTab('inicio')}
                className="absolute left-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white cursor-pointer transition-colors"
                title="Voltar ao início"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-[17px] font-bold text-white tracking-tight">
                Nosotros
              </h1>
            </div>

            {/* Conteúdo Editorial */}
            <div className="bg-[#15171C] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center p-1.5">
                  <img
                    src="/assets/aistudio/logo_madureira_white_transparent.png"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-white">Assembleia de Deus</h2>
                  <p className="text-[11px] text-[#8E8E93] font-mono">MINISTÉRIO DE MADUREIRA · CONAMAD</p>
                </div>
              </div>

              <p className="text-[13px] text-neutral-300 leading-relaxed">
                Fundada sob a unção do Espírito Santo, a Assembleia de Deus Ministério de Madureira é uma das maiores
                convenções evangélicas do mundo, vinculada à Convenção Nacional das Assembleias de Deus no Brasil (CONAMAD).
              </p>

              <div className="space-y-2 pt-1 border-t border-white/10">
                <div className="flex items-start gap-2.5 text-[12px] text-neutral-300">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Doutrina Bíblica fundamental e compromisso inegociável com a Palavra de Deus.</span>
                </div>
                <div className="flex items-start gap-2.5 text-[12px] text-neutral-300">
                  <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Acolhimento pastoral e apoio a famílias imigrantes em toda a Europa e América Latina.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 5: PERFIL / ACESSO DO MEMBRO (LOGIN)                     */}
        {/* ============================================================ */}
        {activeTab === 'perfil' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header: Botão Circular Voltar + Título Centralizado "Perfil" */}
            <div className="relative flex items-center justify-center h-12">
              <button
                type="button"
                onClick={() => setActiveTab('inicio')}
                className="absolute left-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white cursor-pointer transition-colors"
                title="Voltar ao início"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-[17px] font-bold text-white tracking-tight">
                Perfil de Acesso
              </h1>
            </div>

            {currentUser ? (
              <div className="bg-[#15171C] border border-white/[0.08] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white text-black font-bold flex items-center justify-center text-lg shadow-md">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[16px] font-bold text-white">{currentUser.name}</div>
                    <div className="text-[12px] text-[#8E8E93]">{currentUser.email}</div>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="w-full h-[46px] rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98]"
                >
                  <span>Abrir Painel Eclesiástico</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-black">
                <AuthForm
                  compact
                  onAuthSuccess={(user, workspace) => {
                    if (onAuthSuccess) onAuthSuccess(user, workspace);
                  }}
                  onCancel={() => setActiveTab('inicio')}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* BARRA INFERIOR DE 5 ABAS (EXATA DA FOTO COM DESTAQUE VERDE)   */}
      {/* ============================================================ */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#0B0C0E]/95 backdrop-blur-xl border-t border-white/[0.08] z-40 max-w-md mx-auto">
        <div className="px-2 h-16 flex items-center justify-around">
          {/* 1. Inicio */}
          <button
            type="button"
            onClick={() => setActiveTab('inicio')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'inicio' ? 'text-[#10B981]' : 'text-[#71717A] hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Inicio</span>
          </button>

          {/* 2. Noticias */}
          <button
            type="button"
            onClick={() => setActiveTab('noticias')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'noticias' ? 'text-[#10B981]' : 'text-[#71717A] hover:text-white'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Noticias</span>
          </button>

          {/* 3. Congregaciones */}
          <button
            type="button"
            onClick={() => setActiveTab('congregacoes')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'congregacoes' ? 'text-[#10B981]' : 'text-[#71717A] hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Congregaciones</span>
          </button>

          {/* 4. Nosotros */}
          <button
            type="button"
            onClick={() => setActiveTab('sobre')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'sobre' ? 'text-[#10B981]' : 'text-[#71717A] hover:text-white'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Nosotros</span>
          </button>

          {/* 5. Perfil */}
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'perfil' ? 'text-[#10B981]' : 'text-[#71717A] hover:text-white'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Perfil</span>
          </button>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* MODAL CANÔNICO: CULTOS E HORÁRIOS                            */}
      {/* ============================================================ */}
      {showSchedulesModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#15171C] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setShowSchedulesModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-white">Cultos e Horários</h3>
                <p className="text-[11px] text-neutral-400">
                  {currentSelectedCongregation ? currentSelectedCongregation.name : 'Sede Madrid'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-[12px] text-neutral-200">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="font-bold text-white">Quartas-feiras • 20h00</div>
                <div className="text-neutral-400 text-[11px]">Culto de Doutrina e Estudo Bíblico</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="font-bold text-white">Sábados • 19h30</div>
                <div className="text-neutral-400 text-[11px]">Culto de Jovens (UMADM) e Louvor</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="font-bold text-white">Domingos • 11h00</div>
                <div className="text-neutral-400 text-[11px]">Escola Bíblica Dominical (EBD)</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="font-bold text-white">Domingos • 18h30</div>
                <div className="text-neutral-400 text-[11px]">Culto Geral da Família e Adoração</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSchedulesModal(false)}
              className="w-full h-[44px] rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[13px] transition-colors"
            >
              Fechar Horários
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DETALHE DE NOTÍCIA / COMUNICADO                        */}
      {/* ============================================================ */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#15171C] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  COMUNICADO OFICIAL
                </span>
                <h3 className="text-[15px] font-bold text-white leading-tight">
                  {selectedAnnouncement.title}
                </h3>
              </div>
            </div>

            <p className="text-[13px] text-neutral-300 leading-relaxed max-h-60 overflow-y-auto pr-1">
              {selectedAnnouncement.content}
            </p>

            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Publicado por: {selectedAnnouncement.authorName}</span>
              <span className="text-emerald-400 font-medium">CONAMAD</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
              className="w-full h-[44px] rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[13px] transition-colors"
            >
              Compreendido
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DETALHE DE CONGREGAÇÃO                                 */}
      {/* ============================================================ */}
      {selectedCongregationDetail && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#15171C] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setSelectedCongregationDetail(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                SEDE REGIONAL • {selectedCongregationDetail.city}
              </span>
              <h3 className="text-[17px] font-bold text-white">
                {selectedCongregationDetail.name}
              </h3>
            </div>

            <div className="space-y-2 text-[12px] text-neutral-300">
              <div className="flex items-start gap-2.5 p-2.5 bg-white/5 rounded-xl">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{selectedCongregationDetail.address || 'Endereço da congregação oficial'}</span>
              </div>

              {selectedCongregationDetail.pastorName && (
                <div className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-xl">
                  <UserIcon className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Pastor: {selectedCongregationDetail.pastorName}</span>
                </div>
              )}

              {selectedCongregationDetail.serviceSchedules && (
                <div className="flex items-start gap-2.5 p-2.5 bg-white/5 rounded-xl">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{selectedCongregationDetail.serviceSchedules}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleSelectCongregation(selectedCongregationDetail);
                  setSelectedCongregationDetail(null);
                }}
                className="flex-1 h-[44px] rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[13px] transition-colors"
              >
                Definir como Minha Igreja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
