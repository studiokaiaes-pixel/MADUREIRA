import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  FileText,
  Church,
  Calendar,
  Heart,
  Bell,
  CreditCard,
  Plus,
  Shield,
  Compass,
  ArrowLeft,
  Lock,
  BookOpen,
  Send,
  Sparkles,
} from 'lucide-react';

interface OnboardingExperienceProps {
  onEnterMemberPortal: () => void;
  onEnterVisitorPortal: () => void;
  initialScreen?: OnboardingScreenId;
}

export type OnboardingScreenId = 1 | 2 | 3 | 4 | 5 | 6;

export const OnboardingExperience: React.FC<OnboardingExperienceProps> = ({
  onEnterMemberPortal,
  onEnterVisitorPortal,
  initialScreen = 1,
}) => {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreenId>(initialScreen);
  const [selectedPortalMode, setSelectedPortalMode] = useState<'membro' | 'secretaria'>('membro');

  // Transição automática na tela de introdução (Splash)
  useEffect(() => {
    if (currentScreen === 1) {
      const timer = setTimeout(() => {
        setCurrentScreen(2);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const handleNext = () => {
    if (currentScreen < 6) {
      setCurrentScreen((prev) => ((prev + 1) as OnboardingScreenId));
    }
  };

  const handleSkip = () => {
    setCurrentScreen(6);
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between font-sans selection:bg-white selection:text-black transition-colors duration-500 bg-black text-[#F3F3F3]"
    >
      {/* ============================================================== */}
      {/* BARRA SUPERIOR INTEGRADA DA PÁGINA (Sem barra falsa de celular) */}
      {/* ============================================================== */}
      <header className="w-full max-w-4xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between z-30 shrink-0">
        {/* Marca / Logo no canto superior esquerdo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white overflow-hidden p-1">
            <img
              src="/assets/aistudio/logo_madureira_white_transparent.png"
              alt="Logo AD Madureira"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[12px] font-mono font-bold tracking-[0.25em] uppercase text-neutral-300">
            AD MADUREIRA
          </span>
        </div>

        {/* Controles de navegação: Pular / Voltar */}
        {currentScreen >= 2 && currentScreen <= 5 && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-[13px] font-medium text-[#A7A9AE] hover:text-white flex items-center gap-1 transition-colors cursor-pointer py-1.5 px-3 rounded-full hover:bg-white/5"
          >
            <span>Pular Apresentação</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {currentScreen === 6 && (
          <button
            type="button"
            onClick={() => setCurrentScreen(5)}
            className="text-[13px] font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 px-3 rounded-full bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à Apresentação</span>
          </button>
        )}
      </header>

      {/* ============================================================== */}
      {/* CONTEÚDO PRINCIPAL INTEGRADO NA PÁGINA                        */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col justify-center w-full max-w-2xl sm:max-w-3xl mx-auto px-6 py-6 sm:py-10 relative z-10">
        {/* ============================================================ */}
        {/* TELA 1: MARCA / APRESENTAÇÃO INICIAL                         */}
        {/* ============================================================ */}
        {currentScreen === 1 && (
          <div
            onClick={() => setCurrentScreen(2)}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center cursor-pointer animate-fadeIn min-h-[460px]"
          >
            <div className="flex flex-col items-center gap-7">
              {/* Logotipo Oficial AD Madureira (Sem fundo / Transparente) */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 relative flex items-center justify-center">
                <img
                  src="/assets/aistudio/logo_madureira_white_transparent.png"
                  alt="Logotipo Oficial AD Madureira"
                  className="w-full h-full object-contain drop-shadow-[0_0_35px_rgba(255,255,255,0.25)] select-none"
                />
              </div>

              <div className="space-y-2">
                <div className="text-[14px] font-mono font-medium tracking-[0.45em] uppercase text-[#F3F3F3]">
                  AD MADUREIRA
                </div>
                <div className="text-[11px] text-neutral-400 tracking-wider">
                  Toque em qualquer lugar para continuar
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TELA 2: ATUALIZAÇÃO DE DADOS                                 */}
        {/* ============================================================ */}
        {currentScreen === 2 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn space-y-8 min-h-[480px]">
            {/* Ilustração: Cartão de Atualização Integrado (Sem cartões de fundo e sem fundo de gradiente) */}
            <div className="flex-1 flex items-center justify-center relative py-6 w-full">
              <div className="w-full max-w-[360px] sm:max-w-[400px] bg-[#1A1D24] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <p className="text-[15px] sm:text-[16px] font-medium text-[#F3F3F3] leading-snug">
                  Quero atualizar meus dados e emitir minha credencial.
                </p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#A7A9AE]">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-[12px] font-medium text-neutral-300 flex items-center gap-1 border border-white/5">
                      <span>Membro</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:bg-neutral-200 transition-colors">
                    <ArrowUp className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Zona de Titular & Indicador de Progresso */}
            <div className="space-y-4 pt-2">
              <h1 className="text-[25px] sm:text-[28px] font-normal text-[#F3F3F3] leading-[1.25] tracking-tight">
                Sua vida de membro,<br />
                organizada em um só lugar
              </h1>

              {/* 5 Indicadores de Progresso (1 ativo) */}
              <div className="flex items-center gap-2 pt-1">
                <span className="w-7 h-1.5 bg-white rounded-full transition-all" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
              </div>
            </div>

            {/* Botão Inferior de Ação */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-[50px] rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] flex items-center justify-center shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TELA 3: DOCUMENTOS, AVISOS E CREDENCIAL                      */}
        {/* ============================================================ */}
        {currentScreen === 3 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn space-y-8 min-h-[480px]">
            {/* Ilustração: Ícones Quadrados e Notificações */}
            <div className="flex-1 flex flex-col items-center justify-center relative py-6 space-y-4">
              {/* Primeira Linha de Ícones */}
              <div className="flex items-center justify-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg -rotate-6">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#1D2026] border border-white/10 text-white flex items-center justify-center shadow-lg rotate-3">
                  <Plus className="w-7 h-7" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center shadow-lg -rotate-3">
                  <FileText className="w-7 h-7" />
                </div>
              </div>

              {/* Card Central Cinza */}
              <div className="w-full max-w-[320px] bg-[#1D2026] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
                <p className="text-[13px] font-medium text-neutral-200">
                  Adicionar os comunicados da minha igreja.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-neutral-400">+</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] text-neutral-300">Automático &gt;</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center">
                    <ArrowUp className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Segunda Linha de Ícones */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1E293B] text-sky-400 flex items-center justify-center -rotate-6 shadow-md">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center rotate-3 shadow-md">
                  <Church className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#D97706] text-white flex items-center justify-center -rotate-3 shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center rotate-6 shadow-md">
                  <Heart className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Zona de Titular */}
            <div className="space-y-4 pt-2">
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-[11px] font-medium text-neutral-300 border border-white/5">
                Tudo conectado
              </div>

              <h1 className="text-[25px] sm:text-[28px] font-normal text-[#F3F3F3] leading-[1.25] tracking-tight">
                Documentos, avisos e<br />
                credencial. Tudo aqui.
              </h1>

              {/* 5 Indicadores (2 ativo) */}
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-7 h-1.5 bg-white rounded-full transition-all" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
              </div>
            </div>

            {/* Botão Inferior */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-[50px] rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] flex items-center justify-center shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TELA 4: CERTIFICADOS E CARTAS                                */}
        {/* ============================================================ */}
        {currentScreen === 4 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn space-y-8 min-h-[480px]">
            {/* Ilustração: Linha de Status de Documento */}
            <div className="flex-1 flex flex-col items-center justify-center relative py-6 space-y-3.5">
              {/* Chip Superior "Pedido enviado ↗" */}
              <div className="px-4 py-1.5 rounded-full bg-[#1D2026] border border-white/10 text-[12px] font-medium text-neutral-300 flex items-center gap-2 shadow-md">
                <Send className="w-3.5 h-3.5 text-neutral-400" />
                <span>Pedido enviado ↗</span>
              </div>

              {/* Cartão de Análise */}
              <div className="w-full max-w-[320px] bg-[#16181D] border border-white/10 rounded-2xl p-4 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Analisando solicitação
                  </span>
                  <span>•••</span>
                </div>
                <div className="space-y-1 text-[11px] text-neutral-300">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    ✓ <span>Dados do membro confirmados</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    ✓ <span>Documento validado</span>
                  </div>
                </div>
              </div>

              {/* Cartão Azul Destacado Frontal com Brilho */}
              <div className="w-full max-w-[330px] bg-[#162738] border border-sky-400/30 rounded-2xl p-4 space-y-3 shadow-xl shadow-sky-950/50">
                <div className="flex items-center gap-2 text-[12px] font-bold text-sky-300">
                  <Check className="w-4 h-4" />
                  <span>Seu documento está pronto</span>
                </div>

                <div className="bg-[#0F1B27] rounded-xl p-3 flex items-center justify-between gap-3 border border-sky-500/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-300 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-white truncate">
                        Carta de Recomendação
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        Assinada e com selo oficial
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-sky-500 text-white font-bold text-[11px] tracking-wider uppercase shrink-0"
                  >
                    ABRIR
                  </button>
                </div>
              </div>
            </div>

            {/* Zona de Titular */}
            <div className="space-y-4 pt-2">
              <h1 className="text-[25px] sm:text-[28px] font-normal text-[#F3F3F3] leading-[1.25] tracking-tight">
                Peça certificados e cartas<br />
                em poucos cliques
              </h1>

              {/* 5 Indicadores (3 ativo) */}
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-7 h-1.5 bg-white rounded-full transition-all" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
              </div>
            </div>

            {/* Botão Inferior */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-[50px] rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] flex items-center justify-center shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TELA 5: CURSOS E ATIVIDADE                                   */}
        {/* ============================================================ */}
        {currentScreen === 5 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn space-y-8 min-h-[480px]">
            {/* Ilustração: Gráfico de Atividade e Cultos */}
            <div className="flex-1 flex flex-col items-center justify-center relative py-6">
              <div className="w-full max-w-[330px] bg-[#181A20] border border-white/10 rounded-2xl p-4.5 space-y-4 shadow-xl relative">
                {/* Cultos agendados */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12px] p-2.5 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2.5 text-white font-medium">
                      <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-300 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <span>Escola Bíblica</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">DOM • 09H</span>
                  </div>

                  <div className="flex items-center justify-between text-[12px] p-2.5 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2.5 text-white font-medium">
                      <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center">
                        <Church className="w-3.5 h-3.5" />
                      </div>
                      <span>Culto Geral</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">DOM • 18H</span>
                  </div>
                </div>

                {/* Gráfico de Linha Verde e Pontos */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Sua jornada este mês</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                      PRÓXIMOS 06
                    </span>
                  </div>

                  <div className="relative h-16 w-full flex items-center justify-center">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 240 50">
                      <line x1="0" y1="45" x2="240" y2="45" stroke="#ffffff10" strokeWidth="1" />
                      <path
                        d="M 10 40 L 45 35 L 75 18 L 105 38 L 135 15 L 170 30 L 205 12 L 235 22"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {[
                        [10, 40],
                        [45, 35],
                        [75, 18],
                        [105, 38],
                        [135, 15],
                        [170, 30],
                        [205, 12],
                        [235, 22],
                      ].map(([x, y], i) => (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r={i === 6 ? 4.5 : 3}
                          fill={i === 6 ? '#FFFFFF' : '#10B981'}
                          stroke="#10B981"
                          strokeWidth="1.5"
                        />
                      ))}
                    </svg>
                  </div>

                  <div className="flex justify-between text-[9px] font-mono text-neutral-500 pt-0.5">
                    <span>SEM 1</span>
                    <span>SEM 2</span>
                    <span>SEM 3</span>
                    <span>SEM 4</span>
                  </div>
                </div>

                {/* Etiqueta Flutuante Verde no Canto */}
                <div className="absolute -bottom-3 -right-2 px-3.5 py-1.5 bg-[#064E3B] border border-emerald-500/40 rounded-xl shadow-lg flex flex-col text-left">
                  <span className="text-[11px] font-bold text-emerald-200">Você está em dia</span>
                  <span className="text-[10px] text-emerald-300/80">2 avisos novos</span>
                </div>
              </div>
            </div>

            {/* Zona de Titular */}
            <div className="space-y-4 pt-2">
              <h1 className="text-[25px] sm:text-[28px] font-normal text-[#F3F3F3] leading-[1.25] tracking-tight">
                Acompanhe cultos e fique<br />
                perto da sua igreja
              </h1>

              {/* 5 Indicadores (4 ativo) */}
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
                <span className="w-7 h-1.5 bg-white rounded-full transition-all" />
                <span className="w-2 h-1.5 bg-[#3A3D45] rounded-full" />
              </div>
            </div>

            {/* Botão Inferior "Começar" */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setCurrentScreen(6)}
                className="w-full h-[50px] rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] flex items-center justify-center shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Começar
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TELA 6: PORTADA / ACCESO AL SISTEMA                          */}
        {/* ============================================================ */}
        {currentScreen === 6 && (
          <div className="flex-1 flex flex-col justify-center animate-fadeIn space-y-6 max-w-lg mx-auto w-full py-4">
            {/* Cabeçalho de Boas-Vindas */}
            <div className="text-center space-y-2.5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#14161B] border border-white/10 flex items-center justify-center shadow-xl p-2.5">
                <img
                  src="/assets/aistudio/logo_madureira_white_transparent.png"
                  alt="Logo AD Madureira"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h2 className="text-[22px] font-bold tracking-wider uppercase text-white font-serif">
                  ADM MADUREIRA
                </h2>
                <p className="text-[12px] sm:text-[13px] text-neutral-400 leading-tight max-w-[320px] mx-auto mt-1">
                  Sua igreja, seus documentos e sua jornada. Sempre com você.
                </p>
              </div>
            </div>

            {/* Cartão Principal: MEMBRO */}
            <div className="bg-[#121418] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[16px] font-bold tracking-tight text-white block">
                    MEMBRO
                  </span>
                  <span className="text-[12px] text-neutral-400">
                    Para quem faz parte da nossa família.
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-medium text-emerald-300 border border-emerald-400/20 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  <span>Acesso seguro</span>
                </span>
              </div>

              {/* Seletor do Portal */}
              <div className="relative">
                <select
                  value={selectedPortalMode}
                  onChange={(e) => setSelectedPortalMode(e.target.value as any)}
                  className="w-full bg-[#181B22] border border-white/15 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-white transition-colors cursor-pointer appearance-none"
                >
                  <option value="membro">Portal completo do membro</option>
                  <option value="secretaria">Acesso Secretaria & Pastor</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                  ▼
                </div>
              </div>

              {/* Indicação "Gratuito" */}
              <div className="flex items-baseline gap-2 pt-1 border-t border-white/10">
                <span className="text-[28px] font-black text-white tracking-tight">
                  Gratuito
                </span>
                <span className="text-[13px] text-neutral-400">
                  / para membros
                </span>
              </div>

              {/* Botão Branco "Entrar no Portal" */}
              <button
                type="button"
                onClick={onEnterMemberPortal}
                className="w-full h-[48px] rounded-full bg-white hover:bg-neutral-100 text-black font-bold text-[14px] flex items-center justify-center shadow-lg active:scale-[0.98] transition-all cursor-pointer"
              >
                Entrar no Portal
              </button>

              {/* Benefícios */}
              <div className="space-y-2 pt-1 text-[12px] text-neutral-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Credencial digital sempre disponível</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Certificados, cartas e expediente</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Avisos, cultos e petições pastorais</span>
                </div>
              </div>

              {/* Nota de Privacidade */}
              <div className="pt-2 text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5 border-t border-white/5">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Seus dados protegidos e sob seu controle</span>
              </div>
            </div>

            {/* Cartão Secundário: VISITANTE */}
            <button
              type="button"
              onClick={onEnterVisitorPortal}
              className="w-full bg-[#121418] hover:bg-[#181B22] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[14px] font-bold text-white block">
                    Visitante
                  </span>
                  <span className="text-[12px] text-neutral-300">
                    Conheça nosso portal público
                  </span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-neutral-300" />
            </button>
          </div>
        )}
      </main>

      {/* Footer Minimalista da Página */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-[#A7A9AE] border-t border-white/5 z-20">
        <span>Assembleia de Deus Ministério de Madureira</span>
        <span>Convenção Nacional CONAMAD</span>
      </footer>
    </div>
  );
};
