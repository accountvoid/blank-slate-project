import { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { ProfileCard } from '@/components/ProfileCard';
import { SoloLevelingQuestCard } from '@/features/quests/SoloLevelingQuestCard';
import { PrayerQuestModal } from '@/features/quests/PrayerQuestModal';
import { SystemNotification } from '@/components/SystemNotification';
import { LevelUpModal } from '@/components/LevelUpModal';
import { MaxLevelModal } from '@/components/MaxLevelModal';
import { GateDiscoveryNotification } from '@/components/GateDiscoveryNotification';
import { NewGateNotification } from '@/components/NewGateNotification';
import { BottomNav } from '@/components/BottomNav';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Menu, User, ShoppingBag, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatType, Gate } from '@/types/game';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ScrollArea } from '@/components/ui/scroll-area';



const Index = () => {
  const navigate = useNavigate();
  const {
    gameState, 
    levelUpInfo,
    dismissLevelUp,
    getXpProgress, 
    completeQuest, 
    updatePlayerInfo,
    completePrayerQuest,
    useAbility,
    startSideQuest,
    updateSideQuestProgress,
    failQuest,
  } = useGameState();
  const { playQuestComplete, playUseAbility } = useSoundEffects();
  const [activePrayerQuest, setActivePrayerQuest] = useState<string | null>(null);
  const [showNewQuestNotification, setShowNewQuestNotification] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [showMaxLevelModal, setShowMaxLevelModal] = useState(false);
  const [showGateNotification, setShowGateNotification] = useState(false);
  const [discoveredGate, setDiscoveredGate] = useState<Gate | null>(null);
  const [showNewGateNotification, setShowNewGateNotification] = useState(false);
  const [newGate, setNewGate] = useState<Gate | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { key: 'profile', label: 'البروفايل', labelEn: 'Profile', icon: User, color: 'text-blue-400', borderColor: 'border-blue-500/40', bgColor: 'bg-blue-500/10', path: '/profile' },
    { key: 'market', label: 'السوق', labelEn: 'Market', icon: ShoppingBag, color: 'text-yellow-400', borderColor: 'border-yellow-500/40', bgColor: 'bg-yellow-500/10', path: '/market' },
    { key: 'abilities', label: 'القدرات', labelEn: 'Abilities', icon: Zap, color: 'text-purple-400', borderColor: 'border-purple-500/40', bgColor: 'bg-purple-500/10', path: '/abilities' },
  ];

  // Check for max level - المستوى الأقصى هو 50
  const maxLevel = Math.max(
    gameState.levels.strength,
    gameState.levels.mind,
    gameState.levels.spirit,
    gameState.levels.agility
  );
  
  useEffect(() => {
    if (maxLevel >= 50) {
      setShowMaxLevelModal(true);
    }
  }, [maxLevel]);

  // Timer-based penalty: when all main quests have timers that expired and none completed, go to penalty
  useEffect(() => {
    const mainQuests = gameState.quests.filter(q => q.dailyReset && q.isMainQuest !== false);
    const allStarted = mainQuests.every(q => q.startedAt);
    const noneCompleted = mainQuests.every(q => !q.completed);
    
    if (!allStarted || !noneCompleted || mainQuests.length === 0) return;
    
    const checkExpired = () => {
      const now = Date.now();
      // Apply Mission Failed: any started, uncompleted main quest whose timer ran out → fail it (HP penalty)
      mainQuests.forEach(q => {
        if (!q.startedAt || !q.requiredTime || q.completed) return;
        const started = new Date(q.startedAt).getTime();
        const elapsed = (now - started) / 1000;
        if (elapsed >= q.requiredTime * 60) {
          failQuest(q.id);
        }
      });
    };
    
    const interval = setInterval(checkExpired, 5000);
    return () => clearInterval(interval);
  }, [gameState.quests, failQuest]);

  // Get only main daily quests (not side quests)
  const dailyQuests = gameState.quests.filter(q => q.dailyReset && q.isMainQuest !== false);

  // Get XP reward for completing all tasks
  const totalXpReward = dailyQuests.reduce((sum, q) => sum + q.xpReward, 0);

  // Check for prayer time
  useEffect(() => {
    const checkPrayerTime = () => {
      const now = new Date();
      
      const duePrayer = gameState.prayerQuests.find(p => {
        if (p.completed) return false;
        const prayerHour = parseInt(p.time.split(':')[0]);
        const currentHour = now.getHours();
        return currentHour >= prayerHour && currentHour < prayerHour + 1;
      });

      if (duePrayer && !activePrayerQuest) {
        setActivePrayerQuest(duePrayer.id);
      }
    };

    checkPrayerTime();
    const interval = setInterval(checkPrayerTime, 60000);
    return () => clearInterval(interval);
  }, [gameState.prayerQuests, activePrayerQuest]);

  // Show new quest notification
  useEffect(() => {
    const hasIncompleteQuests = dailyQuests.some(q => !q.completed);
    if (hasIncompleteQuests) {
      setShowNewQuestNotification(true);
      const timer = setTimeout(() => setShowNewQuestNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // إشعار البوابات الجديدة - يظهر فقط للبوابات الموجودة فعلاً
  useEffect(() => {
    const gates = gameState.gates || [];
    if (gates.length === 0) return;
    
    const shownGates = JSON.parse(localStorage.getItem('shownGateNotifications') || '[]');
    const newGates = gates.filter(g => !shownGates.includes(g.id) && g.discovered);
    
    if (newGates.length > 0) {
      // عرض إشعار لأول بوابة جديدة موجودة
      setDiscoveredGate(newGates[0]);
      setShowGateNotification(true);
      
      // تحديث البوابات المعروضة
      const updatedShown = [...shownGates, ...newGates.map(g => g.id)];
      localStorage.setItem('shownGateNotifications', JSON.stringify(updatedShown));
    }
  }, [gameState.gates]);

  // الاستماع لإشعار البوابات الجديدة من التحديث التلقائي
  useEffect(() => {
    const handleNewGate = () => {
      // جلب البوابات الحالية مباشرة من الـ state
      const gates = gameState.gates || [];
      if (gates.length > 0) {
        const firstGate = gates[0];
        if (firstGate) {
          setNewGate(firstGate);
          setShowNewGateNotification(true);
        }
      }
    };

    window.addEventListener('newGateAppeared', handleNewGate);
    return () => window.removeEventListener('newGateAppeared', handleNewGate);
  }, [gameState.gates]);

  const handleTaskComplete = (taskId: string) => {
    playQuestComplete();
    completeQuest(taskId);
    setSystemMessage('تم إكمال المهمة بنجاح! الزعيم تلقى ضرراً.');
    setTimeout(() => setSystemMessage(null), 3000);
  };

  const handleStartQuest = (questId: string) => {
    startSideQuest(questId);
  };

  const handleUpdateQuestProgress = (questId: string, timeProgress: number) => {
    updateSideQuestProgress(questId, timeProgress);
  };

  const handlePrayerComplete = (prayerId: string) => {
    playQuestComplete();
    completePrayerQuest(prayerId);
  };

  const handleUseAbility = (abilityId: string) => {
    playUseAbility();
    useAbility(abilityId);
    
    const ability = gameState.abilities.find(a => a.id === abilityId);
    if (ability) {
      setSystemMessage(`تم تفعيل ${ability.name}!`);
      setTimeout(() => setSystemMessage(null), 3000);
    }
  };

  const currentPrayer = activePrayerQuest 
    ? gameState.prayerQuests.find(p => p.id === activePrayerQuest) 
    : null;

  const unlockedAbilities = gameState.abilities.filter(a => a.unlocked && a.id !== 'a7').slice(0, 4);
  const topAchievements = gameState.achievements.slice(0, 4);

  return (
    <div className="min-h-screen pb-24">
      {/* Header with Burger Menu */}
      <header className="sticky top-0 z-40 flex justify-end items-center p-4 gap-2">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-primary/10 rounded-lg transition-all">
              <Menu className="w-6 h-6 text-primary" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-card/95 border-l border-primary/30 p-0">
            <SheetHeader className="p-4 border-b border-primary/20">
              <SheetTitle className="text-sm font-bold tracking-[0.15em] uppercase text-primary text-right">
                القائمة
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
                        "flex items-center gap-3 p-3 rounded-lg border transition-all group",
                        item.borderColor,
                        item.bgColor,
                        "hover:scale-[1.02]"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg border flex items-center justify-center",
                        item.borderColor,
                        item.bgColor
                      )}>
                        <Icon className={cn("w-5 h-5", item.color)} />
                      </div>
                      <div className="flex-1 text-right">
                        <p className={cn("font-bold text-sm", item.color)}>{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.labelEn}</p>
                      </div>
                      <ChevronRight className={cn("w-4 h-4", item.color, "rotate-180")} />
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>

            {/* Player Info Mini */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-primary/20 bg-card/90">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">المستوى الكلي</p>
                <p className="text-2xl font-black text-primary">{gameState.totalLevel}</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
      {/* System Notifications */}
      {showNewQuestNotification && (
        <SystemNotification 
          show={showNewQuestNotification}
          title="مهمة يومية جديدة"
          message="Daily Quest has arrived!"
          type="info"
          onClose={() => setShowNewQuestNotification(false)}
        />
      )}
      
      {systemMessage && (
        <SystemNotification 
          show={!!systemMessage}
          title="تم بنجاح"
          message={systemMessage}
          type="success"
          onClose={() => setSystemMessage(null)}
        />
      )}

      <main className="container mx-auto px-4 py-6 space-y-6">
        <ProfileCard 
          gameState={gameState} 
          getXpProgress={getXpProgress} 
          onUpdateProfile={updatePlayerInfo}
        />

        {/* Daily Quest Card */}
        <section>
          <SoloLevelingQuestCard
            quests={dailyQuests}
            onTaskComplete={handleTaskComplete}
            onStartQuest={handleStartQuest}
            onUpdateQuestProgress={handleUpdateQuestProgress}
            onPenalty={() => navigate('/penalty')}
          />
        </section>

      </main>

      <BottomNav />

      {/* Prayer Quest Modal */}
      {currentPrayer && (
        <PrayerQuestModal
          prayer={currentPrayer}
          onComplete={handlePrayerComplete}
          onClose={() => setActivePrayerQuest(null)}
        />
      )}

      {/* Level Up Modal */}
      {levelUpInfo && levelUpInfo.show && (
        <LevelUpModal
          show={levelUpInfo.show}
          newLevel={levelUpInfo.newLevel}
          category={levelUpInfo.category}
          onDismiss={dismissLevelUp}
        />
      )}

      {/* Max Level Modal */}
      <MaxLevelModal 
        show={showMaxLevelModal} 
        onDismiss={() => setShowMaxLevelModal(false)} 
      />

      {/* Gate Discovery Notification */}
      <GateDiscoveryNotification
        show={showGateNotification}
        gate={discoveredGate}
        hasManaGauge={gameState.inventory?.some(item => item.id === 'mana_meter' && item.quantity > 0) || false}
        playerPower={gameState.totalLevel || 1}
        onClose={() => setShowGateNotification(false)}
        onEnter={() => setShowGateNotification(false)}
      />

      {/* New Gate Notification with Sound */}
      <NewGateNotification
        show={showNewGateNotification}
        gate={newGate}
        onClose={() => setShowNewGateNotification(false)}
      />
    </div>
  );
};

export default Index;