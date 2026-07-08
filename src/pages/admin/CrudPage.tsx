import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Copy, Search, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'json' | 'date';

export type CrudField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  hint?: string;
};

export type CrudConfig = {
  table: string;
  title: string;
  fields: CrudField[];
  listColumns: { key: string; label: string; render?: (row: any) => any }[];
  toggleField?: string; // e.g. is_active / enabled
  pageSize?: number;
};

const emptyValue = (t: FieldType) => {
  switch (t) {
    case 'boolean': return false;
    case 'number': return 0;
    case 'json': return '{}';
    default: return '';
  }
};

export default function CrudPage({ config }: { config: CrudConfig }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<any | null>(null);
  const pageSize = config.pageSize ?? 20;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(config.table as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(`Load failed: ${error.message}`);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [config.table]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(q)
    );
  }, [rows, search]);

  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const openCreate = () => {
    const init: any = {};
    config.fields.forEach((f) => (init[f.key] = f.default ?? emptyValue(f.type)));
    setEditing(init);
    setCreating(true);
  };

  const openEdit = (row: any) => {
    const init: any = { ...row };
    config.fields.forEach((f) => {
      if (f.type === 'json' && typeof init[f.key] !== 'string') {
        init[f.key] = JSON.stringify(init[f.key] ?? {}, null, 2);
      }
    });
    setEditing(init);
    setCreating(false);
  };

  const save = async () => {
    if (!editing) return;
    const payload: any = {};
    for (const f of config.fields) {
      let v = editing[f.key];
      if (f.type === 'json') {
        try {
          v = v ? JSON.parse(v) : null;
        } catch {
          toast.error(`Invalid JSON in ${f.label}`);
          return;
        }
      }
      if (f.type === 'number') v = v === '' || v == null ? null : Number(v);
      if (f.type === 'date' && v === '') v = null;
      payload[f.key] = v;
    }
    let error;
    if (creating) {
      const res = await supabase.from(config.table as any).insert(payload);
      error = res.error;
    } else {
      const res = await supabase.from(config.table as any).update(payload).eq('id', editing.id);
      error = res.error;
    }
    if (error) return toast.error(error.message);
    toast.success(creating ? 'Created' : 'Updated');
    setEditing(null);
    load();
  };

  const duplicate = async (row: any) => {
    const { id, created_at, updated_at, ...rest } = row;
    const { error } = await supabase.from(config.table as any).insert(rest);
    if (error) return toast.error(error.message);
    toast.success('Duplicated');
    load();
  };

  const toggle = async (row: any) => {
    if (!config.toggleField) return;
    const { error } = await supabase
      .from(config.table as any)
      .update({ [config.toggleField]: !row[config.toggleField] })
      .eq('id', row.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async () => {
    if (!deleting) return;
    const { error } = await supabase.from(config.table as any).delete().eq('id', deleting.id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    setDeleting(null);
    load();
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search…"
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New</Button>
        </div>
      </header>

      <div className="border border-border rounded-lg overflow-hidden bg-card/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                {config.listColumns.map((c) => (
                  <th key={c.key} className="text-left px-4 py-3">{c.label}</th>
                ))}
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={config.listColumns.length + 1} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && paged.map((row) => (
                <tr key={row.id} className="border-t border-border/60 hover:bg-muted/20">
                  {config.listColumns.map((c) => (
                    <td key={c.key} className="px-4 py-3 align-top max-w-xs truncate">
                      {c.render ? c.render(row) : String(row[c.key] ?? '')}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {config.toggleField && (
                      <Button size="icon" variant="ghost" onClick={() => toggle(row)} title="Toggle">
                        <Power className={`w-4 h-4 ${row[config.toggleField] ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => duplicate(row)} title="Duplicate">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(row)} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(row)} title="Delete">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && !paged.length && (
                <tr><td colSpan={config.listColumns.length + 1} className="p-6 text-center text-muted-foreground">No records.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border/60 text-sm">
            <span className="text-muted-foreground">Page {page + 1} / {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{creating ? 'Create' : 'Edit'} {config.title}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              {config.fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                  {f.type === 'textarea' && (
                    <Textarea rows={3} value={editing[f.key] ?? ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                  )}
                  {f.type === 'json' && (
                    <Textarea rows={6} className="font-mono text-xs" value={editing[f.key] ?? ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                  )}
                  {f.type === 'boolean' && (
                    <div className="flex items-center gap-2"><Switch checked={!!editing[f.key]} onCheckedChange={(v) => setEditing({ ...editing, [f.key]: v })} /><span className="text-sm text-muted-foreground">{editing[f.key] ? 'On' : 'Off'}</span></div>
                  )}
                  {f.type === 'number' && (
                    <Input type="number" value={editing[f.key] ?? ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                  )}
                  {f.type === 'date' && (
                    <Input type="datetime-local" value={editing[f.key] ? String(editing[f.key]).slice(0, 16) : ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  )}
                  {f.type === 'text' && (
                    <Input value={editing[f.key] ?? ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                  )}
                  {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>{creating ? 'Create' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This action is permanent and audit-logged.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const Bool = ({ v }: { v: boolean }) => (
  <Badge variant={v ? 'default' : 'outline'}>{v ? 'ON' : 'OFF'}</Badge>
);
