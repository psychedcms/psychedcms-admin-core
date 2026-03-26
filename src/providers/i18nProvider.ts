import polyglotI18nProvider from 'ra-i18n-polyglot';
import type { TranslationMessages, I18nProvider } from 'react-admin';
import { mergePluginI18n } from '../slots/mergePluginI18n.ts';

/** Available UI locales, populated by buildI18nProvider. */
let registeredLocales: string[] = [];

/** Returns the list of available UI locale codes. */
export function getAvailableLocales(): string[] {
    return registeredLocales;
}

/**
 * Build a configured i18n provider with plugin translations merged in.
 * @param defaultLocale - The default locale code (e.g. 'fr')
 * @param locales - Available locales with display names
 * @param baseMessages - Base translation messages keyed by locale code.
 *                       Must include at least the default locale.
 */
export function buildI18nProvider(
    defaultLocale: string,
    locales: Array<{ locale: string; name: string }>,
    baseMessages: Record<string, object> = {},
): I18nProvider {
    registeredLocales = locales.map((l) => l.locale);
    const messages = mergePluginI18n(baseMessages);

    return polyglotI18nProvider(
        (locale) => (messages[locale] ?? messages[defaultLocale] ?? {}) as TranslationMessages,
        defaultLocale,
        locales,
    );
}
