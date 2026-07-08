import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useGameState } from "@/hooks/useGameState";
import { useAuth } from "@/hooks/useAuth";
import { usePunishment } from "@/hooks/usePunishment";
import { LevelUpModal } from "@/components/LevelUpModal";
import { GameOverModal } from "@/components/GameOverModal";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AppHeader } from "@/components/AppHeader";
import { preloadAssets, preloadRoutes } from "@/lib/assetPreload";

import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

// Admin (lazy)
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/UsersPage"));
const AdminRoles = lazy(() => import("./pages/admin/RolesPage"));
const AdminAudit = lazy(() => import("./pages/admin/AuditLogsPage"));
const AdminSettings = lazy(() => import("./pages/admin/SettingsPage"));
const AdminPayments = lazy(() => import("./pages/admin/PaymentsPage"));
const AdminCrud = lazy(() => import("./pages/admin/CrudPage"));

// Lazy chunks — preloaded on idle after auth.
const Quests = lazy(() => import("./pages/Quests"));
const Gates = lazy(() => import("./pages/Gates"));
const Battle = lazy(() => import("./pages/Battle"));
const MonsterBattle = lazy(() => import("./pages/MonsterBattle"));
const Dungeon = lazy(() => import("./pages/Dungeon"));
const Abilities = lazy(() => import("./pages/Abilities"));
const Stats = lazy(() => import("./pages/Stats"));
const Achievements = lazy(() => import("./pages/Achievements"));
const GrandQuest = lazy(() => import("./pages/GrandQuest"));
const Market = lazy(() => import("./pages/Market"));
const Profile = lazy(() => import("./pages/Profile"));
const Penalty = lazy(() => import("./pages/Penalty"));

const LAZY_LOADERS = [
  () => import("./pages/Quests"),
  () => import("./pages/Gates"),
  () => import("./pages/Battle"),
  () => import("./pages/Dungeon"),
  () => import("./pages/Stats"),
  () => import("./pages/Market"),
  () => import("./pages/Profile"),
  () => import("./pages/Penalty"),
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const { gameState, levelUpInfo, dismissLevelUp, resetGame } = useGameState();
  const { user, loading: authLoading } = useAuth();
  const { active: punishmentActive, enforceDeadline } = usePunishment();
  const location = useLocation();
  const navigate = useNavigate();

  // Warm assets + lazy chunks once authed.
  useEffect(() => {
    preloadAssets();
    if (user) preloadRoutes(LAZY_LOADERS);
  }, [user]);

  // Global MP < 10 toast for quest/portal entry attempts
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ current?: number; required?: number }>).detail || {};
      toast.error('Mana منخفضة', {
        description: `تحتاج ${detail.required ?? 10} MP على الأقل لبدء أي مهمة أو دخول بوابة. (الحالي: ${Math.floor(detail.current ?? 0)})`,
      });
    };
    window.addEventListener('mp-too-low', handler);
    return () => window.removeEventListener('mp-too-low', handler);
  }, []);

  // Re-enforce deadline whenever the app regains visibility.
  useEffect(() => {
    if (!user) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') enforceDeadline();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [user, enforceDeadline]);

  // Force redirect to /penalty whenever punishment is active.
  useEffect(() => {
    if (!user) return;
    if (punishmentActive && location.pathname !== '/penalty') {
      navigate('/penalty', { replace: true });
    }
  }, [user, punishmentActive, location.pathname, navigate]);

  if (authLoading) {
    return <LoadingScreen fullScreen message="SETVOID" />;
  }

  const needsPassword = typeof window !== 'undefined' && localStorage.getItem('needsPassword') === 'true';
  if (!user || !gameState.isOnboarded || needsPassword) {
    return <Onboarding />;
  }

  return (
    <>
      <AppHeader />
      <Suspense fallback={<LoadingScreen fullScreen message="LOADING" />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/gates" element={<Gates />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/battle/monster" element={<MonsterBattle />} />
          <Route path="/dungeon" element={<Dungeon />} />
          <Route path="/abilities" element={<Abilities />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/grand-quest" element={<GrandQuest />} />
          <Route path="/market" element={<Market />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/penalty" element={<Penalty />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {levelUpInfo && (
        <LevelUpModal
          show={levelUpInfo.show}
          newLevel={levelUpInfo.newLevel}
          category={levelUpInfo.category}
          onDismiss={dismissLevelUp}
        />
      )}

      {gameState.hp <= 0 && (
        <GameOverModal show={true} onRestart={resetGame} />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
