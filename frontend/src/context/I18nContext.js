import { createContext, useContext, useState, useCallback } from 'react';
import { getTranslation, detectLanguage } from '../lib/i18n';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLang] = useState(detectLanguage);

  const setLanguage = useCallback((lang) => {
    setLang(lang);
    localStorage.setItem('pl_language', lang);
  }, []);

  const t = useCallback((key) => getTranslation(language, key), [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
