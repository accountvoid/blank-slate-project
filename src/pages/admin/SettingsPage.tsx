import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export default function SettingsPage() {
  const { isSuperAdmin } = useIsAdmin();
  const [rows, setRows] = useState<any[]>([]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('{}');

  const load = async () => {
    const { data } = await supabase.from('system_settings').select('*').order('key');
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    let v: any;
    try { v = JSON.parse(value); } catch { return toast.error('Invalid JSON'); }
    const { error } = await supabase.from('system_settings').upsert({ key, value: v, updated_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    toast.success('Saved');
    setKey(''); setValue('{}');
    load();
  };
  const remove = async (k: string) => {
    const { error } = await supabase.from('system_settings').delete().eq('key', k);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">System Settings</h1>
      {!isSuperAdmin && <p className="text-sm text-destructive">Only super_admin can modify settings.</p>}
      <div className="border border-border rounded-lg bg-card/40 p-4 space-y-3">
        <Input placeholder="Key (e.g. feature.foo)" value={key} onChange={(e) => setKey(e.target.value)} />
        <Textarea rows={6} className="font-mono text-xs" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button onClick={save} disabled={!isSuperAdmin || !key}>Save</Button>
      </div>
      <div className="border border-border rounded-lg bg-card/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Key</th>
              <th className="text-left px-4 py-3">Value</th>
              <th className="text-left px-4 py-3">Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-border/60">
                <td className="px-4 py-2 font-mono">{r.key}</td>
                <td className="px-4 py-2 font-mono text-xs max-w-lg truncate">{JSON.stringify(r.value)}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  <Button size="icon" variant="ghost" onClick={() => remove(r.key)} disabled={!isSuperAdmin}>
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
