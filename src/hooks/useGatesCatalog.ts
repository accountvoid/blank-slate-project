import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Gate } from '@/types/game';

/**
 * Raw catalog row (matches public.gates_catalog).
 */
export interface GatesCatalogRow {
  id: string;
  id_gate: string;
  name_gate: string;
  description: string | null;
  rank_gate: string;
  gate_type: string;
  image_url: string | null;
  power_gate: number;
  required_level: number;
  required_rank: string;
  boss_name: string | null;
  boss_hp: number | null;
  boss_attack: number | null;
  reward_gold: number;
  reward_xp: number;
  reward_items: any;
  is_active: boolean;
  force_show: boolean;
  is_hidden: boolean;
  start_date: string | null;
  end_date: string | null;
}

const energyByRank: Record<string, string> = {
  E: '1,200',
  D: '5,400',
  C: '12,000',
  B: '28,000',
  A: '65,000',
  S: 'UNMEASURABLE',
};

const dangerByRank: Record<string, string> = {
  E: 'MINIMAL THREAT',
  D: 'LOW THREAT',
  C: 'MODERATE DANGER',
  B: 'HIGH DANGER',
  A: 'EXTREME PERIL',
  S: 'CATACLYSMIC',
};

const colorByRank: Record<string, string> = {
  E: 'gray', D: 'green', C: 'blue', B: 'purple', A: 'orange', S: 'red',
};

const mapRowToGate = (r: GatesCatalogRow, playerLevel: number, idx: number): Gate => {
  const rank = r.rank_gate as Gate['rank'];
  const isFullyRevealed = playerLevel >= (r.required_level ?? 0);
  // Closing time: end_date if set, otherwise end of today (UTC-local).
  const closing = r.end_date
    ? r.end_date
    : (() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d.toISOString();
      })();

  return {
    id: r.id,
    idGate: r.id_gate,
    name: isFullyRevealed ? r.name_gate : `بوابة ${rank}`,
    rank,
    requiredPower: r.power_gate,
    energyDensity: isFullyRevealed ? energyByRank[rank] ?? '???' : '???',
    danger: isFullyRevealed ? (dangerByRank[rank] ?? r.description ?? '???') : '???',
    color: colorByRank[rank] ?? 'gray',
    discovered: true,
    completed: false,
    isFullyRevealed,
    gateNumber: idx + 1,
    closingTime: closing,
    type: r.gate_type,
    rewards: {
      xp: r.reward_xp ?? 0,
      gold: r.reward_gold ?? 0,
      shadowPoints: 0,
    },
  };
};

/**
 * Visibility rules — priority order:
 *  1. is_hidden  -> never show
 *  2. is_active=false -> never show
 *  3. force_show -> always show
 *  4. start_date/end_date window -> filter (schedule)
 *  5. otherwise show
 *
 * RLS already filters out (1) and (2); we re-check defensively.
 */
const isVisible = (r: GatesCatalogRow): boolean => {
  if (r.is_hidden) return false;
  if (!r.is_active) return false;
  if (r.force_show) return true;
  const now = Date.now();
  if (r.start_date && new Date(r.start_date).getTime() > now) return false;
  if (r.end_date && new Date(r.end_date).getTime() < now) return false;
  return true;
};

export const useGatesCatalog = (playerLevel: number) => {
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any).from('gates_catalog')
        .select('*')
        .order('required_level', { ascending: true });
      if (error) {
        setError(error.message);
        setGates([]);
        return;
      }
      const rows = (data || []) as GatesCatalogRow[];
      const visible = rows.filter(isVisible);
      setGates(visible.map((r, i) => mapRowToGate(r, playerLevel, i)));
    } catch (e: any) {
      setError(e?.message || 'failed to load gates');
      setGates([]);
    } finally {
      setLoading(false);
    }
  }, [playerLevel]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: re-fetch on any change to the catalog.
  useEffect(() => {
    const ch = supabase
      .channel(`gates-catalog-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gates_catalog' },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  return { gates, loading, error, reload: load };
};
