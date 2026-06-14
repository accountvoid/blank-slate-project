import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Swords, Zap, Heart, Battery, ArrowLeft, Shield, Wind, Eye, Flame, Star, Trophy, Coins, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';

interface DamagePopup {
  id: number;
  value: number;
  x: number;
  y: number;
  isCrit: boolean;
  isPlayer?: boolean;
  isDodge?: boolean;
}

interface LootItem {
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  amount?: number;
}

interface BossConfig {
  name: string;
  rank: string;
  image: string;
  color: string;
  hpMultiplier: number;
  attackPower: number;
  attackSpeed: number;
  dodgeChance: number;
}

const BOSSES_BY_RANK: Record<string, BossConfig> = {
  E: { name: 'عنكبوت الظل', rank: 'E', image: '/BoosSnowSpider.png', color: '#6b7280', hpMultiplier: 10, attackPower: 15, attackSpeed: 3000, dodgeChance: 0.08 },
  D: { name: 'ذئب الصحراء', rank: 'D', image: '/BoosSnowSpider.png', color: '#22c55e', hpMultiplier: 20, attackPower: 30, attackSpeed: 3000, dodgeChance: 0.12 },
  C: { name: 'فارس الظلام', rank: 'C', image: '/BoosSnowSpider.png', color: '#3b82f6', hpMultiplier: 35, attackPower: 55, attackSpeed: 3000, dodgeChance: 0.18 },
  B: { name: 'تنين الجليد', rank: 'B', image: '/BoosSnowSpider.png', color: '#a855f7', hpMultiplier: 60, attackPower: 90, attackSpeed: 3000, dodgeChance: 0.22 },
  A: { name: 'ملك الوحوش', rank: 'A', image: '/BoosSnowSpider.png', color: '#f59e0b', hpMultiplier: 100, attackPower: 150, attackSpeed: 3000, dodgeChance: 0.28 },
  S: { name: 'إمبراطور الظلام', rank: 'S', image: '/BoosSnowSpider.png', color: '#ef4444', hpMultiplier: 200, attackPower: 250, attackSpeed: 3000, dodgeChance: 0.35 },
};

const LOOT_TABLE: Record<string, LootItem[]> = {
  E: [{ name: 'ذهب', icon: '🪙', rarity: 'common', amount: 50 }, { name: 'حجر مانا صغير', icon: '💎', rarity: 'common' }],
  D: [{ name: 'ذهب', icon: '🪙', rarity: 'common', amount: 150 }, { name: 'جرعة شفاء', icon: '🧪', rarity: 'common' }, { name: 'درع خفيف', icon: '🛡️', rarity: 'rare' }],
  C: [{ name: 'ذهب', icon: '🪙', rarity: 'rare', amount: 400 }, { name: 'سيف العاصفة', icon: '⚔️', rarity: 'rare' }, { name: 'حجر مانا نادر', icon: '💠', rarity: 'rare' }],
  B: [{ name: 'ذهب', icon: '🪙', rarity: 'epic', amount: 800 }, { name: 'خوذة الظلام', icon: '⛑️', rarity: 'epic' }, { name: 'خاتم القوة', icon: '💍', rarity: 'epic' }],
  A: [{ name: 'ذهب', icon: '🪙', rarity: 'legendary', amount: 2000 }, { name: 'درع التنين', icon: '🐉', rarity: 'legendary' }, { name: 'عباءة الخفاء', icon: '🧥', rarity: 'epic' }],
  S: [{ name: 'ذهب', icon: '🪙', rarity: 'legendary', amount: 5000 }, { name: 'سيف القيامة', icon: '⚔️', rarity: 'legendary' }, { name: 'تاج الإمبراطور', icon: '👑', rarity: 'legendary' }],
};

const RARITY_COLORS: Record<string, string> = { common: '#9ca3af', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' };

const getBaseDamage = (strengthLevel: number): number => {
  if (strengthLevel <= 1) return 1;
  if (strengthLevel <= 10) return Math.max(1, Math.floor(Math.pow(1000, (strengthLevel - 1) / 9)));
  return Math.floor(1000 + Math.pow(strengthLevel - 10, 0.7) * 100);
};

const getAgilityDodge = (agiLevel: number): number => Math.min(0.5, 0.02 * agiLevel);
const getAgilitySpeedBonus = (agiLevel: number): number => Math.min(0.5, 0.01 * agiLevel);
const getIntCounterChance = (intLevel: number): number => Math.min(0.4, 0.015 * intLevel);
const getSpiritHitBonus = (spiLevel: number): number => Math.min(0.3, 0.01 * spiLevel);
const getSpiritDmgBonus = (spiLevel: number): number => 1 + Math.min(0.5, 0.01 * spiLevel);
const getSpiritReveal = (spiLevel: number): boolean => spiLevel >= 5;

const SKILL_LEVEL_MULTIPLIERS = [1, 1.3, 1.6, 2.0, 2.5, 3.0];
const DARK_VOID_CHARGE_REQUIRED = 15;

const getSkillLevels = () => {
  try {
    const stored = localStorage.getItem('battle_skill_levels');
    if (stored) return JSON.parse(stored);
  } catch {}
  return { basicAttack: 1, thunderDash: 1, daggerStrike: 1, swordStrike: 1, darkVoid: 1 };
};

const HunterBattle = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { gameState } = useGameState();

  const gateRank = (searchParams.get('rank') || 'E').toUpperCase();
  const bossConfig = BOSSES_BY_RANK[gateRank] || BOSSES_BY_RANK['E'];

  const strengthLevel = gameState.levels.strength || 1;
  const agilityLevel = gameState.levels.agility || 1;
  const intLevel = gameState.levels.mind || 1;
  const spiritLevel = gameState.levels.spirit || 1;
  const playerLevel = gameState.totalLevel || 1;
  const playerName = gameState.playerName || 'Hunter';
  const hasDagger = (gameState.inventory || []).some(i => i.id === 'dagger' && i.quantity > 0);
  const skillLevels = getSkillLevels();
  const canUseDarkVoid = playerLevel >= 25;

  const baseDmg = getBaseDamage(strengthLevel);
  const spiDmgMult = getSpiritDmgBonus(spiritLevel);
  const basicDmg = Math.floor(baseDmg * spiDmgMult * SKILL_LEVEL_MULTIPLIERS[Math.min((skillLevels.basicAttack || 1) - 1, 5)]);
  const swordDmg = Math.floor(baseDmg * 1.8 * spiDmgMult * SKILL_LEVEL_MULTIPLIERS[Math.min((skillLevels.swordStrike || 1) - 1, 5)]);
  const thunderDmg = Math.floor(baseDmg * 3 * spiDmgMult * SKILL_LEVEL_MULTIPLIERS[Math.min((skillLevels.thunderDash || 1) - 1, 5)]);
  const daggerDmg = Math.floor(baseDmg * 2 * spiDmgMult * SKILL_LEVEL_MULTIPLIERS[Math.min((skillLevels.daggerStrike || 1) - 1, 5)]);
  const darkVoidDmg = Math.floor(baseDmg * 8 * spiDmgMult * SKILL_LEVEL_MULTIPLIERS[Math.min((skillLevels.darkVoid || 1) - 1, 5)]);

  const playerDodgeChance = getAgilityDodge(agilityLevel);
  const counterChance = getIntCounterChance(intLevel);
  const spiHitBonus = getSpiritHitBonus(spiritLevel);
  const canRevealBossHP = getSpiritReveal(spiritLevel);

  const hpVariance = useMemo(() => 0.8 + Math.random() * 0.4, []);
  const maxBossHP = Math.max(100, Math.floor(baseDmg * bossConfig.hpMultiplier * hpVariance));
  const [bossHP, setBossHP] = useState(maxBossHP);
  const maxPlayerHP = gameState.maxHp || (2000 + playerLevel * 50);
  const maxPlayerMana = gameState.maxEnergy || (150 + playerLevel * 5);
  const [playerHP, setPlayerHP] = useState(maxPlayerHP);
  const [playerMana, setPlayerMana] = useState(maxPlayerMana);

  const [isAttacking, setIsAttacking] = useState(false);
  const [isBossHit, setIsBossHit] = useState(false);
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [isBossAdvancing, setIsBossAdvancing] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  
  const logRef = useRef<string[]>(['⚔️ المعركة بدأت!']);
  const [latestLog, setLatestLog] = useState<string>('⚔️ المعركة بدأت!');

  const pushLog = useCallback((msg: string) => {
    logRef.current = [msg, ...logRef.current.slice(0, 4)];
    setLatestLog(msg);
  }, []);

  const [screenShake, setScreenShake] = useState(false);
  const [thunderFlash, setThunderFlash] = useState(false);
  const [slashEffect, setSlashEffect] = useState(false);
  const [thunderBoltEffect, setThunderBoltEffect] = useState(false);
  const [daggerEffect, setDaggerEffect] = useState(false);
  const [swordEffect, setSwordEffect] = useState(false);
  const [darkVoidEffect, setDarkVoidEffect] = useState(false);

  const [swordCooldown, setSwordCooldown] = useState(0);
  const [thunderCooldown, setThunderCooldown] = useState(0);
  const [daggerCooldown, setDaggerCooldown] = useState(0);

  const [ragingSpeedActive, setRagingSpeedActive] = useState(false);
  const [ragingSpeedCooldown, setRagingSpeedCooldown] = useState(0);
  const [ragingSpeedTimer, setRagingSpeedTimer] = useState(0);
  const [dodgedAttack, setDodgedAttack] = useState(false);

  const [darkVoidCharge, setDarkVoidCharge] = useState(0);
  const [bossFury, setBossFury] = useState(0);
  const [ultimateFuryActive, setUltimateFuryActive] = useState(false);

  const [showVictory, setShowVictory] = useState(false);
  const [showLoot, setShowLoot] = useState(false);
  const [lootItems, setLootItems] = useState<LootItem[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  const bossHPPercent = (bossHP / maxBossHP) * 100;
  const playerHPPercent = (playerHP / maxPlayerHP) * 100;
  const playerManaPercent = (playerMana / maxPlayerMana) * 100;
  const isBossDead = bossHP <= 0;
  const isPlayerDead = playerHP <= 0;
  const battleOver = isBossDead || isPlayerDead || showVictory || showLoot;
  const isDarkVoidReady = darkVoidCharge >= DARK_VOID_CHARGE_REQUIRED;

  const addDamagePopup = useCallback((value: number, isCrit: boolean, isPlayer = false, isDodge = false) => {
    const id = Date.now() + Math.random();
    const x = 20 + Math.random() * 60;
    const y = 10 + Math.random() * 50;
    setDamagePopups(prev => [...prev, { id, value, x, y, isCrit, isPlayer, isDodge }]);
    setTimeout(() => setDamagePopups(prev => prev.filter(p => p.id !== id)), 1500);
  }, []);

  useEffect(() => {
    if (battleOver) return;
    const interval = setInterval(() => {
      setSwordCooldown(p => Math.max(0, p - 1));
      setThunderCooldown(p => Math.max(0, p - 1));
      setDaggerCooldown(p => Math.max(0, p - 1));
      setRagingSpeedCooldown(p => Math.max(0, p - 1));
      setRagingSpeedTimer(p => { if (p <= 1) { setRagingSpeedActive(false); return 0; } return p - 1; });
      setPlayerMana(p => Math.min(maxPlayerMana, p + 2));
    }, 1000);
    return () => clearInterval(interval);
  }, [battleOver, maxPlayerMana]);

  useEffect(() => {
    if (battleOver) return;
    if (bossHPPercent < 25 && bossFury < 100) setBossFury(100);
  }, [bossHPPercent, battleOver, bossFury]);

  useEffect(() => {
    if (bossFury >= 100 && !ultimateFuryActive && !battleOver) {
      setUltimateFuryActive(true);
      setScreenShake(true);
      pushLog('🔥💀 Ultimate Fury! غغب مطلق!');
      setTimeout(() => setScreenShake(false), 1000);
    }
  }, [bossFury, ultimateFuryActive, battleOver, pushLog]);

  const attemptDamage = useCallback((dmg: number, isCrit: boolean, label: string) => {
    const effectiveDodge = Math.max(0, bossConfig.dodgeChance - spiHitBonus);
    if (Math.random() < effectiveDodge) {
      addDamagePopup(0, false, false, true);
      pushLog(`🛡️ ${bossConfig.name} تفادى!`);
      return;
    }
    setIsBossHit(true);
    setScreenShake(true);
    setBossHP(p => Math.max(0, p - dmg));
    addDamagePopup(dmg, isCrit);
    setComboCount(p => p + 1);
    setDarkVoidCharge(p => Math.min(DARK_VOID_CHARGE_REQUIRED, p + 1));
    pushLog(label);
    setTimeout(() => { setIsBossHit(false); setScreenShake(false); }, 400);
  }, [bossConfig, spiHitBonus, addDamagePopup, pushLog]);

  useEffect(() => {
    if (battleOver) return;
    const speedReduction = getAgilitySpeedBonus(agilityLevel);
    const adjustedSpeed = Math.max(1500, bossConfig.attackSpeed * (1 - speedReduction));
    const interval = setInterval(() => {
      if (bossHP <= 0 || playerHP <= 0) return;
      setIsBossAdvancing(true);
      setTimeout(() => {
        setIsBossAdvancing(false);
        const totalDodge = ragingSpeedActive ? Math.min(0.9, playerDodgeChance + 0.5) : playerDodgeChance;
        if (Math.random() < totalDodge) {
          setDodgedAttack(true);
          addDamagePopup(0, false, true, true);
          pushLog('💨 تفادي!');
          setTimeout(() => setDodgedAttack(false), 600);
          if (Math.random() < counterChance) {
            const counterDmg = Math.floor(basicDmg * 1.5);
            setTimeout(() => {
              attemptDamage(counterDmg, true, `🔄💥 ضربة مضادة → ${counterDmg.toLocaleString()}`);
            }, 300);
            pushLog('🧠 توقع الهجوم! ضربة مضادة!');
          }
          return;
        }
        const furyMult = ultimateFuryActive ? 3 : 1;
        const bossDmg = Math.floor((bossConfig.attackPower + Math.floor(Math.random() * bossConfig.attackPower * 0.5)) * furyMult);
        setIsPlayerHit(true);
        setPlayerHP(p => Math.max(0, p - bossDmg));
        addDamagePopup(bossDmg, ultimateFuryActive, true);
        setScreenShake(true);
        pushLog(`${ultimateFuryActive ? '🔥' : '🕷️'} ${bossConfig.name} → ${bossDmg}`);
        setTimeout(() => { setIsPlayerHit(false); setScreenShake(false); }, 400);
      }, 600);
    }, adjustedSpeed);
    return () => clearInterval(interval);
  }, [battleOver, bossHP, playerHP, ragingSpeedActive, ultimateFuryActive, bossConfig, addDamagePopup, playerDodgeChance, counterChance, agilityLevel, basicDmg, attemptDamage, pushLog]);

  const basicAttack = useCallback(() => {
    if (isAttacking || battleOver || playerMana < 5) return;
    setIsAttacking(true);
    setPlayerMana(p => p - 5);
    const isCrit = Math.random() < 0.15;
    const finalDmg = isCrit ? Math.floor(basicDmg * 2) : basicDmg;
    setSlashEffect(true);
    setTimeout(() => {
      attemptDamage(finalDmg, isCrit, `${isCrit ? '💥' : '⚔️'} ضربة → ${finalDmg.toLocaleString()}`);
      setTimeout(() => setSlashEffect(false), 400);
    }, 200);
    setTimeout(() => setIsAttacking(false), 400);
  }, [isAttacking, battleOver, playerMana, basicDmg, attemptDamage]);

  const swordStrike = useCallback(() => {
    if (isAttacking || battleOver || swordCooldown > 0 || playerMana < 15) return;
    setIsAttacking(true);
    setPlayerMana(p => p - 15);
    const isCrit = Math.random() < 0.2;
    const finalDmg = isCrit ? Math.floor(swordDmg * 2) : swordDmg;
    setSwordEffect(true);
    setScreenShake(true);
    setTimeout(() => {
      attemptDamage(finalDmg, isCrit, `${isCrit ? '🗡️💥' : '🗡️'} السيف → ${finalDmg.toLocaleString()}`);
      setTimeout(() => { setSwordEffect(false); setScreenShake(false); }, 400);
    }, 300);
    setSwordCooldown(4);
    setTimeout(() => setIsAttacking(false), 700);
  }, [isAttacking, battleOver, swordCooldown, playerMana, swordDmg, attemptDamage]);

  const thunderDash = useCallback(() => {
    if (isAttacking || battleOver || thunderCooldown > 0 || playerMana < 50) return;
    setIsAttacking(true);
    setPlayerMana(p => p - 50);
    const isCrit = Math.random() < 0.25;
    const finalDmg = isCrit ? Math.floor(thunderDmg * 2.5) : thunderDmg;
    setThunderBoltEffect(true);
    setScreenShake(true);
    setTimeout(() => { setThunderFlash(true); setTimeout(() => setThunderFlash(false), 150); }, 200);
    setTimeout(() => {
      attemptDamage(finalDmg, isCrit, `${isCrit ? '⚡💥' : '⚡'} البرق → ${finalDmg.toLocaleString()}`);
      setTimeout(() => { setScreenShake(false); setThunderBoltEffect(false); }, 500);
    }, 400);
    setThunderCooldown(8);
    setTimeout(() => setIsAttacking(false), 900);
  }, [isAttacking, battleOver, thunderCooldown, playerMana, thunderDmg, attemptDamage]);

  const daggerStrikeAction = useCallback(() => {
    if (!hasDagger || isAttacking || battleOver || daggerCooldown > 0 || playerMana < 25) return;
    setIsAttacking(true);
    setPlayerMana(p => p - 25);
    const isCrit = Math.random() < 0.3;
    const finalDmg = isCrit ? Math.floor(daggerDmg * 2) : daggerDmg;
    setDaggerEffect(true);
    setScreenShake(true);
    setTimeout(() => {
      attemptDamage(finalDmg, isCrit, `${isCrit ? '🗡️💥' : '🗡️'} خنجر → ${finalDmg.toLocaleString()}`);
      setTimeout(() => { setDaggerEffect(false); setScreenShake(false); }, 400);
    }, 300);
    setDaggerCooldown(5);
    setTimeout(() => setIsAttacking(false), 700);
  }, [hasDagger, isAttacking, battleOver, daggerCooldown, playerMana, daggerDmg, attemptDamage]);

  const darkVoidStrike = useCallback(() => {
    if (!canUseDarkVoid || isAttacking || battleOver || darkVoidCharge < DARK_VOID_CHARGE_REQUIRED) return;
    setIsAttacking(true);
    setDarkVoidCharge(0);
    const isCrit = Math.random() < 0.4;
    const finalDmg = isCrit ? Math.floor(darkVoidDmg * 3) : darkVoidDmg;
    setDarkVoidEffect(true);
    setScreenShake(true);
    setTimeout(() => {
      attemptDamage(finalDmg, isCrit, `${isCrit ? '🌑💥' : '🌑'} ثقب الظلام → ${finalDmg.toLocaleString()}`);
      setTimeout(() => { setDarkVoidEffect(false); setScreenShake(false); }, 800);
    }, 500);
    setTimeout(() => setIsAttacking(false), 1200);
  }, [canUseDarkVoid, isAttacking, battleOver, darkVoidCharge, darkVoidDmg, attemptDamage]);

  const activateRagingSpeed = useCallback(() => {
    if (battleOver || ragingSpeedCooldown > 0 || ragingSpeedActive || playerMana < 75) return;
    setPlayerMana(p => p - 75);
    setRagingSpeedActive(true);
    setRagingSpeedTimer(8);
    setRagingSpeedCooldown(20);
    pushLog('💨 Raging Speed! تفادي 80-85%!');
  }, [battleOver, ragingSpeedCooldown, ragingSpeedActive, playerMana, pushLog]);

  useEffect(() => { const t = setTimeout(() => setComboCount(0), 5000); return () => clearTimeout(t); }, [comboCount]);

  useEffect(() => {
    if (isBossDead && !showVictory) {
      setTimeout(() => {
        setShowVictory(true);
        const xp = Math.floor(maxBossHP * 0.02);
        setXpGained(xp);
        const loot = LOOT_TABLE[gateRank] || LOOT_TABLE['E'];
        setLootItems(loot);
      }, 1500);
    }
  }, [isBossDead, showVictory, maxBossHP, gateRank]);

  const handleShowLoot = () => { setShowVictory(false); setShowLoot(true); };
  const handleFinish = () => navigate(-1);

  const resetBattle = () => {
    setPlayerHP(maxPlayerHP); setPlayerMana(maxPlayerMana); setBossHP(maxBossHP);
    setComboCount(0); setSwordCooldown(0); setThunderCooldown(0); setDaggerCooldown(0);
    setRagingSpeedCooldown(0); setRagingSpeedActive(false); setRagingSpeedTimer(0);
    setBossFury(0); setUltimateFuryActive(false); setDarkVoidCharge(0);
    setShowVictory(false); setShowLoot(false); setShowLevelUp(false);
    logRef.current = ['⚔️ المعركة بدأت!'];
    setLatestLog('⚔️ المعركة بدأت!');
    setDamagePopups([]);
  };

  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 3,
      width: `${1 + Math.random() * 2}px`,
      height: `${1 + Math.random() * 2}px`,
      background: i % 3 === 0 ? 'rgba(6,182,212,0.5)' : i % 3 === 1 ? 'rgba(168,85,247,0.4)' : `${bossConfig.color}55`,
      left: `${5 + Math.random() * 90}%`,
      top: `${10 + Math.random() * 80}%`,
    }));
  }, [bossConfig.color]);

  return (
    <div className={`h-screen bg-[#080710] text-white flex flex-col overflow-hidden relative select-none font-sans ${screenShake ? 'animate-screen-shake' : ''}`} dir="rtl">
      {thunderFlash && <div className="absolute inset-0 z-50 bg-yellow-200/40 pointer-events-none" style={{ animation: 'flash 0.1s ease-out 3' }} />}
      {ultimateFuryActive && (
        <motion.div className="absolute inset-0 z-40 pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(139,0,0,0.6) 100%)' }}
        />
      )}
      {dodgedAttack && <div className="absolute inset-0 z-40 pointer-events-none bg-cyan-400/10" style={{ animation: 'flash 0.15s ease-out 2' }} />}

      <AnimatePresence>
        {darkVoidEffect && (
          <motion.div className="absolute inset-0 z-45 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-purple-950/70" />
            <motion.div
              className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full"
              initial={{ scale: 0, x: '-50%', y: '-50%' }}
              animate={{ scale: 2, x: '-50%', y: '-50%' }}
              transition={{ duration: 1 }}
              style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.95) 0%, rgba(88,28,135,0.5) 40%, transparent 70%)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* شاشة المعركة العلوية (مقسمة لجزئين متقابلين بناءً على الصورة المرفقة) */}
      <div className="relative flex-1 min-h-0 flex flex-col justify-between p-4 pb-2">
        
        {/* زر العودة والرانك وعداد الكومبو */}
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
          <button onClick={() => navigate(-1)} className="pointer-events-auto bg-black/40 border border-white/10 p-2 rounded-xl hover:bg-white/10 transition-all active:scale-90">
            <ArrowLeft size={18} className="text-white/70" />
          </button>
          
          <div className="px-5 py-1 text-xs font-black tracking-widest rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
            RANK {bossConfig.rank}
          </div>

          <AnimatePresence>
            {comboCount > 1 && (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                <motion.div className="text-orange-400 font-black italic text-lg" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
                  {comboCount}x COMBO
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* المؤثرات البصرية وتدفق الخلفية */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {particles.map((p) => (
            <motion.div key={p.id} className="absolute rounded-full"
              animate={{ y: [0, -20, 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
              style={{ width: p.width, height: p.height, background: p.background, left: p.left, top: p.top }}
            />
          ))}
        </div>

        {/* قسم البوس (العدو) - الجهة العلوية اليمنى بالكامل */}
        <div className="flex justify-between items-start gap-4 mt-12 z-10 relative">
          
          {/* كرت ومعلومات اللاعب الأساسية - جهة اليسار */}
          <div className="flex-1 max-w-[48%] bg-black/30 border border-white/5 rounded-2xl p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/20 overflow-hidden shrink-0 flex items-center justify-center">
                <img src="/UserPersonality.png" alt="Player" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-white truncate text-left">{playerName}</div>
                <div className="text-[10px] font-bold text-cyan-400 text-left">مستوى {playerLevel}</div>
              </div>
            </div>

            {/* شريط الحياة للاعب */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono">
                <span className="font-bold text-emerald-400">HP</span>
                <span>{playerHP} / {maxPlayerHP}</span>
              </div>
              <div className="h-2 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${playerHPPercent}%` }}
                  style={{ background: playerHPPercent > 50 ? 'linear-gradient(90deg, #10b981, #34d399)' : playerHPPercent > 20 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)' }}
                />
              </div>
            </div>

            {/* شريط المانا للاعب */}
            <div className="space-y-1 mt-2">
              <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono">
                <span className="font-bold text-blue-400">MP</span>
                <span>{playerMana} / {maxPlayerMana}</span>
              </div>
              <div className="h-1.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${playerManaPercent}%` }}
                  style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
                />
              </div>
            </div>
          </div>

          {/* كرت ومعلومات البوس - جهة اليمين المتناسقة تماماً */}
          <div className="flex-1 max-w-[48%] bg-black/30 border border-white/5 rounded-2xl p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2 flex-row-reverse">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-400/20 overflow-hidden shrink-0 flex items-center justify-center">
                <img src={bossConfig.image} alt="Boss Avatar" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <div className="text-xs font-black text-white truncate">{bossConfig.name}</div>
                <div className="text-[10px] font-bold text-red-400">الرتبة {bossConfig.rank}</div>
              </div>
            </div>

            {/* شريط حياة البوس */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono flex-row-reverse">
                <span className="font-bold text-red-500">HP</span>
                <span>{bossHP} / {maxBossHP}</span>
              </div>
              <div className="h-2 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${bossHPPercent}%` }}
                  style={{ background: `linear-gradient(90deg, ${bossConfig.color}, #f87171)` }}
                />
              </div>
            </div>

            {/* عداد غضب البوس المدمج */}
            <div className="space-y-1 mt-2">
              <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono flex-row-reverse">
                <span className="font-bold text-orange-400">RAGE</span>
                <span>{Math.floor(bossFury)}%</span>
              </div>
              <div className="h-1.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${bossFury}%` }}
                  style={{ background: 'linear-gradient(90deg, #ea580c, #f97316)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ساحة العرض المركزي للمجسمات (البوس واللاعب متواجهين في المنتصف بدقة) */}
        <div className="flex-1 flex items-center justify-between px-6 relative my-auto min-h-[180px] z-10">
          
          {/* مجسم اللاعب يساراً */}
          <motion.div className="relative"
            animate={{ x: isAttacking ? 30 : isPlayerHit ? -15 : 0, scale: isAttacking ? 1.1 : 1, filter: isPlayerHit ? 'brightness(2)' : 'brightness(1)' }}
            transition={{ duration: 0.2 }}
          >
            <img src="/UserPersonality.png" alt="Player Character" className="w-24 h-24 object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]" style={{ transform: 'scaleX(-1)' }} />
            
            {damagePopups.filter(p => p.isPlayer).map(popup => (
              <motion.div key={popup.id} className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 font-black italic text-lg" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -40 }} transition={{ duration: 1.2 }}>
                {popup.isDodge ? <span className="text-cyan-400">DODGE!</span> : <span className="text-red-500">-{popup.value}</span>}
              </motion.div>
            ))}
          </motion.div>

          {/* الفاصل الزمني والـ VS في المنتصف */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <span className="text-4xl font-black italic tracking-widest text-zinc-700">VS</span>
          </div>

          {/* مجسم البوس يميناً */}
          <motion.div className="relative"
            animate={{ scale: isBossHit ? 0.9 : isBossAdvancing ? 1.1 : 1, x: isBossAdvancing ? -30 : 0, filter: isBossHit ? 'brightness(2)' : 'brightness(1)' }}
            transition={{ duration: 0.2 }}
          >
            <img src={bossConfig.image} alt="Boss Character" className="w-28 h-28 object-contain drop-shadow-[0_0_35px_rgba(239,68,68,0.4)]" />
            
            {damagePopups.filter(p => !p.isPlayer).map(popup => (
              <motion.div key={popup.id} className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 font-black italic text-xl" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -40 }} transition={{ duration: 1.2 }}>
                {popup.isDodge ? <span className="text-zinc-400">MISS</span> : <span className={popup.isCrit ? "text-yellow-400 text-2xl" : "text-white"}>-{popup.value}</span>}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* تأثيرات الضربات والقطع */}
        <AnimatePresence>{slashEffect && <div className="absolute inset-0 pointer-events-none flex items-center justify-center"><div className="w-full h-1 bg-white animate-pulse" /></div>}</AnimatePresence>
        <AnimatePresence>{swordEffect && <div className="absolute inset-0 pointer-events-none bg-amber-500/10" />}</AnimatePresence>
        <AnimatePresence>{daggerEffect && <div className="absolute inset-0 pointer-events-none bg-purple-500/10" />}</AnimatePresence>
        <AnimatePresence>{thunderBoltEffect && <div className="absolute inset-0 pointer-events-none bg-yellow-500/10" />}</AnimatePresence>

      </div>

      {/* لوحة التحكم والمهارات السفلية المصممة بشكل احترافي وجريء طبق الأصل */}
      <div className="relative z-20 bg-[#0e0d1a] border-t border-white/5 rounded-t-[2.5rem] p-5 pt-6 space-y-4 shadow-[0_-15px_30px_rgba(0,0,0,0.6)]">
        
        {/* شريط السجلات المطور واللوق البسيط */}
        <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-zinc-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shrink-0" />
            <span className="truncate text-zinc-300 font-mono text-right">{latestLog}</span>
          </div>
          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider ml-2">LOG</span>
        </div>

        {/* المهارات القتالية الأساسية */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-zinc-400 px-1">
            <Swords size={14} className="text-zinc-500" />
            <span>المهارات الهجومية</span>
          </div>
          <div className={`grid gap-2.5 ${hasDagger ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <SkillBtn onClick={basicAttack} disabled={isAttacking || battleOver || playerMana < 5} icon={<Swords size={16} />} name="ضربة" dmg={basicDmg} mpCost={5} color="cyan" />
            <SkillBtn onClick={swordStrike} disabled={isAttacking || battleOver || swordCooldown > 0 || playerMana < 15} icon={<Flame size={16} />} name="السيف" dmg={swordDmg} mpCost={15} cooldown={swordCooldown} color="amber" />
            <SkillBtn onClick={thunderDash} disabled={isAttacking || battleOver || thunderCooldown > 0 || playerMana < 50} icon={<Zap size={16} />} name="البرق" dmg={thunderDmg} mpCost={50} cooldown={thunderCooldown} color="yellow" />
            {hasDagger && (
              <SkillBtn onClick={daggerStrikeAction} disabled={!hasDagger || isAttacking || battleOver || daggerCooldown > 0 || playerMana < 25} icon={<Shield size={16} />} name="خنجر" dmg={daggerDmg} mpCost={25} cooldown={daggerCooldown} color="purple" />
            )}
          </div>
        </div>

        {/* المهارات الإضافية والخاصة */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-zinc-400 px-1">
            <Zap size={14} className="text-zinc-500" />
            <span>القدرات الخاصة</span>
          </div>
          <div className={`grid gap-2.5 ${canUseDarkVoid ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button onClick={activateRagingSpeed} disabled={battleOver || ragingSpeedCooldown > 0 || ragingSpeedActive || playerMana < 75}
              className={`relative flex items-center justify-between p-3 rounded-xl border transition-all overflow-hidden ${battleOver || ragingSpeedCooldown > 0 || ragingSpeedActive || playerMana < 75 ? 'bg-zinc-900/40 border-zinc-800/50 opacity-40' : 'bg-gradient-to-r from-teal-950/40 to-teal-900/20 border-teal-500/30 hover:border-teal-400/50 active:scale-95'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400"><Wind size={16} /></div>
                <div className="text-right">
                  <span className="text-xs font-black text-white block">سرعة جنونية (تفادي)</span>
                  <span className="text-[10px] text-zinc-500">تفادي فائق للهجمات</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400 shrink-0">75 MP</span>
              {ragingSpeedCooldown > 0 && !ragingSpeedActive && <div className="absolute inset-0 bg-black/70 flex items-center justify-center font-bold text-teal-400">{ragingSpeedCooldown}s</div>}
              {ragingSpeedActive && <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center font-bold text-teal-300">{ragingSpeedTimer}s</div>}
            </button>

            {canUseDarkVoid && (
              <button onClick={darkVoidStrike} disabled={isAttacking || battleOver || !isDarkVoidReady}
                className={`relative flex items-center justify-between p-3 rounded-xl border transition-all overflow-hidden ${isAttacking || battleOver || !isDarkVoidReady ? 'bg-zinc-900/40 border-zinc-800/50 opacity-40' : 'bg-gradient-to-r from-purple-950/40 to-violet-900/20 border-purple-500/30 hover:border-purple-400/50 active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.15)]'}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><Eye size={16} /></div>
                  <div className="text-right">
                    <span className="text-xs font-black text-white block">ثقب الظلام</span>
                    <span className="text-[10px] text-zinc-500">ضربة قاضية مطلقة</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400 shrink-0">{darkVoidCharge}/{DARK_VOID_CHARGE_REQUIRED}</span>
                {!isDarkVoidReady && <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800"><div className="h-full bg-purple-500 transition-all" style={{ width: `${(darkVoidCharge / DARK_VOID_CHARGE_REQUIRED) * 100}%` }} /></div>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* المودالز والنوافذ العلوية عند الفوز أو الخسارة */}
      <AnimatePresence>
        {showVictory && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="text-center space-y-4 px-6" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <div className="text-4xl font-black italic tracking-widest text-cyan-400">VICTORY</div>
              <div className="text-zinc-400 text-xs">تمت تصفية بوابة العدو بنجاح!</div>
              <div className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-xl bg-black/40 border border-white/5 text-yellow-400">
                <Trophy size={16} /> {bossConfig.name}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-yellow-500 font-bold"><Star size={16} /> +{xpGained} XP</div>
              <button onClick={handleShowLoot} className="mt-2 px-6 py-2.5 bg-cyan-500 text-black font-black rounded-xl active:scale-95 transition-all text-xs">عرض الغنائم</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoot && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-[85%] max-w-sm bg-[#0e0d1a] border border-white/5 rounded-2xl p-5 space-y-4" initial={{ scale: 0.8 }}>
              <div className="flex items-center gap-2 text-cyan-400 font-black text-sm border-b border-white/5 pb-2"><Sparkles size={16} /> غنائم النظام المستخرجة</div>
              <div className="space-y-2">
                {lootItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <span className="text-xs font-bold block" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
                        <span className="text-[9px] uppercase text-zinc-500 tracking-wider">{item.rarity}</span>
                      </div>
                    </div>
                    {item.amount && <span className="text-xs font-bold text-yellow-400 font-mono">+{item.amount}</span>}
                  </div>
                ))}
              </div>
              <button onClick={handleFinish} className="w-full py-3 bg-cyan-500 text-black font-black rounded-xl active:scale-95 transition-all text-xs">تأكيد ومغادرة البوابة</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPlayerDead && !isBossDead && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="text-center space-y-4" initial={{ scale: 0.8 }}>
              <div className="text-4xl font-black italic tracking-widest text-red-500">DEFEAT</div>
              <div className="text-zinc-400 text-xs">لقد انهارت قواك داخل الزنزانة...</div>
              <button onClick={resetBattle} className="px-6 py-2.5 bg-red-500/20 border border-red-500/40 text-red-400 font-black rounded-xl active:scale-95 transition-all text-xs">إعادة محاولة الغارة</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes flash { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
        @keyframes screen-shake { 0%, 100% { transform: translate(0); } 10% { transform: translate(-3px, 1px); } 20% { transform: translate(3px, -1px); } 30% { transform: translate(-2px, -1px); } 40% { transform: translate(2px, 1px); } }
        .animate-screen-shake { animation: screen-shake 0.3s ease-out; }
      `}</style>
    </div>
  );
};

interface SkillBtnProps {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  name: string;
  dmg: number;
  mpCost: number;
  cooldown?: number;
  color: 'cyan' | 'amber' | 'yellow' | 'purple';
}

const colorMap = {
  cyan: { from: 'from-cyan-950/40', to: 'to-cyan-900/10', border: 'border-cyan-500/20', hover: 'hover:border-cyan-400/40', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  amber: { from: 'from-amber-950/40', to: 'to-amber-900/10', border: 'border-amber-500/20', hover: 'hover:border-amber-400/40', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  yellow: { from: 'from-yellow-950/40', to: 'to-yellow-900/10', border: 'border-yellow-500/20', hover: 'hover:border-yellow-400/40', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  purple: { from: 'from-purple-950/40', to: 'to-purple-900/10', border: 'border-purple-500/20', hover: 'hover:border-purple-400/40', text: 'text-purple-400', bg: 'bg-purple-500/10' },
};

const SkillBtn = ({ onClick, disabled, icon, name, dmg, mpCost, cooldown, color }: SkillBtnProps) => {
  const c = colorMap[color];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all overflow-hidden ${disabled ? 'bg-zinc-900/40 border-zinc-800/50 opacity-30' : `bg-gradient-to-b ${c.from} ${c.to} ${c.border} ${c.hover} active:scale-95`}`}
    >
      <div className={`mb-1 p-1 rounded-lg ${disabled ? 'bg-zinc-800/40' : c.bg} ${disabled ? 'text-zinc-600' : c.text}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black ${disabled ? 'text-zinc-500' : 'text-white'}`}>{name}</span>
      <span className="text-[9px] font-mono text-zinc-500 mt-0.5">{dmg.toLocaleString()}</span>
      <div className="flex items-center gap-0.5 mt-0.5">
        <Battery size={6} className="text-blue-400 opacity-60" />
        <span className="text-[8px] font-mono text-blue-400/70">{mpCost}</span>
      </div>
      {cooldown !== undefined && cooldown > 0 && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center font-mono font-black text-sm text-white">
          {cooldown}s
        </div>
      )}
    </button>
  );
};

export default HunterBattle;
