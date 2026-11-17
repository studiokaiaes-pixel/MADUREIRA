import React, { useState, useEffect } from 'react';
import { api, getAuthToken } from './api';
import { NavSection, PreviewState, User, Workspace } from './types';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { RootConsole } from './components/RootConsole';
import { AdminDashboard } from './components/AdminDashboard';
import { PreviewBanner } from './components/PreviewBanner';
import { MemberPortal } from './components/MemberPortal';
import { Sidebar } from './components/Sidebar';
import { SecretaryDashboard } from './components/SecretaryDashboard';
import { MembersModule } from './components/MembersModule';
import { MemberDossierView } from './components/MemberDossierView';
import { DocumentationModule } from './components/DocumentationModule';
import { CongregationsModule } from './components/CongregationsModule';
import { DepartmentsModule } from './components/DepartmentsModule';
import { EventsModule } from './components/EventsModule';
import { CommunicationsModule } from './components/CommunicationsModule';
import { MemberRequestsModule } from './components/MemberRequestsModule';
import { CredentialsModule } from './components/CredentialsModule';
import { ReportsModule } from './components/ReportsModule';
import { AuditModule } from './components/AuditModule';
import { SettingsModule } from './components/SettingsModule';
import { PublicPortal } from './components/PublicPortal';
import { OnboardingExperience, OnboardingScreenId } from './components/OnboardingExperience';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>({
    isActive: false,
    targetAdminId: null,
    targetAdminName: null,
    targetWorkspace: null,
  });
  const [loading, setLoading] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isViewingPublicPortal, setIsViewingPublicPortal] = useState(false);
  const [guestView, setGuestView] = useState<'onboarding' | 'public_portal' | 'login'>('onboarding');
  const [onboardingScreen, setOnboardingScreen] = useState<OnboardingScreenId>(1);

  // Comprobar sesión al inicio
  useEffect(() => {
    const checkSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.fetchMe();
        setCurrentUser(res.user);
        if (res.workspace) {
          setCurrentWorkspace(res.workspace);
        }
        if (res.preview) {
          setPreviewState(res.preview);
        }
      } catch {
        // Token inválido o expirado
        try {
          await api.logout();
        } catch {
          // Ignorar
        }
        setCurrentUser(null);
        setCurrentWorkspace(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleAuthSuccess = (user: User, workspace?: Workspace) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    setIsViewingPublicPortal(false);
    setGuestView('onboarding');
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentWorkspace(null);
    setShowAuthModal(false);
    setIsViewingPublicPortal(false);
    setGuestView('onboarding');
    setPreviewState({
      isActive: false,
      targetAdminId: null,
      targetAdminName: null,
      targetWorkspace: null,
    });
  };

  const handleStartPreview = async (targetAdminId: string) => {
    try {
      const res = await api.startPreview(targetAdminId);
      let ws: Workspace | null = null;
      try {
        ws = await api.fetchAdminWorkspace();
      } catch {
        // fallback
      }
      setPreviewState({
        isActive: true,
        targetAdminId,
        targetAdminName: res.preview?.targetAdminName || 'Pastor Administrador',
        targetWorkspace: ws,
      });
    } catch (err: any) {
      alert(`Error al iniciar vista previa: ${err.message}`);
    }
  };

  const handleExitPreview = async () => {
    try {
      await api.stopPreview();
      setPreviewState({
        isActive: false,
        targetAdminId: null,
        targetAdminName: null,
        targetWorkspace: null,
      });
    } catch (err: any) {
      alert(`Error al salir de vista previa: ${err.message}`);
    }
  };

  // Estados para Navegación Eclesiástica
  const [currentSection, setCurrentSection] = useState<NavSection>('inicio');
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-xs font-mono tracking-[0.3em] uppercase text-neutral-400">
          INICIALIZANDO TERMINAL CRIPTOGRÁFICA...
        </div>
      </div>
    );
  }

  // 1. VISITANTE NO AUTENTICADO: Experiencia de Onboarding -> Acceso o Portal Público
  if (!currentUser) {
    if (guestView === 'onboarding') {
      return (
        <OnboardingExperience
          initialScreen={onboardingScreen}
          onEnterMemberPortal={() => {
            setOnboardingScreen(6);
            setGuestView('login');
          }}
          onEnterVisitorPortal={() => setGuestView('public_portal')}
        />
      );
    }

    if (guestView === 'login') {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
          {/* Header Institucional Integrado */}
          <header className="border-b border-white/[0.08] bg-black/85 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center p-1 overflow-hidden shadow-sm">
                  <img
                    src="/assets/aistudio/logo_madureira_white_transparent.png"
                    alt="Logo AD Madureira"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-bold text-[15px] tracking-tight text-white block">AD MADUREIRA</span>
                  <span className="text-[10px] font-mono text-[#8E8E93] tracking-wider uppercase block">
                    MINISTÉRIO DE MADUREIRA · CONAMAD
                  </span>
                </div>
              </div>

              <div className="hidden" style={{ display: 'none' }}>
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingScreen(6);
                    setGuestView('onboarding');
                  }}
                  className="text-[12px] font-medium text-[#A1A1AA] hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                >
                  ← Apresentação
                </button>
                <button
                  type="button"
                  onClick={() => setGuestView('public_portal')}
                  className="text-[12px] font-semibold text-white px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>🌐</span>
                  <span>Portal Público</span>
                </button>
              </div>
            </div>
          </header>

          {/* Conteúdo Centralizado Unificado — O modelo original exato */}
          <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center">
            <div
              className="w-full bg-black"
              style={{ backgroundColor: '#000000' }}
            >
              <AuthForm
                onAuthSuccess={handleAuthSuccess}
                onCancel={() => {
                  setOnboardingScreen(6);
                  setGuestView('onboarding');
                }}
                integratedWebMode={true}
              />
            </div>
          </main>

          {/* Rodapé Integrado */}
          <footer className="w-full border-t border-white/[0.08] py-5 px-6 text-center text-xs font-mono text-[#8E8E93] mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>Assembleia de Deus — Ministério de Madureira · Convenção Nacional CONAMAD</span>
              <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider">
                <span>Gestão Canônica</span>
                <span>·</span>
                <span>Credencial Criptográfica</span>
              </div>
            </div>
          </footer>
        </div>
      );
    }

    return (
      <PublicPortal
        currentUser={null}
        onOpenLogin={() => setGuestView('login')}
        onGoToDashboard={() => {}}
        onAuthSuccess={handleAuthSuccess}
        onViewOnboarding={() => setGuestView('onboarding')}
      />
    );
  }

  // 2. MODO PORTAL PÚBLICO PARA USUARIOS AUTENTICADOS (exploración como visitante)
  if (isViewingPublicPortal) {
    return (
      <PublicPortal
        currentUser={currentUser}
        onOpenLogin={() => {}}
        onGoToDashboard={() => setIsViewingPublicPortal(false)}
      />
    );
  }

  // 3. VISTA EXCLUSIVA DE MIEMBRO — Nunca accede a pantallas de administración
  if (currentUser?.role === 'member') {
    return (
      <MemberPortal
        currentUser={currentUser}
        onLogout={handleLogout}
        onViewPublicPortal={() => setIsViewingPublicPortal(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-100 flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Barra de Navegación Principal (Oculta para admin para dar protagonismo al formato exacto de la foto) */}
      {currentUser?.role !== 'admin' && (
        <Navbar
          user={currentUser}
          onLogout={handleLogout}
          onOpenCredentials={() => setShowDemoModal(true)}
          onViewPublicPortal={() => setIsViewingPublicPortal(true)}
        />
      )}

      {/* Banner de Modo Vista Previa / Impersonación cuando Root inspecciona un Admin */}
      {currentUser?.role === 'root' && previewState.isActive && (
        <PreviewBanner
          targetAdminName={previewState.targetAdminName}
          onExitPreview={handleExitPreview}
        />
      )}

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col">
        {!currentUser ? (
          // Vista de Autenticación
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        ) : currentUser.role === 'root' ? (
          // Consola Root exclusiva (o vista previa fantasma del admin)
          previewState.isActive ? (
            <AdminDashboard
              currentUser={currentUser}
              initialWorkspace={previewState.targetWorkspace || undefined}
              isPreviewMode={true}
              onLogout={handleLogout}
            />
          ) : (
            <RootConsole
              currentUser={currentUser}
              onStartPreview={handleStartPreview}
            />
          )
        ) : currentUser.role === 'admin' ? (
          // PANEL DEL PASTOR ADMINISTRADOR — FORMATO INTEGRADO MÓDULOS 07 A 17 (Foto de referencia)
          <AdminDashboard
            currentUser={currentUser}
            initialWorkspace={currentWorkspace || undefined}
            onLogout={handleLogout}
          />
        ) : (
          // Suite Modular Eclesiástica Unificada (con Menú Lateral)
          <div className="flex-1 flex min-h-[calc(100vh-130px)]">
            <Sidebar
              currentSection={currentSection}
              onSelectSection={(sec) => {
                setCurrentSection(sec);
                if (sec !== 'expedientes') setSelectedMemberId(null);
              }}
              currentUser={currentUser}
              onLogout={handleLogout}
            />

            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
              {currentSection === 'inicio' && (
                <SecretaryDashboard
                  currentUser={currentUser}
                  onNavigate={setCurrentSection}
                />
              )}

              {currentSection === 'miembros' && (
                <MembersModule
                  currentUser={currentUser}
                  onSelectMember={(id) => {
                    setSelectedMemberId(id);
                    setCurrentSection('expedientes');
                  }}
                />
              )}

              {currentSection === 'expedientes' && (
                <MemberDossierView
                  memberId={selectedMemberId || 1}
                  currentUser={currentUser}
                  onBack={() => setCurrentSection('miembros')}
                />
              )}

              {currentSection === 'documentacion' && (
                <DocumentationModule currentUser={currentUser} />
              )}

              {currentSection === 'congregaciones' && (
                <CongregationsModule currentUser={currentUser} />
              )}

              {currentSection === 'departamentos' && (
                <DepartmentsModule currentUser={currentUser} />
              )}

              {currentSection === 'eventos' && (
                <EventsModule currentUser={currentUser} />
              )}

              {currentSection === 'comunicaciones' && (
                <CommunicationsModule currentUser={currentUser} />
              )}

              {currentSection === 'atencion' && (
                <MemberRequestsModule currentUser={currentUser} />
              )}

              {currentSection === 'credenciales' && (
                <CredentialsModule currentUser={currentUser} />
              )}

              {currentSection === 'informes' && (
                <ReportsModule currentUser={currentUser} />
              )}

              {currentSection === 'auditoria' && (
                <AuditModule currentUser={currentUser} />
              )}

              {currentSection === 'gestion_filial' && (
                <AdminDashboard initialWorkspace={currentWorkspace || undefined} />
              )}

              {currentSection === 'configuracion' && (
                <SettingsModule currentUser={currentUser} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Minimalista de Lujo (Oculto para admin para no interferir con la barra de pestañas inferior de la foto) */}
      {currentUser?.role !== 'admin' && (
        <footer className="w-full border-t border-neutral-900/80 py-8 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="font-editorial text-white tracking-widest uppercase">AD MADUREIRA</span>
              <span>·</span>
              <span>ASSEMBLEIA DE DEUS · MINISTÉRIO DE MADUREIRA</span>
            </div>

            <div className="flex items-center gap-6 text-[11px] tracking-wider uppercase text-neutral-400">
              <span>CONAMAD</span>
              <span>SUPERVISÃO GERAL</span>
              <span>GESTÃO ECLESIÁSTICA</span>
            </div>
          </div>
        </footer>
      )}

      {/* Modal Guía Rápida de Credenciales */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-[20px] font-bold tracking-tight text-white">
                Credenciales de Acceso
              </h3>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-[#8E8E93] hover:text-white text-[13px] font-medium"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="p-4 bg-[#161618] border border-white/10 rounded-2xl space-y-1.5">
                <div className="text-white font-bold text-[14px] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full inline-block" />
                    Supervisão Geral (Root Fantasma)
                  </span>
                  <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-950/30 px-2 py-0.5 rounded-full border border-orange-500/30">
                    SIGILO
                  </span>
                </div>
                <div className="text-[#8E8E93]">
                  Email: <span className="text-white font-medium">root@admadureira.org</span>
                </div>
                <div className="text-[#8E8E93]">
                  Contraseña: <span className="text-white font-medium">root#master99</span>
                </div>
                <div className="text-[12px] text-neutral-400 pt-1 leading-relaxed">
                  Acceso exclusivo para aprovisionar pastores por ciudad e inspeccionar cualquier filial en vista previa.
                </div>
              </div>

              <div className="p-4 bg-[#161618] border border-white/10 rounded-2xl space-y-3">
                <div className="text-white font-bold text-[14px] flex items-center justify-between">
                  <span>Pastores Administradores por Sede</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full">
                    ADMIN
                  </span>
                </div>
                <div className="text-[#8E8E93] text-[12px] space-y-1.5 font-mono">
                  <div>📍 <strong className="text-white font-sans">Rio de Janeiro</strong>: admin@admadureira.org / admin12345</div>
                  <div>📍 <strong className="text-white font-sans">São Paulo</strong>: pastor.sp@admadureira.org / admin12345</div>
                  <div>📍 <strong className="text-white font-sans">Brasília</strong>: pastor.df@admadureira.org / admin12345</div>
                </div>
                <div className="text-[11px] text-neutral-400 pt-1 leading-relaxed">
                  Cada pastor gobierna su filial y puede designar o actualizar a su propio secretario.
                </div>
              </div>

              <div className="p-4 bg-[#161618] border border-emerald-500/20 rounded-2xl space-y-3">
                <div className="text-white font-bold text-[14px] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                    Secretarios Locales Independientes
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    SECRETARÍA
                  </span>
                </div>
                <div className="text-[#8E8E93] text-[12px] space-y-1.5 font-mono">
                  <div>📋 <strong className="text-white font-sans">Sec. Rio (Pb. Lucas)</strong>: secretario.rio@admadureira.org / sec12345</div>
                  <div>📋 <strong className="text-white font-sans">Sec. SP (Ev. Marcos)</strong>: secretario.sp@admadureira.org / sec12345</div>
                  <div>📋 <strong className="text-white font-sans">Sec. Brasília (Pb. Tiago)</strong>: secretario.df@admadureira.org / sec12345</div>
                </div>
                <div className="text-[11px] text-neutral-400 pt-1 leading-relaxed">
                  Cada secretario tiene acceso exclusivo e independiente a los registros y expedientes de su filial asignada.
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowDemoModal(false)}
                className="w-full h-[48px] text-[15px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-2xl transition-all shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
