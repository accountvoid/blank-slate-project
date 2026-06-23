import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Loader2, Shield, CheckCircle2, ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// MUST match the server-side allowlist in supabase/functions/create-payment.
const OFFERS = [
  { gold: 1000, usd: 1 },
  { gold: 5000, usd: 4 },
  { gold: 15000, usd: 10 },
  { gold: 50000, usd: 30 },
];

const NETWORKS = [
  { id: 'usdttrc20', label: 'USDT • TRC20', sub: 'Tron — lowest fees' },
  { id: 'usdtbsc',   label: 'USDT • BEP20', sub: 'BNB Smart Chain' },
  { id: 'usdterc20', label: 'USDT • ERC20', sub: 'Ethereum' },
] as const;

type Network = typeof NETWORKS[number]['id'];
type Step = 'offers' | 'network' | 'paying' | 'status' | 'error';

interface Props {
  gold: number;
  compact?: boolean;
}

const STATUS_LABEL: Record<string, { label: string; tone: 'amber' | 'green' | 'red' | 'gray' }> = {
  waiting:                          { label: 'Waiting for payment',     tone: 'amber' },
  confirming:                       { label: 'Confirming on-chain',     tone: 'amber' },
  confirmed:                        { label: 'Confirmed',               tone: 'green' },
  sending:                          { label: 'Sending to wallet',       tone: 'amber' },
  partially_paid:                   { label: 'Partially paid',          tone: 'amber' },
  finished:                         { label: 'Completed — gold added!', tone: 'green' },
  failed:                           { label: 'Payment failed',          tone: 'red'   },
  refunded:                         { label: 'Refunded',                tone: 'red'   },
  expired:                          { label: 'Invoice expired',         tone: 'red'   },
  pending_payment_provider_failed:  { label: 'Provider unavailable',    tone: 'red'   },
};

export default function BuyGold({ gold, compact }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('offers');
  const [offer, setOffer] = useState<typeof OFFERS[number] | null>(null);
  const [network, setNetwork] = useState<Network>('usdttrc20');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('waiting');
  const [credited, setCredited] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const reset = () => {
    stopPolling();
    setStep('offers'); setOffer(null); setInvoiceUrl(''); setOrderId(null);
    setPaymentStatus('waiting'); setCredited(false);
    setErrorMsg(''); setErrorDetail('');
  };

  // Realtime + polling fallback for status.
  useEffect(() => {
    if (step !== 'status' || !orderId) return;
    const channel = supabase
      .channel(`payments:${orderId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments', filter: `id=eq.${orderId}` },
        (p: any) => {
          if (p.new?.status) setPaymentStatus(p.new.status);
          if (typeof p.new?.credited === 'boolean') setCredited(p.new.credited);
        })
      .subscribe();

    pollRef.current = setInterval(async () => {
      const { data } = await (supabase as any)
        .from('payments')
        .select('status, credited')
        .eq('id', orderId)
        .maybeSingle();
      if (data) {
        setPaymentStatus(data.status);
        setCredited(!!data.credited);
      }
    }, 5000);

    return () => { supabase.removeChannel(channel); stopPolling(); };
  }, [step, orderId]);

  const submit = async () => {
    if (!offer || !user) return;
    setStep('paying');
    setErrorMsg(''); setErrorDetail('');
    try {
      const client_nonce = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          gold_amount: offer.gold,
          amount_usd: offer.usd,
          pay_currency: network,
          client_nonce,
        },
      });

      // Transport-level failure (network / function not deployed / CORS).
      if (error) {
        const detail = (data as any)?.error || (data as any)?.details || error.message;
        throw new Error(detail || 'Edge Function unreachable');
      }
      const res = data as any;
      if (!res?.success) {
        setErrorDetail(typeof res?.details === 'string' ? res.details : JSON.stringify(res?.details ?? {}));
        throw new Error(res?.error || 'Unknown server error');
      }
      if (!res.invoice_url) throw new Error('No invoice URL returned');

      setInvoiceUrl(res.invoice_url);
      setOrderId(res.order_id);
      setPaymentStatus(res.payment?.status ?? 'waiting');
      setStep('status');
      if (res.warning) toast.info(res.warning);
    } catch (e) {
      setErrorMsg((e as Error).message || 'Payment failed');
      setStep('error');
      toast.error('فشل إنشاء عملية الدفع', { description: (e as Error).message });
    }
  };

  const statusInfo = STATUS_LABEL[paymentStatus] ?? { label: paymentStatus, tone: 'gray' as const };
  const toneClass =
    statusInfo.tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-300' :
    statusInfo.tone === 'red'   ? 'border-red-500/40 bg-red-500/10 text-red-300' :
    statusInfo.tone === 'amber' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300' :
                                  'border-white/15 bg-white/5 text-gray-300';

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-md border border-yellow-500/40 bg-yellow-500/10',
            'px-2.5 py-1 text-xs font-bold text-yellow-300 transition hover:bg-yellow-500/20',
            'shadow-[0_0_10px_rgba(234,179,8,0.15)]',
            compact && 'px-2 py-0.5 text-[11px]'
          )}
          aria-label="Buy Gold"
        >
          <Coins className="h-3.5 w-3.5" />
          <span className="tabular-nums">{gold.toLocaleString()}</span>
          <span className="text-yellow-400/60">+</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md border-yellow-500/30 bg-black/95 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-400">
            <Coins className="h-5 w-5" /> GOLD EXCHANGE
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400">
            SETVOID · Secure crypto payments via NowPayments
          </DialogDescription>
        </DialogHeader>

        {step === 'offers' && (
          <div className="space-y-2">
            {OFFERS.map((o) => (
              <button
                key={o.gold}
                onClick={() => { setOffer(o); setStep('network'); }}
                className="flex w-full items-center justify-between rounded border border-yellow-500/30 bg-yellow-500/5 p-3 text-left transition hover:bg-yellow-500/10"
              >
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="font-bold tabular-nums">{o.gold.toLocaleString()} GOLD</p>
                    <p className="text-xs text-gray-400">${o.usd} USDT</p>
                  </div>
                </div>
                <span className="text-xs text-yellow-400/70">Select →</span>
              </button>
            ))}
          </div>
        )}

        {step === 'network' && offer && (
          <div className="space-y-3">
            <div className="rounded border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm">
              <span className="text-gray-400">Package:</span>{' '}
              <span className="font-bold text-yellow-300">{offer.gold.toLocaleString()} GOLD</span>{' '}
              <span className="text-gray-500">· ${offer.usd}</span>
            </div>
            <p className="text-xs text-gray-400">Choose network:</p>
            <div className="space-y-2">
              {NETWORKS.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setNetwork(n.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded border p-3 text-left transition',
                    network === n.id
                      ? 'border-yellow-400 bg-yellow-500/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">{n.label}</p>
                    <p className="text-xs text-gray-400">{n.sub}</p>
                  </div>
                  {network === n.id && <CheckCircle2 className="h-4 w-4 text-yellow-400" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={reset}>Back</Button>
              <Button className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400" onClick={submit}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'paying' && (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-yellow-400" />
            <p className="mt-4 text-sm text-gray-400">Creating secure invoice…</p>
          </div>
        )}

        {step === 'status' && (
          <div className="space-y-4">
            <div className={cn('rounded border p-3', toneClass)}>
              <div className="flex items-center gap-2">
                {statusInfo.tone === 'green' ? <CheckCircle2 className="h-4 w-4" />
                  : statusInfo.tone === 'red' ? <AlertTriangle className="h-4 w-4" />
                  : <Clock className="h-4 w-4 animate-pulse" />}
                <p className="text-sm font-bold">{statusInfo.label}</p>
              </div>
              <p className="mt-1 text-xs opacity-80">
                Order ID: <span className="font-mono">{orderId?.slice(0, 8)}…</span>
                {credited && ' · gold credited ✓'}
              </p>
            </div>

            {invoiceUrl && !['finished','confirmed','failed','expired','refunded'].includes(paymentStatus) && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded bg-yellow-500 py-3 text-sm font-bold text-black hover:bg-yellow-400"
              >
                <ExternalLink className="h-4 w-4" /> Open Payment Page
              </a>
            )}

            <p className="text-center text-[11px] text-gray-500">
              This screen updates automatically once the transaction confirms on-chain.
            </p>

            <button onClick={() => setOpen(false)} className="w-full text-xs text-gray-500 hover:text-gray-300">
              Close
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-3">
            <div className="rounded border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4" /> {errorMsg}
              </div>
              {errorDetail && (
                <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-[11px] text-red-200/80">
                  {errorDetail}
                </pre>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={reset}>Try again</Button>
          </div>
        )}

        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-600">
          <Shield className="h-3 w-3" /> SECURE SETVOID TRANSACTION LAYER
        </div>
      </DialogContent>
    </Dialog>
  );
}
