import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PlayerStats {
  STR: number;
  AGI: number;
  SPI: number;
  MIN: number;
}

export interface Profile {
  user_id: string;
  id_player: string;
  name_player: string;
  rank_player: string;
  level_player: number;
  hp_player: number;
  mb_player: number;
  gold_player: number;
  void_player: number;
  stats_player: PlayerStats;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data as unknown as Profile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Omit<Profile, 'user_id' | 'created_at' | 'updated_at' | 'id_player'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await (supabase as any)
      .from('profiles')
      .update(updates as never)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data as unknown as Profile);
    }

    return { data, error };
  };

  return { profile, loading, updateProfile };
};
