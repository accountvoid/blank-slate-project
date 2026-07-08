import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Coins, DoorOpen, Swords, CalendarDays, ShoppingCart, DollarSign, UserPlus, LogIn, ScrollText } from 'lucide-react';

type Stats = {
  total_users: number;
  today_registrations: number;
  today_logins: number;
  total_gold: number;
  total_gates: number;
  total_main_quests: number;
  total_side_quests: number;
  total_events: number;
  total_purchases: number;
  revenue_usd: number;
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) => (
  <Card className="bg-card/60 border-border/60 hover:border-primary/40 transition-colors">
    <CardContent className="p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.rpc('admin_dashboard_stats' as any);
    if (data) setStats(data as Stats);
    const { data: p } = await supabase
      .from('profiles')
      .select('id_player,name_player,created_at,level_player')
      .order('created_at', { ascending: false })
      .limit(6);
    setRecentUsers(p ?? []);
    const { data: pay } = await supabase
      .from('payments')
      .select('id,user_id,amount_usd,gold_amount,status,created_at')
      .order('created_at', { ascending: false })
      .limit(6);
    setRecentPayments(pay ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Realtime system overview</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={stats?.total_users ?? '—'} icon={Users} />
        <StatCard label="Today Signups" value={stats?.today_registrations ?? '—'} icon={UserPlus} />
        <StatCard label="Today Logins" value={stats?.today_logins ?? '—'} icon={LogIn} />
        <StatCard label="Total Gold" value={stats?.total_gold?.toLocaleString() ?? '—'} icon={Coins} />
        <StatCard label="Gates" value={stats?.total_gates ?? '—'} icon={DoorOpen} />
        <StatCard label="Main Quests" value={stats?.total_main_quests ?? '—'} icon={Swords} />
        <StatCard label="Side Quests" value={stats?.total_side_quests ?? '—'} icon={ScrollText} />
        <StatCard label="Events" value={stats?.total_events ?? '—'} icon={CalendarDays} />
        <StatCard label="Purchases" value={stats?.total_purchases ?? '—'} icon={ShoppingCart} />
        <StatCard label="Revenue (USD)" value={`$${(stats?.revenue_usd ?? 0).toFixed(2)}`} icon={DollarSign} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Newest Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u.id_player} className="flex justify-between text-sm border-b border-border/50 py-2">
                <span>{u.name_player} <span className="text-muted-foreground">({u.id_player})</span></span>
                <span className="text-muted-foreground">Lv {u.level_player}</span>
              </div>
            ))}
            {!recentUsers.length && <p className="text-sm text-muted-foreground">No users yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Newest Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm border-b border-border/50 py-2">
                <span>${p.amount_usd} · {p.gold_amount} gold</span>
                <span className="text-muted-foreground">{p.status}</span>
              </div>
            ))}
            {!recentPayments.length && <p className="text-sm text-muted-foreground">No payments yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
