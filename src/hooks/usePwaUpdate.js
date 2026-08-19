import { useState, useEffect, useCallback } from 'react';

export function usePwaUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  const applyUpdate = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    if ('caches' in window) {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }, [registration]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[PWA] Service Worker updated. Refreshing application...');
        window.location.reload();
      }
    });

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        setRegistration(reg);

        if (reg.waiting) {
          setHasUpdate(true);
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New update ready. Activating...');
              setHasUpdate(true);
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        const intervalId = setInterval(() => {
          reg.update().catch(() => {});
        }, 30 * 1000);

        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('focus', handleVisibilityChange);
        };
      })
      .catch((err) => {
        console.warn('[PWA] SW registration notice:', err);
      });
  }, []);

  return {
    hasUpdate,
    applyUpdate,
    registration
  };
}
