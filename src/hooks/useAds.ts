import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AdType = 'banner' | 'video' | 'sponsored_mission';
export type AdBannerSize = 'horizontal' | 'square' | 'full_width';
export type AdCategory = 'strength' | 'mind' | 'spirit' | 'agility';
export type AdEventType = 'view' | 'click' | 'start' | 'complete' | 'claim';

export interface Ad {
  id: string;
  type: AdType;
  status: 'active' | 'inactive' | 'archived';
  placement: string;
  banner_size: AdBannerSize | null;
  category: AdCategory | null;
  priority: number;
  display_order: number;
  start_at: string;
  end_at: string | null;
  advertiser_name: string | null;
  advertiser_logo_url: string | null;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  skip_after_seconds: number | null;
  button_text: string | null;
  destination_url: string | null;
  internal_route: string | null;
  xp_reward: number;
  gold_reward: number;
  reward_multiplier: number;
  mission_duration_minutes: number | null;
  repeat_interval_hours: number | null;
  difficulty: string | null;
  completion_requirements: Record<string, unknown>;
}

interface UseAdsOptions {
  type?: AdType;
  placement?: string;
  category?: AdCategory | null;
  limit?: number;
}

export function useAds({ type, placement, category, limit }: UseAdsOptions = {}) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = useCallback(async () => {
    let q = (supabase as any).from('ads').select('*').eq('status', 'active');
    if (type) q = q.eq('type', type);
    if (placement) q = q.eq('placement', placement);
    if (category !== undefined) {
      if (category === null) q = q.is('category', null);
      else q = q.eq('category', category);
    }
    q = q.order('priority', { ascending: false }).order('display_order', { ascending: true });
    if (limit) q = q.limit(limit);

    const { data, error } = await q;
    if (error) {
      console.error('[useAds] fetch error:', error);
      setAds([]);
    } else {
      const now = Date.now();
      const filtered = (data || []).filter((a: Ad) => {
        const start = new Date(a.start_at).getTime();
        const end = a.end_at ? new Date(a.end_at).getTime() : Infinity;
        return start <= now && now < end;
      });
      setAds(filtered);
    }
    setLoading(false);
  }, [type, placement, category, limit]);

  useEffect(() => {
    fetchAds();
    const channel = supabase
      .channel(`ads-${type ?? 'all'}-${placement ?? 'all'}-${category ?? 'any'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, () => fetchAds())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAds, type, placement, category]);

  return { ads, loading, refresh: fetchAds };
}

export async function logAdEvent(ad_id: string, event_type: AdEventType, metadata: Record<string, unknown> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from('ad_events').insert({
      ad_id,
      event_type,
      user_id: user?.id ?? null,
      metadata,
    });
  } catch (e) {
    console.warn('[logAdEvent] failed:', e);
  }
}
