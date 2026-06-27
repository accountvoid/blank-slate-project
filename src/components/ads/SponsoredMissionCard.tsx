import { ExternalLink, Sparkles } from 'lucide-react';
import { logAdEvent, type Ad } from '@/hooks/useAds';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  ad: Ad;
}

/**
 * Renders a sponsored side-mission card visually consistent with the existing
 * mission cards in src/pages/Quests.tsx, marked clearly as "Sponsored".
 */
export function SponsoredMissionCard({ ad }: Props) {
  const viewedRef = useRef(false);
  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true;
      logAdEvent(ad.id, 'view', { placement: 'sponsored_mission', category: ad.category });
    }
  }, [ad.id, ad.category]);

  const handleStart = () => {
    logAdEvent(ad.id, 'start', { category: ad.category });
    logAdEvent(ad.id, 'click', { category: ad.category });
    if (ad.destination_url) window.open(ad.destination_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative group">
      <div className="relative bg-black/60 border-2 border-amber-400/60 p-4 shadow-[0_0_25px_rgba(251,191,36,0.25)]">
        <div className="flex justify-center mb-4 mt-[-1.5rem]">
          <div className="border border-amber-400/60 px-4 py-0.5 bg-slate-900/90 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <h2 className="text-[10px] font-bold tracking-widest text-amber-200 uppercase italic">
              SPONSORED: {ad.title}
            </h2>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border border-amber-400/40 flex items-center justify-center bg-black/40 overflow-hidden">
              {ad.image_url || ad.sponsor_logo_url ? (
                <img
                  src={ad.image_url || ad.sponsor_logo_url || ''}
                  alt={ad.sponsor_name || ad.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Sparkles className="w-8 h-8 text-amber-400/70" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center border-b border-amber-400/20 pb-1">
                <span className="text-[9px] text-amber-300/80 uppercase font-bold">Reward:</span>
                <div className="flex gap-2">
                  <span className="text-xs font-bold text-yellow-400">+{ad.gold_reward} G</span>
                  <span className="text-xs font-bold text-blue-300">+{ad.xp_reward} XP</span>
                </div>
              </div>
              {ad.sponsor_name && (
                <div className="flex justify-between items-center border-b border-amber-400/20 pb-1">
                  <span className="text-[9px] text-amber-300/80 uppercase font-bold">Sponsor:</span>
                  <span className="text-[10px] font-bold text-white truncate">{ad.sponsor_name}</span>
                </div>
              )}
              {ad.description && (
                <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-3">{ad.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleStart}
            className={cn(
              'w-full py-2 text-[10px] font-bold tracking-[0.2em] uppercase border transition-all flex items-center justify-center gap-2',
              'bg-amber-500/15 border-amber-400/50 text-amber-200 hover:bg-amber-500/25',
            )}
          >
            <ExternalLink className="w-3 h-3" />
            {ad.button_text || 'Start mission'}
          </button>
        </div>
      </div>
    </div>
  );
}
