import { Link, useLocation } from 'react-router-dom';
import { AppLogo } from '@/components/LoadingScreen';
import { cn } from '@/lib/utils';
import BuyGold from '@/components/Buy_Gold';
import { useGameState } from '@/hooks/useGameState';

/**
 * Global SETVOID header — logo + live gold (with Buy Gold dialog).
 * Hidden on immersive screens (dungeon, battle, penalty, onboarding).
 */
const HIDDEN_PREFIXES = ['/dungeon', '/battle', '/penalty', '/onboarding', '/auth'];

export const AppHeader = () => {
  const { pathname } = useLocation();
  const { gameState } = useGameState();
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-primary/20 bg-card/85 backdrop-blur-xl',
        'flex items-center justify-between px-3 py-2'
      )}
    >
      <Link to="/" className="flex items-center">
        <AppLogo className="h-7 w-auto" />
      </Link>
      <BuyGold gold={Math.floor(gameState.gold ?? 0)} compact />
    </header>
  );
};
