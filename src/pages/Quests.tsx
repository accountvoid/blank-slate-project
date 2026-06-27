import { useGameState } from '@/hooks/useGameState';
import { useProfile } from '@/hooks/useProfile';
import { BottomNav } from '@/components/BottomNav';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useState, useEffect } from 'react';
import { Dumbbell, Brain, Heart, Zap, Target, CheckCircle2, Clock, Scroll, X, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { Quest, StatType } from '@/types';
import { useAds, type AdCategory } from '@/hooks/useAds';
import { SponsoredMissionCard } from '@/components/ads/SponsoredMissionCard';

type QuestTab = 'all' | StatType;

// Maps the in-game StatType to the ad category enum
const STAT_TO_AD_CATEGORY: Record<StatType, AdCategory> = {
  strength: 'strength',
  mind: 'mind',
  spirit: 'spirit',
  agility: 'agility',
};

const Quests = () => {
  const { gameState, startSideQuest, claimSideQuest, closeSideQuest } = useGameState();
  const { loading: profileLoading } = useProfile();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<QuestTab>('all');

  // --- Modal Logic with New Animation ---
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Track quests being claimed with animation
  const [claimingQuests, setClaimingQuests] = useState<Set<string>>(new Set());

  // Sponsored missions from Supabase (filtered by current tab category)
  const adCategory: AdCategory | undefined =
    activeTab === 'all' ? undefined : STAT_TO_AD_CATEGORY[activeTab as StatType];
  const { ads: sponsoredAds } = useAds({ type: 'sponsored_mission', category: adCategory });

  const handleOpenDetails = (quest: Quest) => {
    setSelectedQuest(quest);
    setTimeout(() => setIsVisible(true), 50);
  };

  const handleCloseModal = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      setSelectedQuest(null);
    }, 800);
  };

  const handleConfirmStart = () => {
    if (selectedQuest) {
      startSideQuest(selectedQuest.id);
      toast({
        title: t('quests.questInitialized'),
        description: t('quests.initialized'),
      });
      handleCloseModal();
    }
  };

  const handleClaim = (questId: string) => {
    // Add to claiming set for animation
    setClaimingQuests(prev => new Set([...prev, questId]));
    
    // Wait for animation then claim
    setTimeout(() => {
      claimSideQuest(questId);
      toast({
        title: t('quests.rewardsClaimed'),
        description: t('quests.rewardsClaimedDesc'),
      });
    }, 800);
  };

  // Filter out claimed quests and those being claimed
  const sideQuests = gameState.quests.filter(q => 
    q.isMainQuest === false && 
    !q.claimed && 
    !claimingQuests.has(q.id)
  );
  
  const getFilteredQuests = () => activeTab === 'all' ? sideQuests : sideQuests.filter(q => q.category === activeTab);
  
  const tabs = [
    { id: 'all', label: t('quests.title'), icon: Scroll },
    { id: 'strength', label: 'STR', icon: Dumbbell },
    { id: 'mind', label: 'INT', icon: Brain },
    { id: 'spirit', label: 'SPR', icon: Heart },
    { id: 'agility', label: 'AGI', icon: Zap },
  ];

  if (profileLoading) {
    return <LoadingScreen fullScreen message="QUESTS" />;
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white p-3 font-sans pb-24">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(29,78,216,0.15),transparent_70%)]" />
      </div>

      {/* --- New Animated Quest Detail Modal --- */}
      {selectedQuest && (
        <div className={cn(
          "fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-[1000ms]",
          isVisible && !isExiting ? "bg-black/80" : "bg-black/0 pointer-events-none"
        )}>
          <div className={cn(
            "relative max-w-sm w-full bg-[#050b18] border-x border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.2)] transition-all ease-[cubic-bezier(0.2,1,0.2,1)]",
            isVisible && !isExiting ? "opacity-100 scale-y-100 duration-[1200ms]" : "opacity-0 scale-y-0 duration-[800ms]",
            "origin-center"
          )}>
            {/* خطوط التوهج العلوي والسفلي */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-[1px] bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)] transition-all duration-[1200ms] delay-300",
              isVisible && !isExiting ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
            )} />
            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-[1px] bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)] transition-all duration-[1200ms] delay-300",
              isVisible && !isExiting ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
            )} />

            {/* محتوى المهمة */}
            <div className={cn(
              "p-6 space-y-5 transition-all duration-1000 delay-500",
              isVisible && !isExiting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <div className="text-center">
                <span className="text-[10px] font-black tracking-[0.4em] text-blue-500/60 uppercase">{t('quests.missionBriefing')}</span>
              </div>

              <div className="w-full border border-blue-500/30 p-4 bg-blue-950/20 relative">
                <div className="absolute top-0 right-0 p-1"><ShieldAlert className="w-4 h-4 text-blue-500/40" /></div>
                <div className="mb-3 border-b border-blue-500/20 pb-2">
                  <span className="text-[9px] text-blue-400 block mb-1 uppercase font-bold">{t('quests.designation')}:</span>
                  <span className="text-sm font-bold text-white tracking-widest uppercase italic">{selectedQuest.title}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-blue-400 block mb-1">{t('quests.type')}:</span>
                    <span className="text-xs font-bold text-white">{selectedQuest.category.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-blue-400 block mb-1">{t('quests.limit')}:</span>
                    <span className="text-xs font-bold text-blue-300">{selectedQuest.requiredTime || 10}M</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-blue-900/30 p-3 italic text-[10px] text-slate-300 leading-relaxed">
                {selectedQuest.description}
              </div>

              <div className="border-l-2 border-yellow-500 bg-yellow-500/5 p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-yellow-500 uppercase">{t('quests.rewardGold')}:</span>
                  <span className="text-xs font-bold text-yellow-400 tracking-widest">{selectedQuest.goldReward || 25} G</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-400 uppercase">{t('quests.rewardXp')}:</span>
                  <span className="text-xs font-bold text-blue-300 tracking-widest">+{selectedQuest.xpReward} XP</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={handleCloseModal} className="py-3 border border-slate-700 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-red-400 hover:border-red-400/50 transition-all">
                  {t('quests.abort')}
                </button>
                <button onClick={handleConfirmStart} className="py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-all">
                  {t('quests.initialize')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Main UI Content --- */}
      <header className="relative z-10 flex flex-col items-center mb-6 border-b border-blue-500/30 pb-4">
        <h1 className="text-xl font-bold tracking-[0.2em] uppercase italic text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{t('quests.sideQuests')}</h1>
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-blue-400 uppercase mt-2">
          <CheckCircle2 className="w-3 h-3" />
          <span>{t('quests.available')}: {sideQuests.filter(q => !q.completed).length} / {sideQuests.length}</span>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto space-y-8">
        <div className="flex gap-1 p-1 bg-black/40 border border-slate-800 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as QuestTab)} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-md transition-all whitespace-nowrap", activeTab === tab.id ? "bg-white/10 text-white border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]" : "text-slate-500")}>
              <tab.icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-12">
          {getFilteredQuests().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-slate-400 text-sm">{t('quests.empty.title', 'No quests available')}</p>
              <p className="text-slate-500 text-xs mt-1">{t('quests.empty.subtitle', 'You completed all quests!')}</p>
            </div>
          ) : (
            getFilteredQuests().map((quest) => {
              const isClaiming = claimingQuests.has(quest.id);
              const progressPercent = quest.requiredTime 
                ? Math.min(100, ((quest.timeProgress || 0) / (quest.requiredTime * 60)) * 100)
                : 0;
              
              return (
                <div 
                  key={quest.id} 
                  className={cn(
                    "relative group transition-all duration-700",
                    isClaiming && "opacity-0 scale-y-0 origin-center"
                  )}
                >
                  <div className="relative bg-black/60 border-2 border-slate-200/90 p-4 shadow-[0_0_20px_rgba(30,58,138,0.3)]">
                    <div className="flex justify-center mb-4 mt-[-1.5rem]">
                      <div className="border border-slate-400/50 px-4 py-0.5 bg-slate-900/90">
                        <h2 className="text-[10px] font-bold tracking-widest text-white uppercase italic">{t('quests.title').toUpperCase()}: {quest.title}</h2>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 border border-slate-500/50 flex items-center justify-center bg-black/40">
                          <div className="text-3xl grayscale brightness-200 opacity-80 drop-shadow-[0_0_10px_white]">
                            {quest.category === 'strength' ? <Dumbbell /> : quest.category === 'mind' ? <Brain /> : quest.category === 'spirit' ? <Heart /> : <Zap />}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center border-b border-white/10 pb-1">
                            <span className="text-[9px] text-slate-400 uppercase font-bold">{t('quests.reward')}:</span>
                            <div className="flex gap-2">
                              <span className="text-xs font-bold text-yellow-400">+{quest.goldReward || 25} G</span>
                              <span className="text-xs font-bold text-blue-300">+{quest.xpReward} XP</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/10 pb-1">
                            <span className="text-[9px] text-slate-400 uppercase font-bold">{t('quests.status')}:</span>
                            <span className={cn("text-[9px] font-bold uppercase", quest.active ? "text-blue-400 animate-pulse" : quest.completed && !quest.claimed ? "text-green-400" : "text-slate-500")}>
                              {quest.active ? t('quests.inProgress') : quest.completed && !quest.claimed ? t('quests.readyToClaim') : t('quests.statusAvailable')}
                            </span>
                          </div>
                          {(quest.active || quest.completed) && quest.requiredTime && (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-400 uppercase font-bold">{t('quests.progress')}:</span>
                                <span className="text-[9px] font-bold text-blue-300">
                                  {Math.floor((quest.timeProgress || 0) / 60)}m / {quest.requiredTime}m
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full transition-all duration-300 rounded-full",
                                    quest.completed ? "bg-green-500" : "bg-blue-500"
                                  )}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => quest.completed && !quest.claimed ? handleClaim(quest.id) : handleOpenDetails(quest)}
                        disabled={quest.active}
                        className={cn(
                          "w-full py-2 text-[10px] font-bold tracking-[0.2em] uppercase border transition-all",
                          quest.active ? "bg-slate-900 border-blue-500/20 text-blue-900" : 
                          quest.completed && !quest.claimed ? "bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30" :
                          "bg-blue-500/10 border-blue-500/40 text-blue-300 hover:bg-blue-500/20"
                        )}
                      >
                        {quest.active ? t('quests.processing') : quest.completed && !quest.claimed ? `✓ ${t('quests.claimReward')}` : t('quests.initializeQuest')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Quests;
