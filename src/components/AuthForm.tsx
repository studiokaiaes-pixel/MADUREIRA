import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Shield,
  Church,
  X,
  Sparkles,
  ArrowLeft,
  KeyRound,
  FileText,
} from 'lucide-react';
import { api } from '../api';
import { CityOption, User, Workspace } from '../types';

interface AuthFormProps {
  onAuthSuccess: (user: User, workspace?: Workspace) => void;
  onCancel?: () => void;
  compact?: boolean;
  integratedWebMode?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  onAuthSuccess,
  onCancel,
  compact = false,
  integratedWebMode = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Cidades / Filiais ativas
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedCityWorkspaceId, setSelectedCityWorkspaceId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modais de suporte
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  // Estado para recuperação de senha com validação de documento
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryDocument, setRecoveryDocument] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [recoveryPastorName, setRecoveryPastorName] = useState<string | null>(null);

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    const cleanEmail = recoveryEmail.trim();
    const cleanDoc = recoveryDocument.trim();

    if (!cleanEmail) {
      setRecoveryError('Informe o e-mail cadastrado.');
      return;
    }
    if (!cleanDoc) {
      setRecoveryError('Informe o número de documento oficial (DNI / NIE / CPF).');
      return;
    }
    if (recoveryPassword.length < 6) {
      setRecoveryError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (recoveryPassword !== recoveryConfirmPassword) {
      setRecoveryError('A confirmação da nova senha não confere.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await api.recoverPassword({
        email: cleanEmail,
        idDocument: cleanDoc,
        newPassword: recoveryPassword,
      });

      setRecoverySuccess(res.message);
      setRecoveryPastorName(res.pastorName || 'Pastor Dirigente');
    } catch (err: any) {
      setRecoveryError(err.message || 'Erro ao redefinir senha com validação canônica.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  useEffect(() => {
    api
      .fetchCities()
      .then((list) => {
        setCities(list);
        if (list.length > 0 && !selectedCityWorkspaceId) {
          // Priorizar Madrid se existir para facilitar testes
          const madrid = list.find((c) => c.city.toLowerCase().includes('madrid'));
          setSelectedCityWorkspaceId(madrid ? madrid.workspaceId : list[0].workspaceId);
        }
      })
      .catch(() => {});
  }, [selectedCityWorkspaceId]);

  // Validação dinâmica da senha para cadastro
  const passLength = password.length >= 8;
  const passAlphaNum = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const passSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    try {
      if (mode === 'login') {
        const res = await api.login(cleanEmail, password);
        onAuthSuccess(res.user, res.workspace);
      } else {
        if (!cleanName) {
          throw new Error('Informe seu nome completo para o cadastro ministerial.');
        }
        if (!selectedCityWorkspaceId) {
          throw new Error('Selecione a cidade ou filial da sua igreja.');
        }
        const res = await api.register(cleanEmail, password, cleanName, selectedCityWorkspaceId);
        if (res.pendingApproval) {
          setSuccessNotice(
            `Solicitação de membro enviada com sucesso! O Pastor Dirigente ou a Secretaria da sua filial irá aprovar sua ficha oficial.`
          );
          setMode('login');
          setName('');
          setPassword('');
        } else if (res.user) {
          onAuthSuccess(res.user, (res as any).workspace);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar a solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const [approvingDemo, setApprovingDemo] = useState(false);

  const handleApproveDemo = async (targetEmail: string) => {
    if (!targetEmail) return;
    try {
      setApprovingDemo(true);
      const res = await api.approveDemo(targetEmail);
      setSuccessNotice(res.message);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao aprovar conta');
    } finally {
      setApprovingDemo(false);
    }
  };

  const fillCredentials = (
    type:
      | 'root'
      | 'admin-madrid'
      | 'sec-madrid'
      | 'admin-rio'
      | 'sec-rio'
      | 'admin-sp'
      | 'sec-sp'
      | 'member'
      | 'member-kaue'
  ) => {
    setMode('login');
    setErrorMessage(null);
    setSuccessNotice(null);
    setShowDemoDrawer(false);

    if (type === 'root') {
      setEmail('root@admadureira.org');
      setPassword('root#master99');
    } else if (type === 'admin-madrid') {
      setEmail('pastor.madrid@admadureira.org');
      setPassword('admin12345');
    } else if (type === 'sec-madrid') {
      setEmail('secretario.madrid@admadureira.org');
      setPassword('sec12345');
    } else if (type === 'admin-rio') {
      setEmail('admin@admadureira.org');
      setPassword('admin12345');
    } else if (type === 'sec-rio') {
      setEmail('secretario.rio@admadureira.org');
      setPassword('sec12345');
    } else if (type === 'admin-sp') {
      setEmail('pastor.sp@admadureira.org');
      setPassword('admin12345');
    } else if (type === 'sec-sp') {
      setEmail('secretario.sp@admadureira.org');
      setPassword('sec12345');
    } else if (type === 'member') {
      setEmail('gabriel.menezes@admadureira.org');
      setPassword('miembro123');
    } else if (type === 'member-kaue') {
      setEmail('kaue.barbosa2022@gmail.com');
      setPassword('17012007Alice');
    }
  };

  const selectedCityDetails = cities.find((c) => c.workspaceId === selectedCityWorkspaceId);

  return (
    <div
      className={`w-full ${
        compact ? 'max-w-[420px]' : 'max-w-[440px]'
      } mx-auto font-sans text-white select-none relative animate-fadeIn`}
    >
      {/* ============================================================== */}
      {/* BARRA SUPERIOR (Alinhada e integrada ao topo)                  */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between px-1 pt-1 pb-3 border-b border-white/[0.06] mb-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] font-medium text-[#A1A1AA] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-[#A1A1AA] uppercase">
              ADM MADUREIRA
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Botão sutil de atalhos rápidos para testes */}
          <button
            type="button"
            onClick={() => setShowDemoDrawer(true)}
            className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3 h-3" />
            <span>Testes</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ILUSTRAÇÃO ORIGINAL DE CARTÕES FLUTUANTES EM VIDRO            */}
      {/* (Modelo Original Fiel a media_1794419192837_7c9de2eb.webp)    */}
      {/* ============================================================== */}
      <div className="relative flex items-center justify-center my-4 py-3 h-44 overflow-visible">
        {mode === 'login' ? (
          /* Modo Login: Cartão de trás (Azul escuro com Cadeado) + Cartão da frente (Vidro carvão com Usuário) */
          <div className="relative w-48 h-36 flex items-center justify-center">
            {/* Cartão de Trás (+10deg) */}
            <div className="absolute w-32 h-36 rounded-2xl bg-[#16202A] border border-sky-400/30 shadow-2xl transform rotate-[10deg] translate-x-5 -translate-y-1 p-3.5 flex flex-col justify-between transition-transform duration-500">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 pb-1">
                <div className="w-14 h-1.5 bg-sky-400/25 rounded-full" />
                <div className="w-9 h-1.5 bg-sky-400/15 rounded-full" />
              </div>
            </div>

            {/* Cartão da Frente (-8deg) */}
            <div className="absolute w-32 h-36 rounded-2xl bg-[#1D2026]/95 backdrop-blur-md border border-white/20 shadow-2xl transform -rotate-[8deg] -translate-x-3 translate-y-1 p-3.5 flex flex-col justify-between transition-transform duration-500 z-10">
              <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 pb-1">
                <div className="w-16 h-1.5 bg-white/30 rounded-full" />
                <div className="w-11 h-1.5 bg-white/15 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          /* Modo Registro: Cartão de trás (Terracota com Documento) + Cartão da frente (Vidro carvão com UserPlus) */
          <div className="relative w-48 h-36 flex items-center justify-center">
            {/* Cartão de Trás (+10deg) */}
            <div className="absolute w-32 h-36 rounded-2xl bg-[#2A181A] border border-rose-500/30 shadow-2xl transform rotate-[10deg] translate-x-5 -translate-y-1 p-3.5 flex flex-col justify-between transition-transform duration-500">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 pb-1">
                <div className="w-14 h-1.5 bg-rose-400/25 rounded-full" />
                <div className="w-9 h-1.5 bg-rose-400/15 rounded-full" />
              </div>
            </div>

            {/* Cartão da Frente (-8deg) */}
            <div className="absolute w-32 h-36 rounded-2xl bg-[#1D2026]/95 backdrop-blur-md border border-white/20 shadow-2xl transform -rotate-[8deg] -translate-x-3 translate-y-1 p-3.5 flex flex-col justify-between transition-transform duration-500 z-10">
              <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 pb-1">
                <div className="w-16 h-1.5 bg-white/30 rounded-full" />
                <div className="w-11 h-1.5 bg-white/15 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* TÍTULO, SUBTÍTULO E INDICADOR DE PONTOS (EXATOS DA MAQUETA)   */}
      {/* ============================================================== */}
      <div className="space-y-1.5 pt-1 pb-4 text-left">
        <h1 className="text-[30px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
          {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#A1A1AA] leading-snug">
          {mode === 'login'
            ? 'Acesse sua conta e continue com a sua jornada na igreja.'
            : 'Faça parte da nossa igreja e tenha tudo em um só lugar.'}
        </p>

        {/* Indicador de 3 pontos do carrossel */}
        <div className="flex items-center gap-1.5 pt-2">
          {mode === 'login' ? (
            <>
              <span className="w-6 h-1.5 bg-white rounded-full transition-all duration-300" />
              <span className="w-1.5 h-1.5 bg-[#3F3F46] rounded-full transition-all duration-300" />
              <span className="w-1.5 h-1.5 bg-[#3F3F46] rounded-full transition-all duration-300" />
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 bg-[#3F3F46] rounded-full transition-all duration-300" />
              <span className="w-6 h-1.5 bg-white rounded-full transition-all duration-300" />
              <span className="w-1.5 h-1.5 bg-[#3F3F46] rounded-full transition-all duration-300" />
            </>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MENSAGENS DE NOTIFICAÇÃO E AVISOS                              */}
      {/* ============================================================== */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-[13px] flex flex-col gap-2 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-red-200">
              <span className="w-2 h-2 bg-red-400 rounded-full" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          {errorMessage.includes('espera de aprobación') && (
            <div className="pt-2 border-t border-red-500/20 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">Modo de testes ativo:</span>
              <button
                type="button"
                disabled={approvingDemo}
                onClick={() => handleApproveDemo(email)}
                className="px-3 py-1 bg-amber-400 text-black font-bold text-[11px] rounded-lg shadow-sm"
              >
                {approvingDemo ? 'Aprovando...' : '✓ Aprovar Conta Agora'}
              </button>
            </div>
          )}
        </div>
      )}

      {successNotice && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-[13px] flex items-start justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* FORMULÁRIO PRINCIPAL                                           */}
      {/* ============================================================== */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Campo "Nome completo" (Exclusivo do modo Registro) */}
        {mode === 'register' && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="block text-[13px] font-medium text-[#D4D4D8]">
              Nome completo
            </label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-[#A1A1AA] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full h-[56px] bg-[#18181B] hover:bg-[#202024] focus:bg-[#202024] border border-transparent focus:border-white/30 rounded-[16px] pl-12 pr-4 text-[16px] text-white placeholder-[#71717A] focus:outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Campo "E-mail" */}
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#D4D4D8]">
            E-mail
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-[#A1A1AA] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              className="w-full h-[56px] bg-[#18181B] hover:bg-[#202024] focus:bg-[#202024] border border-transparent focus:border-white/30 rounded-[16px] pl-12 pr-4 text-[16px] text-white placeholder-[#71717A] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Campo "Cidade / Filial" (Apenas no modo Registro) */}
        {mode === 'register' && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="block text-[13px] font-medium text-[#D4D4D8]">
              Sua Cidade / Filial ADM
            </label>
            <div className="relative">
              <Church className="w-5 h-5 text-[#A1A1AA] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={selectedCityWorkspaceId}
                onChange={(e) => setSelectedCityWorkspaceId(e.target.value)}
                className="w-full h-[56px] bg-[#18181B] hover:bg-[#202024] focus:bg-[#202024] border border-transparent focus:border-white/30 rounded-[16px] pl-12 pr-10 text-[15px] text-white focus:outline-none transition-all appearance-none cursor-pointer"
              >
                {cities.map((city) => (
                  <option
                    key={city.workspaceId}
                    value={city.workspaceId}
                    className="bg-[#18181B] text-white"
                  >
                    {city.city} — {city.churchName}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        )}

        {/* Campo "Senha" */}
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[#D4D4D8]">
            Senha
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-[#A1A1AA] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? 'Sua senha' : 'Crie uma senha'}
              className="w-full h-[56px] bg-[#18181B] hover:bg-[#202024] focus:bg-[#202024] border border-transparent focus:border-white/30 rounded-[16px] pl-12 pr-12 text-[16px] text-white placeholder-[#71717A] focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white p-1 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Link "Esqueceu sua senha?" (Apenas no Login, alinhado à direita) */}
        {mode === 'login' && (
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => {
                setRecoveryEmail(email || '');
                setRecoveryDocument('');
                setRecoveryPassword('');
                setRecoveryConfirmPassword('');
                setRecoveryError(null);
                setRecoverySuccess(null);
                setShowForgotPasswordModal(true);
              }}
              className="text-[13px] sm:text-[14px] font-medium text-white hover:underline cursor-pointer"
            >
              Esqueceu sua senha?
            </button>
          </div>
        )}

        {/* Checklist de Validação da Senha (Apenas no Registro) */}
        {mode === 'register' && (
          <div className="space-y-2 pt-1 pb-1 animate-fadeIn">
            <div className="flex items-center gap-2 text-[13px]">
              {passLength ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[#71717A] shrink-0" />
              )}
              <span
                className={
                  passLength
                    ? 'text-emerald-300 font-medium'
                    : 'text-[#A1A1AA]'
                }
              >
                Pelo menos 8 caracteres
              </span>
            </div>

            <div className="flex items-center gap-2 text-[13px]">
              {passAlphaNum ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[#71717A] shrink-0" />
              )}
              <span
                className={
                  passAlphaNum
                    ? 'text-emerald-300 font-medium'
                    : 'text-[#A1A1AA]'
                }
              >
                Uma letra e um número
              </span>
            </div>

            <div className="flex items-center gap-2 text-[13px]">
              {passSpecial ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[#71717A] shrink-0" />
              )}
              <span
                className={
                  passSpecial
                    ? 'text-emerald-300 font-medium'
                    : 'text-[#A1A1AA]'
                }
              >
                Um caractere especial (ex.: !@#)
              </span>
            </div>
          </div>
        )}

        {/* Botão Principal Branco Pill: "Entrar" ou "Criar conta" */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[56px] rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[17px] flex items-center justify-center shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Processando...</span>
              </span>
            ) : mode === 'login' ? (
              'Entrar'
            ) : (
              'Criar conta'
            )}
          </button>
        </div>

        {/* Divisor "ou" (Original do Mockup) */}
        <div className="relative flex items-center justify-center py-2">
          <div className="w-full border-t border-white/10" />
          <span className="absolute bg-[#101216] px-3 text-[13px] text-[#71717A] select-none">
            ou
          </span>
        </div>

        {/* Botões Sociais Apple & Google (Original do Mockup) */}
        <div className="hidden" style={{ display: 'none' }}>
          <button
            type="button"
            onClick={() => setErrorMessage('O login com Apple ID estará disponível em breve.')}
            className="h-[52px] rounded-2xl bg-[#18181B] hover:bg-[#222226] border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            title="Entrar com Apple"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.14.65-2.79 1.42-.58.67-1.09 1.77-.95 2.82 1.12.09 2.14-.51 2.78-1.29z"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setErrorMessage('O login com Google estará disponível em breve.')}
            className="h-[52px] rounded-2xl bg-[#18181B] hover:bg-[#222226] border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            title="Entrar com Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </button>
        </div>



        {/* Footer: Alternador entre Login e Cadastro */}
        <div className="pt-4 text-center">
          {mode === 'login' ? (
            <p className="text-[14px] text-[#A1A1AA]">
              Ainda não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className="font-bold text-white hover:underline cursor-pointer"
              >
                Cadastrar
              </button>
            </p>
          ) : (
            <p className="text-[14px] text-[#A1A1AA]">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className="font-bold text-white hover:underline cursor-pointer"
              >
                Entrar
              </button>
            </p>
          )}
        </div>
      </form>

      {/* ============================================================== */}
      {/* DRAWER / MODAL DE ATALHOS DE TESTE                             */}
      {/* ============================================================== */}
      {showDemoDrawer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#16181D] border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-[16px] font-bold text-white">
                  Contas de Teste Integradas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoDrawer(false)}
                className="text-[#A1A1AA] hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-[12px] text-[#A1A1AA] leading-relaxed">
              Toque em qualquer perfil para preencher instantaneamente e validar
              as telas de administração, pastoral ou membro:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('admin-madrid')}
                className="p-3 bg-[#1F222A] hover:bg-[#282C36] border border-purple-500/30 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-[10px] text-purple-400 font-bold uppercase">
                  PASTOR MADRID
                </div>
                <div className="text-[13px] font-semibold text-white">Pr. Carlos</div>
                <div className="text-[10px] text-neutral-400 font-mono">pastor.madrid@...</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('member-kaue')}
                className="p-3 bg-[#1F222A] hover:bg-[#282C36] border border-emerald-500/30 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-[10px] text-emerald-400 font-bold uppercase">
                  MEMBRO MADRID
                </div>
                <div className="text-[13px] font-semibold text-white">Kaue Barbosa</div>
                <div className="text-[10px] text-neutral-400 font-mono">kaue.barbosa2022@...</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('root')}
                className="p-3 bg-[#1F222A] hover:bg-[#282C36] border border-orange-500/30 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-[10px] text-orange-400 font-bold uppercase">
                  SUPERVISÃO ROOT
                </div>
                <div className="text-[13px] font-semibold text-white">Root Fantasma</div>
                <div className="text-[10px] text-neutral-400 font-mono">root@admadureira.org</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('admin-rio')}
                className="p-3 bg-[#1F222A] hover:bg-[#282C36] border border-white/10 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-[10px] text-[#A1A1AA] font-bold uppercase">
                  PASTOR RIO
                </div>
                <div className="text-[13px] font-semibold text-white">Pr. Vance</div>
                <div className="text-[10px] text-neutral-400 font-mono">admin@admadureira.org</div>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowDemoDrawer(false)}
                className="w-full h-[42px] bg-white/10 hover:bg-white/20 text-white rounded-xl text-[13px] font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL "ESQUECEU SUA SENHA?" COM VALIDAÇÃO CANÔNICA DE DOCUMENTO */}
      {/* ============================================================== */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="w-full max-w-md bg-black border-0 rounded-3xl p-6 sm:p-7 space-y-5 relative animate-fadeIn my-6"
            style={{ backgroundColor: '#000000', border: 'none' }}
          >
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute right-5 top-5 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {recoverySuccess ? (
              <div className="space-y-4 text-center py-2 animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-black border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-[20px] font-bold text-white tracking-tight">
                    Senha Atualizada com Sucesso!
                  </h3>
                  <p className="text-[13px] text-neutral-300 leading-relaxed max-w-xs mx-auto">
                    {recoverySuccess}
                  </p>
                </div>

                <div className="p-3.5 bg-black border border-emerald-500/30 rounded-2xl text-[12px] text-emerald-200/90 text-left flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-emerald-300">Aviso Canônico Enviado:</span>
                    <span>O Pastor Dirigente ({recoveryPastorName || 'Pastor Dirigente'}) e a Secretaria da sua filial foram notificados e o evento foi registrado na auditoria oficial.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEmail(recoveryEmail);
                    setPassword(recoveryPassword);
                    setShowForgotPasswordModal(false);
                    setRecoverySuccess(null);
                  }}
                  className="w-full h-[48px] rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-[15px] transition-all cursor-pointer shadow-lg active:scale-[0.98] mt-2"
                >
                  Concluir & Iniciar Sessão
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecoverPassword} className="space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-black border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                      Recuperação de Senha
                    </h3>
                    <p className="text-[11px] text-[#A1A1AA]">
                      Validação de documento oficial e aviso pastoral
                    </p>
                  </div>
                </div>

                <p className="text-[12px] text-neutral-300 leading-snug">
                  Por segurança canônica, informe seu e-mail e o número de documento oficial (DNI / NIE / CPF) cadastrado no seu expediente para redefinir a senha.
                </p>

                {recoveryError && (
                  <div className="p-3 rounded-xl bg-black border border-red-500/40 text-red-200 text-[12px] flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                    <span>{recoveryError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-neutral-300">
                    E-mail do Membro
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full h-[46px] bg-black border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-3.5 text-[14px] text-white placeholder-neutral-500 focus:outline-none transition-colors"
                      style={{ backgroundColor: '#000000' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[12px] font-medium text-neutral-300">
                      Nº de Documento (DNI / NIE / CPF)
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">Obrigatório</span>
                  </div>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={recoveryDocument}
                      onChange={(e) => setRecoveryDocument(e.target.value)}
                      placeholder="Ex: Y1234567X, 12345678A ou CPF"
                      className="w-full h-[46px] bg-black border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-3.5 text-[14px] text-white placeholder-neutral-500 focus:outline-none transition-colors font-mono"
                      style={{ backgroundColor: '#000000' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-neutral-300">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={recoveryPassword}
                      onChange={(e) => setRecoveryPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-[46px] bg-black border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-3.5 text-[14px] text-white placeholder-neutral-500 focus:outline-none transition-colors"
                      style={{ backgroundColor: '#000000' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-neutral-300">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={recoveryConfirmPassword}
                      onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full h-[46px] bg-black border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-3.5 text-[14px] text-white placeholder-neutral-500 focus:outline-none transition-colors"
                      style={{ backgroundColor: '#000000' }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-black rounded-xl border border-white/10 text-[11px] text-neutral-400 leading-snug flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Um aviso de segurança e registro canônico será enviado ao Pastor Dirigente e Administrador da Filial.</span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="flex-1 h-[44px] rounded-xl bg-black hover:bg-neutral-900 border border-white/15 text-neutral-300 font-medium text-[13px] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="flex-1 h-[44px] rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-[13px] transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {recoveryLoading ? 'Validando...' : 'Validar & Alterar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
