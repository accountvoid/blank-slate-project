import { Link, useLocation } from 'react-router-dom';
import { AppLogo } from '@/components/LoadingScreen';
import { cn } from '@/lib/utils';

/**
 * Global SETVOID header — logo.
 * Hidden on immersive screens (dungeon, battle, penalty, onboarding).
 */
const HIDDEN_PREFIXES = ['/dungeon', '/battle', '/penalty', '/onboarding', '/auth'];

export const AppHeader = () => {
  const { pathname } = useLocation();
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-primary/20 bg-card/85 backdrop-blur-xl',
        'flex items-center justify-center px-3 py-2'
      )}
    >
      <Link to="/" className="flex items-center">
        <AppLogo className="h-7 w-auto" />
      </Link>
    </header>
  );
};
