import './defaults.ts';

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

export { useLocaleSettings } from './hooks/useLocaleSettings.ts';
export type { LocaleSettings } from './hooks/useLocaleSettings.ts';
export { usePsychedSchema } from './hooks/usePsychedSchema.ts';
export { PsychedSchemaContext, usePsychedSchemaContext } from './providers/PsychedSchemaContext.ts';
export type { PsychedSchemaContextValue } from './providers/PsychedSchemaContext.ts';
export type { ContentTypeMetadata, FieldType, FieldMetadata, ResourceSchema, PsychedSchema, OpenApiProperty, OpenApiSchema, OpenApiComponents, OpenApiDocument, WorkflowState, TransitionMeta } from './types/psychedcms.ts';
export { GlobalSettings, PreferencesSettings } from './settings/index.ts';
