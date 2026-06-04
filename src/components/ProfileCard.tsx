import { useState } from 'react';
import { Dumbbell, Brain, Heart, Flame, Shield, Zap, Bell, Smartphone } from 'lucide-react';
import { GameState, Gate } from '@/types/game';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

import { NewGateNotification } from './NewGateNotification';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { getRankFromLevel } from '@/lib/ranks';

interface ProfileCardProps {
  gameState: GameState;
  getXpProgress: (xp: number) => number;
  onUpdateProfile?: (name: string, title: string) => void;
}

const getRankColor = (totalLevel: number) => {
  const rank = getRankFromLevel(totalLevel);
  return { border: rank.border, bg: rank.bg, glow: `shadow-${rank.text.replace('text-', '')}/50`, text: rank.text, rankName: rank.name };
};

const stats = [
  { key: 'strength', label: 'STR', icon: Dumbbell, color: 'text-strength' },
  { key: 'mind', label: 'INT', icon: Brain, color: 'text-mind' },
  { key: 'spirit', label: 'SPR', icon: Heart, color: 'text-spirit' },
  { key: 'agility', label: 'AGI', icon: Zap, color: 'text-agility' },
] as const;

export const ProfileCard = ({ gameState, getXpProgress, onUpdateProfile }: ProfileCardProps) => {
  const { t } = useTranslation();
  const [showTestGateNotif, setShowTestGateNotif] = useState(false);
  const [testGate, setTestGate] = useState<Gate | null>(null);
  const { 
    permission, 
    isSupported, 
    requestPermission, 
  } = usePushNotifications();
  
  const totalLevel = gameState.totalLevel;
  const todayQuests = gameState.quests.filter(q => q.completed && q.isMainQuest !== false).length;
  const totalQuests = gameState.quests.filter(q => q.isMainQuest !== false).length;
  const rankColor = getRankColor(totalLevel);
  const hpPercentage = Math.min(100, Math.max(0, (gameState.hp / gameState.maxHp) * 100));
  const energyPercentage = Math.min(100, Math.max(0, (gameState.energy / gameState.maxEnergy) * 100));

  return (
    <>
      <div className={cn("profile-card relative flex flex-col", rankColor.border, totalLevel >= 50 && "shadow-2xl")}>
        <div className="corner-decoration corner-tl" />
        <div className="corner-decoration corner-tr" />
        <div className="corner-decoration corner-bl" />
        <div className="corner-decoration corner-br" />
        
        <div className="scan-line" />

        {/* الشعار في الأعلى */}
        <div className="flex justify-center pt-4 pb-2">
           <img src="/src/assets/SETVOIDUI.png" alt="Logo" className="h-8 w-auto" />
        </div>

        <div className="status-header">
          <h2>{t('profile.title')}</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-6 mb-4">
            <div className="flex-1 flex flex-col gap-1 text-right" dir="rtl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-primary/70 font-bold">{t('common.name')}:</span>
                <span className="font-semibold text-sm">{gameState.playerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-primary/70 font-bold">{t('common.rank')}:</span>
                <span className={cn("font-bold text-sm", rankColor.text)}>{rankColor.rankName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-primary/70 font-bold">{t('common.title')}:</span>
                <span className="text-sm text-primary truncate max-w-[100px]">
                  {gameState.equippedTitle || '-'}
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className={cn("text-5xl font-bold glow-text", rankColor.text)}>{totalLevel}</div>
              <div className="text-[10px] text-muted-foreground tracking-widest font-bold">{t('common.level')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-destructive" />
                  <span className="text-xs">{t('common.hp')}</span>
                </div>
                <span className="text-xs font-bold">{Math.round(gameState.hp)}/{gameState.maxHp}</span>
              </div>
              <div className="stats-bar h-3">
                <div className="stats-bar-fill bg-destructive" style={{ width: `${hpPercentage}%` }} />
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-secondary" />
                  <span className="text-xs">{t('common.energy')}</span>
                </div>
                <span className="text-xs font-bold">{Math.round(gameState.energy)}/{gameState.maxEnergy}</span>
              </div>
              <div className="stats-bar h-3">
                <div className="stats-bar-fill bg-secondary" style={{ width: `${energyPercentage}%` }} />
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mb-4" />

          <div className="flex items-center justify-around mb-4 py-3 rounded-lg bg-card/50 border border-primary/20">
            <div className="text-center">
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <div className="text-lg font-bold">{gameState.streakDays}</div>
              <div className="text-[10px] text-muted-foreground">{t('common.streakDay')}</div>
            </div>
            <div className="w-px h-10 bg-primary/30" />
            <div className="text-center">
              <div className="text-lg font-bold">{todayQuests}/{totalQuests}</div>
              <div className="text-[10px] text-muted-foreground">{t('common.questDay')}</div>
            </div>
            <div className="w-px h-10 bg-primary/30" />
            <div className="text-center">
              <div className="text-lg font-bold text-secondary">{gameState.gold || 0}</div>
              <div className="text-[10px] text-muted-foreground">{t('common.gold')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const level = gameState.levels[stat.key];
              const xp = gameState.stats[stat.key];
              const progress = getXpProgress(xp);

              return (
                <div key={stat.key} className="flex items-center gap-3 p-3 rounded-lg bg-card/30 border border-primary/10 overflow-hidden">
                  <Icon className={cn('w-5 h-5 shrink-0', stat.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn('text-sm font-bold', stat.color)}>{stat.label}</span>
                      <span className="stat-value text-sm">{level}</span>
                    </div>
                    <div className="stats-bar h-2">
                      <div className={cn('stats-bar-fill', stat.color.replace('text-', 'bg-'))} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isSupported && (
            <div className="mt-4 p-3 bg-card/50 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  إشعارات النظام
                </h4>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  permission === 'granted' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                )}>
                  {permission === 'granted' ? 'مفعلة' : 'غير مفعّلة'}
                </span>
              </div>
              
              {permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  className="w-full p-2 text-xs bg-primary/10 border border-primary/30 text-primary rounded hover:bg-primary/20 font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {permission === 'denied' ? 'فعّل من إعدادات المتصفح' : 'تفعيل إشعارات الهاتف'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <NewGateNotification
        show={showTestGateNotif}
        gate={testGate}
        onClose={() => setShowTestGateNotif(false)}
      />
    </>
  );
};
