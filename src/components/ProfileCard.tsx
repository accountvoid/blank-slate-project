import { useState } from 'react';
import { Dumbbell, Brain, Heart, Flame, Shield, Zap, Bell, Smartphone } from 'lucide-react';
import { GameState, Gate } from '@/types/game';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { NewGateNotification } from './NewGateNotification';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { getRankFromLevel } from '@/lib/ranks';
 
interface ProfileCardProps {
  gameState: GameState;
  getXpProgress: (xp: number) => number;
  onUpdateProfile?: (name: string, title: string) => void;
}

const stats = [
  { key: 'strength', label: 'STR', icon: Dumbbell, color: 'text-cyan-400' },
  { key: 'mind', label: 'INT', icon: Brain, color: 'text-cyan-400' },
  { key: 'spirit', label: 'SPR', icon: Heart, color: 'text-cyan-400' },
  { key: 'agility', label: 'AGI', icon: Zap, color: 'text-cyan-400' },
] as const;

export const ProfileCard = ({ gameState, getXpProgress }: ProfileCardProps) => {
  const { t } = useTranslation();
  const [showTestGateNotif, setShowTestGateNotif] = useState(false);
  const [testGate, setTestGate] = useState<Gate | null>(null);
  const { permission, isSupported, requestPermission } = usePushNotifications();
  
  const totalLevel = gameState.totalLevel;
  const hpPercentage = Math.min(100, Math.max(0, (gameState.hp / gameState.maxHp) * 100));
  const energyPercentage = Math.min(100, Math.max(0, (gameState.energy / gameState.maxEnergy) * 100));

  return (
    <div 
      className="relative flex flex-col bg-slate-950 border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] isolation-isolate"
      style={{ willChange: 'transform' }}
    >
      {/* الشعار بتنسيق أفضل */}
      <div className="flex justify-center pt-6 pb-4 bg-cyan-950/20">
         <img 
            src="/src/assets/SETVOIDUI.png" 
            alt="Logo" 
            className="h-12 w-auto drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" 
         />
      </div>

      <div className="p-6 text-white">
        {/* معلومات اللاعب */}
        <div className="flex items-center justify-between mb-6 border-b border-cyan-500/30 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 tracking-wider">{gameState.playerName}</h2>
            <p className="text-sm text-white/70">{gameState.equippedTitle || 'No Title'}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-white">{totalLevel}</div>
            <div className="text-[10px] text-cyan-400 uppercase tracking-widest">Level</div>
          </div>
        </div>

        {/* الـ Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-cyan-100">
              <span>HP</span>
              <span>{Math.round(gameState.hp)}/{gameState.maxHp}</span>
            </div>
            <div className="h-2 bg-slate-800 border border-cyan-500/50">
              <div className="h-full bg-cyan-500" style={{ width: `${hpPercentage}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-cyan-100">
              <span>ENERGY</span>
              <span>{Math.round(gameState.energy)}/{gameState.maxEnergy}</span>
            </div>
            <div className="h-2 bg-slate-800 border border-cyan-500/50">
              <div className="h-full bg-cyan-500" style={{ width: `${energyPercentage}%` }} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const level = gameState.levels[stat.key];
            const progress = getXpProgress(gameState.stats[stat.key]);

            return (
              <div key={stat.key} className="p-3 bg-slate-900 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span className="text-lg font-bold text-white">{level}</span>
                </div>
                <div className="h-1.5 bg-slate-800">
                  <div className="h-full bg-cyan-400" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
