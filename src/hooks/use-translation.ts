'use client';

import { useLanguage } from '@/components/language-provider';
import { TRANSLATIONS } from '@/lib/translations';
import { useState, useEffect } from 'react';

/**
 * Accesses the global translation frequency.
 * Stabilized for React 18 hydration to prevent text content mismatches.
 */
export function useTranslation() {
 const { language, setLanguage } = useLanguage();
 const [isHydrated, setIsHydrated] = useState(false);

 useEffect(() => {
   setIsHydrated(true);
 }, []);

 // During SSR and the very first client render, we force English to ensure parity.
 // This prevents the common "Text content does not match" #310 hydration error.
 const currentLang = isHydrated ? language : 'en';
 const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

 return { t, language, setLanguage, isHydrated };
}
