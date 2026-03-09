import { getI18nMessages } from '../registry.ts';

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export function mergePluginI18n(
  baseMessages: Record<string, object>,
): Record<string, object> {
  const pluginMessages = getI18nMessages();
  const merged: Record<string, object> = { ...baseMessages };

  for (const [locale, messages] of Object.entries(pluginMessages)) {
    merged[locale] = deepMerge(
      (merged[locale] ?? {}) as Record<string, unknown>,
      messages as Record<string, unknown>,
    );
  }

  return merged;
}
