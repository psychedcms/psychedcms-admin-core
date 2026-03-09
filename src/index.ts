export type {
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

export {
  registerPlugin,
  getRegistry,
  freezeRegistry,
  getSidebarWidgets,
  getSettingsPages,
  getMenuSections,
  getAppBarItems,
  getFormHooks,
  getAppWrappers,
  getHttpMiddleware,
  getSaveHooks,
  getI18nMessages,
} from './registry.ts';

export { SidebarSlot } from './slots/SidebarSlot.tsx';
export { renderSettingsRoutes } from './slots/SettingsRoutes.tsx';
export { SettingsMenuSlot } from './slots/SettingsMenuSlot.tsx';
export { AppBarSlot } from './slots/AppBarSlot.tsx';
export { FormHookSlot } from './slots/FormHookSlot.tsx';
export { AppWrapperSlot } from './slots/AppWrapperSlot.tsx';
export { buildHttpClient } from './slots/usePluginHttpClient.ts';
export { runBeforeSaveHooks, runAfterSaveHooks } from './slots/usePluginSaveHooks.ts';
export { mergePluginI18n } from './slots/mergePluginI18n.ts';
