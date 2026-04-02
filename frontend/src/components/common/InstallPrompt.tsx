'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Download, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed before
    if (localStorage.getItem('install-dismissed')) return;

    // Detect mobile
    const mobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If mobile and no native prompt after 2 seconds, show manual banner
    if (mobile) {
      setTimeout(() => {
        if (!deferredPrompt) {
          setShowBanner(true);
        }
      }, 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('install-dismissed', 'true');
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-bold text-lg">Install Chat US</h3>
          <button onClick={handleDismiss} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isIOS ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Share size={24} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 1</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tap the <strong>Share</strong> button at the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Plus size={24} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 2</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Download size={24} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 3</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tap <strong>&quot;Add&quot;</strong> to confirm</p>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
                <Download size={32} className="text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Install Chat US on your device for quick access</p>
              <button
                onClick={handleInstall}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Install App
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <span className="text-2xl">⋮</span>
                <div>
                  <p className="font-medium text-sm">Step 1</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tap the <strong>⋮ menu</strong> in the top-right corner</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Plus size={24} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 2</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Download size={24} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Step 3</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tap <strong>&quot;Install&quot;</strong> to confirm</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
