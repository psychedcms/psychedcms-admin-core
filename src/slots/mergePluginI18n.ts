import { getI18nMessages } from '../registry.ts';

export function mergePluginI18n(
  baseMessages: Record<string, object>,
): Record<string, object> {
  const pluginMessages = getI18nMessages();
  const merged: Record<string, object> = { ...baseMessages };

  for (const [locale, messages] of Object.entries(pluginMessages)) {
    merged[locale] = { ...(merged[locale] ?? {}), ...messages };
  }

  return merged;
}
