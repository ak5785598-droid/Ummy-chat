'use client';

import { useLanguage } from '@/components/language-provider';
import { TRANSLATIONS } from '@/lib/translations';

/**
 * Accesses the global translation frequency.
 */
export function useTranslation() {
  const { language, setLanguage } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return { t, language, setLanguage };
}
