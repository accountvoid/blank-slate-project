import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { BottomNav } from '@/components/BottomNav';
import { RadarChart } from '@/components/RadarChart';
import { HolographicProfile } from '@/components/HolographicProfile';
import { cn } from '@/lib/utils';
// استيراد المودالات الجديدة
import { ItemAnalysisModal } from '@/components/ItemAnalysisModal'; 
import { ItemUseModal } from '@/components/ItemUseModal';
import { XPResetModal } from '@/components/XPResetModal';
import { 
  Dumbbell, 
  Brain, 
  Heart, 
  Zap,
  Target,
  Coins,
  Package,
  X,
  ShieldAlert,
  Info,
  MapPin,
  ImageIcon,
  BarChart3,
  User,
  Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Stats = () => {
  const { t } = useTranslation();
  const { gameState, getXpProgress, useItem, equipTitle, unequipTitle, resetAndReallocateXP } = useGameState();
  const [activeTab, setActiveTab] = useState<'stats' | 'equipment' | 'body'>('stats');

  // حالات التحكم في المودالات الجديدة
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<import('@/types').InventoryItem | null>(null);

  const MAX_LEVEL = 100;

  const stats = [
    { category: 'strength' as const, level: gameState.levels.strength, xp: gameState.stats.strength, xpProgress: getXpProgress(gameState.stats.strength), name: 'STRENGTH', icon: <Dumbbell className="w-5 h-5" />, color: '#60a5fa' },
    { category: 'mind' as const, level: gameState.levels.mind, xp: gameState.stats.mind, xpProgress: getXpProgress(gameState.stats.mind), name: 'MIND', icon: <Brain className="w-5 h-5" />, color: '#60a5fa' },
    { category: 'spirit' as const, level: gameState.levels.spirit, xp: gameState.stats.spirit, xpProgress: getXpProgress(gameState.stats.spirit), name: 'SPIRIT', icon: <Heart className="w-5 h-5" />, color: '#60a5fa' },
    { category: 'agility' as const, level: gameState.levels.agility || 0, xp: gameState.stats.agility || 0, xpProgress: getXpProgress(gameState.stats.agility || 0), name: 'AGILITY', icon: <Zap className="w-5 h-5" />, color: '#60a5fa' },
  ];

  const radarStats = {
    strength: Math.min((gameState.levels.strength / MAX_LEVEL) * 100, 100),
    mind: Math.min((gameState.levels.mind / MAX_LEVEL) * 100, 100),
    spirit: Math.min((gameState.levels.spirit / MAX_LEVEL) * 100, 100),
    agility: Math.min(((gameState.levels.agility || 0) / MAX_LEVEL) * 100, 100),
  };

  const totalLevel = gameState.totalLevel;
  const levelConfig = totalLevel >= 40 ? { color: '#c084fc', tier: 'S-RANK' } : totalLevel >= 20 ? { color: '#60a5fa', tier: 'B-RANK' } : { color: '#ffffff', tier: 'E-RANK' };

  return (
    <div className="min-h-screen bg-[#020817] text-white p-3 font-sans selection:bg-blue-500/30 pb-24">
      {/* Modals Section */}
      {showAnalysis && (
        <ItemAnalysisModal 
          item={selectedItem} 
          onClose={() => setShowAnalysis(false)} 
        />
      )}
      
      {showUseModal && (
        <ItemUseModal 
          item={selectedItem}
          gameState={gameState}
          onClose={() => setShowUseModal(false)}
          onUseItem={(itemId, qty, statAlloc) => {
            useItem(itemId, qty, statAlloc);
          }}
          onEquipTitle={equipTitle}
          onAnalyze={() => {
            setShowUseModal(false);
            setShowAnalysis(true);
          }}
          onResetXP={() => {
            setShowUseModal(false);
            setShowResetModal(true);
          }}
        />
      )}

      {showResetModal && (
        <XPResetModal
          gameState={gameState}
          onClose={() => setShowResetModal(false)}
          onConfirm={(allocation) => {
            resetAndReallocateXP(allocation);
            setShowResetModal(false);
          }}
        />
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(29,78,216,0.15),transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />
      </div>

      <header className="relative z-10 flex justify-between items-center mb-6 border-b border-blue-500/30 pb-3">
        <h1 className="text-xl font-bold tracking-[0.1em] uppercase italic text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">{t('stats.playerStatus')}</h1>
        <div className="bg-blue-950/40 border border-blue-400/50 px-3 py-1 flex items-center gap-2">
          <Coins className="w-3.5 h-3.5 text-yellow-400" />
          <span className="font-mono font-bold text-blue-100 text-sm">{gameState.gold.toLocaleString()}</span>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto space-y-6">
        <div className="flex gap-2 mb-6">
          {[
            { key: 'stats', label: t('stats.abilities'), icon: Target },
            { key: 'equipment', label: t('stats.inventory'), icon: Package },
            { key: 'body', label: t('stats.body'), icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'stats' | 'equipment' | 'body')}
                className={cn(
                  "flex-1 py-2 border text-[10px] font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2",
                  activeTab === tab.key ? "bg-blue-500/20 border-blue-400 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-black/40 border-slate-700 text-slate-500"
                )}
              >
                <Icon className="w-3 h-3" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="relative bg-black/60 border-2 border-slate-200/90 p-6 shadow-[0_0_20px_rgba(30,58,138,0.3)] text-center">
              <div className="flex justify-center mb-6 mt-[-2.5rem]">
                <div className="border border-slate-400/50 px-6 py-1 bg-slate-900/90 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                  <h2 className="text-xs font-bold tracking-widest text-white uppercase italic">{t('stats.class')}: <span className="text-blue-400">{t('stats.shadowMonarch')}</span></h2>
                </div>
              </div>
              <div className="text-4xl font-black italic text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">LV. {totalLevel}</div>
              <div className="text-[10px] font-bold tracking-[0.4em] uppercase py-1 px-4 border-y border-white/20 mt-2 inline-block" style={{ color: levelConfig.color }}>{levelConfig.tier}</div>
            </div>
            <div className="bg-black/40 border border-blue-500/30 p-4"><div className="flex justify-center py-2"><RadarChart stats={radarStats} size={240} /></div></div>
            <div className="space-y-3">
              {stats.map((stat) => (
                <div key={stat.category} className="bg-black/60 border border-slate-700/50 p-3">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-3"><div className="text-blue-400 opacity-80">{stat.icon}</div><span className="text-xs font-bold tracking-tighter text-slate-300 uppercase">{stat.name}</span></div>
                    <span className="text-lg font-black italic text-white">{stat.level}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${stat.xpProgress}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {gameState.inventory.filter(i => i.quantity > 0).length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-800 opacity-50"><Package className="w-12 h-12 mx-auto mb-4 text-slate-600" /><p className="text-[10px] font-bold tracking-[0.3em] uppercase">{t('stats.inventoryEmpty')}</p></div>
            ) : (
              gameState.inventory.filter(i => i.quantity > 0).map((item, index) => (
                <div key={`${item.id}-${index}`} className="relative bg-black/60 border-2 border-slate-200/90 p-4 shadow-[0_0_20px_rgba(30,58,138,0.3)] transition-all">
                  <div className="flex justify-center mb-4 mt-[-1.5rem]">
                    <div className="border border-slate-400/50 px-4 py-0.5 bg-slate-900/90 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                      <h2 className="text-xs font-bold tracking-widest text-white uppercase italic">ITEM: <span className="text-blue-400">{item.name}</span></h2>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 border border-slate-500/50 flex items-center justify-center bg-black/40 relative flex-shrink-0">
                        {item.id === 'mana_meter' || item.name === 'Mana Gauge' ? (
                          <img src="/ManaDeviceIcon.png" alt="Mana Gauge" className="w-[150%] h-[150%] scale-125 object-contain filter brightness-110 drop-shadow-[0_0_10px_#3b82f6]" />
                        ) : (
                          <span className="text-4xl filter grayscale brightness-200 opacity-90 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">{item.icon || '📦'}</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center border-b border-white/10 pb-1"><p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">{t('stats.category')}:</p><p className="text-xs font-bold text-white italic uppercase">{item.category || item.type}</p></div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-1"><p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">{t('stats.quantity')}:</p><p className="text-xs font-bold text-blue-400 italic">x{item.quantity}</p></div>
                      </div>
                    </div>
                    <div className="bg-blue-950/20 border border-blue-500/20 p-2 min-h-[40px]"><p className="text-[10px] text-slate-300 italic text-center leading-tight">{item.description}</p></div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => { setSelectedItem(item); setShowAnalysis(true); }}
                        className="flex items-center justify-center gap-2 py-3 bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-cyan-900/50 transition-all active:scale-95"
                      >
                        <BarChart3 className="w-3 h-3" /> {t('stats.analysis')}
                      </button>
                      <button
                        onClick={() => { setSelectedItem(item); setShowUseModal(true); }}
                        className="flex items-center justify-center gap-2 py-3 bg-blue-600/20 border border-blue-400/50 text-blue-100 text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-blue-600/40 transition-all active:scale-95 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                      >
                        <Zap className="w-3 h-3 text-yellow-400" /> {t('stats.useItem')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'body' && (
          <div className="flex flex-col items-center justify-center py-20 border border-blue-500/20 bg-black/40 animate-in fade-in duration-500">
             <Lock className="w-12 h-12 text-blue-500/40 mb-4" />
             <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-blue-100">{t('stats.alphaLocked')}</h2>
             <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">{t('stats.alphaLockedSub')}</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Stats;
