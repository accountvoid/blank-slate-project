import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => setLogs(data ?? []));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Audit Logs</h1>
      <div className="border border-border rounded-lg bg-card/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">When</th>
              <th className="text-left px-4 py-3">Actor</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Table</th>
              <th className="text-left px-4 py-3">Record</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-border/60">
                <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.actor_id?.slice(0, 8) ?? '—'}</td>
                <td className="px-4 py-2"><Badge>{l.action}</Badge></td>
                <td className="px-4 py-2">{l.table_name}</td>
                <td className="px-4 py-2 font-mono text-xs truncate max-w-xs">{l.record_id}</td>
              </tr>
            ))}
            {!logs.length && <tr><td colSpan={5} className="text-center p-6 text-muted-foreground">No audit logs yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
