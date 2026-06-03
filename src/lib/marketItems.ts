import type { InventoryItem } from '@/types/game';

/**
 * SETVOID — Canonical marketplace catalog (single source of truth).
 * Used by both useGameState (purchases) and Market UI (display).
 */

export type MarketCategory =
  | 'consumable'
  | 'weapon'
  | 'special_material'
  | 'utility'
  | 'stone';

export interface MarketItemDef {
  id: string;
  i18nKey: string;          // items.<id>.name / .description
  category: MarketCategory;
  price: number;
  icon: string;             // emoji
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  // gameplay
  type: InventoryItem['type'];
  effect: number;
  maxUses?: number;
  durability?: number;
  stats?: { hp?: number; damage?: number };
}

export const MARKET_CATALOG: MarketItemDef[] = [
  {
    id: 'hp_elixir',
    i18nKey: 'items.hp_elixir',
    category: 'consumable',
    price: 300,
    icon: '🧪',
    rank: 'E',
    type: 'health',
    effect: 50,
    maxUses: 1,
  },
  {
    id: 'mp_elixir',
    i18nKey: 'items.mp_elixir',
    category: 'consumable',
    price: 300,
    icon: '⚡',
    rank: 'E',
    type: 'energy',
    effect: 50,
    maxUses: 1,
  },
  {
    id: 'xp_book',
    i18nKey: 'items.xp_book',
    category: 'consumable',
    price: 250,
    icon: '📚',
    rank: 'E',
    type: 'xp',
    effect: 75,
    maxUses: 1,
  },
  {
    id: 'stone_dagger',
    i18nKey: 'items.stone_dagger',
    category: 'weapon',
    price: 600,
    icon: '🗡️',
    rank: 'D',
    type: 'tool',
    effect: 0,
    durability: 150,
    stats: { hp: 16, damage: 23 },
  },
  {
    id: 'shadow_dagger',
    i18nKey: 'items.shadow_dagger',
    category: 'weapon',
    price: 11000,
    icon: '🗡️',
    rank: 'B',
    type: 'tool',
    effect: 0,
    durability: 600,
    stats: { hp: 92, damage: 231 },
  },
  {
    id: 'cutting_stones',
    i18nKey: 'items.cutting_stones',
    category: 'special_material',
    price: 7000,
    icon: '💎',
    rank: 'C',
    type: 'tool',
    effect: 0,
  },
  {
    id: 'mana_analyst',
    i18nKey: 'items.mana_analyst',
    category: 'utility',
    price: 1000,
    icon: '📊',
    rank: 'D',
    type: 'tool',
    effect: 0,
    maxUses: 2,
  },
];

// Mana Stone is NOT in the shop — only obtainable by merging 5 cutting stones.
export const MANA_STONE_DEF: MarketItemDef = {
  id: 'mana_stone',
  i18nKey: 'items.mana_stone',
  category: 'stone',
  price: 0,
  icon: '🔮',
  rank: 'B',
  type: 'tool',
  effect: 0,
  maxUses: 1,
};

export type ManaStoneAction =
  | 'exit_gate'
  | 'system_chat'
  | 'ability_development'
  | 'name_change'
  | 'grand_mission';

export const MANA_STONE_ACTIONS: { id: ManaStoneAction; icon: string }[] = [
  { id: 'exit_gate', icon: '🚪' },
  { id: 'system_chat', icon: '💬' },
  { id: 'ability_development', icon: '⚔️' },
  { id: 'name_change', icon: '✏️' },
  { id: 'grand_mission', icon: '🔮' },
];

export const CUTTING_STONES_PER_MERGE = 5;

// All possible bonus drops from gates (besides guaranteed Gold)
export const GATE_BONUS_LOOT: Array<{ id: string; chance: number; quantity: number; icon: string; rarity: 'common'|'uncommon'|'rare'|'epic'|'legendary' }> = [
  { id: 'xp_book',        chance: 0.15, quantity: 1, icon: '📚', rarity: 'uncommon' },
  { id: 'hp_elixir',      chance: 0.15, quantity: 1, icon: '🧪', rarity: 'uncommon' },
  { id: 'mp_elixir',      chance: 0.15, quantity: 1, icon: '⚡', rarity: 'uncommon' },
  { id: 'cutting_stones', chance: 0.15, quantity: 1, icon: '💎', rarity: 'rare' },
];

export const GATE_GOLD_BY_RANK: Record<string, number> = {
  E: 80,
  D: 180,
  C: 400,
  B: 900,
  A: 2000,
  S: 5000,
};
