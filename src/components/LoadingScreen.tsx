import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

/**
 * Hardware-accelerated CSS loader (replaces the GIF — no flicker, no CLS).
 * Static logo stays mounted with fixed dimensions, the spinner sits beneath.
 */
export const LoadingScreen = ({ fullScreen = false, message, className }: LoadingScreenProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen ? 'fixed inset-0 z-[9999] bg-background' : 'w-full py-10',
        className
      )}
    >
      <img
        src="/SETVOIDUI.png"
        alt="SETVOID"
        width={120}
        height={120}
        className="h-24 w-24 object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/setvoid.png';
        }}
      />
      <div className="setvoid-loader" aria-hidden />
      {message && (
        <p className="text-xs font-bold tracking-widest text-primary uppercase animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export const AppLogo = ({ className }: { className?: string }) => (
  <img
    src="/SETVOIDUI.png"
    alt="SETVOID"
    width={120}
    height={40}
    className={cn('h-10 w-auto object-contain', className)}
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).src = '/setvoid.png';
    }}
  />
);
