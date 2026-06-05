/**
 * Asset & route preloading (Phase 2).
 * Warms up critical images and lazy chunks on idle so navigation feels instant.
 */

const CRITICAL_ASSETS = [
  '/SETVOIDUI.png',
  '/setvoid.png',
  '/GrottoMonsters.png',
];

const idle = (cb: () => void) => {
  if (typeof window === 'undefined') return;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (typeof ric === 'function') ric(cb);
  else window.setTimeout(cb, 200);
};

export const preloadAssets = () => {
  idle(() => {
    CRITICAL_ASSETS.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  });
};

/**
 * Preload route chunks. Pass the same dynamic-import functions used in `React.lazy`.
 */
export const preloadRoutes = (loaders: Array<() => Promise<unknown>>) => {
  idle(() => {
    loaders.forEach(load => {
      // Fire and forget; the module is cached by the bundler/browser.
      load().catch(() => undefined);
    });
  });
};
