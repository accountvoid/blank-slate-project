import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, Quest, Boss, StatType, Ability, Achievement, GrandQuest, InventoryItem, PrayerQuest, ShadowSoldier, Equipment, Gate } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const profilesTable = () => supabase.from('profiles') as unknown as any;

const MAX_LEVEL = 100; 
const BASE_XP_PER_LEVEL = 100;

const getDayOfWeek = () => new Date().getDay();

const calcLevelFromXp = (xp: number): number => {
  let level = 1;
  let accumulated = 0;
  while (level < MAX_LEVEL) {
    const required = Math.floor(100 * Math.pow(1.22, level - 1));
    if (xp < accumulated + required) break;
    accumulated += required;
    level++;
  }
  return level;
};

const getRotatingQuests = (): Quest[] => {
  const day = getDayOfWeek();
  
  const strQuests: Record<number, Quest> = {
    0: { id: 'str_daily', title: 'تمرين صدر', description: '100 ضغط على 5 مجاميع', category: 'strength', xpReward: 50, completed: false, dailyReset: true, difficulty: 'hard', sets: 5, repsPerSet: 20, dayOfWeek: 0, requiredTime: 25, isMainQuest: true },
    1: { id: 'str_daily', title: 'تمرين كتف', description: '60 تمرين كتف على 5 مجاميع', category: 'strength', xpReward: 45, completed: false, dailyReset: true, difficulty: 'medium', sets: 5, repsPerSet: 12, dayOfWeek: 1, requiredTime: 20, isMainQuest: true },
    2: { id: 'str_daily', title: 'تمرين تراي', description: '60 تمرين تراي على 5 مجاميع', category: 'strength', xpReward: 45, completed: false, dailyReset: true, difficulty: 'medium', sets: 5, repsPerSet: 12, dayOfWeek: 2, requiredTime: 20, isMainQuest: true },
    3: { id: 'str_daily', title: 'تمرين باي', description: '60 تمرين باي على 5 مجاميع', category: 'strength', xpReward: 45, completed: false, dailyReset: true, difficulty: 'medium', sets: 5, repsPerSet: 12, dayOfWeek: 3, requiredTime: 20, isMainQuest: true },
    4: { id: 'str_daily', title: 'تمرين ظهر', description: '60 تمرين ظهر على 5 مجاميع', category: 'strength', xpReward: 50, completed: false, dailyReset: true, difficulty: 'hard', sets: 5, repsPerSet: 12, dayOfWeek: 4, requiredTime: 25, isMainQuest: true },
    5: { id: 'str_daily', title: 'تمرين بطن', description: '100 تمرين بطن على 5 مجاميع', category: 'strength', xpReward: 45, completed: false, dailyReset: true, difficulty: 'medium', sets: 5, repsPerSet: 20, dayOfWeek: 5, requiredTime: 20, isMainQuest: true },
    6: { id: 'str_daily', title: 'تمرين رجل', description: '100 سكوات على 5 مجاميع', category: 'strength', xpReward: 50, completed: false, dailyReset: true, difficulty: 'hard', sets: 5, repsPerSet: 20, dayOfWeek: 6, requiredTime: 25, isMainQuest: true },
  };

  const intQuests: Record<number, Quest> = {
    0: { id: 'int_daily', title: 'مراجعة أسبوع', description: 'راجع ما تعلمته هذا الأسبوع', category: 'mind', xpReward: 35, completed: false, dailyReset: true, difficulty: 'medium', dayOfWeek: 0, requiredTime: 15, isMainQuest: true },
    1: { id: 'int_daily', title: 'لغز منطقي', description: 'حل لغز لتحسين المنطق', category: 'mind', xpReward: 40, completed: false, dailyReset: true, difficulty: 'hard', dayOfWeek: 1, requiredTime: 20, isMainQuest: true },
    2: { id: 'int_daily', title: 'قراءة + تلخيص', description: '25 دقيقة قراءة مع تلخيص', category: 'mind', xpReward: 45, completed: false, dailyReset: true, difficulty: 'hard', timeLimit: 25, dayOfWeek: 2, requiredTime: 25, isMainQuest: true },
    3: { id: 'int_daily', title: 'ألعاب الذاكرة', description: 'تمارين لرفع قوة الذاكرة', category: 'mind', xpReward: 35, completed: false, dailyReset: true, difficulty: 'medium', dayOfWeek: 3, requiredTime: 15, isMainQuest: true },
    4: { id: 'int_daily', title: 'كلمة جديدة', description: 'تعلم كلمة جديدة وحفظها', category: 'mind', xpReward: 30, completed: false, dailyReset: true, difficulty: 'easy', dayOfWeek: 4, requiredTime: 10, isMainQuest: true },
    5: { id: 'int_daily', title: 'تمرين اليد غير المسيطرة', description: 'استخدم يدك الأخرى لتحفيز الدماغ', category: 'mind', xpReward: 40, completed: false, dailyReset: true, difficulty: 'hard', dayOfWeek: 5, requiredTime: 20, isMainQuest: true },
    6: { id: 'int_daily', title: 'تأمل + مراجعة', description: '15 دقيقة تأمل وتركيز', category: 'mind', xpReward: 35, completed: false, dailyReset: true, difficulty: 'medium', timeLimit: 15, dayOfWeek: 6, requiredTime: 15, isMainQuest: true },
  };

  const sprQuests: Record<number, Quest> = {
    0: { id: 'spr_daily', title: 'تسبيح 2000 مرة', description: '1000 سبحان الله + 1000 الحمد لله', category: 'spirit', xpReward: 60, completed: false, dailyReset: true, difficulty: 'legendary', dayOfWeek: 0, requiredTime: 30, isMainQuest: true },
    1: { id: 'spr_daily', title: 'صيام الاثنين', description: 'صم يوم الاثنين أو سبح 25 مرة', category: 'spirit', xpReward: 70, completed: false, dailyReset: true, difficulty: 'legendary', dayOfWeek: 1, requiredTime: 60, isMainQuest: true },
    2: { id: 'spr_daily', title: 'شكر 5 نعم', description: 'اكتب أو تفكر في 5 نعم', category: 'spirit', xpReward: 30, completed: false, dailyReset: true, difficulty: 'easy', dayOfWeek: 2, requiredTime: 10, isMainQuest: true },
    3: { id: 'spr_daily', title: 'ترك ذنب واحد', description: 'امتنع عن ذنب واحد اليوم', category: 'spirit', xpReward: 50, completed: false, dailyReset: true, difficulty: 'hard', dayOfWeek: 3, requiredTime: 30, isMainQuest: true },
    4: { id: 'spr_daily', title: 'صيام الخميس', description: 'صم أو اقرأ صفحة قرآن بتدبر', category: 'spirit', xpReward: 70, completed: false, dailyReset: true, difficulty: 'legendary', dayOfWeek: 4, requiredTime: 60, isMainQuest: true },
    5: { id: 'spr_daily', title: 'صلاة الجمعة', description: 'صلاة الجمعة + 100 صلاة على النبي', category: 'spirit', xpReward: 80, completed: false, dailyReset: true, difficulty: 'legendary', dayOfWeek: 5, requiredTime: 45, isMainQuest: true },
    6: { id: 'spr_daily', title: 'ذكر 1000 مرة', description: 'سبحان الله وبحمده 1000 مرة', category: 'spirit', xpReward: 55, completed: false, dailyReset: true, difficulty: 'hard', dayOfWeek: 6, requiredTime: 25, isMainQuest: true },
  };

  const agiQuests: Record<number, Quest[]> = {
    0: [{ id: 'agi_run', title: 'الركض 20 دقيقة', description: 'اركض لمدة 20 دقيقة متواصلة', category: 'agility', xpReward: 50, completed: false, dailyReset: true, difficulty: 'hard', timeLimit: 20, dayOfWeek: 0, requiredTime: 20, isMainQuest: true }],
    1: [{ id: 'agi_run', title: 'الركض 15 دقيقة', description: 'اركض لمدة 15 دقيقة متواصلة', category: 'agility', xpReward: 40, completed: false, dailyReset: true, difficulty: 'medium', timeLimit: 15, dayOfWeek: 1, requiredTime: 15, isMainQuest: true }],
    2: [{ id: 'agi_sprint', title: 'سباق السرعة', description: '10 جولات سباق 100 متر', category: 'agility', xpReward: 55, completed: false, dailyReset: true, difficulty: 'hard', sets: 10, dayOfWeek: 2, requiredTime: 25, isMainQuest: true }],
    3: [{ id: 'agi_jump', title: 'القفز 300 مرة', description: '6 مجاميع × 50 قفزة', category: 'agility', xpReward: 50, completed: false, dailyReset: true, difficulty: 'hard', sets: 6, repsPerSet: 50, dayOfWeek: 3, requiredTime: 20, isMainQuest: true }],
    4: [{ id: 'agi_run', title: 'الركض 25 دقيقة', description: 'اركض لمدة 25 دقيقة', category: 'agility', xpReward: 55, completed: false, dailyReset: true, difficulty: 'hard', timeLimit: 25, dayOfWeek: 4, requiredTime: 25, isMainQuest: true }],
    5: [{ id: 'agi_hiit', title: 'تمرين HIIT', description: '20 دقيقة تمرين عالي الكثافة', category: 'agility', xpReward: 65, completed: false, dailyReset: true, difficulty: 'legendary', timeLimit: 20, dayOfWeek: 5, requiredTime: 20, isMainQuest: true }],
    6: [{ id: 'agi_walk', title: 'المشي السريع', description: '30 دقيقة مشي سريع', category: 'agility', xpReward: 35, completed: false, dailyReset: true, difficulty: 'easy', timeLimit: 30, dayOfWeek: 6, requiredTime: 30, isMainQuest: true }],
  };

  return [strQuests[day], intQuests[day], sprQuests[day], agiQuests[day][0]];
};

const getSideQuests = (): Quest[] => {
  const day = getDayOfWeek();
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const getGoldReward = (difficulty: 'easy' | 'medium' | 'hard' | 'legendary', seed: number): number => {
    const r = seededRandom(seed);
    switch (difficulty) {
      case 'easy': return Math.floor(r * 26) + 25;
      case 'medium': return Math.floor(r * 51) + 50;
      case 'hard': return Math.floor(r * 76) + 100;
      case 'legendary': return Math.floor(r * 76) + 175;
    }
  };

  const getXpReward = (difficulty: 'easy' | 'medium' | 'hard' | 'legendary', seed: number): number => {
    const r = seededRandom(seed);
    switch (difficulty) {
      case 'easy': return Math.floor(r * 11) + 20;
      case 'medium': return Math.floor(r * 21) + 35;
      case 'hard': return Math.floor(r * 26) + 55;
      case 'legendary': return Math.floor(r * 31) + 80;
    }
  };
  
  const sideQuests: Quest[] = [
    { id: 'side_read', title: 'قراءة 30 دقيقة', description: 'اقرأ كتاباً لمدة 30 دقيقة متواصلة', category: 'mind', xpReward: getXpReward('medium', dateSeed + 1), completed: false, dailyReset: true, difficulty: 'medium', isMainQuest: false, requiredTime: 30, goldReward: getGoldReward('medium', dateSeed + 1), active: false, claimed: false },
    { id: 'side_walk', title: 'المشي 20 دقيقة', description: 'امش لمدة 20 دقيقة', category: 'agility', xpReward: getXpReward('easy', dateSeed + 2), completed: false, dailyReset: true, difficulty: 'easy', isMainQuest: false, requiredTime: 20, goldReward: getGoldReward('easy', dateSeed + 2), active: false, claimed: false },
    { id: 'side_meditate', title: 'التأمل 15 دقيقة', description: 'تأمل واسترخ لمدة 15 دقيقة', category: 'spirit', xpReward: getXpReward('medium', dateSeed + 3), completed: false, dailyReset: true, difficulty: 'medium', isMainQuest: false, requiredTime: 15, goldReward: getGoldReward('medium', dateSeed + 3), active: false, claimed: false },
    { id: 'side_stretch', title: 'تمارين إطالة', description: 'قم بتمارين إطالة لمدة 10 دقائق', category: 'strength', xpReward: getXpReward('easy', dateSeed + 4), completed: false, dailyReset: true, difficulty: 'easy', isMainQuest: false, requiredTime: 10, goldReward: getGoldReward('easy', dateSeed + 4), active: false, claimed: false },
    { id: 'side_water', title: 'شرب 8 أكواب ماء', description: 'اشرب 8 أكواب ماء على مدار اليوم', category: 'spirit', xpReward: getXpReward('easy', dateSeed + 5), completed: false, dailyReset: true, difficulty: 'easy', isMainQuest: false, requiredTime: 60, goldReward: getGoldReward('easy', dateSeed + 5), active: false, claimed: false },
    { id: 'side_pushups', title: '50 ضغطة', description: 'قم بـ 50 ضغطة على مجموعات', category: 'strength', xpReward: getXpReward('hard', dateSeed + 6), completed: false, dailyReset: true, difficulty: 'hard', isMainQuest: false, requiredTime: 15, goldReward: getGoldReward('hard', dateSeed + 6), active: false, claimed: false },
    { id: 'side_study', title: 'دراسة 45 دقيقة', description: 'ادرس أو تعلم شيء جديد', category: 'mind', xpReward: getXpReward('hard', dateSeed + 7), completed: false, dailyReset: true, difficulty: 'hard', isMainQuest: false, requiredTime: 45, goldReward: getGoldReward('hard', dateSeed + 7), active: false, claimed: false },
    { id: 'side_quran', title: 'قراءة 5 صفحات قرآن', description: 'اقرأ 5 صفحات من القرآن بتدبر', category: 'spirit', xpReward: getXpReward('legendary', dateSeed + 8), completed: false, dailyReset: true, difficulty: 'legendary', isMainQuest: false, requiredTime: 30, goldReward: getGoldReward('legendary', dateSeed + 8), active: false, claimed: false },
  ];

  const startIndex = day % sideQuests.length;
  const selected = [sideQuests[startIndex], sideQuests[(startIndex + 1) % sideQuests.length], sideQuests[(startIndex + 2) % sideQuests.length]];

  const GOLD_CAP = 150;
  const XP_CAP = 200;
  const totalGold = selected.reduce((s, q) => s + (q.goldReward || 0), 0);
  const totalXp = selected.reduce((s, q) => s + (q.xpReward || 0), 0);
  const goldScale = totalGold > GOLD_CAP ? GOLD_CAP / totalGold : 1;
  const xpScale = totalXp > XP_CAP ? XP_CAP / totalXp : 1;
  return selected.map(q => ({
    ...q,
    goldReward: Math.floor((q.goldReward || 0) * goldScale),
    xpReward: Math.floor((q.xpReward || 0) * xpScale),
  }));
};

const getInitialAbilities = (): Ability[] => [
  { id: 'a1', name: 'قدرة الانضباط', description: 'تزيد تركيزك على المهام', requiredLevel: 3, category: 'mind', unlocked: false, level: 0, cooldownDays: 7, effect: 'مضاعفة XP للمهمة القادمة' },
  { id: 'a2', name: 'قدرة التركيز', description: 'تقلل التشتت الذهني', requiredLevel: 5, category: 'mind', unlocked: false, level: 0, cooldownDays: 7, effect: 'إكمال مهمة تلقائياً' },
  { id: 'a3', name: 'قدرة التغلب', description: 'تساعدك على هزيمة الزعماء', requiredLevel: 4, category: 'strength', unlocked: false, level: 0, cooldownDays: 7, effect: 'ضرر مضاعف للزعيم' },
  { id: 'a4', name: 'قدرة ضبط النفس', description: 'تزيد مقاومتك للإغراءات', requiredLevel: 6, category: 'spirit', unlocked: false, level: 0, cooldownDays: 7, effect: 'حماية من خسارة HP' },
  { id: 'a5', name: 'قدرة السرعة', description: 'تزيد رشاقتك وسرعتك', requiredLevel: 5, category: 'agility', unlocked: false, level: 0, cooldownDays: 7, effect: 'مضاعفة XP الرشاقة' },
  { id: 'a6', name: 'قدرة الصبر', description: 'تزيد من تحملك', requiredLevel: 7, category: 'spirit', unlocked: false, level: 0, cooldownDays: 7, effect: 'تمديد وقت المهمات' },
  { id: 'a7', name: 'كشف البوابات', description: 'تكشف البوابات المخفية', requiredLevel: 2, category: 'agility', unlocked: false, level: 0, cooldownDays: 0, effect: 'كشف بوابة إضافية' },
  { id: 'a8', name: 'قدرة القوة', description: 'تزيد قوتك الجسدية', requiredLevel: 8, category: 'strength', unlocked: false, level: 0, cooldownDays: 7, effect: 'استعادة 50% طاقة' },
];

const getInitialAchievements = (): Achievement[] => [
  { id: 'ach1', name: 'البداية القوية', description: 'أكمل أول مهمة', requirement: 1, progress: 0, unlocked: false, icon: '🎯', rarity: 'common' },
  { id: 'ach2', name: '7 أيام التزام', description: 'التزم لمدة أسبوع', requirement: 7, progress: 0, unlocked: false, icon: '🔥', rarity: 'rare' },
  { id: 'ach3', name: '30 يوم قوة', description: 'التزم لمدة شهر', requirement: 30, progress: 0, unlocked: false, icon: '💪', rarity: 'epic' },
  { id: 'ach4', name: 'قاهر البوابة', description: 'أكمل أول بوابة', requirement: 1, progress: 0, unlocked: false, icon: '⚔️', rarity: 'rare' },
  { id: 'ach5', name: 'المنجز', description: 'أكمل 100 مهمة', requirement: 100, progress: 0, unlocked: false, icon: '🏆', rarity: 'epic' },
  { id: 'ach6', name: 'الهدف الكبير', description: 'أتم Grand Quest', requirement: 1, progress: 0, unlocked: false, icon: '👑', rarity: 'legendary' },
  { id: 'ach7', name: 'المستوى 10', description: 'وصلت للمستوى 10', requirement: 10, progress: 0, unlocked: false, icon: '⭐', rarity: 'common' },
  { id: 'ach8', name: 'المستوى 50', description: 'وصلت للمستوى 50', requirement: 50, progress: 0, unlocked: false, icon: '💎', rarity: 'epic' },
  { id: 'ach9', name: 'المستوى 100', description: 'وصلت للمستوى 100', requirement: 100, progress: 0, unlocked: false, icon: '🏅', rarity: 'legendary' },
];

const getScheduledGates = (playerLevel: number): Gate[] => {
  const allGates: Gate[] = [
    { id: 'gate_e', idGate: 'GATE-0001', name: 'بوابة E', rank: 'E', requiredPower: 5, energyDensity: '1,200', danger: 'MINIMAL THREAT', color: 'gray', discovered: true, completed: false, rewards: { xp: 100, gold: 50, shadowPoints: 2 } },
    { id: 'gate_d', idGate: 'GATE-0002', name: 'بوابة D', rank: 'D', requiredPower: 10, energyDensity: '5,400', danger: 'LOW THREAT', color: 'green', discovered: false, completed: false, rewards: { xp: 250, gold: 100, shadowPoints: 5 } },
    { id: 'gate_c', idGate: 'GATE-0003', name: 'بوابة C', rank: 'C', requiredPower: 20, energyDensity: '12,000', danger: 'MODERATE DANGER', color: 'blue', discovered: false, completed: false, rewards: { xp: 500, gold: 200, shadowPoints: 10 } },
    { id: 'gate_b', idGate: 'GATE-0004', name: 'بوابة B', rank: 'B', requiredPower: 35, energyDensity: '28,000', danger: 'HIGH DANGER', color: 'purple', discovered: false, completed: false, rewards: { xp: 1000, gold: 400, shadowPoints: 20 } },
    { id: 'gate_a', idGate: 'GATE-0005', name: 'بوابة A', rank: 'A', requiredPower: 60, energyDensity: '65,000', danger: 'EXTREME PERIL', color: 'orange', discovered: false, completed: false, rewards: { xp: 2500, gold: 0, shadowPoints: 50 } },
    { id: 'gate_s', idGate: 'GATE-0006', name: 'بوابة S', rank: 'S', requiredPower: 100, energyDensity: 'UNMEASURABLE', danger: 'CATACLYSMIC', color: 'red', discovered: false, completed: false, rewards: { xp: 10000, gold: 0, shadowPoints: 200 } },
  ];

  const today = new Date();
  const dayOfWeek = today.getDay();
  const gateDays = [0, 2, 4, 6];
  
  if (!gateDays.includes(dayOfWeek)) return [];
  
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  let availableRanks: string[] = [];
  if (playerLevel >= 35) availableRanks = ['C', 'B'];
  else if (playerLevel >= 20) availableRanks = ['D', 'C'];
  else if (playerLevel >= 10) availableRanks = ['E', 'D'];
  else availableRanks = ['E'];
  
  const rankIndex = Math.floor(seededRandom(dateSeed + 42) * availableRanks.length);
  const selectedRank = availableRanks[rankIndex];
  const gateTemplate = allGates.find(g => g.rank === selectedRank) || allGates[0];
  
  const closingDate = new Date(today);
  closingDate.setHours(23, 59, 59, 999);
  const closingTime = closingDate.toISOString();
  
  const isHigherLevel = playerLevel >= gateTemplate.requiredPower;
  const rankIdx = ['E','D','C','B','A','S'].indexOf(gateTemplate.rank);
  const permanentId = `GATE-${String(rankIdx * 100000 + (dateSeed % 100000)).padStart(4, '0')}`;

  return [{
    ...gateTemplate,
    idGate: permanentId,
    id: `${gateTemplate.id}_${dateSeed}`,
    discovered: true,
    gateNumber: 1,
    closingTime,
    name: isHigherLevel ? gateTemplate.name : `بوابة ${gateTemplate.rank}`,
    energyDensity: isHigherLevel ? getRandomEnergyDensity(gateTemplate.rank) : '???',
    danger: isHigherLevel ? gateTemplate.danger : '???',
    isFullyRevealed: isHigherLevel,
  }];
};

const getRandomEnergyDensity = (rank: string): string => {
  const ranges: Record<string, [number, number]> = { 'E': [800, 1500], 'D': [4000, 7000], 'C': [10000, 15000], 'B': [25000, 35000], 'A': [60000, 80000], 'S': [100000, 999999] };
  const [min, max] = ranges[rank] || [1000, 2000];
  return (Math.floor(Math.random() * (max - min + 1)) + min).toLocaleString();
};

const getInitialInventory = (): InventoryItem[] => [];

const getInitialPrayerQuests = (): PrayerQuest[] => [
  { id: 'fajr', name: 'Fajr', arabicName: 'صلاة الفجر', time: '05:00', completed: false, xpReward: 50 },
  { id: 'dhuhr', name: 'Dhuhr', arabicName: 'صلاة الظهر', time: '12:30', completed: false, xpReward: 40 },
  { id: 'asr', name: 'Asr', arabicName: 'صلاة العصر', time: '15:30', completed: false, xpReward: 40 },
  { id: 'maghrib', name: 'Maghrib', arabicName: 'صلاة المغرب', time: '18:00', completed: false, xpReward: 40 },
  { id: 'isha', name: 'Isha', arabicName: 'صلاة العشاء', time: '19:30', completed: false, xpReward: 45 },
];

const getDefaultState = (): GameState => ({
  playerName: 'المحارب',
  playerTitle: 'محارب التطوير الذاتي',
  equippedTitle: undefined,
  playerJob: 'غير معروف',
  isOnboarded: false,
  hp: 100,
  maxHp: 100,
  energy: 100,
  maxEnergy: 100,
  gold: 0,
  shadowPoints: 0,
  stats: { strength: 0, mind: 0, spirit: 0, agility: 0 },
  levels: { strength: 1, mind: 1, spirit: 1, agility: 1 },
  totalLevel: 1,
  quests: [...getRotatingQuests(), ...getSideQuests()],
  abilities: getInitialAbilities(),
  achievements: getInitialAchievements(),
  grandQuest: null,
  inventory: getInitialInventory(),
  prayerQuests: getInitialPrayerQuests(),
  shadowSoldiers: [],
  equipment: [],
  gates: getScheduledGates(1),
  dailyStats: [],
  totalQuestsCompleted: 0,
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  punishmentEndTime: null,
  missedQuestsCount: 0,
  punishment: { active: false, endTime: null, monstersDefeated: 0, currentWave: 1, playerHpInPenalty: 100, maxHpInPenalty: 100 },
  selectedReciter: 'ar.alafasy',
  soundEnabled: true,
  currentBoss: null,
  lastBossAttackTime: null,
});

export const useGameState = () => {
  const { user } = useAuth();
  const previousUserIdRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const skipNextRealtimeUpdateRef = useRef(false); // لمنع الـ Realtime من مسح التحديثات المحلية فوراً

  const getStorageKey = (userId?: string) => {
    return userId ? `levelUpLife_${userId}` : 'levelUpLife_guest';
  };

  const [gameState, setGameState] = useState<GameState>(() => getDefaultState());
  const [levelUpInfo, setLevelUpInfo] = useState<{ show: boolean; newLevel: number; category?: StatType } | null>(null);

  // دالة الحفظ الفوري في المتصفح كخط دفاع أول لحماية البيانات المباشرة
  const saveToLocalBackup = useCallback((state: GameState, userId?: string) => {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
  }, []);

  useEffect(() => {
    const currentUserId = user?.id || null;
    if (previousUserIdRef.current !== currentUserId) {
      isInitializedRef.current = false;
      previousUserIdRef.current = currentUserId;
      if (!currentUserId) {
        setGameState(getDefaultState());
        return;
      }
    }

    if (!user || isInitializedRef.current) return;

    const loadFromSupabase = async () => {
      try {
        const { data, error } = await profilesTable().select('*').eq('user_id', user.id).maybeSingle();
        
        if (error) { 
          isInitializedRef.current = true; 
          const localKey = getStorageKey(user.id);
          const saved = localStorage.getItem(localKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setGameState({ ...getDefaultState(), ...parsed, isOnboarded: true });
            } catch {}
          }
          return; 
        }
        
        if (data) {
          const savedState = data as any;
          const defaultState = getDefaultState();

          // Parse Quests JSONB: { mainQuests, sideQuests, grandQuest, _extras: {...} }
          const Q = (savedState.Quests && typeof savedState.Quests === 'object' && !Array.isArray(savedState.Quests))
            ? savedState.Quests
            : {};
          const parsedQuests: Quest[] = [
            ...((Q.mainQuests as Quest[]) || []),
            ...((Q.sideQuests as Quest[]) || []),
          ];
          const parsedGrandQuest: GrandQuest | null = Q.grandQuest || null;
          const extras = Q._extras || {};

          // Map stats_player {STR,AGI,SPI,MIN} -> {strength,agility,spirit,mind}
          const sp = savedState.stats_player || {};
          const loadedStats = {
            strength: typeof sp.STR === 'number' ? sp.STR : (sp.strength ?? defaultState.stats.strength),
            agility:  typeof sp.AGI === 'number' ? sp.AGI : (sp.agility  ?? defaultState.stats.agility),
            spirit:   typeof sp.SPI === 'number' ? sp.SPI : (sp.spirit   ?? defaultState.stats.spirit),
            mind:     typeof sp.MIN === 'number' ? sp.MIN : (sp.mind     ?? defaultState.stats.mind),
          };
          // Levels are derived from stats; always recompute to avoid drift.
          const derivedLevels = {
            strength: Math.min(calcLevelFromXp(loadedStats.strength), MAX_LEVEL),
            mind:     Math.min(calcLevelFromXp(loadedStats.mind),     MAX_LEVEL),
            spirit:   Math.min(calcLevelFromXp(loadedStats.spirit),   MAX_LEVEL),
            agility:  Math.min(calcLevelFromXp(loadedStats.agility),  MAX_LEVEL),
          };
          const derivedTotalLevel = Math.min(
            Math.floor((derivedLevels.strength + derivedLevels.mind + derivedLevels.spirit + derivedLevels.agility) / 4),
            MAX_LEVEL
          );

          const fetchedPrayerQuests = extras.prayerQuests || defaultState.prayerQuests;

          const mergedState: GameState = {
            ...defaultState,
            isOnboarded: extras.isOnboarded ?? true,
            playerName: savedState.name_player || defaultState.playerName,
            gold: savedState.gold_player ?? defaultState.gold,
            hp: savedState.hp_player ?? defaultState.hp,
            maxHp: savedState.hp_max ?? defaultState.maxHp,
            energy: savedState.mb_player ?? defaultState.energy,
            maxEnergy: savedState.mp_max ?? defaultState.maxEnergy,
            shadowPoints: savedState.void_player ?? defaultState.shadowPoints,
            equippedTitle: extras.equippedTitle || defaultState.equippedTitle,
            stats: loadedStats,
            levels: derivedLevels,
            totalLevel: savedState.level_player ?? derivedTotalLevel,
            playerTitle: extras.playerTitle || defaultState.playerTitle,
            playerJob: extras.playerJob || defaultState.playerJob,
            quests: parsedQuests.length > 0 ? parsedQuests : defaultState.quests,
            grandQuest: parsedGrandQuest,
            currentBoss: extras.currentBoss || defaultState.currentBoss,
            abilities: extras.abilities || defaultState.abilities,
            achievements: extras.achievements || defaultState.achievements,
            inventory: extras.inventory || defaultState.inventory,
            equipment: extras.equipment || defaultState.equipment,
            prayerQuests: Array.isArray(fetchedPrayerQuests) && fetchedPrayerQuests.length > 0 ? fetchedPrayerQuests : defaultState.prayerQuests,
            shadowSoldiers: extras.shadowSoldiers || defaultState.shadowSoldiers,
            gates: extras.gates || defaultState.gates,
            dailyStats: extras.dailyStats || defaultState.dailyStats,
            totalQuestsCompleted: extras.totalQuestsCompleted ?? defaultState.totalQuestsCompleted,
            streakDays: extras.streakDays ?? defaultState.streakDays,
            lastActiveDate: extras.lastActiveDate || defaultState.lastActiveDate,
            punishment: {
              ...defaultState.punishment,
              active: !!savedState.punishment_active,
              endTime: savedState.punishment_end_at || null,
            },
            punishmentEndTime: savedState.punishment_end_at || null,
            missedQuestsCount: extras.missedQuestsCount ?? defaultState.missedQuestsCount,
            selectedReciter: extras.selectedReciter || defaultState.selectedReciter,
            soundEnabled: extras.soundEnabled ?? defaultState.soundEnabled,
            lastBossAttackTime: extras.lastBossAttackTime || defaultState.lastBossAttackTime,
          };

          const today = new Date().toISOString().split('T')[0];
          const isNewDay = mergedState.lastActiveDate !== today;

          // NOTE: Punishment activation on missed daily quests is now enforced
          // server-side by `check_and_apply_punishment(uid)` (called from App on
          // startup + focus). The previous client-side block was removed to avoid
          // partial HP loss, missing reason, and race conditions with the server.


          const needsQuestSeed = isNewDay || !mergedState.quests || mergedState.quests.length === 0;
          if (needsQuestSeed) {
            // Seed daily/main quests but PRESERVE completed/in-progress entries from DB
            const seeded = [...getRotatingQuests(), ...getSideQuests()];
            const existingById = new Map(mergedState.quests.map(q => [q.id, q] as const));
            mergedState.quests = seeded.map(sq => {
              const prior = existingById.get(sq.id);
              if (!prior) return sq;
              // On a new day, daily quests reset; same-day load keeps progress.
              if (isNewDay && sq.dailyReset) return sq;
              return { ...sq, ...prior };
            });
            mergedState.lastActiveDate = today;
          }

          if (!mergedState.prayerQuests || mergedState.prayerQuests.length === 0) {
            mergedState.prayerQuests = getInitialPrayerQuests();
          } else if (isNewDay) {
            mergedState.prayerQuests = mergedState.prayerQuests.map((p: PrayerQuest) => ({ ...p, completed: false }));
          }

          if (!mergedState.gates || mergedState.gates.length === 0 || isNewDay) mergedState.gates = getScheduledGates(mergedState.totalLevel || 1);
          if (!mergedState.abilities || mergedState.abilities.length === 0) mergedState.abilities = getInitialAbilities();
          if (!mergedState.achievements || mergedState.achievements.length === 0) mergedState.achievements = getInitialAchievements();

          setGameState(mergedState);
          saveToLocalBackup(mergedState, user.id);
        } else {
          setGameState({ ...getDefaultState(), isOnboarded: true });
        }
        isInitializedRef.current = true;
      } catch (err) { 
        isInitializedRef.current = true; 
      }
    };
    loadFromSupabase();
  }, [user]);

  // تعديل الـ Realtime لمنع حلقة التحديثات اللانهائية التي تعيد مسح المهام
  useEffect(() => {
    if (!user?.id) return;
    const channelName = `game-state-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelName).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload) => {
          if (skipNextRealtimeUpdateRef.current) {
            skipNextRealtimeUpdateRef.current = false;
            return;
          }
          if (payload.new && !isSyncingRef.current) {
            const n = payload.new as any;
            const Q = (n.Quests && typeof n.Quests === 'object' && !Array.isArray(n.Quests)) ? n.Quests : {};
            const parsedQuests: Quest[] = [
              ...((Q.mainQuests as Quest[]) || []),
              ...((Q.sideQuests as Quest[]) || []),
            ];
            const sp = n.stats_player || {};
            const mappedStats = {
              strength: typeof sp.STR === 'number' ? sp.STR : undefined,
              agility:  typeof sp.AGI === 'number' ? sp.AGI : undefined,
              spirit:   typeof sp.SPI === 'number' ? sp.SPI : undefined,
              mind:     typeof sp.MIN === 'number' ? sp.MIN : undefined,
            };

            setGameState(prev => {
              const nextStats = {
                strength: mappedStats.strength ?? prev.stats.strength,
                agility:  mappedStats.agility  ?? prev.stats.agility,
                spirit:   mappedStats.spirit   ?? prev.stats.spirit,
                mind:     mappedStats.mind     ?? prev.stats.mind,
              };
              const nextLevels = {
                strength: Math.min(calcLevelFromXp(nextStats.strength), MAX_LEVEL),
                mind:     Math.min(calcLevelFromXp(nextStats.mind),     MAX_LEVEL),
                spirit:   Math.min(calcLevelFromXp(nextStats.spirit),   MAX_LEVEL),
                agility:  Math.min(calcLevelFromXp(nextStats.agility),  MAX_LEVEL),
              };
              const updated: GameState = {
                ...prev,
                playerName: n.name_player || prev.playerName,
                gold: n.gold_player ?? prev.gold,
                hp: n.hp_player ?? prev.hp,
                maxHp: n.hp_max ?? prev.maxHp,
                energy: n.mb_player ?? prev.energy,
                maxEnergy: n.mp_max ?? prev.maxEnergy,
                shadowPoints: n.void_player ?? prev.shadowPoints,
                totalLevel: n.level_player ?? prev.totalLevel,
                stats: nextStats,
                levels: nextLevels,
                punishment: {
                  ...prev.punishment,
                  active: typeof n.punishment_active === 'boolean' ? n.punishment_active : prev.punishment.active,
                  endTime: n.punishment_end_at ?? prev.punishment.endTime,
                },
                quests: parsedQuests.length > 0 ? parsedQuests : prev.quests,
                grandQuest: Q.grandQuest ?? prev.grandQuest,
                prayerQuests: (Q._extras && Q._extras.prayerQuests) || prev.prayerQuests,
              };
              saveToLocalBackup(updated, user.id);
              return updated;
            });
          }
        }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, saveToLocalBackup]);

  useEffect(() => {
    const checkAndUpdateGates = () => {
      const lastGateUpdate = localStorage.getItem('lastGateUpdateDate');
      const today = new Date().toISOString().split('T')[0];
      if (lastGateUpdate !== today) {
        setGameState(prev => {
          const updated = { ...prev, gates: getScheduledGates(prev.totalLevel || 1) };
          saveToLocalBackup(updated, user?.id);
          return updated;
        });
        localStorage.setItem('lastGateUpdateDate', today);
        window.dispatchEvent(new CustomEvent('newGateAppeared'));
      }
    };
    checkAndUpdateGates();
    const interval = setInterval(checkAndUpdateGates, 60000);
    return () => clearInterval(interval);
  }, [user?.id, saveToLocalBackup]);

  useEffect(() => {
    if (!gameState.punishment?.active || !gameState.punishment?.endTime) return;
    const checkPunishmentDamage = () => {
      const endTime = new Date(gameState.punishment.endTime).getTime();
      const now = new Date().getTime();
      const totalDuration = 4 * 60 * 60 * 1000;
      const startTime = endTime - totalDuration;

      if (now >= endTime) return;
      const msElapsed = now - startTime;
      if (msElapsed <= 0) return;

      const hoursElapsed = Math.floor(msElapsed / (1000 * 60 * 60));
      const expectedDamage = Math.min(20, hoursElapsed * 5);

      if (expectedDamage > 0) {
        setGameState(prev => {
          const baseHpInPenalty = prev.punishment.maxHpInPenalty - 30; 
          const targetHp = Math.max(0, baseHpInPenalty - expectedDamage);
          if (prev.hp > targetHp) {
            const updated = { ...prev, hp: targetHp, punishment: { ...prev.punishment, playerHpInPenalty: targetHp } };
            saveToLocalBackup(updated, user?.id);
            return updated;
          }
          return prev;
        });
      }
    };
    const interval = setInterval(checkPunishmentDamage, 60000);
    return () => clearInterval(interval);
  }, [gameState.punishment?.active, gameState.punishment?.endTime, user?.id, saveToLocalBackup]);

  // الـ Effect الرئيسي الموحد والمحسن لمزامنة البيانات تلقائياً دون تداخل
  useEffect(() => {
    if (!user?.id || !isInitializedRef.current) return;
    
    // حفظ سريع في لوكال ستورج للمتصفح الحالي
    saveToLocalBackup(gameState, user.id);

    const timeout = setTimeout(async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      skipNextRealtimeUpdateRef.current = true; // نمنع الإشعار القادم من السيرفر فوراً لأننا أصحاب الطلب

      try {
        const QuestsPayload = {
          mainQuests: gameState.quests.filter(q => q.isMainQuest),
          sideQuests: gameState.quests.filter(q => !q.isMainQuest),
          grandQuest: gameState.grandQuest,
          _extras: {
            isOnboarded: gameState.isOnboarded,
            equippedTitle: gameState.equippedTitle,
            playerTitle: gameState.playerTitle,
            playerJob: gameState.playerJob,
            currentBoss: gameState.currentBoss,
            abilities: gameState.abilities,
            achievements: gameState.achievements,
            inventory: gameState.inventory,
            equipment: gameState.equipment,
            prayerQuests: gameState.prayerQuests,
            shadowSoldiers: gameState.shadowSoldiers,
            gates: gameState.gates,
            dailyStats: gameState.dailyStats,
            totalQuestsCompleted: gameState.totalQuestsCompleted,
            streakDays: gameState.streakDays,
            lastActiveDate: gameState.lastActiveDate,
            missedQuestsCount: gameState.missedQuestsCount,
            selectedReciter: gameState.selectedReciter,
            soundEnabled: gameState.soundEnabled,
            lastBossAttackTime: gameState.lastBossAttackTime,
          },
        };

        // Map game stats -> DB stats_player shape {STR, AGI, SPI, MIN}
        const stats_player = {
          STR: gameState.stats.strength,
          AGI: gameState.stats.agility,
          SPI: gameState.stats.spirit,
          MIN: gameState.stats.mind,
        };

        const updateData: any = {
          name_player: gameState.playerName,
          gold_player: gameState.gold,
          hp_player: gameState.hp,
          hp_max: gameState.maxHp,
          mb_player: gameState.energy,
          mp_max: gameState.maxEnergy,
          void_player: gameState.shadowPoints,
          level_player: gameState.totalLevel,
          rank_player: getRank(gameState.totalLevel),
          stats_player,
          Quests: QuestsPayload,
          punishment_active: !!gameState.punishment?.active,
          punishment_end_at: gameState.punishment?.endTime || null,
        };

        const { error: updateError } = await profilesTable()
          .update(updateData)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Supabase profile update error:', updateError);
        }
      } catch (err) {
        console.error("Supabase Save Error, using local backup:", err);
      } finally { 
        isSyncingRef.current = false; 
      }
    }, 800); // دي باونس سريع لحفظ استهلاك الترافيك والـ Credit

    return () => clearTimeout(timeout);
  }, [gameState, user, saveToLocalBackup]);

  const getXpRequiredForLevel = (level: number): number => {
    if (level >= MAX_LEVEL) return 999999999;
    return Math.floor(100 * Math.pow(1.22, level - 1));
  };

  const calculateLevel = useCallback((xp: number): number => {
    let level = 1;
    let accumulatedXp = 0;
    while (level < MAX_LEVEL) {
      const required = getXpRequiredForLevel(level);
      if (xp < accumulatedXp + required) break;
      accumulatedXp += required;
      level++;
    }
    return level;
  }, []);

  const getXpProgress = (xp: number): number => {
    let level = 1;
    let accumulatedXp = 0;
    while (level < MAX_LEVEL) {
      const required = getXpRequiredForLevel(level);
      if (xp < accumulatedXp + required) {
        return ((xp - accumulatedXp) / required) * 100;
      }
      accumulatedXp += required;
      level++;
    }
    return 100;
  }

  const getTotalLevel = useCallback((levels: typeof gameState.levels): number => {
    const average = (levels.strength + levels.mind + levels.spirit + levels.agility) / 4;
    return Math.min(Math.floor(average), MAX_LEVEL);
  }, []);

  const getRank = (totalLevel: number): string => {
    if (totalLevel >= 50) return 'A';
    if (totalLevel >= 35) return 'B';
    if (totalLevel >= 20) return 'C';
    if (totalLevel >= 10) return 'D';
    return 'E';
  };

  // تعديل إكمال المهام الكبرى واليومية وحفظها الفوري
  const completeQuest = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest || quest.completed) return prev;
      
      const newStats = { ...prev.stats };
      newStats[quest.category] += quest.xpReward;
      const newLevels = { ...prev.levels };
      const oldLevel = newLevels[quest.category];
      newLevels[quest.category] = calculateLevel(newStats[quest.category]);
      const newTotalLevel = getTotalLevel(newLevels);
      
      if (newLevels[quest.category] > oldLevel) {
        setTimeout(() => setLevelUpInfo({ show: true, newLevel: newLevels[quest.category], category: quest.category }), 100);
      }
      
      const newQuests = prev.quests.map(q => q.id === questId ? { ...q, completed: true } : q);
      const newAbilities = prev.abilities.map(ability => {
        if (!ability.unlocked && newLevels[ability.category] >= ability.requiredLevel) return { ...ability, unlocked: true, level: 1 };
        return ability;
      });
      
      const newAchievements = prev.achievements.map(ach => {
        if (ach.id === 'ach1' && !ach.unlocked) return { ...ach, progress: 1, unlocked: true };
        if (ach.id === 'ach5') { const p = prev.totalQuestsCompleted + 1; return { ...ach, progress: p, unlocked: p >= ach.requirement }; }
        if (ach.id === 'ach7') return { ...ach, progress: newTotalLevel, unlocked: newTotalLevel >= 10 };
        if (ach.id === 'ach8') return { ...ach, progress: newTotalLevel, unlocked: newTotalLevel >= 50 };
        return ach;
      });
      
      const today = new Date().toISOString().split('T')[0];
      const todayStatIndex = prev.dailyStats.findIndex(s => s.date === today);
      let newDailyStats = [...prev.dailyStats];
      if (todayStatIndex >= 0) {
        newDailyStats[todayStatIndex] = { ...newDailyStats[todayStatIndex], [quest.category]: newDailyStats[todayStatIndex][quest.category] + quest.xpReward, questsCompleted: newDailyStats[todayStatIndex].questsCompleted + 1 };
      } else {
        newDailyStats.push({ date: today, strength: quest.category === 'strength' ? quest.xpReward : 0, mind: quest.category === 'mind' ? quest.xpReward : 0, spirit: quest.category === 'spirit' ? quest.xpReward : 0, agility: quest.category === 'agility' ? quest.xpReward : 0, questsCompleted: 1 });
      }
      
      const newGates = prev.gates.map(gate => (!gate.discovered && newTotalLevel >= gate.requiredPower * 0.5) ? { ...gate, discovered: true } : gate);
      const goldGain = quest.difficulty === 'legendary' ? 50 : quest.difficulty === 'hard' ? 30 : quest.difficulty === 'medium' ? 15 : 10;
      const shadowGain = quest.difficulty === 'legendary' ? 5 : quest.difficulty === 'hard' ? 3 : quest.difficulty === 'medium' ? 2 : 1;
      const energyCost = quest.difficulty === 'legendary' ? 15 : quest.difficulty === 'hard' ? 10 : quest.difficulty === 'medium' ? 7 : 5;
      
      return { ...prev, stats: newStats, levels: newLevels, totalLevel: newTotalLevel, quests: newQuests, abilities: newAbilities, achievements: newAchievements, dailyStats: newDailyStats.slice(-30), totalQuestsCompleted: prev.totalQuestsCompleted + 1, gold: prev.gold + goldGain, shadowPoints: (prev.shadowPoints || 0) + shadowGain, energy: Math.max(0, prev.energy - energyCost), gates: newGates };
    });
  }, [calculateLevel, getTotalLevel]);

  const completePrayerQuest = useCallback((prayerId: string) => {
    setGameState(prev => {
      const prayer = prev.prayerQuests.find(p => p.id === prayerId);
      if (!prayer || prayer.completed) return prev;
      const newPrayerQuests = prev.prayerQuests.map(p => p.id === prayerId ? { ...p, completed: true } : p);
      const newStats = { ...prev.stats };
      newStats.spirit += prayer.xpReward;
      const newLevels = { ...prev.levels };
      const oldLevel = newLevels.spirit;
      newLevels.spirit = calculateLevel(newStats.spirit);
      if (newLevels.spirit > oldLevel) setTimeout(() => setLevelUpInfo({ show: true, newLevel: newLevels.spirit, category: 'spirit' }), 100);
      return { ...prev, prayerQuests: newPrayerQuests, stats: newStats, levels: newLevels, totalLevel: getTotalLevel(newLevels), gold: prev.gold + 25 };
    });
  }, [calculateLevel, getTotalLevel]);

  const startGrandQuest = useCallback((category: StatType, title: string, tasks: string[]) => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    const grandQuest: GrandQuest = { id: `gq_${Date.now()}`, title, description: `تحدي 30 يوم في ${category}`, category, startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0], dailyTasks: tasks, completedDays: 0, active: true };
    setGameState(prev => ({ ...prev, grandQuest }));
  }, []);

  const completeGrandQuestDay = useCallback(() => {
    setGameState(prev => {
      if (!prev.grandQuest) return prev;
      const newCompletedDays = prev.grandQuest.completedDays + 1;
      const isCompleted = newCompletedDays >= 30;
      const newAchievements = prev.achievements.map(ach => (ach.id === 'ach6' && isCompleted && !ach.unlocked) ? { ...ach, progress: 1, unlocked: true } : ach);
      return { ...prev, grandQuest: { ...prev.grandQuest, completedDays: newCompletedDays, active: !isCompleted }, achievements: newAchievements };
    });
  }, []);

  const updatePlayerInfo = useCallback((name: string, title: string) => {
    setGameState(prev => ({ ...prev, playerName: name, playerTitle: title }));
  }, []);

  const setPlayerJob = useCallback((job: string) => {
    setGameState(prev => ({ ...prev, playerJob: job }));
  }, []);

  const completeOnboarding = useCallback((name: string) => {
    setGameState(prev => ({ ...prev, isOnboarded: true, playerName: name }));
  }, []);

  const useAbility = useCallback((abilityId: string) => {
    setGameState(prev => {
      const ability = prev.abilities.find(a => a.id === abilityId);
      if (!ability || !ability.unlocked) return prev;
      const today = new Date().toISOString().split('T')[0];
      if (ability.lastUsed && ability.cooldownDays > 0) {
        const diffDays = Math.floor((new Date().getTime() - new Date(ability.lastUsed).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < ability.cooldownDays) return prev;
      }
      return { ...prev, abilities: prev.abilities.map(a => a.id === abilityId ? { ...a, lastUsed: today, level: a.level + 0.1 } : a) };
    });
  }, []);

  const summonShadowSoldier = useCallback((soldierId: string) => {
    setGameState(prev => {
      const soldier = prev.shadowSoldiers?.find(s => s.id === soldierId);
      if (!soldier || soldier.unlocked || (prev.shadowPoints || 0) < soldier.cost) return prev;
      return { ...prev, shadowSoldiers: prev.shadowSoldiers.map(s => s.id === soldierId ? { ...s, unlocked: true } : s), shadowPoints: (prev.shadowPoints || 0) - soldier.cost };
    });
  }, []);

  const MARKET_ITEMS: InventoryItem[] = [
    { id: 'hp_elixir',      name: 'HP Elixir',         description: 'Restores 50% HP',  type: 'health', category: 'consumable',       effect: 50, price: 300,  quantity: 0, icon: '🧪' },
    { id: 'mp_elixir',      name: 'MP Elixir',         description: 'Restores 50% MP',  type: 'energy', category: 'consumable',       effect: 50, price: 300,  quantity: 0, icon: '⚡' },
    { id: 'xp_book',        name: 'XP Book',           description: 'Grants 75 XP',     type: 'xp',     category: 'consumable',       effect: 75, price: 250,  quantity: 0, icon: '📚' },
    { id: 'stone_dagger',   name: 'Stone Dagger',      description: 'Weapon (+16 HP, +23 DMG)', type: 'tool', category: 'weapon',     effect: 0,  price: 600,  quantity: 0, icon: '🗡️' },
    { id: 'shadow_dagger',  name: 'Dagger of Shadows', description: 'Weapon (+92 HP, +231 DMG)', type: 'tool', category: 'weapon',    effect: 0,  price: 11000,quantity: 0, icon: '🗡️' },
    { id: 'cutting_stones', name: 'Cutting Stones',    description: 'Merge 5 to forge a Mana Stone', type: 'tool', category: 'special_material', effect: 0, price: 7000, quantity: 0, icon: '💎' },
    { id: 'mana_analyst',   name: 'Mana Analyst',      description: '2 uses utility',   type: 'tool',   category: 'utility',          effect: 0,  price: 1000, quantity: 0, icon: '📊' },
    { id: 'mana_stone',     name: 'Mana Stone',        description: 'Forged from 5 Cutting Stones', type: 'tool', category: 'stone',  effect: 0,  price: 0,    quantity: 0, icon: '🔮' },
  ];

  const purchaseItem = useCallback((itemId: string) => {
    setGameState(prev => {
      let item = prev.inventory.find(i => i.id === itemId);
      if (!item) {
        item = MARKET_ITEMS.find(i => i.id === itemId);
        if (!item || prev.gold < item.price) return prev;
        return { ...prev, inventory: [...prev.inventory, { ...item, quantity: 1 }], gold: prev.gold - item.price };
      }
      if (prev.gold < item.price) return prev;
      return { ...prev, inventory: prev.inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i), gold: prev.gold - item.price };
    });
  }, []);

  const equipTitle = useCallback((itemId: string) => {
    setGameState(prev => {
      const item = prev.inventory.find(i => i.id === itemId);
      if (!item || item.type !== 'title' || item.quantity <= 0) return prev;
      return { ...prev, inventory: prev.inventory.map(i => ({ ...i, equipped: i.id === itemId ? true : (i.type === 'title' ? false : i.equipped) })), equippedTitle: item.name };
    });
  }, []);

  const unequipTitle = useCallback(() => {
    setGameState(prev => ({ ...prev, inventory: prev.inventory.map(i => ({ ...i, equipped: i.type === 'title' ? false : i.equipped })), equippedTitle: undefined }));
  }, []);

  const useItem = useCallback((itemId: string, quantity: number = 1, statAllocation?: Partial<Record<StatType, number>>) => {
    setGameState(prev => {
      const item = prev.inventory.find(i => i.id === itemId);
      if (!item || item.quantity < quantity) return prev;

      let updates: Partial<GameState> = {};

      if (item.type === 'health') {
        updates.hp = Math.min(prev.maxHp, prev.hp + (prev.maxHp * item.effect / 100) * quantity);
        if (prev.punishment?.active) {
          updates.punishment = { ...prev.punishment, playerHpInPenalty: updates.hp };
        }
      } else if (item.type === 'energy') {
        updates.energy = Math.min(prev.maxEnergy, prev.energy + (prev.maxEnergy * item.effect / 100) * quantity);
      } else if (item.type === 'xp') {
        if (statAllocation) {
          updates.stats = {
            strength: prev.stats.strength + (statAllocation.strength || 0),
            mind: prev.stats.mind + (statAllocation.mind || 0),
            spirit: prev.stats.spirit + (statAllocation.spirit || 0),
            agility: prev.stats.agility + (statAllocation.agility || 0),
          };
        } else {
          const xpPerStat = Math.floor((item.effect * quantity) / 4);
          updates.stats = { strength: prev.stats.strength + xpPerStat, mind: prev.stats.mind + xpPerStat, spirit: prev.stats.spirit + xpPerStat, agility: prev.stats.agility + xpPerStat };
        }
        const newLevels = { strength: calculateLevel(updates.stats.strength), mind: calculateLevel(updates.stats.mind), spirit: calculateLevel(updates.stats.spirit), agility: calculateLevel(updates.stats.agility) };
        updates.levels = newLevels;
        updates.totalLevel = getTotalLevel(newLevels);
      } else if (item.type === 'title' || item.type === 'tool' || item.type === 'key' || item.type === 'reset') {
        return prev;
      }

      const newInventory = prev.inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i);
      return { ...prev, ...updates, inventory: newInventory };
    });
  }, [calculateLevel, getTotalLevel]);

  const resetAndReallocateXP = useCallback((newAllocation: Record<StatType, number>) => {
    setGameState(prev => {
      const resetItem = prev.inventory.find(i => i.id === 'xp_reset');
      if (!resetItem || resetItem.quantity <= 0) return prev;

      const totalXP = prev.stats.strength + prev.stats.mind + prev.stats.spirit + prev.stats.agility;
      const allocatedTotal = Object.values(newAllocation).reduce((sum, val) => sum + val, 0);
      if (allocatedTotal !== totalXP) return prev;

      const newStats = { ...newAllocation };
      const newLevels = { strength: calculateLevel(newStats.strength), mind: calculateLevel(newStats.mind), spirit: calculateLevel(newStats.spirit), agility: calculateLevel(newStats.agility) };
      const newInventory = prev.inventory.map(i => i.id === 'xp_reset' ? { ...i, quantity: i.quantity - 1 } : i);

      return { ...prev, stats: newStats, levels: newLevels, totalLevel: getTotalLevel(newLevels), inventory: newInventory };
    });
  }, [calculateLevel, getTotalLevel]);

  const takeDamage = useCallback((damage: number) => {
    setGameState(prev => {
      const nextHp = Math.max(0, prev.hp - damage);
      if (prev.punishment?.active) {
        return { ...prev, hp: nextHp, punishment: { ...prev.punishment, playerHpInPenalty: nextHp } };
      }
      return { ...prev, hp: nextHp };
    });
  }, []);

  const QUEST_FAIL_HP: Record<string, number> = { easy: 10, medium: 20, hard: 35, legendary: 50 };

  const failQuest = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest || quest.completed) return prev;
      const dmg = QUEST_FAIL_HP[quest.difficulty] ?? 15;
      const newQuests = prev.quests.map(q => q.id === questId ? { ...q, startedAt: undefined, timerDuration: undefined, active: false } : q);
      const nextHp = Math.max(0, prev.hp - dmg);
      return { ...prev, quests: newQuests, hp: nextHp, missedQuestsCount: (prev.missedQuestsCount ?? 0) + 1, punishment: prev.punishment?.active ? { ...prev.punishment, playerHpInPenalty: nextHp } : prev.punishment };
    });
  }, []);

  const applyPunishment = useCallback(() => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 4);
    setGameState(prev => {
      const nextHp = Math.max(0, prev.hp - 30);
      return { 
        ...prev, 
        punishmentEndTime: endTime.toISOString(), 
        hp: nextHp,
        punishment: { active: true, endTime: endTime.toISOString(), monstersDefeated: 0, currentWave: 1, playerHpInPenalty: nextHp, maxHpInPenalty: prev.maxHp }
      };
    });
  }, []);

  const clearPunishment = useCallback(() => {
    setGameState(prev => ({ 
      ...prev, 
      punishmentEndTime: null, 
      missedQuestsCount: 0,
      punishment: { active: false, endTime: null, monstersDefeated: 0, currentWave: 1, playerHpInPenalty: prev.hp, maxHpInPenalty: prev.maxHp }
    }));
  }, []);

  const toggleSound = useCallback(() => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem('levelUpLife_' + (user?.id || 'guest'));
    setGameState(getDefaultState());
  }, [user?.id]);

  const updatePlayerData = useCallback((data: any) => {
    setGameState(prev => {
      const newState = { ...prev };
      if (data.playerName !== undefined) newState.playerName = data.playerName;
      if (data.title !== undefined) newState.equippedTitle = data.title === '-' ? undefined : data.title;
      if (data.gold !== undefined) newState.gold = data.gold;
      if (data.hp !== undefined) {
        newState.hp = data.hp;
        if (newState.punishment?.active) newState.punishment.playerHpInPenalty = data.hp;
      }
      if (data.maxHp !== undefined) newState.maxHp = data.maxHp;
      if (data.streakDays !== undefined) newState.streakDays = data.streakDays;
      if (data.punishment !== undefined) {
        newState.punishment = data.punishment;
        if (data.punishment && data.punishment.playerHpInPenalty !== undefined) newState.hp = data.punishment.playerHpInPenalty;
      }
      if (data.stats) {
        newState.stats = data.stats;
        newState.levels = { strength: calculateLevel(data.stats.strength), mind: calculateLevel(data.stats.mind), spirit: calculateLevel(data.stats.spirit), agility: calculateLevel(data.stats.agility) };
        newState.totalLevel = getTotalLevel(newState.levels);
      }
      return newState;
    });
  }, [calculateLevel, getTotalLevel]);

  const dismissLevelUp = useCallback(() => setLevelUpInfo(null), []);

  // تم حذف دالات الـ update المنفصلة التي تسبب قفل للشبكة وخلل الحفظ بالمهام الجانبية
  const startSideQuest = useCallback((questId: string) => {
    setGameState(prev => {
      if ((prev.energy ?? 0) < 10) {
        try { window.dispatchEvent(new CustomEvent('mp-too-low', { detail: { current: prev.energy, required: 10 } })); } catch {}
        return prev;
      }
      const updatedQuests = prev.quests.map(q => (q.id === questId && !q.active && !q.completed) ? { ...q, startedAt: new Date().toISOString(), timeProgress: q.timeProgress || 0, active: true, claimed: false } : q);
      return { ...prev, quests: updatedQuests };
    });
  }, []);

  const updateSideQuestProgress = useCallback((questId: string, progress: number) => {
    setGameState(prev => {
      const updatedQuests = prev.quests.map(q => {
        if (q.id === questId) {
          const isComplete = progress >= (q.requiredTime || 0) * 60;
          return { ...q, timeProgress: progress, completed: isComplete ? true : q.completed, active: isComplete ? false : q.active };
        }
        return q;
      });
      return { ...prev, quests: updatedQuests };
    });
  }, []);

  const claimSideQuest = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest || quest.claimed) return prev;
      const newStats = { ...prev.stats };
      newStats[quest.category] += quest.xpReward;
      const newLevels = { ...prev.levels };
      const oldLevel = newLevels[quest.category];
      newLevels[quest.category] = Math.min(calculateLevel(newStats[quest.category]), MAX_LEVEL);
      const newTotalLevel = getTotalLevel(newLevels);
      if (newLevels[quest.category] > oldLevel && newLevels[quest.category] < MAX_LEVEL) setTimeout(() => setLevelUpInfo({ show: true, newLevel: newLevels[quest.category], category: quest.category }), 100);
      return { ...prev, stats: newStats, levels: newLevels, totalLevel: newTotalLevel, quests: prev.quests.map(q => q.id === questId ? { ...q, completed: true, claimed: true, active: false } : q), gold: prev.gold + (quest.goldReward || 10), totalQuestsCompleted: prev.totalQuestsCompleted + 1 };
    });
  }, [calculateLevel, getTotalLevel]);

  const closeSideQuest = useCallback((questId: string) => {
    setGameState(prev => ({ ...prev, quests: prev.quests.map(q => q.id === questId ? { ...q, startedAt: undefined, timeProgress: 0 } : q) }));
  }, []);

  const completeGate = useCallback((gateId: string, loot: { id: string; type: string; quantity: number }[]) => {
    setGameState(prev => {
      let newGold = prev.gold;
      let newShadowPoints = prev.shadowPoints;
      let newStats = { ...prev.stats };
      const newInventory = [...prev.inventory];

      loot.forEach(item => {
        if (item.type === 'gold') newGold += item.quantity;
        else if (item.type === 'xp') {
          const perStat = Math.floor(item.quantity / 4);
          newStats.strength += perStat; newStats.mind += perStat; newStats.spirit += perStat; newStats.agility += perStat + (item.quantity % 4);
        } else if (item.id === 'shadow_points') newShadowPoints += item.quantity;
        else if (item.type === 'item' || item.type === 'key') {
          const existingItem = newInventory.find(i => i.id === item.id);
          if (existingItem) existingItem.quantity += item.quantity;
          else {
            newInventory.push({ id: item.id, name: item.id.replace(/_/g, ' '), description: 'عنصر من غنائم البوابة', type: item.type === 'key' ? 'key' : 'xp', effect: 50, price: 0, quantity: item.quantity, icon: '📦' });
          }
        }
      });

      const newLevels = { strength: Math.min(calculateLevel(newStats.strength), MAX_LEVEL), mind: Math.min(calculateLevel(newStats.mind), MAX_LEVEL), spirit: Math.min(calculateLevel(newStats.spirit), MAX_LEVEL), agility: Math.min(calculateLevel(newStats.agility), MAX_LEVEL) };
      return { ...prev, gold: newGold, shadowPoints: newShadowPoints, stats: newStats, levels: newLevels, totalLevel: getTotalLevel(newLevels), inventory: newInventory, gates: prev.gates.map(g => g.id === gateId ? { ...g, completed: true } : g) };
    });
  }, [calculateLevel, getTotalLevel]);

  const consumeItem = useCallback((itemId: string, quantity: number = 1) => {
    setGameState(prev => ({ ...prev, inventory: prev.inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i) }));
  }, []);

  const spendGold = useCallback((amount: number): boolean => {
    let success = false;
    setGameState(prev => {
      if ((prev.gold || 0) < amount) return prev;
      success = true;
      return { ...prev, gold: prev.gold - amount };
    });
    return success;
  }, []);

  const mergeCuttingStones = useCallback((): boolean => {
    const NEED = 5; let ok = false;
    setGameState(prev => {
      const cs = prev.inventory.find(i => i.id === 'cutting_stones');
      if (!cs || cs.quantity < NEED) return prev;
      ok = true;
      const decremented = prev.inventory.map(i => i.id === 'cutting_stones' ? { ...i, quantity: i.quantity - NEED } : i);
      const existingStone = decremented.find(i => i.id === 'mana_stone');
      return { ...prev, inventory: existingStone ? decremented.map(i => i.id === 'mana_stone' ? { ...i, quantity: i.quantity + 1 } : i) : [...decremented, { id: 'mana_stone', name: 'Mana Stone', description: 'Forged stone', type: 'tool', category: 'stone', effect: 0, price: 0, quantity: 1, icon: '🔮' }] };
    });
    return ok;
  }, []);

  const consumeManaStone = useCallback((): boolean => {
    let ok = false;
    setGameState(prev => {
      const ms = prev.inventory.find(i => i.id === 'mana_stone');
      if (!ms || ms.quantity <= 0) return prev;
      ok = true;
      return { ...prev, inventory: prev.inventory.map(i => i.id === 'mana_stone' ? { ...i, quantity: i.quantity - 1 } : i) };
    });
    return ok;
  }, []);

  const claimGateLoot = useCallback((entries: Array<{ id: string; quantity: number; type: 'gold' | 'item' }>) => {
    setGameState(prev => {
      let gold = prev.gold; let inv = [...prev.inventory];
      for (const e of entries) {
        if (e.type === 'gold') { gold += e.quantity; continue; }
        const existing = inv.find(i => i.id === e.id);
        if (existing) inv = inv.map(i => i.id === e.id ? { ...i, quantity: i.quantity + e.quantity } : i);
        else { const def = MARKET_ITEMS.find(i => i.id === e.id); if (def) inv.push({ ...def, quantity: e.quantity }); }
      }
      return { ...prev, gold, inventory: inv };
    });
  }, []);

  return {
    gameState, levelUpInfo, completeQuest, completePrayerQuest, startGrandQuest, completeGrandQuestDay, updatePlayerInfo, setPlayerJob, completeOnboarding, useAbility, summonShadowSoldier, purchaseItem, useItem, consumeItem, spendGold, equipTitle, unequipTitle, takeDamage, failQuest, applyPunishment, clearPunishment, toggleSound, resetGame, dismissLevelUp, getXpProgress, calculateLevel, getTotalLevel, getRank, startSideQuest, updateSideQuestProgress, claimSideQuest, closeSideQuest, updatePlayerData, completeGate, resetAndReallocateXP, mergeCuttingStones, consumeManaStone, claimGateLoot,
  };
};
