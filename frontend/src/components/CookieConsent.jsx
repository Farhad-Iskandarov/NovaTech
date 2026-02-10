import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/button';
import { X } from 'lucide-react';

const CONSENT_KEY = 'novatech-cookie-consent';

export function CookieConsent() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      data-testid="cookie-consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-white border-t border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-600 text-center md:text-left flex-1">
          {t('cookies.message')}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            data-testid="cookie-decline"
            className="rounded-full"
          >
            {t('cookies.decline')}
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            data-testid="cookie-accept"
            className="bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full"
          >
            {t('cookies.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
