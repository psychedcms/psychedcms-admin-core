import type {
  PluginRegistration,
  SidebarWidget,
  MainPage,
  AdminPage,
  SettingsPage,
  ToolPage,
  AppBarItem,
  FormHook,
  AppWrapper,
  HttpMiddleware,
  SaveHook,
  InputResolver,
  ChildContentOverride,
  EditorToolbarButton,
  EditorExtension,
  EditorContentTransform,
  ListColumnResolver,
  ListFilter,
  ListBulkAction,
  ListAction,
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

export function getDashboard(): PluginRegistration['dashboard'] {
  for (const plugin of registry) {
    if (plugin.dashboard) return plugin.dashboard;
  }
  return undefined;
}

export function getSidebarWidgets(resource?: string): SidebarWidget[] {
  return registry.flatMap((p) => p.sidebarWidgets ?? []).filter(
    (w) => !w.resource || w.resource === resource,
  ).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function getMainPages(): MainPage[] {
  return registry.flatMap((p) => p.mainPages ?? []);
}

export function getSettingsPages(): SettingsPage[] {
  return registry.flatMap((p) => p.settingsPages ?? []);
}

export function getAdminPages(): AdminPage[] {
  return registry.flatMap((p) => p.adminPages ?? []);
}

export function getToolPages(): ToolPage[] {
  return registry.flatMap((p) => p.toolPages ?? []);
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

export function getInputResolvers(): InputResolver[] {
  return registry.flatMap((p) => p.inputResolvers ?? []);
}

export function getSaveHooks(resource?: string): SaveHook[] {
  return registry.flatMap((p) => p.saveHooks ?? []).filter(
    (h) => !h.resource || h.resource === resource,
  );
}

export function getEditorToolbarButtons(): EditorToolbarButton[] {
  return registry.flatMap((p) => p.editorToolbarButtons ?? []).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
}

export function getEditorExtensions(): EditorExtension[] {
  return registry.flatMap((p) => p.editorExtensions ?? []).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
}

export function getListColumnResolvers(): ListColumnResolver[] {
  return registry.flatMap((p) => p.listColumnResolvers ?? []).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
}

export function getListFilters(resource?: string): ListFilter[] {
  return registry.flatMap((p) => p.listFilters ?? []).filter(
    (f) => !f.resource || f.resource === resource,
  ).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function getListBulkActions(resource?: string): ListBulkAction[] {
  return registry.flatMap((p) => p.listBulkActions ?? []).filter(
    (a) => !a.resource || a.resource === resource,
  ).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function getListActions(resource?: string): ListAction[] {
  return registry.flatMap((p) => p.listActions ?? []).filter(
    (a) => !a.resource || a.resource === resource,
  ).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function getEditorContentTransforms(): EditorContentTransform[] {
  return registry.flatMap((p) => p.editorContentTransforms ?? []).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
}

export function getChildContentOverride(parentResource: string, childResource: string): ChildContentOverride | undefined {
  const overrides = registry.flatMap((p) => p.childContentOverrides ?? []);
  return overrides.find((o) => o.parentResource === parentResource && o.childResource === childResource);
}

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

export function getI18nMessages(): Record<string, Record<string, unknown>> {
  const merged: Record<string, Record<string, unknown>> = {};
  for (const plugin of registry) {
    if (!plugin.i18nMessages) continue;
    for (const [locale, messages] of Object.entries(plugin.i18nMessages)) {
      merged[locale] = deepMerge((merged[locale] ?? {}) as Record<string, unknown>, messages as Record<string, unknown>);
    }
  }
  return merged;
}
