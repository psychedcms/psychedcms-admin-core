import polyglotI18nProvider from 'ra-i18n-polyglot';
import type { TranslationMessages, I18nProvider } from 'react-admin';
import { mergePluginI18n } from '../slots/mergePluginI18n.ts';

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
    const messages = mergePluginI18n(baseMessages);

    return polyglotI18nProvider(
        (locale) => (messages[locale] ?? messages[defaultLocale] ?? {}) as TranslationMessages,
        defaultLocale,
        locales,
    );
}
