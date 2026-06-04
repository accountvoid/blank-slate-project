import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useGameState } from "@/hooks/useGameState";
import { useAuth } from "@/hooks/useAuth";
import { LevelUpModal } from "@/components/LevelUpModal";
import { GameOverModal } from "@/components/GameOverModal";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AppHeader } from "@/components/AppHeader";

import Index from "./pages/Index";
import Quests from "./pages/Quests";
import Gates from "./pages/Gates";
import Battle from "./pages/Battle";
import MonsterBattle from "./pages/MonsterBattle";
import Dungeon from "./pages/Dungeon";
import Abilities from "./pages/Abilities";
import Stats from "./pages/Stats";
import Achievements from "./pages/Achievements";
import GrandQuest from "./pages/GrandQuest";
import Market from "./pages/Market";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import AuthCallback from "./pages/AuthCallback";
import Penalty from "./pages/Penalty";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { gameState, levelUpInfo, dismissLevelUp, resetGame } = useGameState();
  const { user, loading: authLoading } = useAuth();

  // Show loading splash while checking auth
  if (authLoading) {
    return <LoadingScreen fullScreen message="SETVOID" className="scale-150" />;
  }

  // If not authenticated, not onboarded, or needs password setup - show onboarding
  const needsPassword = typeof window !== 'undefined' && localStorage.getItem('needsPassword') === 'true';
  if (!user || !gameState.isOnboarded || needsPassword) {
    return <Onboarding />;
  }

  return (
    <>
      <AppHeader />
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
      
      
      {levelUpInfo && (
        <LevelUpModal
          show={levelUpInfo.show}
          newLevel={levelUpInfo.newLevel}
          category={levelUpInfo.category}
          onDismiss={dismissLevelUp}
        />
      )}
      
      {gameState.hp <= 0 && (
        <GameOverModal
          show={true}
          onRestart={resetGame}
        />
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
