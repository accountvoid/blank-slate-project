import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Loader2, Shield, CheckCircle2, ExternalLink } from 'lucide-react';
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
type Step = 'offers' | 'network' | 'paying' | 'done' | 'error';

interface Props {
  gold: number;
  compact?: boolean;
}

export default function BuyGold({ gold, compact }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('offers');
  const [offer, setOffer] = useState<typeof OFFERS[number] | null>(null);
  const [network, setNetwork] = useState<Network>('usdttrc20');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const reset = () => {
    setStep('offers'); setOffer(null); setInvoiceUrl(''); setErrorMsg('');
  };

  const submit = async () => {
    if (!offer || !user) return;
    setStep('paying');
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          gold_amount: offer.gold,
          amount_usd: offer.usd,
          pay_currency: network,
        },
      });
      if (error) throw new Error(error.message);
      const url = (data as any)?.invoice_url;
      if (!url) throw new Error('No invoice URL returned');
      setInvoiceUrl(url);
      setStep('done');
    } catch (e) {
      setErrorMsg((e as Error).message || 'Payment failed');
      setStep('error');
      toast.error('فشل إنشاء عملية الدفع', { description: (e as Error).message });
    }
  };

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

        {step === 'done' && (
          <div className="space-y-4">
            <div className="rounded border border-green-500/30 bg-green-500/5 p-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-bold">Invoice Created</p>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Open the payment page, send the exact USDT amount, and gold will be credited
                automatically once the transaction is confirmed on-chain.
              </p>
            </div>
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded bg-yellow-500 py-3 text-sm font-bold text-black hover:bg-yellow-400"
            >
              <ExternalLink className="h-4 w-4" /> Open Payment Page
            </a>
            <button onClick={() => setOpen(false)} className="w-full text-xs text-gray-500 hover:text-gray-300">
              Close
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-3">
            <div className="rounded border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
              {errorMsg}
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
