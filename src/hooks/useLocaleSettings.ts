import { useSettings } from './useSettings.ts';
import { getAvailableLocales } from '../providers/i18nProvider.ts';

export interface LocaleSettings {
  defaultLocale: string;
  supportedLocales: string[];
}

/**
 * Returns locale configuration.
 * - supportedLocales: derived from available UI translations (set by buildI18nProvider)
 * - defaultLocale: from DB settings, falls back to first available locale
 */
export function useLocaleSettings(): LocaleSettings & { loading: boolean; reload: () => void } {
  const { default_locale, loading, reload } = useSettings();
  const supportedLocales = getAvailableLocales();

  return {
    defaultLocale: default_locale ?? supportedLocales[0] ?? 'en',
    supportedLocales,
    loading,
    reload,
  };
}
