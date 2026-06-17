import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  Dumbbell, 
  Brain, 
  Heart, 
  Zap,
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Play,
  X,
  CheckCircle,
  Timer,
  Crown,
  Target
} from 'lucide-react';
import { StatType, Quest } from '@/types/game';
import { useNavigate } from 'react-router-dom';

interface QuestCardProps {
  quests: Quest[];
  onTaskComplete: (taskId: string) => void;
  onStartQuest: (questId: string) => void;
  onUpdateQuestProgress?: (questId: string, timeProgress: number) => void;
  timeRemaining?: string;
  onPenalty?: () => void;
}

const categoryConfig = {
  strength: { 
    icon: Dumbbell, 
    name: 'القوة',
    englishName: 'STR',
  },
  mind: { 
    icon: Brain, 
    name: 'العقل',
    englishName: 'INT',
  },
  spirit: { 
    icon: Heart, 
    name: 'الروح',
    englishName: 'SPR',
  },
  agility: { 
    icon: Zap, 
    name: 'الرشاقة',
    englishName: 'AGI',
  },
};

interface QuestModalProps {
  quest: Quest;
  allQuests: Quest[]; 
  onClose: () => void;
  onStart: () => void;
  onComplete: () => void;
  onUpdateProgress?: (timeProgress: number) => void;
}

const QuestModal = ({ quest, allQuests, onClose, onStart, onComplete, onUpdateProgress }: QuestModalProps) => {
  const [now, setNow] = useState(Date.now());
  const [isVisible, setIsVisible] = useState(false);
  const config = categoryConfig[quest.category];
  const Icon = config.icon;

  const requiredTimeInSeconds = (quest.requiredTime || 0) * 60;

  const timeProgress = (() => {
    if (!quest.startedAt) return quest.timeProgress || 0;
    const started = new Date(quest.startedAt).getTime();
    const elapsedSinceStart = Math.floor((now - started) / 1000);
    return Math.min(elapsedSinceStart, requiredTimeInSeconds);
  })();

  const isRunning = !!quest.startedAt && !quest.completed && timeProgress < requiredTimeInSeconds;
  const isCompleted = timeProgress >= requiredTimeInSeconds && requiredTimeInSeconds > 0;

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const lastSavedProgress = useRef<number>(-1);
  useEffect(() => {
    if (onUpdateProgress && quest.startedAt && timeProgress !== lastSavedProgress.current) {
      lastSavedProgress.current = timeProgress;
      onUpdateProgress(timeProgress);

      // حفظ التقدم محلياً في المتصفح عند تغيير العداد
      const syncProgressToLocalStorage = () => {
        const updatedQuestsArray = allQuests.map(q => {
          if (q.id === quest.id) {
            return { ...q, timeProgress: timeProgress };
          }
          return q;
        });
        localStorage.setItem('local_active_quests', JSON.stringify(updatedQuestsArray));
      };

      if (timeProgress >= requiredTimeInSeconds || timeProgress % 5 === 0) {
        syncProgressToLocalStorage();
      }
    }
  }, [timeProgress, quest.startedAt, onUpdateProgress, quest.id, allQuests, requiredTimeInSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    const nowIso = new Date().toISOString();
    const updatedQuestsArray = allQuests.map(q => {
      if (q.id === quest.id) {
        return { ...q, startedAt: nowIso, active: true };
      }
      return q;
    });

    // حفظ حالة بدء المهمة محلياً
    localStorage.setItem('local_active_quests', JSON.stringify(updatedQuestsArray));
    onStart();
  };

  const handleComplete = () => {
    const updatedQuestsArray = allQuests.map(q => {
      if (q.id === quest.id) {
        return { ...q, completed: true, active: false, timeProgress: requiredTimeInSeconds };
      }
      return q;
    });

    // حفظ حالة اكتمال المهمة محلياً
    localStorage.setItem('local_active_quests', JSON.stringify(updatedQuestsArray));
    onComplete();
  };

  const progressPercentage = requiredTimeInSeconds > 0 
    ? Math.min((timeProgress / requiredTimeInSeconds) * 100, 100) 
    : 0;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className={cn(
          "absolute inset-0 backdrop-blur-md transition-all duration-500",
          isVisible ? "bg-black/90" : "bg-black/0"
        )}
        onClick={handleClose}
      />
      
      <div className={cn(
        "relative z-10 w-full max-w-sm transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)]",
        isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
      )}>
        <div className="pointer-events-none absolute -inset-2 bg-gradient-to-b from-cyan-500/20 via-blue-500/10 to-cyan-500/20 blur-xl opacity-60" />
        
        <div className="relative overflow-hidden" style={{
          background: 'linear-gradient(180deg, rgba(8,20,40,0.98) 0%, rgba(4,12,28,0.99) 50%, rgba(8,20,40,0.98) 100%)',
          border: '2px solid rgba(56,189,248,0.4)',
          boxShadow: '0 0 60px rgba(56,189,248,0.15), inset 0 0 60px rgba(56,189,248,0.05)',
        }}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `
              linear-gradient(rgba(56,189,248,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56,189,248,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }} />

          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]" />

          <div className="pointer-events-none absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-cyan-400/70" />
          <div className="pointer-events-none absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-cyan-400/70" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-cyan-400/70" />
          <div className="pointer-events-none absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-cyan-400/70" />

          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-1.5 text-slate-500 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative px-6 pt-7 pb-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-9 h-9 border-2 border-slate-400/60 flex items-center justify-center bg-transparent">
                <span className="text-slate-300 font-black text-lg">!</span>
              </div>
              <div className="border-2 border-slate-400/60 px-5 py-1.5 bg-transparent">
                <span className="text-sm font-black tracking-[0.3em] text-white uppercase">
                  QUEST INFO
                </span>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 font-mono">
              [Daily Quest: <span className="text-cyan-300 font-bold">{quest.title}</span> has arrived.]
            </p>
          </div>

          <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          <div className="px-6 py-5">
            <h3 className="text-center text-lg font-black tracking-[0.2em] text-white mb-5 underline underline-offset-8 decoration-slate-600">
              GOAL
            </h3>
            
            <div className="space-y-4 mb-5">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-300 font-medium">{quest.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {quest.requiredTime ? (
                    <span className="text-sm text-slate-400 font-mono">
                      [{formatTime(timeProgress)}/{formatTime(requiredTimeInSeconds)}]
                    </span>
                  ) : quest.sets && quest.repsPerSet ? (
                    <span className="text-sm text-slate-400 font-mono">
                      [{quest.repsPerSet}×{quest.sets}]
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400 font-mono">[1/1]</span>
                  )}
                  <div className={cn(
                    "w-5 h-5 border flex items-center justify-center",
                    isCompleted || quest.completed
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : "border-slate-600"
                  )}>
                    {(isCompleted || quest.completed) && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                </div>
              </div>

              {quest.requiredTime && (
                <div className="px-4">
                  <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/30">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        isCompleted 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                          : "bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                      )}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  {isRunning && !isCompleted && (
                    <p className="text-[9px] text-cyan-500/60 text-center mt-1.5 animate-pulse font-mono">
                      ▸ Timer active...
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between px-4 pt-2 border-t border-slate-700/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Reward</span>
                </div>
                <span className="text-sm font-black text-cyan-300 tracking-wider">+{quest.xpReward} XP</span>
              </div>

              {quest.goldReward && (
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500/70" />
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Gold</span>
                  </div>
                  <span className="text-sm font-black text-yellow-400/80 tracking-wider">+{quest.goldReward} G</span>
                </div>
              )}
            </div>
          </div>

          <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

          <div className="px-6 py-4">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              <span className="text-red-400 font-bold">WARNING:</span> Failure to complete the daily quest will result in an appropriate <span className="text-red-400 font-bold">penalty</span>.
            </p>
          </div>

          <div className="px-6 pb-6 pt-2">
            {quest.completed ? (
              <div className="flex items-center justify-center gap-3 py-4 border border-emerald-500/30 bg-emerald-500/5">
                <div className="w-7 h-7 border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-500/10">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-black text-emerald-400 tracking-[0.2em] text-sm">COMPLETED</span>
              </div>
            ) : !quest.startedAt ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-3.5 border border-slate-700/50 text-slate-500 font-bold text-xs tracking-[0.2em] uppercase hover:text-slate-300 hover:border-slate-500/50 transition-all"
                >
                  CLOSE
                </button>
                <button
                  type="button"
                  onClick={handleStart}
                  className="py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xs tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(56,189,248,0.3)] hover:shadow-[0_0_40px_rgba(56,189,248,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  ACCEPT
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={!isCompleted}
                className={cn(
                  "w-full py-4 font-black text-sm tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2",
                  isCompleted
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
                    : "border border-slate-700/50 text-slate-600 cursor-not-allowed"
                )}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    CLAIM REWARD
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    <Timer className="w-4 h-4 animate-pulse" />
                    {Math.ceil((requiredTimeInSeconds - timeProgress) / 60)}m REMAINING
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SoloLevelingQuestCard = ({ 
  quests, 
  onTaskComplete,
  onStartQuest,
  onUpdateQuestProgress,
  timeRemaining,
  onPenalty
}: QuestCardProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [dailyTimeLeft, setDailyTimeLeft] = useState('');

  useEffect(() => {
    const getDailyDeadline = () => {
      const key = 'daily_quest_start';
      let startTime = localStorage.getItem(key);
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem('daily_quest_date');
      
      if (!startTime || storedDate !== today) {
        const now = Date.now().toString();
        localStorage.setItem(key, now);
        localStorage.setItem('daily_quest_date', today);
        return parseInt(now);
      }
      return parseInt(startTime);
    };

    const startTime = getDailyDeadline();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = TWENTY_FOUR_HOURS - elapsed;

      if (remaining <= 0) {
        const allDone = quests.filter(q => q.dailyReset && q.isMainQuest !== false).every(q => q.completed);
        if (!allDone && onPenalty) {
          onPenalty();
        }
        setDailyTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);
      setDailyTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [quests, onPenalty]);

  useEffect(() => {
    if (selectedQuest) {
      const updatedQuest = quests.find(q => q.id === selectedQuest.id);
      if (updatedQuest) {
        setSelectedQuest(updatedQuest);
      }
    }
  }, [quests, selectedQuest]);

  const getQuestsPerCategory = () => {
    const categories: StatType[] = ['strength', 'mind', 'spirit', 'agility'];
    const selectedQuests: Quest[] = [];
    
    categories.forEach(category => {
      const categoryQuests = quests.filter(q => q.category === category && q.dailyReset && q.isMainQuest !== false);
      if (categoryQuests.length > 0) {
        const incompleteQuest = categoryQuests.find(q => !q.completed) || categoryQuests[0];
        selectedQuests.push(incompleteQuest);
      }
    });
    
    return selectedQuests;
  };

  const displayQuests = getQuestsPerCategory();
  const completedTasks = displayQuests.filter(q => q.completed).length;
  const allCompleted = completedTasks === displayQuests.length && displayQuests.length > 0;

  useEffect(() => {
    if (allCompleted && !showCompletion) {
      setShowCompletion(true);
      setTimeout(() => setShowCompletion(false), 5000);
    }
  }, [allCompleted, showCompletion]);

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
  };

  const handleStartQuest = () => {
    if (selectedQuest) {
      onStartQuest(selectedQuest.id);
    }
  };

  const handleCompleteQuest = () => {
    if (selectedQuest) {
      onTaskComplete(selectedQuest.id);
      setSelectedQuest(null);
    }
  };

  const handleUpdateProgress = (timeProgress: number) => {
    if (selectedQuest && onUpdateQuestProgress) {
      onUpdateQuestProgress(selectedQuest.id, timeProgress);
    }
  };

  return (
    <>
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-fade-in">
          <div className="max-w-sm w-full text-center relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-white/10 via-slate-300/20 to-white/10 blur-2xl" />
            <div className="relative p-8 bg-gradient-to-b from-slate-900 to-black border border-white/20 rounded-sm">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />
              
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/20 to-white/5 border-2 border-white/30 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                <Crown className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
              </div>
              
              <h2 className="text-2xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] mb-2 tracking-wider">
                QUEST COMPLETE
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                لقد أتممت جميع المهمات اليومية!
              </p>
              <p className="text-4xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] mb-6">
                +{displayQuests.reduce((sum, q) => sum + q.xpReward, 0) * 2} XP
              </p>
              <button
                onClick={() => setShowCompletion(false)}
                className="w-full py-4 rounded-sm bg-gradient-to-r from-white to-slate-200 text-black font-black tracking-wider shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <div className={cn(
          "pointer-events-none absolute -inset-1 blur-md opacity-40",
          allCompleted 
            ? "bg-emerald-500/30" 
            : "bg-cyan-500/20"
        )} />
        
        <div className="relative overflow-hidden" style={{
          background: 'linear-gradient(180deg, rgba(8,20,40,0.98) 0%, rgba(4,12,28,0.99) 50%, rgba(8,20,40,0.98) 100%)',
          border: '2px solid rgba(56,189,248,0.35)',
          boxShadow: allCompleted 
            ? '0 0 60px rgba(16,185,129,0.2), inset 0 0 60px rgba(16,185,129,0.05)'
            : '0 0 60px rgba(56,189,248,0.15), inset 0 0 60px rgba(56,189,248,0.05)',
        }}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `
              linear-gradient(rgba(56,189,248,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56,189,248,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }} />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-scan-line" />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]" />

          <div className="pointer-events-none absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/70" />
          <div className="pointer-events-none absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/70" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/70" />
          <div className="pointer-events-none absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/70" />

          <div 
            className="relative z-10 px-5 pt-6 pb-4 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-slate-400/60 flex items-center justify-center bg-transparent shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                  <span className="text-slate-200 font-black text-xl">!</span>
                </div>
                <div className="border-2 border-slate-400/60 px-5 py-1.5 bg-transparent">
                  <span className="text-sm font-black tracking-[0.3em] text-white uppercase">
                    QUEST INFO
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-cyan-500/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyan-500/60" />
                )}
              </div>
            </div>

            <p className="text-sm text-slate-400 font-mono text-center">
              [Daily Quest: <span className="text-cyan-300 font-bold">Strength Training</span> has arrived.]
            </p>
          </div>

          <div className="mx-5 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          {isExpanded && (
            <div className="relative z-10 px-5 py-5 animate-fade-in">
              <h3 className="text-center text-base font-black tracking-[0.25em] text-white mb-5 underline underline-offset-8 decoration-slate-600/60">
                GOALS
              </h3>
              
              <div className="space-y-1">
                {displayQuests.map((quest) => {
                  const config = categoryConfig[quest.category];
                  const Icon = config.icon;

                  return (
                    <button
                      type="button"
                      key={quest.id}
                      onClick={(e) => { e.stopPropagation(); handleQuestClick(quest); }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 transition-all duration-300 group",
                        "hover:bg-cyan-500/5",
                        quest.completed && "opacity-70"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn(
                          "w-4.5 h-4.5 transition-all",
                          quest.completed 
                            ? "text-emerald-400" 
                            : "text-slate-500 group-hover:text-cyan-400"
                        )} />
                        <span className={cn(
                          "text-sm font-medium transition-all",
                          quest.completed 
                            ? "text-slate-500 line-through" 
                            : "text-slate-300 group-hover:text-white"
                        )}>
                          {quest.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-sm font-mono",
                          quest.completed ? "text-emerald-400" : "text-slate-500"
                        )}>
                          {quest.completed ? (
                            quest.requiredTime 
                              ? `[${quest.requiredTime}/${quest.requiredTime}m]`
                              : quest.sets && quest.repsPerSet
                                ? `[${quest.repsPerSet}×${quest.sets}/${quest.repsPerSet}×${quest.sets}]`
                                : '[1/1]'
                          ) : (
                            quest.requiredTime 
                              ? `[${Math.floor((quest.timeProgress || 0) / 60)}/${quest.requiredTime}m]`
                              : quest.sets && quest.repsPerSet
                                ? `[0/${quest.repsPerSet}×${quest.sets}]`
                                : '[0/1]'
                          )}
                        </span>
                        
                        <div className={cn(
                          "w-5 h-5 border flex items-center justify-center transition-all",
                          quest.completed
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "border-slate-600 group-hover:border-cyan-500/50"
                        )}>
                          {quest.completed && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2">
                <div className="flex items-center gap-2 px-4 py-1.5 border border-cyan-500/20 bg-cyan-500/5">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black text-cyan-300 tracking-wider">
                    {completedTasks}/{displayQuests.length} COMPLETED
                  </span>
                </div>
              </div>

              <div className="mx-0 my-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

              <div className="px-2 pb-1">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  <span className="text-red-400 font-bold">WARNING:</span> Failure to complete
                  the daily quest will result in an appropriate <span className="text-red-400 font-bold">penalty</span>.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center">
                {dailyTimeLeft && (
                  <div className="flex items-center gap-2 px-4 py-2 border border-cyan-500/20 bg-cyan-500/5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black text-cyan-300 tracking-[0.15em] font-mono">
                      TIME REMAINING: {dailyTimeLeft}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedQuest && (
        <QuestModal
          quest={selectedQuest}
          allQuests={quests} 
          onClose={() => setSelectedQuest(null)}
          onStart={handleStartQuest}
          onComplete={handleCompleteQuest}
          onUpdateProgress={handleUpdateProgress}
        />
      )}
    </>
  );
};
 
