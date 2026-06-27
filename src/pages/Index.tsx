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
import { StatType, Gate, Quest } from '@/types/game';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { AdBanner } from '@/components/ads/AdBanner';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  // حالة محلية موحدة ومحمية لإدارة الـ Quests
  const [hybridQuestsState, setHybridQuestsState] = useState<Quest[]>([]);

  const menuItems = [
    { key: 'profile', label: t('nav.profile'), labelEn: 'Profile', icon: User, color: 'text-blue-400', borderColor: 'border-blue-500/40', bgColor: 'bg-blue-500/10', path: '/profile' },
    { key: 'market', label: t('nav.market'), labelEn: 'Market', icon: ShoppingBag, color: 'text-yellow-400', borderColor: 'border-yellow-500/40', bgColor: 'bg-yellow-500/10', path: '/market' },
    { key: 'abilities', label: t('nav.abilities'), labelEn: 'Abilities', icon: Zap, color: 'text-purple-400', borderColor: 'border-purple-500/40', bgColor: 'bg-purple-500/10', path: '/abilities' },
  ];

  // ملاحظة: المزامنة مع Supabase تتم مركزياً عبر useGameState الذي يكتب على
  // الأعمدة الصحيحة (Quests JSONB + name_player/hp_player/...). كانت هذه الدالة
  // السابقة تكتب على عمود غير موجود (`id`) وتمسح كامل Quests JSONB، فأزلناها.
  const syncQuestsToSupabase = async (_updatedQuests: Quest[]) => {
    /* no-op: handled by useGameState central save effect */
  };

  // معالجة دمج البيانات وحمايتها من التصفير عند تحميل الصفحة أو تحديث الـ gameState
  useEffect(() => {
    if (gameState.quests && gameState.quests.length > 0) {
      const dbQuests = gameState.quests.filter(q => q.dailyReset && q.isMainQuest !== false);
      
      // جلب آخر تقدم مخزن محلياً (المصدر الأساسي والأقوى للوقت)
      const savedLocalProgress = localStorage.getItem('local_quests_progress') || localStorage.getItem('local_active_quests');
      let localQuests: Quest[] = [];
      if (savedLocalProgress) {
        try { 
          localQuests = JSON.parse(savedLocalProgress); 
        } catch(e) { 
          console.error("Error parsing local quests:", e); 
        }
      }

      // الدمج مع فرض بيانات الوقت المخزنة محلياً لعدم ضياع العداد
      const hybridQuests = dbQuests.map(dbQ => {
        const matchedLocal = localQuests.find(locQ => locQ.id === dbQ.id);
        
        // إذا كانت المهمة مكتملة في الـ Database فنعيد تصفير حالتها المحلية، وإلا نلتزم بالوقت المحلي
        return {
          ...dbQ,
          startedAt: dbQ.completed ? undefined : (matchedLocal ? matchedLocal.startedAt : dbQ.startedAt),
          timeProgress: dbQ.completed ? 0 : (matchedLocal && matchedLocal.timeProgress !== undefined ? matchedLocal.timeProgress : (dbQ.timeProgress || 0)),
          active: dbQ.completed ? false : (matchedLocal ? matchedLocal.active : dbQ.active),
          completed: dbQ.completed
        };
      });

      setHybridQuestsState(hybridQuests);
      
      // تحديث فوري للـ LocalStorage لضمان بقائه متزامنًا مع التعديلات الجديدة
      localStorage.setItem('local_quests_progress', JSON.stringify(hybridQuests));
    }
  }, [gameState.quests]);

  // فحص المستوى الأقصى (50)
  const maxLevel = Math.max(
    gameState.levels?.strength || 0,
    gameState.levels?.mind || 0,
    gameState.levels?.spirit || 0,
    gameState.levels?.agility || 0
  );
  
  useEffect(() => {
    if (maxLevel >= 50) {
      setShowMaxLevelModal(true);
    }
  }, [maxLevel]);

  // عقوبة انتهاء الوقت (24 ساعة)
  useEffect(() => {
    if (hybridQuestsState.length === 0) return;
    
    const checkExpired = () => {
      const startTimeStr = localStorage.getItem('daily_quest_start');
      if (!startTimeStr) return;
      
      const startTime = parseInt(startTimeStr);
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - startTime;

      if (elapsed >= TWENTY_FOUR_HOURS) {
        const allCompleted = hybridQuestsState.every(q => q.completed);
        if (!allCompleted) {
          // تفجير العقوبة فوراً
          failQuest(hybridQuestsState[0].id);
          navigate('/penalty');
        }
      }
    };
    
    const interval = setInterval(checkExpired, 5000);
    return () => clearInterval(interval);
  }, [hybridQuestsState, failQuest, navigate]);

  // فحص أوقات الصلوات
  useEffect(() => {
    if (!gameState.prayerQuests) return;

    const checkPrayerTime = () => {
      const now = new Date();
      const duePrayer = gameState.prayerQuests.find(p => {
        if (p.completed) return false;
        const prayerHour = parseInt(p.time.split(':')[0]);
        const currentHour = now.getHours();
        return currentHour >= prayerHour && currentHour < prayerHour + 1;
      });

      if (duePrayer && activePrayerQuest !== duePrayer.id) {
        setActivePrayerQuest(duePrayer.id);
      }
    };

    checkPrayerTime();
    const interval = setInterval(checkPrayerTime, 60000);
    return () => clearInterval(interval);
  }, [gameState.prayerQuests, activePrayerQuest]);

  // إشعار المهام الجديدة عند فتح التطبيق أول مرة
  useEffect(() => {
    const hasIncompleteQuests = hybridQuestsState.some(q => !q.completed);
    if (hasIncompleteQuests) {
      setShowNewQuestNotification(true);
      const timer = setTimeout(() => setShowNewQuestNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hybridQuestsState.length]);

  // إشعارات اكتشاف البوابات
  useEffect(() => {
    const gates = gameState.gates || [];
    if (gates.length === 0) return;
    
    const shownGates = JSON.parse(localStorage.getItem('shownGateNotifications') || '[]');
    const newGates = gates.filter(g => !shownGates.includes(g.id) && g.discovered);
    
    if (newGates.length > 0) {
      setDiscoveredGate(newGates[0]);
      setShowGateNotification(true);
      
      const updatedShown = [...shownGates, ...newGates.map(g => g.id)];
      localStorage.setItem('shownGateNotifications', JSON.stringify(updatedShown));
    }
  }, [gameState.gates]);

  // إشعار ظهور بوابة جديدة تلقائياً
  useEffect(() => {
    const handleNewGate = () => {
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

  // عند الضغط على زر إكمال المهمة واستلام الجائزة
  const handleTaskComplete = (taskId: string) => {
    playQuestComplete();
    
    const updated = hybridQuestsState.map(q => {
      if (q.id === taskId) {
        return { ...q, completed: true, active: false, startedAt: undefined, timeProgress: 0 };
      }
      return q;
    });
    
    setHybridQuestsState(updated);
    
    // 1. التحديث الفوري للمخزن المحلي
    localStorage.setItem('local_quests_progress', JSON.stringify(updated));
    localStorage.setItem('local_active_quests', JSON.stringify(updated));
    
    // 2. المزامنة المباشرة مع الخادم وقاعدة البيانات
    syncQuestsToSupabase(updated);
    completeQuest(taskId);
    
    setSystemMessage(t('index.questCompleteMessage'));
    setTimeout(() => setSystemMessage(null), 3000);
  };

  // عند قبول المهمة وبدء العداد
  const handleStartQuest = (questId: string) => {
    const nowIso = new Date().toISOString();
    const updated = hybridQuestsState.map(q => {
      if (q.id === questId) {
        return { ...q, startedAt: nowIso, active: true, timeProgress: q.timeProgress || 0 };
      }
      return q;
    });

    setHybridQuestsState(updated);
    
    // حفظ حالة البداية محلياً فوراً لمنع التصفير عند التنقل
    localStorage.setItem('local_quests_progress', JSON.stringify(updated));
    localStorage.setItem('local_active_quests', JSON.stringify(updated));

    startSideQuest(questId);
  };

  // المزامنة الدورية المستمرة لكل ثانية لتقدم الوقت الجاري للمهمة
  const handleUpdateQuestProgress = (questId: string, timeProgress: number) => {
    const updated = hybridQuestsState.map(q => {
      if (q.id === questId) {
        return { ...q, timeProgress: timeProgress };
      }
      return q;
    });

    setHybridQuestsState(updated);
    
    // حفظ مستمر ودقيق لكل ثانية تمر محلياً بالجهاز
    localStorage.setItem('local_quests_progress', JSON.stringify(updated));
    localStorage.setItem('local_active_quests', JSON.stringify(updated));

    updateSideQuestProgress(questId, timeProgress);
  };

  const handlePrayerComplete = (prayerId: string) => {
    playQuestComplete();
    completePrayerQuest(prayerId);
  };

  const handleUseAbility = (abilityId: string) => {
    playUseAbility();
    useAbility(abilityId);
    
    const ability = gameState.abilities?.find(a => a.id === abilityId);
    if (ability) {
      setSystemMessage(t('index.abilityActivated', { name: ability.name }));
      setTimeout(() => setSystemMessage(null), 3000);
    }
  };

  const currentPrayer = activePrayerQuest && gameState.prayerQuests
    ? gameState.prayerQuests.find(p => p.id === activePrayerQuest) 
    : null;

  return (
    <div className="min-h-screen pb-24">
      {/* System Notifications */}
      {showNewQuestNotification && (
        <SystemNotification 
          show={showNewQuestNotification}
          title={t('index.newQuestTitle')}
          message={t('index.newQuestMessage')}
          type="info"
          onClose={() => setShowNewQuestNotification(false)}
        />
      )}
      
      {systemMessage && (
        <SystemNotification 
          show={!!systemMessage}
          title={t('common.successTitle')}
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
            quests={hybridQuestsState}
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

      {/* New Gate Notification */}
      <NewGateNotification
        show={showNewGateNotification}
        gate={newGate}
        onClose={() => setShowNewGateNotification(false)}
      />
    </div>
  );
};

export default Index;
