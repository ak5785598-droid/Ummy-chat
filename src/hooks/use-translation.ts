'use client';

import { useLanguage } from '@/components/language-provider';
import { TRANSLATIONS } from '@/lib/translations';
import { useFirebase } from '@/firebase/provider';

/**
 * Accesses the global translation frequency.
 * Synchronized with FirebaseProvider's hydration heartbeat.
 */
export function useTranslation() {
  const { isHydrated } = useFirebase();
  const { language, setLanguage } = useLanguage();

  // During SSR and initial hydration window, we force English for structural parity.
  const currentLang = isHydrated ? language : 'en';
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  return { t, language, setLanguage, isHydrated };
}
