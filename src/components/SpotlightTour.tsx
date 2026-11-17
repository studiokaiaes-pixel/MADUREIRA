import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Play,
  CheckCircle2,
  Compass,
  ArrowRight,
  Eye,
} from 'lucide-react';

export interface SpotlightStep {
  id: string;
  targetSelector: string;
  targetTab?: 'inicio' | 'credencial' | 'expediente' | 'documentos' | 'comunicados' | 'atencion';
  title: string;
  badge: string;
  description: string;
  whatItDoes: string;
  documentGenerated?: string;
  actionLabel?: string;
  actionId?: string;
}

export const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    id: 'step-inicio-credencial',
    targetSelector: '[data-tour="btn-inicio-credencial"]',
    targetTab: 'inicio',
    title: 'Ver Credencial Digital',
    badge: 'Acesso Rápido',
    description: 'Abre seu cartão eclesiástico oficial com foto, cargo e QR Code de validação.',
    whatItDoes: 'Exibe o carnet oficial emitido pela CONAMAD España e dá acesso à emissão da Ficha Canônica A4.',
    documentGenerated: 'Carnet digital com token criptográfico.',
    actionLabel: 'Ver Credencial Agora',
    actionId: 'ver-credencial',
  },
  {
    id: 'step-inicio-pedir-doc',
    targetSelector: '[data-tour="btn-inicio-pedir-doc"]',
    targetTab: 'inicio',
    title: 'Pedir Documento à Secretaria',
    badge: 'Secretaria',
    description: 'Solicite certidões de batismo, cartas de mudança ou recomendação com 1 clique.',
    whatItDoes: 'Gera uma petição administrativa formal enviada diretamente ao setor de documentação.',
    documentGenerated: 'Dossiê com protocolo de acompanhamento.',
    actionLabel: 'Abrir Pedido de Documento',
    actionId: 'pedir-documento',
  },
  {
    id: 'step-gerar-pdf-ficha',
    targetSelector: '[data-tour="btn-gerar-pdf-ficha"]',
    targetTab: 'credencial',
    title: 'Gerar PDF (Ficha Oficial de Membro)',
    badge: 'Ficha A4 Oficial',
    description: 'Este é o botão principal! Gera e baixa imediatamente sua Ficha Oficial da Assembleia de Deus Madureira.',
    whatItDoes: 'Gera o PDF institucional A4 idêntico ao modelo oficial da Secretaria, com cabeçalho CONAMAD, dados canônicos e assinaturas pastorais.',
    documentGenerated: 'Arquivo "Ficha_Miembro_ADMM_[SeuNome].pdf" pronto para impressão.',
    actionLabel: '⚡ Baixar PDF Agora',
    actionId: 'gerar-pdf-ficha',
  },
  {
    id: 'step-ver-imprimir-ficha',
    targetSelector: '[data-tour="btn-ver-imprimir-ficha"]',
    targetTab: 'credencial',
    title: 'Ver Ficha / Imprimir Ficha',
    badge: 'Visualizador A4',
    description: 'Permite inspecionar a ficha diagramada na tela antes de imprimir.',
    whatItDoes: 'Abre o visor canônico em tela cheia com opção de impressão direta para sua impressora física.',
    documentGenerated: 'Visualização interativa A4 em alta fidelidade.',
    actionLabel: '🔍 Abrir Visualizador A4',
    actionId: 'ver-ficha',
  },
  {
    id: 'step-tab-expediente',
    targetSelector: '[data-tour="nav-tab-expediente"]',
    targetTab: 'expediente',
    title: 'Meu Expediente & Histórico',
    badge: 'Arquivo Canônico',
    description: 'Consulte toda a sua pasta arquivada na igreja: data de batismo, admissão e congregação.',
    whatItDoes: 'Permite auditar seu histórico de membro e atualizar dados civis como morada e telefone.',
    documentGenerated: 'Histórico cadastral homologado.',
    actionLabel: 'Acessar Expediente',
    actionId: 'meu-expediente',
  },
  {
    id: 'step-tab-documentos',
    targetSelector: '[data-tour="btn-nova-solicitacao-doc"]',
    targetTab: 'documentos',
    title: 'Nova Solicitação de Documento',
    badge: 'Certificados & Cartas',
    description: 'Área onde você emite e baixa as certidões e cartas autorizadas pelo pastor.',
    whatItDoes: 'Permite solicitar Carta de Mudança (transferência de filial) ou Certidão de Membro com selo eclesiástico.',
    documentGenerated: 'Certidão ou Carta de Mudança timbrada.',
    actionLabel: 'Nova Solicitação',
    actionId: 'pedir-documento',
  },
  {
    id: 'step-tab-atencion',
    targetSelector: '[data-tour="btn-nova-peticao-pastoral"]',
    targetTab: 'atencion',
    title: 'Petição Pastoral Confidencial',
    badge: 'Gabinete Pastoral',
    description: 'Canal 100% privado com o Pastor Titular da sua filial.',
    whatItDoes: 'Envie pedidos de oração de urgência, agendamento de aconselhamento bíblico ou visita pastoral sob sigilo estrito.',
    documentGenerated: 'Mensagem privada no portal pastoral.',
    actionLabel: 'Enviar Petição ao Pastor',
    actionId: 'peticao-pastoral',
  },
  {
    id: 'step-portal-publico',
    targetSelector: '[data-tour="btn-portal-publico"]',
    targetTab: 'inicio',
    title: 'Portal Público Institucional',
    badge: 'Visitantes',
    description: 'Acesse o site aberto da igreja para consultar horários de cultos e mapa de filiais.',
    whatItDoes: 'Alterna para o portal aberto de boas-vindas sem encerrar sua sessão de membro.',
    documentGenerated: 'Navegação imediata ao portal público.',
    actionLabel: '🌐 Visitar Portal Público',
    actionId: 'portal-publico',
  },
  {
    id: 'step-logout',
    targetSelector: '[data-tour="btn-logout"]',
    targetTab: 'inicio',
    title: 'Sair e Proteger Sessão',
    badge: 'Segurança',
    description: 'Encerra sua sessão e remove o token com segurança deste dispositivo.',
    whatItDoes: 'Limpa o JWT do navegador para garantir que ninguém mais acerte seus registros de membro.',
    documentGenerated: 'Retorno seguro à tela de autenticação.',
  },
];

interface SpotlightTourProps {
  onClose: () => void;
  onFinish: (dontShowAgain: boolean) => void;
  onNavigateTab: (tab: 'inicio' | 'credencial' | 'expediente' | 'documentos' | 'comunicados' | 'atencion') => void;
  onTriggerAction?: (actionId: string) => void;
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  onClose,
  onFinish,
  onNavigateTab,
  onTriggerAction,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; arrowSide: 'top' | 'bottom'; arrowOffset: number }>({
    top: 100,
    left: 100,
    arrowSide: 'top',
    arrowOffset: 50,
  });
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [isElementVisible, setIsElementVisible] = useState(false);

  const currentStep = SPOTLIGHT_STEPS[currentStepIndex];
  const popoverRef = useRef<HTMLDivElement>(null);

  // Posiciona o destaque com recorte real SVG e o popover flutuante
  const updatePosition = useCallback(() => {
    const el = document.querySelector(currentStep.targetSelector);
    if (!el) {
      setIsElementVisible(false);
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);
    setIsElementVisible(true);

    // Medidas do popover flutuante
    const popoverWidth = Math.min(390, window.innerWidth - 32);
    const popoverHeight = 290;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    // Garante que o popover fique dentro dos limites da tela
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    // Calcula a posição do ponteiro indicador (seta) relativo ao centro do botão
    const buttonCenterX = rect.left + rect.width / 2;
    const arrowOffset = Math.max(20, Math.min(popoverWidth - 20, buttonCenterX - left));

    // Determina se posiciona acima ou abaixo com espaçamento generoso (20px) para NUNCA tapar o botão
    let top: number;
    let arrowSide: 'top' | 'bottom' = 'top';

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= popoverHeight + 24 || spaceBelow > spaceAbove) {
      top = rect.bottom + 20;
      arrowSide = 'top';
    } else {
      top = Math.max(16, rect.top - popoverHeight - 20);
      arrowSide = 'bottom';
    }

    setPopoverPos({ top, left, arrowSide, arrowOffset });
  }, [currentStep.targetSelector]);

  // Ao mudar de passo, sincroniza a aba no sistema e rola suavemente até o elemento
  useEffect(() => {
    if (currentStep.targetTab) {
      onNavigateTab(currentStep.targetTab);
    }

    // Aguarda a renderização da aba pelo React
    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
      updatePosition();
    }, 220);

    return () => clearTimeout(timer);
  }, [currentStepIndex, currentStep.targetTab, currentStep.targetSelector, onNavigateTab, updatePosition]);

  // Atualiza posição em scroll ou resize
  useEffect(() => {
    const handleRecalc = () => updatePosition();
    window.addEventListener('resize', handleRecalc);
    window.addEventListener('scroll', handleRecalc, true);

    return () => {
      window.removeEventListener('resize', handleRecalc);
      window.removeEventListener('scroll', handleRecalc, true);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStepIndex < SPOTLIGHT_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    onFinish(dontShowAgain);
  };

  const handleExecuteAction = () => {
    if (currentStep.actionId && onTriggerAction) {
      onTriggerAction(currentStep.actionId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* 1. MÁSCARA SVG QUE RECORTA O BOTÃO AO 100% DE NITIDEZ (ZERO ESCURIDÃO SOBRE O BOTÃO) */}
      {targetRect && isElementVisible ? (
        <svg
          className="fixed inset-0 w-full h-full z-40 pointer-events-auto"
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <mask id="spotlight-tour-cutout-mask">
              {/* Tela cheia branca = aplica a sombra escura no resto */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Recorte transparente exato no botão = ZERO sombra, luminosidade 100% natural */}
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="16"
                ry="16"
                fill="black"
              />
            </mask>
          </defs>
          {/* Fundo escuro semitransparente com a máscara de recorte aplicada */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-tour-cutout-mask)"
            onClick={handleNext}
            className="cursor-pointer"
          />
        </svg>
      ) : (
        <div
          onClick={handleNext}
          className="fixed inset-0 bg-black/75 z-40 cursor-pointer"
        />
      )}

      {/* 2. MOLDURA BRILHANTE AO REDOR DO RECORTE (DESTAQUE VISUAL SEM OBSTRUÇÃO) */}
      {targetRect && isElementVisible && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: '20px',
            pointerEvents: 'none',
          }}
          className="border-2 border-white ring-4 ring-white/20 shadow-[0_0_35px_rgba(255,255,255,0.45)] z-50 animate-pulse pointer-events-none"
        >
          {/* Placa Indicadora Superior com Seta */}
          <div className="absolute -top-3.5 left-2 px-3 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider shadow-2xl flex items-center gap-1.5 border border-white/40">
            <span>👉 ESTE É O BOTÃO</span>
          </div>

          {/* Círculo do Número do Passo */}
          <div className="absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-black text-white font-mono font-bold text-[12px] flex items-center justify-center shadow-2xl border-2 border-white">
            {currentStepIndex + 1}
          </div>
        </div>
      )}

      {/* 3. POPOVER / TEXTO FLUTUANTE COM SETA DIRECIONAL ANCLADA */}
      <div
        ref={popoverRef}
        style={{
          position: 'fixed',
          top: popoverPos.top,
          left: popoverPos.left,
          width: 'min(390px, calc(100vw - 32px))',
        }}
        className="z-50 bg-[#121214] border border-white/15 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 space-y-4 relative"
      >
        {/* Seta direcional apontando exatamente para o botão iluminado */}
        {popoverPos.arrowSide === 'top' ? (
          <div
            style={{ left: `${popoverPos.arrowOffset}px` }}
            className="absolute -top-2.5 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-white/20 drop-shadow-md"
          />
        ) : (
          <div
            style={{ left: `${popoverPos.arrowOffset}px` }}
            className="absolute -bottom-2.5 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white/20 drop-shadow-md"
          />
        )}

        {/* Cabecera do Texto Flutuante */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                {currentStep.badge}
              </span>
              <span className="text-[11px] font-mono text-[#A1A1AA]">
                Passo {currentStepIndex + 1} / {SPOTLIGHT_STEPS.length}
              </span>
            </div>
            <h3 className="text-[17px] font-bold text-white tracking-tight leading-tight">
              {currentStep.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Pular tour guiado"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* O que o botão faz e o que gera */}
        <div className="space-y-2.5 text-[12px]">
          <p className="text-neutral-200 leading-relaxed font-normal">
            {currentStep.description}
          </p>

          <div className="p-3 rounded-2xl bg-[#18181B] border border-white/5 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>O que faz no sistema:</span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              {currentStep.whatItDoes}
            </p>
          </div>

          {currentStep.documentGenerated && (
            <div className="text-[11px] text-neutral-200 font-medium flex items-center gap-1.5 bg-white/5 p-2 rounded-xl border border-white/10">
              <span className="text-white font-bold shrink-0">📄 Documento:</span>
              <span className="text-neutral-300 font-mono text-[10px] truncate">{currentStep.documentGenerated}</span>
            </div>
          )}
        </div>

        {/* Botão de Ação Direta para Testar */}
        {currentStep.actionLabel && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleExecuteAction}
              className="w-full h-11 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[13px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{currentStep.actionLabel}</span>
            </button>
          </div>
        )}

        {/* Barra Inferior com Controles e Checkbox */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          {/* Checkbox para Não Repetir */}
          <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/20 bg-black/40 text-white focus:ring-0 cursor-pointer"
            />
            <span>Não repetir</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              className="h-9 px-4 rounded-full bg-[#18181B] hover:bg-[#222226] text-neutral-300 hover:text-white border border-white/10 text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="h-9 px-4 rounded-full bg-white hover:bg-neutral-200 text-black text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <span>{currentStepIndex === SPOTLIGHT_STEPS.length - 1 ? 'Concluir ✨' : 'Próximo 👉'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
