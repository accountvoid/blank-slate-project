import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'super_admin' | 'admin' | 'moderator';

export const useIsAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (cancelled) return;
      if (error) {
        setRoles([]);
      } else {
        setRoles((data ?? []).map((r) => r.role as AppRole));
      }
      setLoading(false);
    };
    if (!authLoading) load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const isAdmin = roles.length > 0;
  const isSuperAdmin = roles.includes('super_admin');
  const isModerator = roles.includes('moderator');

  return { roles, isAdmin, isSuperAdmin, isModerator, loading: authLoading || loading };
};
