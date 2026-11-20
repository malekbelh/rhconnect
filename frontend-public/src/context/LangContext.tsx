import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Locale, Translations } from '../i18n/translations';
import { getTranslation } from '../i18n/translations';

interface LangContextType {
  locale: Locale;
  translations: Translations;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

const DEFAULT_LOCALE: Locale = 'fr';
const STORAGE_KEY = 'rhconnect_locale';

export const LangProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<Translations>(getTranslation(DEFAULT_LOCALE));
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize locale from localStorage and apply to document
  useEffect(() => {
    const storedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
    const initialLocale = (storedLocale && ['fr', 'ar', 'en'].includes(storedLocale) ? storedLocale : DEFAULT_LOCALE) as Locale;

    setLocaleState(initialLocale);
    setTranslations(getTranslation(initialLocale));
    applyLocaleToDocument(initialLocale);
    setIsHydrated(true);
  }, []);

  const applyLocaleToDocument = (newLocale: Locale) => {
    document.documentElement.lang = newLocale;
    // Pas de RTL car seulement FR (LTR) et EN (LTR)
  };

  const setLocale = useCallback((newLocale: Locale) => {
    if (!['fr', 'ar', 'en'].includes(newLocale)) {
      console.warn(`Invalid locale: ${newLocale}, using default`);
      newLocale = DEFAULT_LOCALE;
    }

    setLocaleState(newLocale);
    setTranslations(getTranslation(newLocale));
    localStorage.setItem(STORAGE_KEY, newLocale);
    applyLocaleToDocument(newLocale);

    // Dispatch custom event for other components to react to locale change
    window.dispatchEvent(
      new CustomEvent('localechange', {
        detail: { locale: newLocale },
      })
    );
  }, []);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let value: any = translations;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key; // Fallback to key if not found
        }
      }

      return typeof value === 'string' ? value : key;
    },
    [translations]
  );

  if (!isHydrated) {
    return (
      <LangContext.Provider
        value={{
          locale,
          translations,
          setLocale,
          t,
        }}
      >
        {children}
      </LangContext.Provider>
    );
  }

  return (
    <LangContext.Provider
      value={{
        locale,
        translations,
        setLocale,
        t,
      }}
    >
      {children}
    </LangContext.Provider>
  );
};

export const useLang = (): LangContextType => {
  const context = useContext(LangContext);
  if (context === undefined) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
};
