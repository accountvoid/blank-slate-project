import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, Quest, Boss, StatType, Ability, Achievement, GrandQuest, InventoryItem, PrayerQuest, ShadowSoldier, Equipment, Gate } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * `profiles` is a heterogeneous JSONB-backed table whose generated row type
 * does not match our richly-typed domain models (Quest, Boss, …).
 * `profilesTable()` centralises the unavoidable structural cast so the rest
 * of the hook can stay strictly typed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const profilesTable = () => supabase.from('profiles') as unknown as any;

const MAX_LEVEL = 100; 
const BASE_XP_PER_LEVEL = 100;

const getDayOfWeek = () => new Date().getDay();

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
  
  // Seeded random based on date for deterministic rewards
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
  return [sideQuests[startIndex], sideQuests[(startIndex + 1) % sideQuests.length], sideQuests[(startIndex + 2) % sideQuests.length]];
};

const getInitialAbilities = (): Ability[] => [
  { id: 'a1', name: 'قدرة الانضباط', description: 'تزيد تركيزك على المهام', requiredLevel: 3, category: 'mind', unlocked: false, level: 1, cooldownDays: 7, effect: 'مضاعفة XP للمهمة القادمة' },
  { id: 'a2', name: 'قدرة التركيز', description: 'تقلل التشتت الذهني', requiredLevel: 5, category: 'mind', unlocked: false, level: 1, cooldownDays: 7, effect: 'إكمال مهمة تلقائياً' },
  { id: 'a3', name: 'قدرة التغلب', description: 'تساعدك على هزيمة الزعماء', requiredLevel: 4, category: 'strength', unlocked: false, level: 1, cooldownDays: 7, effect: 'ضرر مضاعف للزعيم' },
  { id: 'a4', name: 'قدرة ضبط النفس', description: 'تزيد مقاومتك للإغراءات', requiredLevel: 6, category: 'spirit', unlocked: false, level: 1, cooldownDays: 7, effect: 'حماية من خسارة HP' },
  { id: 'a5', name: 'قدرة السرعة', description: 'تزيد رشاقتك وسرعتك', requiredLevel: 5, category: 'agility', unlocked: false, level: 1, cooldownDays: 7, effect: 'مضاعفة XP الرشاقة' },
  { id: 'a6', name: 'قدرة الصبر', description: 'تزيد من تحملك', requiredLevel: 7, category: 'spirit', unlocked: false, level: 1, cooldownDays: 7, effect: 'تمديد وقت المهمات' },
  { id: 'a7', name: 'كشف البوابات', description: 'تكشف البوابات المخفية', requiredLevel: 2, category: 'agility', unlocked: false, level: 1, cooldownDays: 0, effect: 'كشف بوابة إضافية' },
  { id: 'a8', name: 'قدرة القوة', description: 'تزيد قوتك الجسدية', requiredLevel: 8, category: 'strength', unlocked: false, level: 1, cooldownDays: 7, effect: 'استعادة 50% طاقة' },
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
    { id: 'gate_e', name: 'بوابة E', rank: 'E', requiredPower: 5, energyDensity: '1,200', danger: 'MINIMAL THREAT', color: 'gray', discovered: true, completed: false, rewards: { xp: 100, gold: 50, shadowPoints: 2 } },
    { id: 'gate_d', name: 'بوابة D', rank: 'D', requiredPower: 10, energyDensity: '5,400', danger: 'LOW THREAT', color: 'green', discovered: false, completed: false, rewards: { xp: 250, gold: 100, shadowPoints: 5 } },
    { id: 'gate_c', name: 'بوابة C', rank: 'C', requiredPower: 20, energyDensity: '12,000', danger: 'MODERATE DANGER', color: 'blue', discovered: false, completed: false, rewards: { xp: 500, gold: 200, shadowPoints: 10 } },
    { id: 'gate_b', name: 'بوابة B', rank: 'B', requiredPower: 35, energyDensity: '28,000', danger: 'HIGH DANGER', color: 'purple', discovered: false, completed: false, rewards: { xp: 1000, gold: 400, shadowPoints: 20 } },
    { id: 'gate_a', name: 'بوابة A', rank: 'A', requiredPower: 60, energyDensity: '65,000', danger: 'EXTREME PERIL', color: 'orange', discovered: false, completed: false, rewards: { xp: 2500, gold: 0, shadowPoints: 50 } },
    { id: 'gate_s', name: 'بوابة S', rank: 'S', requiredPower: 100, energyDensity: 'UNMEASURABLE', danger: 'CATACLYSMIC', color: 'red', discovered: false, completed: false, rewards: { xp: 10000, gold: 0, shadowPoints: 200 } },
  ];

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  
  // 4 بوابات في الأسبوع: السبت(6)، الأحد(0)، الثلاثاء(2)، الخميس(4)
  const gateDays = [0, 2, 4, 6]; // Sun, Tue, Thu, Sat
  
  if (!gateDays.includes(dayOfWeek)) {
    return []; // لا بوابات اليوم
  }
  
  // Seeded random based on date for consistent gates
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  // اختيار رتبة البوابة بناءً على مستوى اللاعب
  let availableRanks: string[] = [];
  if (playerLevel >= 35) availableRanks = ['C', 'B'];
  else if (playerLevel >= 20) availableRanks = ['D', 'C'];
  else if (playerLevel >= 10) availableRanks = ['E', 'D'];
  else availableRanks = ['E'];
  
  // بوابة واحدة لكل يوم من أيام البوابات
  const rankIndex = Math.floor(seededRandom(dateSeed + 42) * availableRanks.length);
  const selectedRank = availableRanks[rankIndex];
  const gateTemplate = allGates.find(g => g.rank === selectedRank) || allGates[0];
  
  // البوابة تغلق في نهاية اليوم
  const closingDate = new Date(today);
  closingDate.setHours(23, 59, 59, 999);
  const closingTime = closingDate.toISOString();
  
  const isHigherLevel = playerLevel >= gateTemplate.requiredPower;
  
  return [{
    ...gateTemplate,
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

const getInitialInventory = (): InventoryItem[] => [
  { id: 'health_potion', name: 'زجاجة الدم', description: 'تزيد الدم بنسبة 25%', type: 'health', category: 'Elixir', effect: 25, price: 100, quantity: 0, icon: '❤️' },
  { id: 'xp_book', name: 'كتاب الخبرة', description: 'يزيد خبرة اللاعب 500 XP', type: 'xp', category: 'Element', effect: 500, price: 250, quantity: 0, icon: '📚' },
  { id: 'energy_drink', name: 'مشروب الطاقة', description: 'يستعيد 50% من الطاقة', type: 'energy', category: 'Elixir', effect: 50, price: 150, quantity: 0, icon: '⚡' },
  { id: 'xp_reset', name: 'حجر إعادة التوزيع', description: 'يعيد جميع نقاط XP ويسمح لك بإعادة توزيعها', type: 'reset', category: 'Special', effect: 0, price: 5000, quantity: 0, icon: '🔄' },
  { id: 'rename_stone', name: 'حجر إعادة التسمية', description: 'يسمح لك بتغيير اسم شخصيتك', type: 'tool', category: 'Special', effect: 0, price: 2000, quantity: 1, icon: '✏️' },
  { id: 'gate_exit_stone', name: 'حجر الخروج من البوابة', description: 'يسمح بالخروج الآمن من البوابة دون عقوبة', type: 'key', category: 'Special', effect: 0, price: 3000, quantity: 1, icon: '🚪' },
  { id: 'grand_quest_stone', name: 'حجر المهمة الكبرى', description: 'مطلوب لتفعيل مهمة Grand Quest جديدة', type: 'tool', category: 'Special', effect: 0, price: 5000, quantity: 1, icon: '🔮' },
  { id: 'central_activation_stone', name: 'حجر التفعيل المركزي', description: 'يفعّل شات النظام للتواصل مع ذكاء النظام', type: 'tool', category: 'Special', effect: 0, price: 10000, quantity: 1, icon: '💬' },
];

const getInitialPrayerQuests = (): PrayerQuest[] => [
  { id: 'fajr', name: 'Fajr', arabicName: 'صلاة الفجر', time: '05:00', completed: false, xpReward: 50 },
  { id: 'dhuhr', name: 'Dhuhr', arabicName: 'صلاة الظهر', time: '12:30', completed: false, xpReward: 40 },
  { id: 'asr', name: 'Asr', arabicName: 'صلاة العصر', time: '15:30', completed: false, xpReward: 40 },
  { id: 'maghrib', name: 'Maghrib', arabicName: 'صلاة المغرب', time: '18:00', completed: false, xpReward: 40 },
  { id: 'isha', name: 'Isha', arabicName: 'صلاة العشاء', time: '19:30', completed: false, xpReward: 45 },
];

const getInitialShadowSoldiers = (): ShadowSoldier[] => [
  { id: 'deris', name: 'Deris', arabicName: 'ديريس', type: 'mind', level: 1, power: 50, unlocked: false, cost: 10 },
  { id: 'balfo', name: 'Balfo', arabicName: 'بالفو', type: 'strength', level: 1, power: 60, unlocked: false, cost: 15 },
  { id: 'qaboos', name: 'Qaboos', arabicName: 'قابوس', type: 'spirit', level: 1, power: 55, unlocked: false, cost: 12 },
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
  shadowSoldiers: getInitialShadowSoldiers(),
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

  // دالة لجلب مفتاح التخزين المحلي الخاص بالمستخدم
  const getStorageKey = (userId?: string) => {
    return userId ? `levelUpLife_${userId}` : 'levelUpLife_guest';
  };

  const [gameState, setGameState] = useState<GameState>(() => getDefaultState());
  const [levelUpInfo, setLevelUpInfo] = useState<{ show: boolean; newLevel: number; category?: StatType } | null>(null);

  // مراقبة تغيير المستخدم وإعادة تحميل البيانات
  useEffect(() => {
    const currentUserId = user?.id || null;
    
    // إذا تغير المستخدم، أعد تهيئة البيانات
    if (previousUserIdRef.current !== currentUserId) {
      isInitializedRef.current = false;
      previousUserIdRef.current = currentUserId;
      
      // مسح البيانات القديمة من الذاكرة
      if (!currentUserId) {
        // تسجيل خروج - إعادة للحالة الافتراضية
        setGameState(getDefaultState());
        return;
      }
    }

    if (!user || isInitializedRef.current) return;

    const loadFromSupabase = async () => {
      try {
        const { data, error } = await profilesTable().select('quests, current_boss, abilities, achievements, inventory, equipment, prayer_quests, shadow_soldiers, gates, grand_quest, claimed_rewards, daily_stats, total_quests_completed, streak_days, last_active_date, punishment, punishment_end_time, missed_quests_count, selected_reciter, sound_enabled, is_onboarded, last_boss_attack_time, player_name, gold, hp, max_hp, energy, max_energy, shadow_points, equipped_title, stats, levels, total_level, player_title, player_job').eq('user_id', user.id).maybeSingle();
        
        if (error) { 
          isInitializedRef.current = true; 
          // تحميل من localStorage للمستخدم الحالي
          const localKey = getStorageKey(user.id);
          const saved = localStorage.getItem(localKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              const defaultState = getDefaultState();
              setGameState({ ...defaultState, ...parsed, isOnboarded: true });
            } catch {}
          }
          return; 
        }
        
        if (data) {
          // Persisted profile row holds JSONB columns; the loose record cast here is
          // intentional — strict typing happens further down where we map fields onto GameState.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const savedState = data as any;
          const defaultState = getDefaultState();
          const mergedState = { 
            ...defaultState, 
            isOnboarded: true,
            playerName: savedState.player_name || defaultState.playerName,
            gold: savedState.gold ?? defaultState.gold,
            hp: savedState.hp ?? defaultState.hp,
            maxHp: savedState.max_hp ?? defaultState.maxHp,
            energy: savedState.energy ?? defaultState.energy,
            maxEnergy: savedState.max_energy ?? defaultState.maxEnergy,
            shadowPoints: savedState.shadow_points ?? defaultState.shadowPoints,
            equippedTitle: savedState.equipped_title || defaultState.equippedTitle,
            stats: savedState.stats || defaultState.stats,
            levels: savedState.levels || defaultState.levels,
            totalLevel: savedState.total_level || defaultState.totalLevel,
            playerTitle: savedState.player_title || defaultState.playerTitle,
            playerJob: savedState.player_job || defaultState.playerJob,
            quests: savedState.quests || defaultState.quests,
            currentBoss: savedState.current_boss || defaultState.currentBoss,
            abilities: savedState.abilities || defaultState.abilities,
            achievements: savedState.achievements || defaultState.achievements,
            inventory: savedState.inventory || defaultState.inventory,
            equipment: savedState.equipment || defaultState.equipment,
            prayerQuests: savedState.prayer_quests || defaultState.prayerQuests,
            shadowSoldiers: savedState.shadow_soldiers || defaultState.shadowSoldiers,
            gates: savedState.gates || defaultState.gates,
            grandQuest: savedState.grand_quest || defaultState.grandQuest,
            dailyStats: savedState.daily_stats || defaultState.dailyStats,
            totalQuestsCompleted: savedState.total_quests_completed ?? defaultState.totalQuestsCompleted,
            streakDays: savedState.streak_days ?? defaultState.streakDays,
            lastActiveDate: savedState.last_active_date || defaultState.lastActiveDate,
            punishment: savedState.punishment || defaultState.punishment,
            punishmentEndTime: savedState.punishment_end_time || defaultState.punishmentEndTime,
            missedQuestsCount: savedState.missed_quests_count ?? defaultState.missedQuestsCount,
            selectedReciter: savedState.selected_reciter || defaultState.selectedReciter,
            soundEnabled: savedState.sound_enabled ?? defaultState.soundEnabled,
            lastBossAttackTime: savedState.last_boss_attack_time || defaultState.lastBossAttackTime,
          };
          
          const today = new Date().toISOString().split('T')[0];
          if (mergedState.lastActiveDate !== today) {
            mergedState.quests = [...getRotatingQuests(), ...getSideQuests()];
            mergedState.prayerQuests = mergedState.prayerQuests?.map((p: PrayerQuest) => ({ ...p, completed: false })) || getInitialPrayerQuests();
            mergedState.gates = getScheduledGates(mergedState.totalLevel || 1);
            mergedState.lastActiveDate = today;
          }
          setGameState(mergedState);
        } else {
          // لا توجد بيانات في السيرفر - إنشاء حالة جديدة
          const defaultState = getDefaultState();
          setGameState({ ...defaultState, isOnboarded: true });
        }
        isInitializedRef.current = true;
      } catch (err) { 
        isInitializedRef.current = true; 
      }
    };
    
    loadFromSupabase();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const channelName = `game-state-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelName).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload) => {
          if (payload.new && !isSyncingRef.current) {
            const newData = payload.new as Record<string, unknown> & {
              player_name?: string; equipped_title?: string;
              gold?: number; hp?: number; max_hp?: number;
              energy?: number; max_energy?: number; shadow_points?: number;
            };
            setGameState(prev => ({
              ...prev,
              playerName: newData.player_name || prev.playerName,
              equippedTitle: newData.equipped_title || prev.equippedTitle,
              gold: newData.gold ?? prev.gold,
              hp: newData.hp ?? prev.hp,
              maxHp: newData.max_hp ?? prev.maxHp,
              energy: newData.energy ?? prev.energy,
              maxEnergy: newData.max_energy ?? prev.maxEnergy,
              shadowPoints: newData.shadow_points ?? prev.shadowPoints,
            }));
          }
        }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    const checkAndUpdateGates = () => {
      const lastGateUpdate = localStorage.getItem('lastGateUpdateDate');
      const today = new Date().toISOString().split('T')[0];
      if (lastGateUpdate !== today) {
        setGameState(prev => ({ ...prev, gates: getScheduledGates(prev.totalLevel || 1) }));
        localStorage.setItem('lastGateUpdateDate', today);
        window.dispatchEvent(new CustomEvent('newGateAppeared'));
      }
    };
    checkAndUpdateGates();
    const interval = setInterval(checkAndUpdateGates, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // حفظ في localStorage بمفتاح خاص بالمستخدم
    const storageKey = getStorageKey(user?.id);
    localStorage.setItem(storageKey, JSON.stringify(gameState));
    
    if (!user || isSyncingRef.current || !isInitializedRef.current) return;
    
    const timeout = setTimeout(async () => {
      isSyncingRef.current = true;
      try {
        const { data: existing } = await profilesTable().select('id').eq('user_id', user.id).maybeSingle();
        const updateData = { 
          player_name: gameState.playerName, 
          equipped_title: gameState.equippedTitle || null, 
          gold: gameState.gold, 
          hp: gameState.hp, 
          max_hp: gameState.maxHp, 
          energy: gameState.energy, 
          max_energy: gameState.maxEnergy, 
          shadow_points: gameState.shadowPoints,
          stats: gameState.stats,
          levels: gameState.levels,
          total_level: gameState.totalLevel,
          player_title: gameState.playerTitle,
          player_job: gameState.playerJob,
          quests: gameState.quests,
          current_boss: gameState.currentBoss,
          abilities: gameState.abilities,
          achievements: gameState.achievements,
          inventory: gameState.inventory,
          equipment: gameState.equipment,
          prayer_quests: gameState.prayerQuests,
          shadow_soldiers: gameState.shadowSoldiers,
          gates: gameState.gates,
          grand_quest: gameState.grandQuest,
          daily_stats: gameState.dailyStats,
          total_quests_completed: gameState.totalQuestsCompleted,
          streak_days: gameState.streakDays,
          last_active_date: gameState.lastActiveDate,
          punishment: gameState.punishment,
          missed_quests_count: gameState.missedQuestsCount,
          selected_reciter: gameState.selectedReciter,
          sound_enabled: gameState.soundEnabled,
          is_onboarded: gameState.isOnboarded,
        };
        if (existing) await profilesTable().update(updateData).eq('user_id', user.id);
        else await profilesTable().insert([{ user_id: user.id, ...updateData }]);
      } catch (err) {} finally { isSyncingRef.current = false; }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [gameState, user]);

  // --- نظام الخبرة المطور (المنحنى الأسّي) ---
  const getXpRequiredForLevel = (level: number): number => {
    if (level >= MAX_LEVEL) return 999999999;
    const baseXP = 100;
    // زيادة الصعوبة بنسبة 22% تراكمياً لكل مستوى
    return Math.floor(baseXP * Math.pow(1.22, level - 1));
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
  };

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
    { id: 'xp_book', name: 'كتاب الخبرة', description: 'يزيد خبرة اللاعب 500 XP موزعة على جميع الإحصائيات', type: 'xp', category: 'Element', effect: 500, price: 250, quantity: 0, icon: '📚' },
    { id: 'hp_potion', name: 'Blood Elixir', description: 'يستعيد 50% من الصحة القصوى', type: 'health', category: 'Elixir', effect: 50, price: 500, quantity: 0, icon: '🧪' },
    { id: 'mp_potion', name: 'Energy Elixir', description: 'يستعيد 50% من الطاقة القصوى', type: 'energy', category: 'Elixir', effect: 50, price: 500, quantity: 0, icon: '⚡' },
    { id: 'mana_meter', name: 'Mana Gauge', description: 'جهاز قياس طاقة البوابات والعناصر', type: 'tool', category: 'Tool', effect: 0, price: 2000, quantity: 0, icon: '📊' },
    { id: 'dagger', name: 'خنجر الظلام', description: 'سلاح قوي يفتح مهارة ضربة الخنجر في المعركة', type: 'tool', category: 'Weapon', effect: 0, price: 3000, quantity: 0, icon: '🗡️' },
    { id: 'enhancement_stone', name: 'حجر التطوير', description: 'حجر طاقة لتطوير مهارات المعركة - اجمع الأحجار لرفع مستوى المهارات', type: 'tool', category: 'Enhancement', effect: 0, price: 1000, quantity: 0, icon: '💎' },
    { id: 'awakened_title', name: 'المستيقظ الواعي', description: 'لقب يُظهر أنك من المستيقظين - يزيد XP بنسبة 5%', type: 'title', category: 'Title', effect: 5, price: 3000, quantity: 0, icon: '👑' },
    { id: 'power_eye_title', name: 'عين القوة', description: 'لقب نادر يكشف قوة الأعداء ويظهر إحصائياتهم', type: 'title', category: 'Title', effect: 10, price: 10000, quantity: 0, icon: '👁️' },
    { id: 'storm_hand_title', name: 'يد العاصفة', description: 'لقب نادر يزيد ضرر الهجمات بنسبة 10%', type: 'title', category: 'Title', effect: 10, price: 15000, quantity: 0, icon: '🌩️' },
    { id: 'return_key', name: 'مفتاح العودة', description: 'يتيح الخروج من البوابة دون إكمالها بشكل آمن', type: 'key', category: 'Key', effect: 0, price: 8000, quantity: 0, icon: '🔑' },
    { id: 'xp_reset', name: 'حجر إعادة التوزيع', description: 'يعيد جميع نقاط XP ويسمح لك بإعادة توزيعها', type: 'reset', category: 'Special', effect: 0, price: 5000, quantity: 0, icon: '🔄' },
    { id: 'rename_stone', name: 'حجر إعادة التسمية', description: 'يسمح لك بتغيير اسم شخصيتك', type: 'tool', category: 'Special', effect: 0, price: 2000, quantity: 0, icon: '✏️' },
    { id: 'gate_exit_stone', name: 'حجر الخروج من البوابة', description: 'يسمح بالخروج الآمن من البوابة دون عقوبة', type: 'key', category: 'Special', effect: 0, price: 3000, quantity: 0, icon: '🚪' },
    { id: 'grand_quest_stone', name: 'حجر المهمة الكبرى', description: 'مطلوب لتفعيل مهمة Grand Quest جديدة', type: 'tool', category: 'Special', effect: 0, price: 5000, quantity: 0, icon: '🔮' },
    { id: 'central_activation_stone', name: 'حجر التفعيل المركزي', description: 'يفعّل شات النظام للتواصل مع ذكاء النظام', type: 'tool', category: 'Special', effect: 0, price: 10000, quantity: 0, icon: '💬' },
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
          updates.stats = {
            strength: prev.stats.strength + xpPerStat,
            mind: prev.stats.mind + xpPerStat,
            spirit: prev.stats.spirit + xpPerStat,
            agility: prev.stats.agility + xpPerStat,
          };
        }
        const newLevels = {
          strength: calculateLevel(updates.stats.strength),
          mind: calculateLevel(updates.stats.mind),
          spirit: calculateLevel(updates.stats.spirit),
          agility: calculateLevel(updates.stats.agility),
        };
        updates.levels = newLevels;
        updates.totalLevel = getTotalLevel(newLevels);
      } else if (item.type === 'title' || item.type === 'tool' || item.type === 'key' || item.type === 'reset') {
        // عناصر لا تُستهلك بالطريقة العادية
        return prev;
      }

      const newInventory = prev.inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i);
      return { ...prev, ...updates, inventory: newInventory };
    });
  }, [calculateLevel, getTotalLevel]);

  // إعادة توزيع نقاط XP - تجمع كل النقاط وتعيد توزيعها
  const resetAndReallocateXP = useCallback((newAllocation: Record<StatType, number>) => {
    setGameState(prev => {
      // إيجاد عنصر إعادة التوزيع
      const resetItem = prev.inventory.find(i => i.id === 'xp_reset');
      if (!resetItem || resetItem.quantity <= 0) return prev;

      // جمع كل نقاط XP الحالية
      const totalXP = prev.stats.strength + prev.stats.mind + prev.stats.spirit + prev.stats.agility;
      
      // التأكد من أن التوزيع الجديد يساوي المجموع الكلي
      const allocatedTotal = Object.values(newAllocation).reduce((sum, val) => sum + val, 0);
      if (allocatedTotal !== totalXP) return prev;

      // تحديث الإحصائيات
      const newStats = { ...newAllocation };
      const newLevels = {
        strength: calculateLevel(newStats.strength),
        mind: calculateLevel(newStats.mind),
        spirit: calculateLevel(newStats.spirit),
        agility: calculateLevel(newStats.agility),
      };

      // تقليل كمية العنصر
      const newInventory = prev.inventory.map(i => 
        i.id === 'xp_reset' ? { ...i, quantity: i.quantity - 1 } : i
      );

      return {
        ...prev,
        stats: newStats,
        levels: newLevels,
        totalLevel: getTotalLevel(newLevels),
        inventory: newInventory,
      };
    });
  }, [calculateLevel, getTotalLevel]);

  const takeDamage = useCallback((damage: number) => {
    setGameState(prev => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
  }, []);

  // Mission Failure penalty (HP deduction by difficulty)
  const QUEST_FAIL_HP: Record<string, number> = {
    easy: 10,
    medium: 20,
    hard: 35,
    legendary: 50,
  };

  const failQuest = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest || quest.completed) return prev;
      const dmg = QUEST_FAIL_HP[quest.difficulty] ?? 15;
      // Mark quest as failed: reset startedAt, increment missedQuestsCount, deduct HP
      const newQuests = prev.quests.map(q =>
        q.id === questId ? { ...q, startedAt: undefined, timerDuration: undefined, active: false } : q
      );
      return {
        ...prev,
        quests: newQuests,
        hp: Math.max(0, prev.hp - dmg),
        missedQuestsCount: (prev.missedQuestsCount ?? 0) + 1,
      };
    });
  }, []);

  const applyPunishment = useCallback(() => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 4);
    setGameState(prev => ({ ...prev, punishmentEndTime: endTime.toISOString(), hp: Math.max(0, prev.hp - 30) }));
  }, []);

  const clearPunishment = useCallback(() => {
    setGameState(prev => ({ ...prev, punishmentEndTime: null, missedQuestsCount: 0 }));
  }, []);

  const toggleSound = useCallback(() => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem('levelUpLife');
    setGameState(getDefaultState());
  }, []);

  const updatePlayerData = useCallback((data: { playerName?: string; title?: string; gold?: number; hp?: number; maxHp?: number; stats?: { strength: number; mind: number; spirit: number; agility: number; }; streakDays?: number; }) => {
    setGameState(prev => {
      const newState = { ...prev };
      if (data.playerName !== undefined) newState.playerName = data.playerName;
      if (data.title !== undefined) newState.equippedTitle = data.title === '-' ? undefined : data.title;
      if (data.gold !== undefined) newState.gold = data.gold;
      if (data.hp !== undefined) newState.hp = data.hp;
      if (data.maxHp !== undefined) newState.maxHp = data.maxHp;
      if (data.streakDays !== undefined) newState.streakDays = data.streakDays;
      if (data.stats) {
        newState.stats = data.stats;
        newState.levels = { strength: calculateLevel(data.stats.strength), mind: calculateLevel(data.stats.mind), spirit: calculateLevel(data.stats.spirit), agility: calculateLevel(data.stats.agility) };
        newState.totalLevel = getTotalLevel(newState.levels);
      }
      return newState;
    });
  }, [calculateLevel, getTotalLevel]);

  const dismissLevelUp = useCallback(() => setLevelUpInfo(null), []);

  const startSideQuest = useCallback((questId: string) => {
    setGameState(prev => ({ ...prev, quests: prev.quests.map(q => (q.id === questId && !q.active && !q.completed) ? { ...q, startedAt: new Date().toISOString(), timeProgress: q.timeProgress || 0, active: true, claimed: false } : q) }));
  }, []);

  const updateSideQuestProgress = useCallback((questId: string, progress: number) => {
    setGameState(prev => ({ ...prev, quests: prev.quests.map(q => {
        if (q.id === questId) {
          const isComplete = progress >= (q.requiredTime || 0) * 60;
          return { ...q, timeProgress: progress, completed: isComplete ? true : q.completed, active: isComplete ? false : q.active };
        }
        return q;
      }) }));
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

  // إكمال البوابة وجمع الغنائم
  const completeGate = useCallback((gateId: string, loot: { id: string; type: string; quantity: number }[]) => {
    setGameState(prev => {
      let newGold = prev.gold;
      let newShadowPoints = prev.shadowPoints;
      let newStats = { ...prev.stats };
      const newInventory = [...prev.inventory];

      // معالجة كل عنصر من الغنائم
      loot.forEach(item => {
        if (item.type === 'gold') {
          newGold += item.quantity;
        } else if (item.type === 'xp') {
          // توزيع XP بالتساوي على الإحصائيات
          const perStat = Math.floor(item.quantity / 4);
          newStats.strength += perStat;
          newStats.mind += perStat;
          newStats.spirit += perStat;
          newStats.agility += perStat + (item.quantity % 4);
        } else if (item.id === 'shadow_points') {
          newShadowPoints += item.quantity;
        } else if (item.type === 'item' || item.type === 'key') {
          // إضافة العنصر للمخزون
          const existingItem = newInventory.find(i => i.id === item.id);
          if (existingItem) {
            existingItem.quantity += item.quantity;
          } else {
            // إضافة عنصر جديد
            newInventory.push({
              id: item.id,
              name: item.id.replace(/_/g, ' '),
              description: 'عنصر من غنائم البوابة',
              type: item.type === 'key' ? 'key' : 'xp',
              effect: 50,
              price: 0,
              quantity: item.quantity,
              icon: '📦',
            });
          }
        }
      });

      // تحديث مستويات الإحصائيات
      const newLevels = {
        strength: Math.min(calculateLevel(newStats.strength), MAX_LEVEL),
        mind: Math.min(calculateLevel(newStats.mind), MAX_LEVEL),
        spirit: Math.min(calculateLevel(newStats.spirit), MAX_LEVEL),
        agility: Math.min(calculateLevel(newStats.agility), MAX_LEVEL),
      };
      const newTotalLevel = getTotalLevel(newLevels);

      // تحديث البوابة كمكتملة
      const newGates = prev.gates.map(g => 
        g.id === gateId ? { ...g, completed: true } : g
      );

      return {
        ...prev,
        gold: newGold,
        shadowPoints: newShadowPoints,
        stats: newStats,
        levels: newLevels,
        totalLevel: newTotalLevel,
        inventory: newInventory,
        gates: newGates,
      };
    });
  }, [calculateLevel, getTotalLevel]);

  const consumeItem = useCallback((itemId: string, quantity: number = 1) => {
    setGameState(prev => {
      const item = prev.inventory.find(i => i.id === itemId);
      if (!item || item.quantity < quantity) return prev;
      return { ...prev, inventory: prev.inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i) };
    });
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

  return {
    gameState,
    levelUpInfo,
    completeQuest,
    completePrayerQuest,
    startGrandQuest,
    completeGrandQuestDay,
    updatePlayerInfo,
    setPlayerJob,
    completeOnboarding,
    useAbility,
    summonShadowSoldier,
    purchaseItem,
    useItem,
    consumeItem,
    spendGold,
    equipTitle,
    unequipTitle,
    takeDamage,
    failQuest,
    applyPunishment,
    clearPunishment,
    toggleSound,
    resetGame,
    dismissLevelUp,
    getXpProgress,
    calculateLevel,
    getTotalLevel,
    getRank,
    startSideQuest,
    updateSideQuestProgress,
    claimSideQuest,
    closeSideQuest,
    updatePlayerData,
    completeGate,
    resetAndReallocateXP,
  };
};
