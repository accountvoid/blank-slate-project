import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export default function RolesPage() {
  const { isSuperAdmin } = useIsAdmin();
  const [roles, setRoles] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin' | 'moderator'>('admin');

  const load = async () => {
    const { data } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false });
    setRoles(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!userId) return;
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    toast.success('Role granted');
    setUserId('');
    load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Roles</h1>
      {!isSuperAdmin && <p className="text-sm text-destructive">Only super_admin can modify roles.</p>}
      <div className="border border-border rounded-lg bg-card/40 p-4 flex gap-2 items-end flex-wrap">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">User ID (UUID from auth.users)</label>
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} className="w-96" placeholder="00000000-0000-0000-0000-000000000000" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Role</label>
          <Select value={role} onValueChange={(v) => setRole(v as any)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">super_admin</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="moderator">moderator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={add} disabled={!isSuperAdmin}>Grant</Button>
      </div>
      <div className="border border-border rounded-lg bg-card/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">User ID</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Since</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-t border-border/60">
                <td className="px-4 py-2 font-mono text-xs">{r.user_id}</td>
                <td className="px-4 py-2">{r.role}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)} disabled={!isSuperAdmin}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
