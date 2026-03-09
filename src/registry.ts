import type {
  PluginRegistration,
  SidebarWidget,
  SettingsPage,
  MenuSection,
  AppBarItem,
  FormHook,
  AppWrapper,
  HttpMiddleware,
  SaveHook,
} from './types.ts';

const registry: PluginRegistration[] = [];
let frozen = false;

export function registerPlugin(plugin: PluginRegistration): void {
  if (frozen) {
    throw new Error(
      'Plugin registry is frozen. All plugins must be registered before the app renders.',
    );
  }
  registry.push(plugin);
}

export function getRegistry(): readonly PluginRegistration[] {
  return registry;
}

export function freezeRegistry(): void {
  frozen = true;
}

export function getSidebarWidgets(resource?: string): SidebarWidget[] {
  return registry.flatMap((p) => p.sidebarWidgets ?? []).filter(
    (w) => !w.resource || w.resource === resource,
  ).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function getSettingsPages(): SettingsPage[] {
  return registry.flatMap((p) => p.settingsPages ?? []);
}

export function getMenuSections(): MenuSection[] {
  return registry.flatMap((p) => p.menuSections ?? []);
}

export function getAppBarItems(): AppBarItem[] {
  return registry.flatMap((p) => p.appBarItems ?? []).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
}

export function getFormHooks(resource?: string): FormHook[] {
  return registry.flatMap((p) => p.formHooks ?? []).filter(
    (h) => !h.resource || h.resource === resource,
  );
}

export function getAppWrappers(): AppWrapper[] {
  return registry.flatMap((p) => p.appWrappers ?? []).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
}

export function getHttpMiddleware(): HttpMiddleware[] {
  return registry.flatMap((p) => p.httpMiddleware ?? []);
}

export function getSaveHooks(resource?: string): SaveHook[] {
  return registry.flatMap((p) => p.saveHooks ?? []).filter(
    (h) => !h.resource || h.resource === resource,
  );
}

export function getI18nMessages(): Record<string, Record<string, string>> {
  const merged: Record<string, Record<string, string>> = {};
  for (const plugin of registry) {
    if (!plugin.i18nMessages) continue;
    for (const [locale, messages] of Object.entries(plugin.i18nMessages)) {
      merged[locale] = { ...merged[locale], ...messages };
    }
  }
  return merged;
}
