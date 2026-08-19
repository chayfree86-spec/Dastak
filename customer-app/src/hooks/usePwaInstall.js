import { useState, useEffect, useCallback } from 'react';

const DISMISS_KEY = 'dastak_customer_pwa_dismissed_until';
const INSTALLED_KEY = 'dastak_customer_pwa_installed';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    return localStorage.getItem(INSTALLED_KEY) === 'true';
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
      if (isStandaloneMode) {
        setIsInstalled(true);
        localStorage.setItem(INSTALLED_KEY, 'true');
      }
    };

    checkStandalone();

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|crmo|fxios/.test(userAgent);
    setIsIOS(isAppleDevice && isSafari);

    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed && !isStandalone) {
        const timer = setTimeout(() => {
          setShowModal(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
      localStorage.setItem(INSTALLED_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If on iOS and not in standalone mode, trigger prompt if not dismissed
    if (isAppleDevice && !window.navigator.standalone && !isDismissed) {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // If on browser and previously installed, still show prompt with 'Open in App' option
    if (!isStandalone && !isDismissed && localStorage.getItem(INSTALLED_KEY) === 'true') {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setShowModal(false);
        setDeferredPrompt(null);
        localStorage.setItem(INSTALLED_KEY, 'true');
        return true;
      }
    } catch (err) {
      console.error('[PWA] Install prompt error:', err);
    }
    return false;
  }, [deferredPrompt]);

  const dismissModal = useCallback((dontShowDays = 3) => {
    setShowModal(false);
    const expiry = Date.now() + dontShowDays * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(expiry));
  }, []);

  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt) || isIOS,
    isStandalone,
    isIOS,
    isInstalled,
    showModal,
    openModal,
    promptInstall,
    dismissModal,
    setShowModal
  };
}
