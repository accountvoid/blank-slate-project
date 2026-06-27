import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAds, logAdEvent, type AdBannerSize } from '@/hooks/useAds';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  placement: string;
  size?: AdBannerSize;
  className?: string;
}

/**
 * Loads active banner ads from Supabase for a given placement.
 * Renders nothing when no ads match — safe to drop anywhere.
 */
export function AdBanner({ placement, size, className }: AdBannerProps) {
  const { ads } = useAds({ type: 'banner', placement, limit: 1 });
  const ad = ads.find(a => !size || a.banner_size === size) ?? ads[0];
  const viewedRef = useRef<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (ad && viewedRef.current !== ad.id) {
      viewedRef.current = ad.id;
      logAdEvent(ad.id, 'view', { placement });
    }
  }, [ad, placement]);

  if (!ad) return null;

  const handleClick = () => {
    logAdEvent(ad.id, 'click', { placement });
    if (ad.internal_route) navigate(ad.internal_route);
    else if (ad.destination_url) window.open(ad.destination_url, '_blank', 'noopener,noreferrer');
  };

  const sizeClass =
    ad.banner_size === 'square' ? 'aspect-square'
    : ad.banner_size === 'full_width' ? 'aspect-[16/5]'
    : 'aspect-[16/6]';

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-blue-500/30 bg-slate-900/60 text-left transition hover:border-blue-400/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]',
        sizeClass,
        className,
      )}
    >
      {ad.image_url && (
        <img src={ad.image_url} alt={ad.title} className="absolute inset-0 h-full w-full object-cover opacity-80" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      <div className="absolute left-3 top-2 text-[8px] font-bold uppercase tracking-widest text-blue-300/70">
        Sponsored {ad.advertiser_name ? `· ${ad.advertiser_name}` : ''}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="text-sm font-bold text-white drop-shadow">{ad.title}</h3>
        {ad.subtitle && <p className="mt-0.5 text-[11px] text-slate-200/90 line-clamp-2">{ad.subtitle}</p>}
        {ad.button_text && (
          <span className="mt-2 inline-block rounded border border-blue-400/50 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-200">
            {ad.button_text}
          </span>
        )}
      </div>
    </button>
  );
}
