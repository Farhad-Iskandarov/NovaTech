import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, getLocalizedContent } from './translations';

const LanguageContext = createContext();

const STORAGE_KEY = 'novatech-lang-pref';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'az';
    }
    return 'az';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang) => {
    if (['en', 'az', 'ru'].includes(lang)) {
      setLanguageState(lang);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  };

  const getContent = (content) => getLocalizedContent(content, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getContent }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  return useLanguage();
}
