import { useLocation, Link } from 'react-router-dom';
import { User, Swords, Target, BarChart3, Scroll } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: User, label: t('nav.home') },
    { path: '/quests', icon: Scroll, label: t('nav.quests') },
    { path: '/gates', icon: Swords, label: t('nav.gates') },
    { path: '/stats', icon: BarChart3, label: t('nav.stats') },
    { path: '/grand-quest', icon: Target, label: t('nav.grandQuest') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" style={{ top: '-20px' }} />
      
      <div className="relative border-t border-primary/20 bg-card/90 backdrop-blur-xl">
        {/* Top glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active background glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20" />
                )}
                
                {/* Icon container */}
                <div className={cn(
                  "relative z-10 transition-all duration-300",
                  isActive && "animate-float"
                )}>
                  <Icon 
                    className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive && "drop-shadow-[0_0_10px_hsl(200,100%,60%)]"
                    )} 
                  />
                  
                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                
                <span className={cn(
                  "relative z-10 text-[10px] font-medium transition-all",
                  isActive && "font-bold"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};