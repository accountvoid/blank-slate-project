import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronRight, User, ShoppingBag, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '@/components/LoadingScreen';
import { cn } from '@/lib/utils';
import BuyGold from '@/components/Buy_Gold';
import { useGameState } from '@/hooks/useGameState';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Global SETVOID header — burger menu (left), logo (center), gold (right).
 * Hidden on immersive screens.
 */
const HIDDEN_PREFIXES = ['/dungeon', '/battle', '/penalty', '/onboarding', '/auth'];

export const AppHeader = () => {
  const { pathname } = useLocation();
  const { gameState } = useGameState();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const menuItems = [
    { key: 'profile',   label: t('nav.profile'),   labelEn: 'Profile',   icon: User,        color: 'text-blue-400',   borderColor: 'border-blue-500/40',   bgColor: 'bg-blue-500/10',   path: '/profile' },
    { key: 'market',    label: t('nav.market'),    labelEn: 'Market',    icon: ShoppingBag, color: 'text-yellow-400', borderColor: 'border-yellow-500/40', bgColor: 'bg-yellow-500/10', path: '/market' },
    { key: 'abilities', label: t('nav.abilities'), labelEn: 'Abilities', icon: Zap,         color: 'text-purple-400', borderColor: 'border-purple-500/40', bgColor: 'bg-purple-500/10', path: '/abilities' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-primary/20 bg-card/85 backdrop-blur-xl',
        'flex items-center justify-between gap-2 px-3 py-2'
      )}
    >
      {/* Burger menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <button
            className="rounded-lg p-2 transition-all hover:bg-primary/10"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-primary" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 border-l border-primary/30 bg-card/95 p-0">
          <SheetHeader className="border-b border-primary/20 p-4">
            <SheetTitle className="text-right text-sm font-bold uppercase tracking-[0.15em] text-primary">
              {t('index.menuTitle')}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 p-3">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg border p-3 transition-all hover:scale-[1.02]',
                      item.borderColor,
                      item.bgColor
                    )}
                  >
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', item.borderColor, item.bgColor)}>
                      <Icon className={cn('h-5 w-5', item.color)} />
                    </div>
                    <div className="flex-1 text-right">
                      <p className={cn('text-sm font-bold', item.color)}>{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.labelEn}</p>
                    </div>
                    <ChevronRight className={cn('h-4 w-4 rotate-180', item.color)} />
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="absolute bottom-0 left-0 right-0 border-t border-primary/20 bg-card/90 p-3">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">{t('common.totalLevel')}</p>
              <p className="text-2xl font-black text-primary">{gameState.totalLevel}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logo (center) */}
      <Link to="/" className="flex items-center">
        <AppLogo className="h-7 w-auto" />
      </Link>

      {/* Gold (right) */}
      <BuyGold gold={Math.floor(gameState.gold ?? 0)} compact />
    </header>
  );
};
