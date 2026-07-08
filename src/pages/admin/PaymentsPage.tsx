import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export default function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(500).then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Payments</h1>
      <div className="border border-border rounded-lg bg-card/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">When</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">USD</th>
              <th className="text-left px-4 py-3">Gold</th>
              <th className="text-left px-4 py-3">Currency</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Credited</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60">
                <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.user_id?.slice(0, 8)}</td>
                <td className="px-4 py-2">${r.amount_usd}</td>
                <td className="px-4 py-2">{r.gold_amount}</td>
                <td className="px-4 py-2">{r.pay_currency}</td>
                <td className="px-4 py-2"><Badge variant="outline">{r.status}</Badge></td>
                <td className="px-4 py-2">{r.credited ? '✅' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
