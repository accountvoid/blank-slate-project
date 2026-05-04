import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '@/components/BottomNav';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useGameState } from '@/hooks/useGameState';
import { Zap, Swords, Target, ArrowUp, Lock, Sparkles, Hexagon, Cpu, ShieldAlert, Hourglass, Coins } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Mastery / Upgrade Rank tuning
const SKILL_LEVEL_MULTIPLIERS = [1, 1.3, 1.6, 2.0, 2.5, 3.0] as const;
const SKILL_TIME_REDUCERS = [0, 0.05, 0.1, 0.15, 0.2, 0.25] as const;
const STONE_COSTS = [0, 2, 4, 10, 25, 50] as const;
const GOLD_COSTS = [0, 250, 600, 1500, 3500, 8000] as const;
const RANK_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;
const MAX_SKILL_LEVEL = 6;

type SkillId = 'basicAttack' | 'thunderDash' | 'daggerStrike';
type SkillLevels = Record<SkillId, number>;
type SkillColor = 'silver' | 'blue' | 'violet';

const STORAGE_KEY = 'battle_skill_levels';

const getBaseDamage = (strengthLevel: number): number => {
  if (strengthLevel <= 1) return 1;
  if (strengthLevel <= 10) return Math.max(1, Math.floor(Math.pow(1000, (strengthLevel - 1) / 9)));
  return Math.floor(1000 + Math.pow(strengthLevel - 10, 0.7) * 100);
};

const loadSkillLevels = (): SkillLevels => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { basicAttack: 1, thunderDash: 1, daggerStrike: 1, ...JSON.parse(stored) };
  } catch {
    /* ignore */
  }
  return { basicAttack: 1, thunderDash: 1, daggerStrike: 1 };
};

const saveSkillLevels = (levels: SkillLevels) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
};

const Abilities = () => {
  const { t } = useTranslation();
  const { gameState, consumeItem, spendGold } = useGameState();
  const [skillLevels, setSkillLevels] = useState<SkillLevels>(loadSkillLevels);

  const strengthLevel = gameState.levels.strength || 1;
  const baseDmg = getBaseDamage(strengthLevel);
  const hasDagger = (gameState.inventory || []).some(i => i.id === 'dagger' && i.quantity > 0);
  const coreStones = (gameState.inventory || []).find(i => i.id === 'enhancement_stone')?.quantity || 0;
  const gold = gameState.gold || 0;

  const skills: Array<{
    id: SkillId;
    name: string;
    nameEn: string;
    icon: JSX.Element;
    color: SkillColor;
    mpCost: number;
    description: string;
    multiplier: number;
    baseCastTime: number;
    unlocked: boolean;
    tag: string;
  }> = [
    {
      id: 'basicAttack',
      name: 'نصل الجليد الفضي',
      nameEn: 'Silver Ice Blade',
      icon: <Swords className="w-8 h-8" />,
      color: 'silver',
      mpCost: 5,
      description: 'هجوم قياسي مشبع بمانا الجليد الفضي.',
      multiplier: 1,
      baseCastTime: 0.5,
      unlocked: true,
      tag: 'Physical',
    },
    {
      id: 'thunderDash',
      name: 'اندفاع البرق الأزرق السماوي',
      nameEn: 'Celestial Blue Thunder',
      icon: <Zap className="w-8 h-8" />,
      color: 'blue',
      mpCost: 50,
      description: 'صعق الأعداء بمانا البرق الأزرق.',
      multiplier: 3,
      baseCastTime: 1.5,
      unlocked: true,
      tag: 'Ultimate',
    },
    {
      id: 'daggerStrike',
      name: 'اغتيال الظلال البنفسجية',
      nameEn: 'Violet Shadow Assassination',
      icon: <Target className="w-8 h-8" />,
      color: 'violet',
      mpCost: 25,
      description: 'طعنة تخترق الدفاعات السحرية.',
      multiplier: 2,
      baseCastTime: 1.0,
      unlocked: hasDagger,
      tag: 'Stealth',
    },
  ];

  const upgradeSkill = (skillId: SkillId) => {
    const currentLevel = skillLevels[skillId] || 1;
    if (currentLevel >= MAX_SKILL_LEVEL) {
      toast({ title: 'SYSTEM', description: t('abilities.errors.max') });
      return;
    }
    const stoneCost = STONE_COSTS[currentLevel];
    const goldCost = GOLD_COSTS[currentLevel];

    if (coreStones < stoneCost) {
      toast({ title: 'SYSTEM', description: t('abilities.errors.noStones', { count: stoneCost }), variant: 'destructive' });
      return;
    }
    if (gold < goldCost) {
      toast({ title: 'SYSTEM', description: t('abilities.errors.noGold', { count: goldCost }), variant: 'destructive' });
      return;
    }

    if (goldCost > 0) {
      const ok = spendGold(goldCost);
      if (!ok) {
        toast({ title: 'SYSTEM', description: t('abilities.errors.noGold', { count: goldCost }), variant: 'destructive' });
        return;
      }
    }
    consumeItem('enhancement_stone', stoneCost);
    const newLevels: SkillLevels = { ...skillLevels, [skillId]: currentLevel + 1 };
    setSkillLevels(newLevels);
    saveSkillLevels(newLevels);
    toast({ title: 'SYSTEM UPGRADE', description: t('abilities.success') });
  };

  type AbilityColorTheme = { border: string; text: string; bg: string; glow: string; bar: string; btn: string };
  const colors: Record<SkillColor, AbilityColorTheme> = {
    silver: { border: 'border-zinc-400', text: 'text-zinc-100', bg: 'bg-zinc-800/20', glow: 'shadow-zinc-700/50', bar: 'bg-zinc-300', btn: 'from-zinc-700 to-zinc-900 border-zinc-500' },
    blue: { border: 'border-blue-500', text: 'text-blue-300', bg: 'bg-blue-900/30', glow: 'shadow-blue-800/60', bar: 'bg-blue-400', btn: 'from-blue-600 to-blue-900 border-blue-500' },
    violet: { border: 'border-fuchsia-600', text: 'text-fuchsia-200', bg: 'bg-fuchsia-900/40', glow: 'shadow-fuchsia-800/70', bar: 'bg-fuchsia-500', btn: 'from-fuchsia-600 to-fuchsia-950 border-fuchsia-600' },
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white p-4 font-sans pb-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,30,50,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(20,30,50,0.4)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(100,200,255,0.1),transparent_60%)] pointer-events-none" />

      <header className="relative z-10 flex flex-col items-center mb-10 pt-4">
        <div className="absolute top-2 end-2"><LanguageSwitcher /></div>
        <div className="flex items-center gap-4 mb-2 opacity-80">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-zinc-400" />
          <Hexagon className="w-10 h-10 text-zinc-300 animate-pulse" />
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-zinc-400" />
        </div>
        <h1 className="text-3xl font-black italic tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
          {t('abilities.title')}
        </h1>
        <p className="text-[10px] font-mono text-blue-300 tracking-[0.5em] uppercase">{t('abilities.subtitle')}</p>
      </header>

      <main className="relative z-10 max-w-xl mx-auto space-y-8">
        <div className="grid grid-cols-4 gap-2 bg-zinc-950/90 border-y-2 border-zinc-700/50 backdrop-blur-md p-4 rounded-2xl shadow-[0_0_30px_rgba(100,200,255,0.1)]">
          <div className="text-center border-e-2 border-zinc-800">
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{t('abilities.stats.sLevel')}</p>
            <p className="text-xl font-black italic text-zinc-100">{strengthLevel}</p>
          </div>
          <div className="text-center border-e-2 border-zinc-800">
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{t('abilities.stats.baseDmg')}</p>
            <p className="text-xl font-black italic text-blue-300">{baseDmg.toLocaleString()}</p>
          </div>
          <div className="text-center border-e-2 border-zinc-800">
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{t('abilities.stats.coreStones')}</p>
            <p className="text-xl font-black italic text-blue-100">💎 {coreStones}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{t('abilities.stats.gold')}</p>
            <p className="text-xl font-black italic text-yellow-300">🪙 {gold.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-8">
          {skills.map((skill) => {
            const level = skillLevels[skill.id] || 1;
            const style = colors[skill.color];
            const idx = Math.min(level - 1, MAX_SKILL_LEVEL - 1);
            const nextIdx = Math.min(level, MAX_SKILL_LEVEL - 1);

            const currentMultiplier = skill.multiplier * SKILL_LEVEL_MULTIPLIERS[idx];
            const currentDmg = Math.floor(baseDmg * currentMultiplier);
            const currentCastTime = skill.baseCastTime * (1 - SKILL_TIME_REDUCERS[idx]);
            const nextMultiplier = skill.multiplier * SKILL_LEVEL_MULTIPLIERS[nextIdx];
            const nextDmg = Math.floor(baseDmg * nextMultiplier);
            const nextCastTime = skill.baseCastTime * (1 - SKILL_TIME_REDUCERS[nextIdx]);

            const stoneCost = level < MAX_SKILL_LEVEL ? STONE_COSTS[level] : 0;
            const goldCost = level < MAX_SKILL_LEVEL ? GOLD_COSTS[level] : 0;
            const canUpgrade = skill.unlocked && level < MAX_SKILL_LEVEL && coreStones >= stoneCost && gold >= goldCost;

            return (
              <div
                key={skill.id}
                className={cn(
                  'group relative bg-[#04060c] border-l-[6px] rounded-xl transition-all duration-500 overflow-hidden',
                  style.border,
                  skill.unlocked ? `shadow-xl ${style.glow}` : 'opacity-30'
                )}
              >
                <div className={cn('absolute inset-0 opacity-10', style.bg)} />

                {!skill.unlocked && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 rounded-xl backdrop-blur-md">
                    <Lock className="w-10 h-10 text-zinc-700 mb-2" />
                    <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest border border-zinc-800 px-4 py-1 rounded-lg">
                      {t('abilities.locked')}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start gap-5 mb-5 relative z-10">
                    <div className={cn('p-5 rounded-3xl border-2 bg-black shadow-2xl relative', style.border, style.text)}>
                      {skill.icon}
                      <div className="absolute -top-3 -end-3 bg-black border-2 border-zinc-700 px-3 py-1 rounded-md text-[9px] font-black italic text-zinc-100/70">
                        {skill.tag}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <h3 className="text-xl font-black text-white tracking-tight drop-shadow-[0_0_10px_currentColor]">{skill.name}</h3>
                        <span className={cn('text-[11px] font-mono font-bold uppercase whitespace-nowrap', style.text)}>{skill.nameEn}</span>
                      </div>
                      <p className="text-[12px] text-zinc-300 leading-relaxed italic border-s-2 border-zinc-700 ps-3">"{skill.description}"</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-black/50 p-4 rounded-xl border-2 border-zinc-800 mb-5 relative z-10">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{t('abilities.matrix')}</span>
                        <span className={cn('text-sm font-black italic', style.text)}>RANK {RANK_LABELS[idx]}</span>
                      </div>
                      <div className="flex gap-1.5 h-2">
                        {[...Array(MAX_SKILL_LEVEL)].map((_, i) => (
                          <div key={i} className={cn('flex-1 rounded-full transition-all duration-500', i < level ? style.bar : 'bg-zinc-800')} />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter flex items-center gap-1">
                          <Zap size={10} /> {t('abilities.manaOutput')}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-white font-black text-base">{currentDmg.toLocaleString()}</span>
                          {level < MAX_SKILL_LEVEL && <span className="text-blue-300 text-[11px] font-bold">▲ {nextDmg.toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter flex items-center gap-1">
                          <Hourglass size={10} /> {t('abilities.castTime')}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-white font-black text-base">{currentCastTime.toFixed(1)}s</span>
                          {level < MAX_SKILL_LEVEL && <span className="text-blue-300 text-[11px] font-bold">▼ {nextCastTime.toFixed(1)}s</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-950/20 border border-blue-800/30 rounded-xl">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span className="text-[11px] font-black text-blue-300 uppercase">{t('abilities.manaCost')}: {skill.mpCost} MP</span>
                    </div>

                    {level < MAX_SKILL_LEVEL ? (
                      <button
                        onClick={() => upgradeSkill(skill.id)}
                        disabled={!canUpgrade}
                        className={cn(
                          'flex-1 min-w-[180px] h-12 rounded-xl border-b-4 font-black text-[11px] uppercase tracking-widest transition-all active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2 shadow-lg px-3',
                          canUpgrade
                            ? `bg-gradient-to-br ${style.btn} text-white hover:brightness-125`
                            : 'bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed'
                        )}
                      >
                        <ArrowUp size={14} className={canUpgrade ? 'animate-bounce' : ''} />
                        <span>{t('abilities.upgrade')}</span>
                        <span className="flex items-center gap-1">💎 {stoneCost}</span>
                        <span className="flex items-center gap-1"><Coins size={12} /> {goldCost}</span>
                      </button>
                    ) : (
                      <div className="flex-1 h-12 rounded-xl bg-gradient-to-r from-zinc-800 to-black border-2 border-zinc-700/50 flex items-center justify-center gap-2.5 text-zinc-500 text-[11px] font-black uppercase italic shadow-inner">
                        <Sparkles size={16} className="text-white/30 animate-pulse" />
                        {t('abilities.maxed')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative p-5 rounded-3xl bg-black border-2 border-zinc-800 overflow-hidden shadow-2xl">
          <div className="absolute top-0 end-0 p-3 opacity-5">
            <ShieldAlert className="w-20 h-20 text-white" />
          </div>
          <h4 className="text-[11px] font-black text-zinc-300 mb-4 tracking-[0.3em] flex items-center gap-2">
            <Hexagon className="w-3.5 h-3.5 text-blue-400" /> {t('abilities.protocols')}
          </h4>
          <div className="grid grid-cols-1 gap-y-2">
            {STONE_COSTS.slice(1).map((stone, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-950/50 p-2 rounded-lg border border-zinc-800 gap-2 flex-wrap">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  RANK {RANK_LABELS[i]} → {RANK_LABELS[i + 1]}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-100 font-bold">×{SKILL_LEVEL_MULTIPLIERS[i + 1].toFixed(1)}</span>
                  <span className="text-[11px] text-blue-400 font-black">💎 {stone}</span>
                  <span className="text-[11px] text-yellow-400 font-black flex items-center gap-1"><Coins size={10} /> {GOLD_COSTS[i + 1]}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-zinc-600 mt-5 italic border-t-2 border-zinc-800 pt-3 flex items-center gap-2">
            <Lock size={10} /> {t('abilities.warning')}
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Abilities;
