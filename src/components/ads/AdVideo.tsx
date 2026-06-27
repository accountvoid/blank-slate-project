import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAds, logAdEvent, type Ad } from '@/hooks/useAds';

interface AdVideoProps {
  placement?: string;
  onClose?: (completed: boolean) => void;
  /** Pass a specific ad to bypass query (e.g. interstitial). */
  ad?: Ad;
}

/**
 * Fullscreen video ad with optional skip timer. Tracks view + complete events.
 */
export function AdVideo({ placement = 'interstitial', onClose, ad: providedAd }: AdVideoProps) {
  const { ads } = useAds({ type: 'video', placement, limit: 1 });
  const ad = providedAd ?? ads[0];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [remaining, setRemaining] = useState<number>(ad?.skip_after_seconds ?? 0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!ad) return;
    logAdEvent(ad.id, 'view', { placement });
    setRemaining(ad.skip_after_seconds ?? 0);
    const t = setInterval(() => {
      setRemaining(r => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [ad, placement]);

  if (!ad || !ad.video_url) return null;

  const handleEnded = () => {
    setCompleted(true);
    logAdEvent(ad.id, 'complete', { placement });
  };

  const canSkip = remaining <= 0 || completed;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={ad.video_url}
        poster={ad.video_thumbnail_url ?? undefined}
        autoPlay
        playsInline
        controls={false}
        className="h-full w-full object-contain"
        onEnded={handleEnded}
      />
      <div className="absolute left-4 top-4 rounded bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
        Ad · {ad.advertiser_name ?? 'Sponsor'}
      </div>
      <button
        onClick={() => canSkip && onClose?.(completed)}
        disabled={!canSkip}
        className="absolute right-4 top-4 flex items-center gap-2 rounded bg-black/70 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
      >
        {canSkip ? <><X className="h-4 w-4" /> Skip</> : <span>Skip in {remaining}s</span>}
      </button>
      {(ad.button_text || ad.destination_url) && (
        <button
          onClick={() => {
            logAdEvent(ad.id, 'click', { placement });
            if (ad.destination_url) window.open(ad.destination_url, '_blank', 'noopener,noreferrer');
          }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg"
        >
          {ad.button_text ?? 'Learn more'}
        </button>
      )}
    </div>
  );
}
