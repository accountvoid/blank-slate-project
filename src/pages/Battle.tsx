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
  
  // Optimization: Use ref for log tracking to avoid unneeded re-renders
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

  // Cache particles configuration to prevent recreating on every re-render
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
    <div className={`h-screen bg-black text-white flex flex-col overflow-hidden relative select-none ${screenShake ? 'animate-screen-shake' : ''}`} dir="ltr">
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

      <div className="relative flex-1 min-h-0 flex flex-col">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(10,20,50,1) 0%, rgba(3,3,12,1) 60%, #000 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(6,182,212,0.05) 0%, transparent 50%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 70%, rgba(239,68,68,0.04) 0%, transparent 50%)' }} />

        <div className="absolute bottom-0 left-0 right-0 h-[35%] overflow-hidden">
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(6,182,212,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.06) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              transform: 'perspective(500px) rotateX(65deg)',
              transformOrigin: 'bottom',
            }}
          />
          <motion.div className="absolute inset-0 bg-gradient-to-t from-cyan-950/15 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p) => (
            <motion.div key={p.id} className="absolute rounded-full"
              animate={{ y: [0, -20, 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
              style={{
                width: p.width, height: p.height,
                background: p.background,
                left: p.left, top: p.top,
              }}
            />
          ))}
        </div>

        <button onClick={() => navigate(-1)} className="absolute top-3 left-3 z-30 bg-black/70 border border-white/10 p-2 rounded-xl hover:bg-white/10 transition-all active:scale-90">
          <ArrowLeft size={16} className="text-white/70" />
        </button>

        <motion.div className="absolute top-3 left-1/2 -translate-x-1/2 z-20"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="px-6 py-1.5 text-[10px] font-black tracking-[0.5em] uppercase backdrop-blur-md rounded-lg border"
            style={{ borderColor: `${bossConfig.color}40`, backgroundColor: `${bossConfig.color}15`, color: bossConfig.color, boxShadow: `0 0 20px ${bossConfig.color}20` }}>
            RANK {bossConfig.rank}
          </div>
        </motion.div>

        {bossHPPercent < 50 && (
          <motion.div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 w-44"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[7px] text-red-400 font-bold tracking-[0.2em]">ULTIMATE FURY</span>
              <span className="text-[7px] text-red-300 ml-auto">{Math.floor(bossFury)}%</span>
            </div>
            <div className="h-2 bg-zinc-900 border border-red-500/20 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                animate={bossFury >= 100 ? { opacity: [0.7, 1, 0.7] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{
                  width: `${bossFury}%`,
                  background: bossFury >= 100 ? 'linear-gradient(90deg, #dc2626, #ff0000, #dc2626)' : 'linear-gradient(90deg, #991b1b, #dc2626)',
                  boxShadow: bossFury >= 100 ? '0 0 20px rgba(239,68,68,0.8)' : 'none',
                }}
              />
            </div>
            {ultimateFuryActive && (
              <motion.div className="text-center mt-1"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <span className="text-[8px] font-black text-red-500 tracking-[0.3em]">⚠️ RAGE MODE ⚠️</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {canUseDarkVoid && (
          <div className="absolute top-3 right-3 z-20">
            <div className="bg-black/80 border border-purple-500/30 px-2.5 py-2 backdrop-blur-md rounded-xl">
              <div className="flex items-center gap-1 text-[7px]">
                <Eye size={8} className="text-purple-400" />
                <span className="text-purple-300 font-bold tracking-wider">VOID</span>
              </div>
              <div className="w-16 h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1">
                <motion.div className="h-full rounded-full"
                  animate={isDarkVoidReady ? { opacity: [0.6, 1, 0.6] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{
                    width: `${(darkVoidCharge / DARK_VOID_CHARGE_REQUIRED) * 100}%`,
                    background: isDarkVoidReady ? 'linear-gradient(90deg, #7c3aed, #a855f7)' : 'linear-gradient(90deg, #4c1d95, #6d28d9)',
                    boxShadow: isDarkVoidReady ? '0 0 12px rgba(139,92,246,0.8)' : 'none',
                  }}
                />
              </div>
              <span className="text-[6px] text-purple-400/60">{darkVoidCharge}/{DARK_VOID_CHARGE_REQUIRED}</span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {comboCount > 1 && (
            <motion.div className="absolute top-20 left-1/2 -translate-x-1/2 z-20"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <motion.div className="text-orange-400 font-black italic text-2xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                style={{ textShadow: '0 0 20px rgba(251,146,60,0.9)' }}
              >
                {comboCount}x COMBO!
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {ragingSpeedActive && (
          <motion.div className="absolute bottom-[38%] left-1/2 -translate-x-1/2 z-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="bg-cyan-500/15 border border-cyan-400/30 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <motion.span className="text-[10px] text-cyan-300 font-bold"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >💨 Raging Speed {ragingSpeedTimer}s</motion.span>
            </div>
          </motion.div>
        )}

        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="mb-3 w-[200px]">
            <div className="bg-black/80 border backdrop-blur-md rounded-xl p-2.5" style={{ borderColor: `${bossConfig.color}40` }}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-black tracking-[0.15em]" style={{ color: bossConfig.color }}>{bossConfig.name}</span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ color: bossConfig.color, backgroundColor: `${bossConfig.color}15` }}>[{bossConfig.rank}]</span>
              </div>
              <div className="h-3 bg-zinc-900 border border-white/5 overflow-hidden rounded-full relative">
                <motion.div className="h-full relative overflow-hidden rounded-full"
                  animate={{ width: `${bossHPPercent}%` }}
                  transition={{ duration: 0.5 }}
                  style={{ background: `linear-gradient(90deg, ${bossConfig}99, ${bossConfig.color})` }}
                >
                  <motion.div className="absolute inset-0"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
                  />
                </motion.div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[7px] text-zinc-500">{bossHP.toLocaleString()}</span>
                <span className="text-[7px] text-zinc-500">{maxBossHP.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <motion.div
            className="relative"
            animate={{
              scale: isBossHit ? 0.85 : isBossAdvancing ? 1.15 : isBossDead ? 0.7 : 1,
              x: isBossAdvancing ? -15 : 0,
              rotate: isBossDead ? 15 : 0,
              filter: isBossHit ? 'brightness(3)' : isBossDead ? 'grayscale(1)' : 'brightness(1)',
            }}
            transition={{ duration: 0.2 }}
          >
            {!isBossDead && (
              <motion.div className="absolute -inset-12 rounded-full blur-3xl"
                animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundColor: `${bossConfig.color}30` }}
              />
            )}
            {ultimateFuryActive && (
              <motion.div className="absolute -inset-8 rounded-full blur-2xl"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                style={{ backgroundColor: 'rgba(239,68,68,0.4)' }}
              />
            )}
            <img src={bossConfig.image} alt="Boss" className="w-36 h-36 object-contain relative z-10"
              style={{ filter: `drop-shadow(0 0 40px ${bossConfig.color}80)` }}
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[140%] h-8">
              <div className="w-full h-full rounded-[50%] blur-xl" style={{ backgroundColor: `${bossConfig.color}30` }} />
            </div>

            {damagePopups.filter(p => !p.isPlayer).map(popup => (
              <motion.div key={popup.id} className="absolute z-30 pointer-events-none"
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -70, scale: popup.isCrit ? 1.5 : 0.8 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
              >
                {popup.isDodge ? (
                  <div className="font-black italic text-zinc-400 text-lg" style={{ textShadow: '0 0 12px rgba(150,150,150,0.6)' }}>MISS!</div>
                ) : (
                  <div className={`font-black italic ${popup.isCrit ? 'text-yellow-300 text-3xl' : 'text-white text-xl'}`}
                    style={{ textShadow: popup.isCrit ? '0 0 30px rgba(250,204,21,0.9)' : '0 0 15px rgba(255,255,255,0.7)' }}>
                    -{popup.value.toLocaleString()}
                    {popup.isCrit && <span className="text-sm ml-1 text-yellow-200">CRIT!</span>}
                  </div>
                )}
              </motion.div>
            ))}

            {isBossDead && (
              <motion.div className="absolute inset-0 flex items-center justify-center z-30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="font-black italic text-2xl tracking-[0.4em]" style={{ color: bossConfig.color, textShadow: `0 0 30px ${bossConfig.color}` }}>DEFEATED</div>
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="absolute left-2 bottom-[8%] z-10 flex flex-col items-center">
          <motion.div
            className="relative"
            animate={{
              x: isAttacking ? 15 : isPlayerHit ? -8 : 0,
              scale: isAttacking ? 1.1 : 1,
              filter: isPlayerHit ? 'brightness(2)' : 'brightness(1)',
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute -inset-8 bg-cyan-500/10 rounded-full blur-2xl" />
            <img src="/UserPersonality.png" alt="Player" className="w-20 relative z-10 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]" style={{ transform: 'scaleX(-1)' }} />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[130%] h-5">
              <div className="w-full h-full bg-cyan-500/20 rounded-[50%] blur-lg" />
            </div>
            {damagePopups.filter(p => p.isPlayer).map(popup => (
              <motion.div key={popup.id} className="absolute z-30 pointer-events-none"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -60 }}
                transition={{ duration: 1.5 }}
                style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
              >
                {popup.isDodge ? (
                  <div className="font-black italic text-cyan-300 text-lg" style={{ textShadow: '0 0 12px rgba(6,182,212,0.8)' }}>DODGE!</div>
                ) : (
                  <div className="font-black italic text-red-400 text-lg" style={{ textShadow: '0 0 12px rgba(239,68,68,0.8)' }}>
                    -{popup.value.toLocaleString()}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="absolute left-2 bottom-[25%] z-20">
          <div className="bg-black/80 border border-cyan-500/20 p-2 backdrop-blur-md rounded-xl w-[120px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[7px] font-black text-cyan-400 tracking-wider truncate max-w-[65px]">{playerName}</span>
              <span className="text-[7px] font-bold text-cyan-300/70">LV.{playerLevel}</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <Heart size={7} className="text-emerald-400 shrink-0" />
              <div className="flex-1 h-2 bg-zinc-900 border border-white/5 overflow-hidden rounded-sm">
                <motion.div className="h-full rounded-sm"
                  animate={{ width: `${playerHPPercent}%` }}
                  style={{ background: playerHPPercent > 50 ? 'linear-gradient(90deg, #10b981, #34d399)' : playerHPPercent > 20 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)' }}
                />
              </div>
              <span className="text-[5px] text-zinc-500 w-6 text-right">{playerHP}</span>
            </div>
            <div className="flex items-center gap-1">
              <Battery size={7} className="text-blue-400 shrink-0" />
              <div className="flex-1 h-1.5 bg-zinc-900 border border-white/5 overflow-hidden rounded-sm">
                <motion.div className="h-full rounded-sm"
                  animate={{ width: `${playerManaPercent}%` }}
                  style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
                />
              </div>
              <span className="text-[5px] text-zinc-500 w-6 text-right">{playerMana}</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {slashEffect && (
            <motion.div className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="w-[200px] h-[200px] relative"
                initial={{ scale: 0.3, rotate: -30, opacity: 0 }}
                animate={{ scale: 1.3, rotate: 15, opacity: [0, 1, 0] }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent transform -rotate-12" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform rotate-12" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {swordEffect && (
            <motion.div className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="w-[220px] h-[220px] relative"
                initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
                animate={{ scale: 1.4, rotate: 20, opacity: [0, 1, 0] }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 via-transparent to-transparent rotate-30 blur-sm" />
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {daggerEffect && (
            <motion.div className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="w-[180px] h-[180px] relative"
                initial={{ scale: 0.3, rotate: -45, opacity: 0 }}
                animate={{ scale: 1.3, rotate: 0, opacity: [0, 1, 0] }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent transform -rotate-45" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {thunderBoltEffect && (
            <motion.div className="absolute inset-0 z-25 pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600" fill="none"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.6 }}
              >
                <path d="M200 0 L180 200 L220 200 L160 400 L210 250 L170 250 L200 0" fill="rgba(250,204,21,0.6)" />
                <path d="M250 20 L235 180 L260 180 L220 350 L255 220 L230 220 L250 20" fill="rgba(250,204,21,0.3)" />
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 h-[12%]">
          <div className="w-full h-full bg-gradient-to-t from-cyan-950/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        </div>
      </div>

      <div className="relative z-20 bg-gradient-to-b from-[#080818] to-[#050510] border-t border-cyan-500/10">
        <div className="px-3 py-1 border-b border-white/5 bg-black/50">
          <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <span className="text-[6px] text-cyan-500/40 font-bold uppercase shrink-0 tracking-[0.2em]">LOG</span>
            <span className="text-[8px] text-zinc-400 whitespace-nowrap">{latestLog}</span>
          </div>
        </div>

        <div className="px-2 pt-2 pb-1">
          <div className="flex items-center gap-1 mb-1">
            <Swords size={8} className="text-zinc-600" />
            <span className="text-[6px] text-zinc-600 font-bold uppercase tracking-[0.2em]">ATTACKS</span>
          </div>
          <div className={`grid gap-1.5 ${hasDagger ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <SkillBtn onClick={basicAttack} disabled={isAttacking || battleOver || playerMana < 5}
              icon={<Swords size={14} />} name="ضربة" dmg={basicDmg} mpCost={5}
              color="cyan" />
            <SkillBtn onClick={swordStrike} disabled={isAttacking || battleOver || swordCooldown > 0 || playerMana < 15}
              icon={<Flame size={14} />} name="السيف" dmg={swordDmg} mpCost={15} cooldown={swordCooldown}
              color="amber" />
            <SkillBtn onClick={thunderDash} disabled={isAttacking || battleOver || thunderCooldown > 0 || playerMana < 50}
              icon={<Zap size={14} />} name="البرق" dmg={thunderDmg} mpCost={50} cooldown={thunderCooldown}
              color="yellow" />
            {hasDagger && (
              <SkillBtn onClick={daggerStrikeAction} disabled={!hasDagger || isAttacking || battleOver || daggerCooldown > 0 || playerMana < 25}
                icon={<Shield size={14} />} name="خنجر" dmg={daggerDmg} mpCost={25} cooldown={daggerCooldown}
                color="purple" />
            )}
          </div>
        </div>

        <div className="px-2 pb-2 pt-1">
          <div className="flex items-center gap-1 mb-1">
            <Zap size={8} className="text-zinc-600" />
            <span className="text-[6px] text-zinc-600 font-bold uppercase tracking-[0.2em]">ABILITIES</span>
          </div>
          <div className={`grid gap-1.5 ${canUseDarkVoid ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button onClick={activateRagingSpeed}
              disabled={battleOver || ragingSpeedCooldown > 0 || ragingSpeedActive || playerMana < 75}
              className={`relative flex items-center gap-2 p-2 rounded-xl border-2 transition-all overflow-hidden
                ${battleOver || ragingSpeedCooldown > 0 || ragingSpeedActive || playerMana < 75
                  ? 'bg-zinc-900/60 border-zinc-800/40 opacity-40'
                  : 'bg-gradient-to-r from-teal-950/60 to-teal-900/30 border-teal-500/30 hover:border-teal-400/60 active:scale-95'
                }`}
            >
              <div className="p-1 rounded-lg bg-teal-500/20"><Wind size={14} className="text-teal-400" /></div>
              <div className="text-left">
                <span className="text-[9px] font-black text-white block">تفادي</span>
                <span className="text-[6px] text-zinc-500">75 MP</span>
              </div>
              {ragingSpeedCooldown > 0 && !ragingSpeedActive && (
                <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center">
                  <span className="text-teal-400 font-black text-lg">{ragingSpeedCooldown}s</span>
                </div>
              )}
              {ragingSpeedActive && (
                <div className="absolute inset-0 bg-teal-500/20 rounded-xl flex items-center justify-center border-2 border-teal-400/50">
                  <motion.span className="text-teal-300 font-black text-lg"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >{ragingSpeedTimer}s</motion.span>
                </div>
              )}
            </button>

            {canUseDarkVoid && (
              <button onClick={darkVoidStrike}
                disabled={isAttacking || battleOver || !isDarkVoidReady}
                className={`relative flex items-center gap-2 p-2 rounded-xl border-2 transition-all overflow-hidden
                  ${isAttacking || battleOver || !isDarkVoidReady
                    ? 'bg-zinc-900/60 border-zinc-800/40 opacity-40'
                    : 'bg-gradient-to-r from-purple-950/80 to-violet-900/40 border-purple-500/40 hover:border-purple-400/70 active:scale-95 shadow-[0_0_25px_rgba(139,92,246,0.3)]'
                  }`}
              >
                <div className={`p-1 rounded-lg ${isDarkVoidReady ? 'bg-purple-500/30' : 'bg-zinc-800/50'}`}>
                  <Eye size={14} className={isDarkVoidReady ? 'text-purple-400' : 'text-zinc-600'} />
                </div>
                <div className="text-left">
                  <span className={`text-[9px] font-black block ${isDarkVoidReady ? 'text-purple-300' : 'text-zinc-600'}`}>ثقب الظلام</span>
                  <span className="text-[6px] text-zinc-500">{darkVoidCharge}/{DARK_VOID_CHARGE_REQUIRED}</span>
                </div>
                {!isDarkVoidReady && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800">
                    <div className="h-full bg-purple-500 transition-all" style={{ width: `${(darkVoidCharge / DARK_VOID_CHARGE_REQUIRED) * 100}%` }} />
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showVictory && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="text-center space-y-5 px-6"
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <motion.div className="text-5xl font-black italic tracking-[0.5em]"
                animate={{ textShadow: ['0 0 30px rgba(6,182,212,0.5)', '0 0 60px rgba(6,182,212,0.9)', '0 0 30px rgba(6,182,212,0.5)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ color: '#06b6d4' }}
              >
                VICTORY
              </motion.div>
              <div className="text-zinc-400 text-sm tracking-[0.3em] uppercase">العدو قد سقط</div>
              <div className="flex items-center justify-center gap-2 text-sm mt-2 px-4 py-2 rounded-xl bg-black/50 border"
                style={{ color: bossConfig.color, borderColor: `${bossConfig.color}40` }}>
                <Trophy size={14} />
                {bossConfig.name} [{bossConfig.rank}]
              </div>

              <motion.div className="flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Star className="text-yellow-400" size={20} />
                <span className="text-yellow-400 font-black text-xl">+{xpGained.toLocaleString()} XP</span>
              </motion.div>

              <motion.button
                onClick={handleShowLoot}
                className="px-8 py-3 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold rounded-xl hover:bg-cyan-500/30 transition-all active:scale-95"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                عرض الغنائم
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoot && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="w-[85%] max-w-sm"
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 14 }}
            >
              <div className="bg-gradient-to-b from-cyan-950/90 to-[#0a0a1a] border border-cyan-500/30 rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 50px rgba(6,182,212,0.2)' }}>
                <div className="px-4 py-3 border-b border-cyan-500/20 flex items-center gap-2">
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={14} className="text-cyan-400" />
                  </motion.div>
                  <span className="text-[10px] font-black text-cyan-400 tracking-[0.3em] uppercase">SYSTEM LOOT</span>
                </div>

                <div className="p-4 space-y-2.5">
                  {lootItems.map((item, i) => (
                    <motion.div key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border"
                      style={{ borderColor: `${RARITY_COLORS[item.rarity]}30` }}
                    >
                      <motion.span className="text-2xl"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      >{item.icon}</motion.span>
                      <div className="flex-1">
                        <span className="text-[11px] font-bold block" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
                        <span className="text-[8px] uppercase tracking-[0.2em]" style={{ color: `${RARITY_COLORS[item.rarity]}80` }}>{item.rarity}</span>
                      </div>
                      {item.amount && (
                        <div className="flex items-center gap-1">
                          <Coins size={10} className="text-yellow-400" />
                          <span className="text-[10px] font-bold text-yellow-400">+{item.amount}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="px-4 pb-4">
                  <motion.button
                    onClick={handleFinish}
                    className="w-full py-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold rounded-xl hover:bg-cyan-500/25 transition-all active:scale-95"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + lootItems.length * 0.15 }}
                  >
                    إنهاء
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPlayerDead && !isBossDead && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <motion.div className="text-center space-y-5"
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <motion.div className="text-5xl font-black italic text-red-500 tracking-[0.4em]"
                animate={{ textShadow: ['0 0 20px rgba(239,68,68,0.5)', '0 0 50px rgba(239,68,68,0.9)', '0 0 20px rgba(239,68,68,0.5)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >DEFEAT</motion.div>
              <div className="text-zinc-400 text-sm tracking-[0.2em]">لقد هُزمت...</div>
              <button onClick={resetBattle}
                className="px-8 py-3 bg-red-500/15 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/25 transition-all active:scale-95">
                إعادة المحاولة
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes flash { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
        @keyframes screen-shake { 0%, 100% { transform: translate(0); } 10% { transform: translate(-4px, 2px); } 20% { transform: translate(4px, -2px); } 30% { transform: translate(-3px, -1px); } 40% { transform: translate(3px, 1px); } }
        .animate-screen-shake { animation: screen-shake 0.4s ease-out; }
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
  cyan: { from: 'from-cyan-950/60', to: 'to-cyan-900/30', border: 'border-cyan-500/30', hover: 'hover:border-cyan-400/60', text: 'text-cyan-400', bg: 'bg-cyan-500/20', cd: 'text-cyan-400' },
  amber: { from: 'from-amber-950/60', to: 'to-amber-900/30', border: 'border-amber-500/30', hover: 'hover:border-amber-400/60', text: 'text-amber-400', bg: 'bg-amber-500/20', cd: 'text-amber-400' },
  yellow: { from: 'from-yellow-950/60', to: 'to-yellow-900/30', border: 'border-yellow-500/30', hover: 'hover:border-yellow-400/60', text: 'text-yellow-400', bg: 'bg-yellow-500/20', cd: 'text-yellow-400' },
  purple: { from: 'from-purple-950/60', to: 'to-purple-900/30', border: 'border-purple-500/30', hover: 'hover:border-purple-400/60', text: 'text-purple-400', bg: 'bg-purple-500/20', cd: 'text-purple-400' },
};

const SkillBtn = ({ onClick, disabled, icon, name, dmg, mpCost, cooldown, color }: SkillBtnProps) => {
  const c = colorMap[color];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all overflow-hidden
        ${disabled ? 'bg-zinc-900/60 border-zinc-800/40 opacity-40' : `bg-gradient-to-b ${c.from} ${c.to} ${c.border} ${c.hover} active:scale-95`}`}>
      <div className={`mb-0.5 p-1 rounded-lg ${disabled ? 'bg-zinc-800/50' : c.bg}`}>
        <span className={disabled ? 'text-zinc-600' : c.text}>{icon}</span>
      </div>
      <span className={`text-[8px] font-black ${disabled ? 'text-zinc-600' : 'text-white'}`}>{name}</span>
      <span className="text-[6px] text-zinc-500">{dmg.toLocaleString()}</span>
      <div className="flex items-center gap-0.5">
        <Battery size={5} className="text-blue-400" />
        <span className="text-[5px] text-blue-400/70">{mpCost}</span>
      </div>
      {cooldown !== undefined && cooldown > 0 && (
        <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center">
          <span className={`${c.cd} font-black text-lg`}>{cooldown}s</span>
        </div>
      )}
    </button>
  );
};

export default HunterBattle;
