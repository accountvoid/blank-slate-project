import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

export default function UsersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500).then(({ data }) => setRows(data ?? []));
  }, []);
  const filtered = rows.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users</h1>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-64" />
      </div>
      <div className="border border-border rounded-lg bg-card/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Rank</th>
              <th className="text-left px-4 py-3">Level</th>
              <th className="text-left px-4 py-3">Gold</th>
              <th className="text-left px-4 py-3">HP</th>
              <th className="text-left px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.user_id} className="border-t border-border/60">
                <td className="px-4 py-2 font-mono text-xs">{u.id_player}</td>
                <td className="px-4 py-2">{u.name_player}</td>
                <td className="px-4 py-2">{u.rank_player}</td>
                <td className="px-4 py-2">{u.level_player}</td>
                <td className="px-4 py-2">{u.gold_player}</td>
                <td className="px-4 py-2">{u.hp_player}/{u.hp_max}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
