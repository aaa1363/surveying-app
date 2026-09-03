import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { AuthScreen, AppTab, resolveAppTab } from './routes';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { authRepository, projectRepository } from '../repositories';
import { DemoBanner } from '../components/layout/DemoBanner';
import { AppHeader } from '../components/layout/AppHeader';
import { BottomNavigation, NavigationTab } from '../components/layout/BottomNavigation';
import { NotificationDrawer } from '../components/layout/NotificationDrawer';
import { LoadingState } from '../components/ui/LoadingState';

// Auth feature views
import { WelcomeView } from '../features/auth/WelcomeView';
import { LoginView } from '../features/auth/LoginView';
import { RegisterView } from '../features/auth/RegisterView';

// Dashboard & module views
import { SurveyorDashboard } from '../features/dashboard/SurveyorDashboard';
import { ProjectsView } from '../features/projects/ProjectsView';
import { canManageProjectDocuments } from '../features/documents/documentAccess';
import { NotFoundState, UnauthorizedState } from '../components/ui/RouteStates';
import { applyTheme, AppTheme, getTheme } from '../utils/theme';

const ClientPanelView = lazy(() => import('../features/client/ClientPanelView').then((module) => ({ default: module.ClientPanelView })));
const PersonalRatesView = lazy(() => import('../features/rates/PersonalRatesView').then((module) => ({ default: module.PersonalRatesView })));
const PricingView = lazy(() => import('../features/pricing/PricingView').then((module) => ({ default: module.PricingView })));
const DocumentsHubView = lazy(() => import('../features/documents/DocumentsHubView').then((module) => ({ default: module.DocumentsHubView })));
const ProfileView = lazy(() => import('../features/profile/ProfileView').then((module) => ({ default: module.ProfileView })));
const ModerationHubView = lazy(() => import('../features/moderation/ModerationHubView').then((module) => ({ default: module.ModerationHubView })));
const ValidationLabView = lazy(() => import('../features/validation-lab/ValidationLabView').then((module) => ({ default: module.ValidationLabView })));
const hub=(name:keyof typeof import('../features/hubs/NavigationHubs'))=>lazy(()=>import('../features/hubs/NavigationHubs').then(module=>({default:module[name] as React.ComponentType<any>})));
const ProjectHub=hub('ProjectHub'),PricingHub=hub('PricingHub'),DocumentsLandingHub=hub('DocumentsLandingHub'),ProfileHub=hub('ProfileHub'),ClientHomeHub=hub('ClientHomeHub'),ClientPricesHub=hub('ClientPricesHub'),AdminHub=hub('AdminHub'),LabHub=hub('LabHub');

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [pricingProjectId, setPricingProjectId] = useState<string | undefined>();
  const [documentsProjectId, setDocumentsProjectId] = useState<string | undefined>();
  const [subView, setSubView] = useState<string>('hub');
  const [theme, setThemeState] = useState<AppTheme>(()=>getTheme());
  const scrollPositions=useRef<Record<string,number>>({});

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Initialize and check persistent demo auth session
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(()=>{const onBack=()=>{const tab=(history.state?.tab||'home') as AppTab;setActiveTab(tab);setSubView('hub');requestAnimationFrame(()=>window.scrollTo({top:scrollPositions.current[tab]||0}));};addEventListener('popstate',onBack);return()=>removeEventListener('popstate',onBack);},[]);

  const navigateTab=(tab:NavigationTab)=>{scrollPositions.current[activeTab]=window.scrollY;history.pushState({tab},'',`#${tab}`);setActiveTab(tab);setSubView('hub');requestAnimationFrame(()=>window.scrollTo({top:scrollPositions.current[tab]||0}));};

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authRepository.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setActiveTab(resolveAppTab(location.hash,user.role));
          const notifs = await projectRepository.getNotifications(user.id);
          setNotifications(notifs);
        }
      } catch (e) {
        console.error('Failed to restore demo session:', e);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  const handleLoginSuccess = async () => {
    const user = await authRepository.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setActiveTab(resolveAppTab(location.hash,user.role));
      const notifs = await projectRepository.getNotifications(user.id);
      setNotifications(notifs);
    }
    if(!user)setActiveTab('home');
    setSubView('hub');
  };

  const handleLogout = async () => {
    await authRepository.logout();
    setCurrentUser(null);
    setAuthScreen('welcome');
    setActiveTab('home');
    setSubView('hub');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState message="در حال راه‌اندازی سامانه مدیریت پروژه‌های نقشه‌برداری..." />
      </div>
    );
  }

  // 1. Unauthenticated Auth Flow
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white" dir="rtl">
        <DemoBanner />

        <main className="flex-1 flex flex-col">
          {authScreen === 'welcome' && (
            <WelcomeView
              onGoToLogin={() => setAuthScreen('login')}
              onGoToRegister={() => setAuthScreen('register')}
            />
          )}

          {authScreen === 'login' && (
            <LoginView
              onSuccess={handleLoginSuccess}
              onGoToRegister={() => setAuthScreen('register')}
              onGoToWelcome={() => setAuthScreen('welcome')}
            />
          )}

          {authScreen === 'register' && (
            <RegisterView
              onSuccess={handleLoginSuccess}
              onGoToLogin={() => setAuthScreen('login')}
              onGoToWelcome={() => setAuthScreen('welcome')}
            />
          )}
        </main>
      </div>
    );
  }

  // 2. Authenticated Application Flow
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans selection:bg-teal-500 selection:text-white" dir="rtl">

      {/* Main Header */}
      <AppHeader
        user={currentUser}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto p-3 sm:p-6 pb-24 sm:pb-28 overflow-x-clip">
        <Suspense fallback={<LoadingState message="در حال بارگذاری بخش انتخاب‌شده..." className="py-20" />}>
        {currentUser.role === 'client' ? <>
          {activeTab==='home'&&<ClientHomeHub open={(view)=>{setActiveTab(view as AppTab);setSubView('hub');}}/>}
          {activeTab==='client_surveyors'&&<ClientPanelView clientUser={currentUser} initialSection="browse"/>}
          {activeTab==='client_prices'&&(subView==='details'?<ClientPanelView clientUser={currentUser} initialSection="browse"/>:<ClientPricesHub open={()=>setSubView('details')}/>) }
          {activeTab==='client_requests'&&<ClientPanelView clientUser={currentUser} initialSection="inquiries"/>}
          {activeTab==='profile'&&(subView==='details'?<ProfileView user={currentUser}/>:<ProfileHub open={()=>setSubView('details')}/>)}
          {!['home','client_surveyors','client_prices','client_requests','profile'].includes(activeTab)&&<UnauthorizedState/>}
        </> : <>
            {activeTab === 'home' && (
              <SurveyorDashboard
                user={currentUser}
                onNavigateToProjects={() => setActiveTab('projects')}
                onNavigateToRates={() => setActiveTab('rates')}
                onNavigateToPricing={(projectId) => { setPricingProjectId(projectId); setActiveTab('pricing'); }}
                onNavigateToDocuments={(projectId) => {
                  setDocumentsProjectId(projectId);
                  setActiveTab('documents');
                }}
                onNavigateToProfile={() => setActiveTab('profile')}
              />
            )}

            {activeTab === 'projects' && (subView==='hub'?<ProjectHub open={(view)=>setSubView(view)}/>: (
              <ProjectsView
                user={currentUser}
                onNavigateToPricing={() => setActiveTab('pricing')}
                initialCreateOpen={subView==='create'}
              />
            ))}

            {activeTab === 'rates' && <PersonalRatesView user={currentUser} />}

            {activeTab === 'pricing' && (subView==='hub'?<PricingHub open={(view)=>{if(view==='rates'){setActiveTab('rates');setSubView('details');}else if(view==='published'){setActiveTab('profile');setSubView('details');}else if(view==='costs'){setActiveTab('projects');setSubView('manage');}else setSubView('details');}}/>:
              <PricingView userId={currentUser.id} userName={currentUser.fullName} userRole={currentUser.role} initialProjectId={pricingProjectId} onNavigateToRates={() => setActiveTab('rates')} onNavigateToCosts={() => setActiveTab('projects')} onEditProjectServices={() => { setActiveTab('projects'); setSubView('manage'); }} onBackToDashboard={() => setActiveTab('home')} />
            )}

            {activeTab === 'documents' && (canManageProjectDocuments(currentUser.role, currentUser.id, currentUser.id)
              ? (subView==='hub'?<DocumentsLandingHub open={()=>setSubView('details')}/>:<DocumentsHubView user={currentUser} initialProjectId={documentsProjectId} />)
              : <UnauthorizedState />)}

            {activeTab === 'profile' && (subView==='hub'?<ProfileHub open={()=>setSubView('details')}/>:
              <ProfileView
                user={currentUser}
                onProfileUpdated={() => {
                  // Re-trigger any needed sync
                }}
              />
            )}

            {activeTab==='admin_management'&&(currentUser.role==='admin'?<AdminHub kind="management" open={(v)=>{setActiveTab(v as AppTab);setSubView('details');}} theme={theme} setTheme={setThemeState}/>:<UnauthorizedState/>)}
            {activeTab==='admin_tariffs'&&(currentUser.role==='admin'?<AdminHub kind="tariffs" open={(v)=>{setActiveTab(v as AppTab);setSubView('details');}} theme={theme} setTheme={setThemeState}/>:<UnauthorizedState/>)}
            {activeTab==='admin_settings'&&(currentUser.role==='admin'?<AdminHub kind="settings" open={()=>{}} theme={theme} setTheme={setThemeState}/>:<UnauthorizedState/>)}

            {activeTab === 'moderation' && (currentUser.role === 'admin'
              ? <ModerationHubView currentUser={currentUser} />
              : <UnauthorizedState />)}
            {activeTab === 'validation_lab' && (currentUser.role === 'admin'
              ? (subView==='hub'?<LabHub open={()=>setSubView('details')}/>:<ValidationLabView user={currentUser} />)
              : <UnauthorizedState />)}

            {!['home', 'projects', 'rates', 'pricing', 'documents', 'profile', 'moderation', 'validation_lab','admin_management','admin_tariffs','admin_settings'].includes(activeTab) && <NotFoundState />}
          </>}
        </Suspense>
      </main>

      {/* Bottom Navigation Tabs (for Surveyor & Admin) */}
      <BottomNavigation
          activeTab={activeTab}
          onTabChange={navigateTab}
          userRole={currentUser.role}
        />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />

    </div>
  );
}
