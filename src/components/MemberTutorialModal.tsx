import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Download,
  Printer,
  CreditCard,
  FileCheck,
  HeartHandshake,
  User as UserIcon,
  Megaphone,
  Globe,
  LogOut,
  Edit,
  CheckCircle2,
  Compass,
  ShieldCheck,
  Sparkles,
  Play,
  RotateCcw,
  Eye,
  Maximize2,
  Minimize2,
  Lock,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Member, User } from '../types';

export interface TutorialButtonStep {
  id: string;
  buttonName: string;
  tabLocation: string;
  icon: React.ElementType;
  badgeColor: string;
  shortDescription: string;
  whatItDoes: string;
  whenToUse: string;
  documentGenerated: string;
  targetTab?: 'inicio' | 'credencial' | 'expediente' | 'documentos' | 'comunicados' | 'atencion';
  interactiveActionLabel: string;
}

export const TUTORIAL_BUTTONS: TutorialButtonStep[] = [
  {
    id: 'gerar-pdf-ficha',
    buttonName: 'Gerar PDF (Ficha Oficial)',
    tabLocation: 'Abas: "Credencial Digital" e "Meu Expediente"',
    icon: Download,
    badgeColor: 'bg-white text-black',
    shortDescription: 'Gera e baixa imediatamente sua Ficha Oficial de Membro em formato A4 institucional.',
    whatItDoes:
      'Gera um documento PDF em padrão A4 de alta resolução com o timbre oficial da Assembleia de Deus Ministério Madureira (CONAMAD España), divisores corporativos #DA4814, dados civis (DNI/NIE, nascimento, endereço), dados eclesiásticos (batismo e admissão), cláusula do RGPD e assinaturas pastorais.',
    whenToUse:
      'Utilize sempre que precisar comprovar formalmente sua membresía ativa perante a convenção, transferências de sede, cartórios ou arquivo pessoal.',
    documentGenerated: 'Arquivo "Ficha_Miembro_ADMM_[SeuNome].pdf" pronto para impressão em papel.',
    targetTab: 'credencial',
    interactiveActionLabel: '⚡ Gerar & Baixar PDF Oficial Agora',
  },
  {
    id: 'ver-ficha',
    buttonName: 'Ver Ficha / Imprimir Ficha',
    tabLocation: 'Aba: "Credencial Digital"',
    icon: FileText,
    badgeColor: 'bg-white text-black',
    shortDescription: 'Abre o visor em tela cheia do documento canônico A4 com botão de impressão rápida.',
    whatItDoes:
      'Permite inspecionar visualmente na tela exatamente como o modelo oficial em papel foi diagramado (idêntico ao modelo Word da Secretaria), verificar se todos os seus dados estão corretos e imprimir direto na sua impressora física sem precisar salvar o arquivo.',
    whenToUse:
      'Quando quiser revisar seus dados antes de emitir ou quando desejar imprimir na hora sem salvar arquivo.',
    documentGenerated: 'Visualização interativa A4 com função de impressão nativa do navegador.',
    targetTab: 'credencial',
    interactiveActionLabel: '🔍 Abrir Visualizador Canônico A4',
  },
  {
    id: 'completar-editar-ficha',
    buttonName: 'Completar / Editar Ficha Canônica',
    tabLocation: 'Banner Inicial e Aba: "Meu Expediente"',
    icon: Edit,
    badgeColor: 'bg-[#18181B] text-white border border-white/20',
    shortDescription: 'Formulário canônico para preencher DNI/NIE, nascimento, morada e batismo.',
    whatItDoes:
      'Abre o modal seguro para você atualizar seus dados pessoais e eclesiásticos. Enquanto esses dados não estiverem completos, o sistema protege seu expediente e não permite a emissão de fichas em branco.',
    whenToUse:
      'No seu primeiro acesso ou sempre que mudar de endereço, telefone ou atualizar dados de batismo.',
    documentGenerated: 'Atualização instantânea no banco de dados e no cabeçalho da Ficha A4.',
    targetTab: 'expediente',
    interactiveActionLabel: '📝 Abrir Formulário de Cadastro',
  },
  {
    id: 'ver-credencial',
    buttonName: 'Ver Credencial / Credencial Digital',
    tabLocation: 'Navegação e Aba: "Início"',
    icon: CreditCard,
    badgeColor: 'bg-[#18181B] text-white border border-white/20',
    shortDescription: 'Apresenta seu cartão oficial de membro com token de autenticidade QR.',
    whatItDoes:
      'Exibe o carnet eclesiástico digital no padrão oficial da CONAMAD España (tarjeta plástica) contendo sua foto, cargo ministerial, NIF institucional R2802896G, número de matrícula e o selo criptográfico de validação.',
    whenToUse:
      'Para apresentar na portaria de convenções, cultos especiais, congressos nacionais ou viagens a outras congregações.',
    documentGenerated: 'Carnet digital interativo e opção de exportação de credencial.',
    targetTab: 'credencial',
    interactiveActionLabel: '💳 Ir para Credencial Digital',
  },
  {
    id: 'pedir-documento',
    buttonName: 'Pedir Documento / Solicitar Documento',
    tabLocation: 'Aba: "Início" e "Certificados e Cartas"',
    icon: FileCheck,
    badgeColor: 'bg-[#18181B] text-white border border-white/20',
    shortDescription: 'Solicita certidões de batismo, cartas de recomendação ou atestados de membro.',
    whatItDoes:
      'Envia uma petição administrativa formal para a Secretaria da sua congregação. Você escolhe o tipo de documento desejado (Carta de Mudança, Recomendação para Viagem, Certidão de Batismo) e adiciona observações pertinentes.',
    whenToUse:
      'Sempre que for viajar a trabalho/estudos, mudar de cidade ou necessitar de comprovação canônica oficial para outra igreja.',
    documentGenerated: 'Gera um protocolo numerado (Dossiê) que é analisado e homologado pelo Pastor.',
    targetTab: 'documentos',
    interactiveActionLabel: '📄 Abrir Formulário de Solicitação',
  },
  {
    id: 'peticao-pastoral',
    buttonName: 'Petição Pastoral / Nova Petição',
    tabLocation: 'Aba: "Início" e "Petições e Pastoral"',
    icon: HeartHandshake,
    badgeColor: 'bg-[#18181B] text-white border border-white/20',
    shortDescription: 'Canal estritamente privado com o Pastor da sua sede local.',
    whatItDoes:
      'Permite enviar pedidos de oração, solicitação de visita pastoral, agendamento de aconselhamento espiritual ou consultas em estrito sigilo pastoral. Apenas o pastor titular tem acesso a essa comunicação.',
    whenToUse:
      'Em momentos de enfermidade, decisões familiares importantes, pedidos de intercessão ou aconselhamento pessoal.',
    documentGenerated: 'Mensagem privada com histórico de respostas pastorais no seu portal.',
    targetTab: 'atencion',
    interactiveActionLabel: '🙏 Enviar Pedido Pastoral',
  },
  {
    id: 'meu-expediente',
    buttonName: 'Meu Expediente',
    tabLocation: 'Barra de navegação principal (3º ícone)',
    icon: UserIcon,
    badgeColor: 'bg-[#18181B] text-white border border-white/20',
    shortDescription: 'Acessa todo o arquivo pessoal, histórico de atos e registros eclesiásticos.',
    whatItDoes:
      'Reúne em duas categorias (Dados Pessoais e Informações de Membresía) o seu número de matrícula oficial, situação no rol (Em Comunhão), data de batismo, data de admissão e registros arquivados.',
    whenToUse:
      'Para auditar as informações que a igreja possui arquivadas sobre você e garantir que estão atualizadas.',
    documentGenerated: 'Visualização consolidada de todo o histórico cadastral.',
    targetTab: 'expediente',
    interactiveActionLabel: '📂 Abrir Meu Expediente',
  },
  {
    id: 'avisos-igreja',
    buttonName: 'Avisos da Igreja / Circulares',
    tabLocation: 'Barra de navegação principal (5º ícone)',
    icon: Megaphone,
    badgeColor: 'bg-[#18181B] text-white border border-white/20',
    shortDescription: 'Consulta comunicados oficiais, editais e circulares emitidas pela pastoral.',
    whatItDoes:
      'Exibe todas as circulares canônicas da Secretaria Nacional e da sua filial local, como horários de conferências, assembleias e convocações da liderança.',
    whenToUse:
      'Para manter-se informado sobre as decisões, eventos e programações especiais da sua igreja.',
    documentGenerated: 'Mural de comunicados oficiais com data e âmbito (Local ou Nacional).',
    targetTab: 'comunicados',
    interactiveActionLabel: '📢 Acessar Comunicados Oficiais',
  },
  {
    id: 'portal-publico',
    buttonName: 'Portal Público (Ícone do Globo 🌐)',
    tabLocation: 'Canto superior direito do cabeçalho',
    icon: Globe,
    badgeColor: 'bg-[#1C1C1E] text-neutral-300 border border-white/10',
    shortDescription: 'Alterna para a página pública institucional da igreja.',
    whatItDoes:
      'Leva você para o portal de boas-vindas da AD Madureira aberto a visitantes, onde constam os endereços das filiais, horários de cultos gerais, mapa de geolocalização e notícias públicas da congregação.',
    whenToUse:
      'Para consultar horários de cultos, enviar a localização para um visitante ou amigos.',
    documentGenerated: 'Navegação imediata sem encerrar a sua sessão.',
    interactiveActionLabel: '🌐 Ir ao Portal Institucional',
  },
  {
    id: 'sair',
    buttonName: 'Sair (Ícone LogOut)',
    tabLocation: 'Canto superior direito do cabeçalho',
    icon: LogOut,
    badgeColor: 'bg-[#1C1C1E] text-rose-300 border border-rose-500/20',
    shortDescription: 'Encerra sua sessão e desativa o token criptográfico com segurança.',
    whatItDoes:
      'Apaga com segurança o token JWT do armazenamento local do seu navegador para impedir que outras pessoas usem o dispositivo para acessar seus dados eclesiásticos.',
    whenToUse:
      'Sempre que utilizar um computador compartilhado, celular de terceiros ou finalizar suas consultas.',
    documentGenerated: 'Desconexão segura com retorno à tela de login.',
    interactiveActionLabel: '🔒 Testar Informações de Segurança',
  },
];

export interface MemberTutorialModalProps {
  onClose: () => void;
  onFinishFirstTime?: (dontShowAgain: boolean) => void;
  onNavigateTab?: (tab: 'inicio' | 'credencial' | 'expediente' | 'documentos' | 'comunicados' | 'atencion') => void;
  onTriggerAction?: (actionId: string) => void;
  member?: Member | null;
  currentUser?: User;
  isFirstTime?: boolean;
}

export const MemberTutorialModal: React.FC<MemberTutorialModalProps> = ({
  onClose,
  onFinishFirstTime,
  onNavigateTab,
  onTriggerAction,
  member,
  currentUser,
  isFirstTime = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'stepByStep' | 'fullList'>('stepByStep');
  const [isDocked, setIsDocked] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [simulatedDocType, setSimulatedDocType] = useState('cert_membresia');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const currentStep = TUTORIAL_BUTTONS[currentStepIndex];
  const StepIcon = currentStep.icon;

  // Sincroniza a aba do sistema quando o usuário avança no passo a passo
  useEffect(() => {
    if (currentStep.targetTab && onNavigateTab) {
      onNavigateTab(currentStep.targetTab);
    }
  }, [currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < TUTORIAL_BUTTONS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setActionSuccessMessage(null);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setActionSuccessMessage(null);
    }
  };

  const handleTriggerAction = (actionId: string, tab?: 'inicio' | 'credencial' | 'expediente' | 'documentos' | 'comunicados' | 'atencion') => {
    if (tab && onNavigateTab) {
      onNavigateTab(tab);
    }
    if (onTriggerAction) {
      onTriggerAction(actionId);
    }

    if (actionId === 'gerar-pdf-ficha') {
      setActionSuccessMessage('Ação executada! O PDF oficial da Ficha foi gerado pelo sistema.');
    } else if (actionId === 'ver-ficha') {
      setActionSuccessMessage('Visualizador A4 acionado! Exibindo o documento canônico oficial.');
      onClose();
    } else if (actionId === 'completar-editar-ficha') {
      setActionSuccessMessage('Formulário canônico aberto para preenchimento.');
      onClose();
    } else if (actionId === 'pedir-documento') {
      setActionSuccessMessage('Formulário de solicitação à Secretaria aberto.');
      onClose();
    } else if (actionId === 'peticao-pastoral') {
      setActionSuccessMessage('Canal estritamente confidencial com o Pastor aberto.');
      onClose();
    } else {
      setActionSuccessMessage('Ação interagida diretamente com o sistema!');
    }
  };

  const handleClose = () => {
    if (onFinishFirstTime) {
      onFinishFirstTime(dontShowAgain);
    }
    onClose();
  };

  return (
    <>
      {/* MODO 1: GUIA FLUTUANTE NO SISTEMA (HUD DOCK INFERIOR) */}
      {isDocked ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-[#161619]/95 border border-purple-500/40 rounded-2xl shadow-2xl p-4 backdrop-blur-xl animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <StepIcon className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Passo {currentStepIndex + 1} de {TUTORIAL_BUTTONS.length}
                  </span>
                  <span className="text-[10px] text-[#8E8E93] truncate">
                    • {currentStep.tabLocation}
                  </span>
                </div>
                <div className="text-[14px] font-bold text-white truncate">
                  {currentStep.buttonName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleTriggerAction(currentStep.id, currentStep.targetTab)}
                className="h-9 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Executar no Sistema</span>
                <span className="sm:hidden">Executar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDocked(false)}
                title="Expandir Tutorial Visual Completo"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClose}
                title="Fechar Tutorial"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-3 text-xs">
            <div className="text-neutral-300 truncate max-w-sm text-[11px]">
              {currentStep.shortDescription}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={currentStepIndex === 0}
                onClick={handlePrev}
                className="px-2.5 py-1 rounded-lg bg-[#202024] text-white disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentStepIndex === TUTORIAL_BUTTONS.length - 1}
                onClick={handleNext}
                className="px-2.5 py-1 rounded-lg bg-purple-600 text-white disabled:opacity-40"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MODO 2: MODAL VISUAL E INTERATIVO EXPANDIDO */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Cabecera do Tutorial */}
            <div className="p-4 sm:p-6 border-b border-white/10 bg-[#161619] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                      TUTORIAL INTERATIVO DO SISTEMA
                    </span>
                    {isFirstTime && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Primeiro Acesso
                      </span>
                    )}
                  </div>
                  <h2 className="text-[17px] sm:text-[20px] font-bold text-white tracking-tight">
                    Conheça Cada Botão e Interaja com o Portal
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão para Minimizar para Modo Flutuante */}
                <button
                  type="button"
                  onClick={() => setIsDocked(true)}
                  title="Minimizar e guiar direto na tela do sistema"
                  className="hidden md:flex h-9 px-3 rounded-xl bg-[#202024] hover:bg-[#2A2A2E] text-purple-300 hover:text-white items-center gap-1.5 text-[11px] font-semibold border border-purple-500/30 transition-all cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Modo Flutuante na Tela</span>
                </button>

                {/* Alternador de Modo: Passo a Passo / Todos */}
                <div className="hidden sm:flex bg-[#202024] p-1 rounded-xl border border-white/5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setViewMode('stepByStep')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      viewMode === 'stepByStep' ? 'bg-purple-600 text-white' : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    Passo a Passo
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('fullList')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      viewMode === 'fullList' ? 'bg-purple-600 text-white' : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    Ver Todos ({TUTORIAL_BUTTONS.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                  title="Fechar Tutorial"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CONTENIDO INTERATIVO */}
            {viewMode === 'stepByStep' ? (
              <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Barra de Progresso e Navegação Superior */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12px] text-[#8E8E93]">
                    <span className="font-semibold text-purple-300 flex items-center gap-2">
                      <span>Botão {currentStepIndex + 1} de {TUTORIAL_BUTTONS.length}:</span>
                      <strong className="text-white">{currentStep.buttonName}</strong>
                    </span>
                    <span className="text-[11px] font-mono">
                      {Math.round(((currentStepIndex + 1) / TUTORIAL_BUTTONS.length) * 100)}% concluído
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1C1C1E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-[#DA4814] transition-all duration-300 rounded-full"
                      style={{ width: `${((currentStepIndex + 1) / TUTORIAL_BUTTONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Notificação de Sucesso de Ação Interativa */}
                {actionSuccessMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{actionSuccessMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActionSuccessMessage(null)}
                      className="text-emerald-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Grid Visual Dividido: À Esquerda a Simulação Visual Interativa / À Direita os Detalhes */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* PAINEL VISUAL INTERATIVO (7 colunas) */}
                  <div className="lg:col-span-7 bg-[#161619] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[340px]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                          Simulador Visual Interativo
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#8E8E93] font-mono">
                        Ao vivo
                      </span>
                    </div>

                    {/* RENDERIZADO VISUAL CONDICIONAL DEPENDENDO DO BOTÃO */}
                    <div className="flex-1 flex flex-col justify-center items-center py-2">
                      {/* BOTÃO 1: FICHA A4 PDF */}
                      {currentStep.id === 'gerar-pdf-ficha' && (
                        <div className="w-full max-w-sm bg-white text-black p-4 rounded-xl shadow-2xl border-t-4 border-[#DA4814] transform hover:scale-[1.02] transition-transform space-y-3">
                          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                            <div className="text-[11px] font-black tracking-tight text-neutral-800 leading-tight">
                              CONAMAD • ADMM MADRID
                              <div className="text-[9px] font-normal text-neutral-500">FICHA OFICIAL DE MEMBRO</div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-[#DA4814]/10 border border-[#DA4814]/30 flex items-center justify-center text-[#DA4814] font-black text-[9px]">
                              A4
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div className="col-span-2 space-y-1">
                              <div className="text-neutral-500 text-[8px] uppercase">Membro Cadastrado</div>
                              <div className="font-bold truncate text-neutral-900">{currentUser?.name || 'Membro do Corpo'}</div>
                              <div className="text-neutral-600 text-[9px]">{member?.memberNumber || 'MAD-2026-OFICIAL'}</div>
                            </div>
                            <div className="w-14 h-16 bg-neutral-100 border border-dashed border-neutral-300 rounded flex items-center justify-center text-[8px] text-neutral-400 justify-self-end">
                              Foto 3x4
                            </div>
                          </div>

                          <div className="bg-neutral-50 p-2 rounded text-[8px] text-neutral-500 border border-neutral-200">
                            ✓ DNI/NIE validado • Batismo em águas • Em comunhão plena
                          </div>
                        </div>
                      )}

                      {/* BOTÃO 2: VISUALIZADOR DA FICHA A4 */}
                      {currentStep.id === 'ver-ficha' && (
                        <div className="w-full max-w-sm bg-[#1C1C1E] border border-white/10 rounded-xl p-4 shadow-2xl space-y-3">
                          <div className="flex items-center justify-between text-xs text-neutral-300 border-b border-white/5 pb-2">
                            <span className="font-semibold flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-purple-400" />
                              Visualizador Canônico A4
                            </span>
                            <span className="text-[10px] text-emerald-400">100% Zoom</span>
                          </div>
                          <div className="aspect-[3/4] max-h-40 w-full bg-white text-black p-3 rounded shadow-inner flex flex-col justify-between text-[8px]">
                            <div className="h-2 w-20 bg-[#DA4814] rounded-sm" />
                            <div className="space-y-1">
                              <div className="h-1.5 w-32 bg-neutral-300 rounded" />
                              <div className="h-1.5 w-24 bg-neutral-200 rounded" />
                              <div className="h-1.5 w-28 bg-neutral-200 rounded" />
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                              <div className="h-2 w-12 bg-neutral-400 rounded" />
                              <div className="h-2 w-12 bg-neutral-400 rounded" />
                            </div>
                          </div>
                          <div className="text-[11px] text-center text-[#8E8E93]">
                            Inspeção visual direta e impressão sem necessidade de baixar.
                          </div>
                        </div>
                      )}

                      {/* BOTÃO 3: COMPLETAR FICHA CANÔNICA */}
                      {currentStep.id === 'completar-editar-ficha' && (
                        <div className="w-full max-w-sm bg-[#1C1C1E] border border-purple-500/30 rounded-xl p-4 shadow-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Edit className="w-3.5 h-3.5 text-purple-400" />
                              Requisitos da Ficha Canônica
                            </span>
                            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                              Cadastro
                            </span>
                          </div>

                          <div className="space-y-2 text-[11px]">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-[#121214] border border-white/5">
                              <span className="text-neutral-300">DNI / NIE Oficial</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Obrigatório
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-[#121214] border border-white/5">
                              <span className="text-neutral-300">Data e Local do Batismo</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Canônico
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-[#121214] border border-white/5">
                              <span className="text-neutral-300">Endereço & Código Postal</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> RGPD Espanha
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BOTÃO 4: CREDENCIAL DIGITAL (CARTÃO INTERATIVO GIRATÓRIO) */}
                      {currentStep.id === 'ver-credencial' && (
                        <div
                          onClick={() => setCardFlipped(!cardFlipped)}
                          className="w-full max-w-sm bg-gradient-to-br from-[#1c1c20] via-[#121214] to-black border border-purple-500/30 rounded-2xl p-4 shadow-2xl cursor-pointer hover:border-purple-400 transition-all select-none group"
                          title="Clique para virar o cartão"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                              CARTÃO OFICIAL DE MEMBRO
                            </span>
                            <span className="text-[9px] text-[#8E8E93] group-hover:text-white transition-colors">
                              (Clique para girar 🔄)
                            </span>
                          </div>

                          {!cardFlipped ? (
                            <div className="py-3 flex items-center gap-3.5">
                              <div className="w-12 h-14 bg-neutral-800 rounded-lg border border-white/10 flex items-center justify-center text-neutral-400 text-[9px] shrink-0">
                                FOTO
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="text-[13px] font-bold text-white truncate">
                                  {currentUser?.name || 'Membro do Corpo'}
                                </div>
                                <div className="text-[10px] text-purple-300 font-medium">
                                  {member?.ministerialFunction || 'Membro Eclesiástico'}
                                </div>
                                <div className="text-[9px] font-mono text-[#8E8E93]">
                                  Matrícula: {member?.memberNumber || 'MAD-2026-REG'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-3 flex items-center justify-between">
                              <div className="space-y-1 text-[9px] text-neutral-300">
                                <div>NIF Eclesiástico: R2802896G</div>
                                <div>CONAMAD España • Madrid</div>
                                <div className="text-emerald-400">Status: Em Plena Comunhão</div>
                              </div>
                              <div className="w-14 h-14 bg-white p-1 rounded-lg flex items-center justify-center">
                                <div className="w-full h-full border border-dashed border-black flex items-center justify-center text-[7px] text-black font-bold">
                                  QR TOKEN
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-[10px] text-purple-300 font-semibold flex items-center justify-between pt-1 border-t border-white/5">
                            <span>{cardFlipped ? 'Verso Validado' : 'Frente com Chip Digital'}</span>
                            <span className="text-neutral-400">Toque para ver verso</span>
                          </div>
                        </div>
                      )}

                      {/* BOTÃO 5: PEDIR DOCUMENTO */}
                      {currentStep.id === 'pedir-documento' && (
                        <div className="w-full max-w-sm bg-[#1C1C1E] border border-blue-500/30 rounded-xl p-4 shadow-2xl space-y-3">
                          <div className="text-xs font-bold text-white flex items-center justify-between">
                            <span>Solicitação de Certidão & Carta</span>
                            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                              Secretaria
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setSimulatedDocType('cert_membresia')}
                              className={`p-2 rounded-lg border text-left transition-all ${
                                simulatedDocType === 'cert_membresia'
                                  ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                                  : 'bg-[#121214] border-white/5 text-neutral-400'
                              }`}
                            >
                              Certidão de Membro
                            </button>
                            <button
                              type="button"
                              onClick={() => setSimulatedDocType('carta_mudanca')}
                              className={`p-2 rounded-lg border text-left transition-all ${
                                simulatedDocType === 'carta_mudanca'
                                  ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                                  : 'bg-[#121214] border-white/5 text-neutral-400'
                              }`}
                            >
                              Carta de Mudança
                            </button>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#121214] text-[10px] text-neutral-300 border border-white/5 flex items-center justify-between">
                            <span>Protocolo pré-gerado:</span>
                            <span className="font-mono text-purple-300">REQ-{Math.floor(Math.random() * 8999 + 1000)}</span>
                          </div>
                        </div>
                      )}

                      {/* BOTÃO 6: PETIÇÃO PASTORAL */}
                      {currentStep.id === 'peticao-pastoral' && (
                        <div className="w-full max-w-sm bg-[#1C1C1E] border border-rose-500/30 rounded-xl p-4 shadow-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                              Canal Sigiloso com o Pastor
                            </span>
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                              100% Privado
                            </span>
                          </div>
                          <div className="bg-[#121214] p-3 rounded-lg border border-white/5 space-y-2 text-[11px]">
                            <div className="text-neutral-300">Selecione o tipo de atenção:</div>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-2 py-1 rounded bg-[#202024] text-white text-[10px] font-medium border border-white/10">
                                🙏 Pedido de Oração
                              </span>
                              <span className="px-2 py-1 rounded bg-[#202024] text-neutral-300 text-[10px] border border-white/5">
                                🤝 Visita Pastoral
                              </span>
                              <span className="px-2 py-1 rounded bg-[#202024] text-neutral-300 text-[10px] border border-white/5">
                                💬 Aconselhamento
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] text-[#8E8E93]">
                            Apenas o Pastor Titular da sua congregação recebe e responde.
                          </div>
                        </div>
                      )}

                      {/* BOTÃO 7: MEU EXPEDIENTE */}
                      {currentStep.id === 'meu-expediente' && (
                        <div className="w-full max-w-sm bg-[#1C1C1E] border border-emerald-500/30 rounded-xl p-4 shadow-2xl space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span>Dossiê Canônico Completo</span>
                            <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              Homologado
                            </span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between p-2 rounded bg-[#121214] border border-white/5">
                              <span className="text-neutral-400">Rol de Membros:</span>
                              <span className="text-emerald-300 font-semibold">Em Comunhão</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-[#121214] border border-white/5">
                              <span className="text-neutral-400">Congregação Local:</span>
                              <span className="text-white font-medium">{member?.congregationName || 'Sede Madrid'}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-[#121214] border border-white/5">
                              <span className="text-neutral-400">Histórico de Atos:</span>
                              <span className="text-purple-300">Arquivado na Secretaria</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BOTÃO 8: AVISOS DA IGREJA */}
                      {currentStep.id === 'avisos-igreja' && (
                        <div className="w-full max-w-sm bg-[#1C1C1E] border border-sky-500/30 rounded-xl p-4 shadow-2xl space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span>Mural de Comunicados & Editais</span>
                            <span className="text-sky-400 text-[10px] bg-sky-500/10 px-2 py-0.5 rounded-full">
                              Oficial
                            </span>
                          </div>
                          <div className="space-y-2 text-[11px]">
                            <div className="p-2.5 rounded-lg bg-[#121214] border-l-2 border-sky-500 space-y-1">
                              <div className="font-bold text-white text-[12px]">Conferência Geral CONAMAD</div>
                              <div className="text-[10px] text-neutral-400">Circular Nacional emitida para todas as filiais.</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#121214] border-l-2 border-purple-500 space-y-1">
                              <div className="font-bold text-white text-[12px]">Assembleia Geral Extraordinária</div>
                              <div className="text-[10px] text-neutral-400">Convocação oficial aos membros em comunhão.</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BOTÃO 9: PORTAL PÚBLICO */}
                      {currentStep.id === 'portal-publico' && (
                        <div className="w-full max-w-sm bg-[#1C1C1E] border border-white/10 rounded-xl p-3.5 shadow-2xl space-y-2.5">
                          <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 text-[11px] text-neutral-400 font-mono">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block" />
                            <span className="text-[10px] ml-2 text-neutral-300">admadureira.es/public</span>
                          </div>
                          <div className="bg-[#121214] p-3 rounded-lg text-center space-y-1">
                            <div className="text-white font-bold text-xs">Página Institucional Aberta</div>
                            <div className="text-[10px] text-[#8E8E93]">
                              Horários de cultos, mapa georreferenciado e informações a visitantes.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BOTÃO 10: SAIR */}
                      {currentStep.id === 'sair' && (
                        <div className="w-full max-w-sm bg-[#1C1C1E] border border-rose-500/20 rounded-xl p-4 shadow-2xl text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">Encerramento Criptográfico</div>
                            <div className="text-[11px] text-neutral-400 max-w-xs mx-auto mt-1">
                              Limpa o token JWT da memória do navegador garantindo que nenhum terceiro acesse seus dados.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BOTÃO DE AÇÃO DIRETA COM O SISTEMA */}
                    <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] text-[#8E8E93]">
                        Deseja acionar esta funcionalidade no sistema agora?
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTriggerAction(currentStep.id, currentStep.targetTab)}
                        className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[12px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{currentStep.interactiveActionLabel}</span>
                      </button>
                    </div>
                  </div>

                  {/* PAINEL DE EXPLICAÇÃO CANÔNICA (5 colunas) */}
                  <div className="lg:col-span-5 bg-[#161619] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider truncate">
                            {currentStep.tabLocation}
                          </div>
                          <div className="text-[16px] font-bold text-white tracking-tight truncate">
                            {currentStep.buttonName}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 text-[12px]">
                        <div className="bg-[#121214] p-3.5 rounded-xl border border-white/5 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            <span>O que este botão faz:</span>
                          </div>
                          <p className="text-neutral-300 leading-relaxed text-[11px]">
                            {currentStep.whatItDoes}
                          </p>
                        </div>

                        <div className="bg-[#121214] p-3.5 rounded-xl border border-white/5 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Quando você deve usar:</span>
                          </div>
                          <p className="text-neutral-300 leading-relaxed text-[11px]">
                            {currentStep.whenToUse}
                          </p>
                        </div>

                        <div className="bg-[#121214] p-3.5 rounded-xl border border-white/5 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            <span>Resultado / Documento gerado:</span>
                          </div>
                          <p className="text-neutral-300 leading-relaxed text-[11px]">
                            {currentStep.documentGenerated}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-[11px] text-[#8E8E93] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Sincronizado em tempo real com a sua conta eclesiástica.</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* MODO 2: CATÁLOGO COMPLETO DE TODOS OS 10 BOTÕES */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <p className="text-[13px] text-[#8E8E93]">
                  Catálogo detalhado de todos os 10 botões e ações da sua área de membro:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {TUTORIAL_BUTTONS.map((btn, idx) => {
                    const Icon = btn.icon;
                    return (
                      <div
                        key={btn.id}
                        className="bg-[#161619] border border-white/10 hover:border-purple-500/40 rounded-2xl p-4 space-y-3 transition-colors flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-white text-[14px]">{btn.buttonName}</div>
                                <div className="text-[10px] text-[#8E8E93]">{btn.tabLocation}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-[#8E8E93]">#{idx + 1}</span>
                          </div>

                          <p className="text-[12px] text-neutral-300 leading-relaxed">
                            {btn.whatItDoes}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-emerald-400 truncate">
                            {btn.whenToUse.slice(0, 45)}...
                          </span>

                          <button
                            type="button"
                            onClick={() => handleTriggerAction(btn.id, btn.targetTab)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white text-[11px] font-semibold transition-all flex items-center gap-1 shrink-0"
                          >
                            <span>Testar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BARRA INFERIOR DE FINALIZAÇÃO E NAVEGAÇÃO */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#161619] flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Checkbox para Primeiro Acesso: Não mostrar novamente */}
              <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-[11px]">
                  Não exibir este tutorial automaticamente no próximo login
                </span>
              </label>

              {viewMode === 'stepByStep' ? (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={currentStepIndex === 0}
                    onClick={handlePrev}
                    className="h-10 px-5 rounded-full bg-[#18181B] hover:bg-[#222226] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  {currentStepIndex < TUTORIAL_BUTTONS.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="h-10 px-6 rounded-full bg-white hover:bg-neutral-200 text-black text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <span>Próximo Botão</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClose}
                      className="h-10 px-6 rounded-full bg-white hover:bg-neutral-200 text-black text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Concluir Tutorial</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-10 px-6 rounded-full bg-white text-black font-semibold text-[12px] hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
                >
                  Entendido / Concluir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
