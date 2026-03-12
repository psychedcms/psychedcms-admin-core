import { useSettings } from './useSettings.ts';

export interface LocaleSettings {
  defaultLocale: string;
  supportedLocales: string[];
}

/**
 * Fetches locale settings from the unified settings API.
 * Thin wrapper around useSettings for backwards compatibility.
 */
export function useLocaleSettings(): LocaleSettings & { loading: boolean; reload: () => void } {
  const { default_locale, supported_locales, loading, reload } = useSettings();

  return {
    defaultLocale: default_locale,
    supportedLocales: supported_locales,
    loading,
    reload,
  };
}
