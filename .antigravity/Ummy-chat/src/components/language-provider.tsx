'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode } from '@/lib/translations';

interface LanguageContextType {
 language: LanguageCode;
 setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Manages the global linguistic frequency of the application.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
 const [language, setLangState] = useState<LanguageCode>('en');

 useEffect(() => {
  const saved = localStorage.getItem('ummy_lang') as LanguageCode;
  if (saved && ['en', 'hi', 'bn', 'ar', 'ur'].includes(saved)) {
   setLangState(saved);
  }
 }, []);

 const setLanguage = (lang: LanguageCode) => {
  setLangState(lang);
  localStorage.setItem('ummy_lang', lang);
 };

 return (
  <LanguageContext.Provider value={{ language, setLanguage }}>
   {children}
  </LanguageContext.Provider>
 );
}

export function useLanguage() {
 const context = useContext(LanguageContext);
 if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
 return context;
}
