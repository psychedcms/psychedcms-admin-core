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
export { useFieldMetadata } from './hooks/useFieldMetadata.ts';
export { useWorkflowState, getTransitionMeta, transitionToEndpoint } from './hooks/useWorkflowState.ts';
export { PsychedSchemaContext, usePsychedSchemaContext } from './providers/PsychedSchemaContext.ts';
export type { PsychedSchemaContextValue } from './providers/PsychedSchemaContext.ts';
export type { ContentTypeMetadata, FieldType, FieldMetadata, ResourceSchema, PsychedSchema, OpenApiProperty, OpenApiSchema, OpenApiComponents, OpenApiDocument, WorkflowState, TransitionMeta } from './types/psychedcms.ts';
export { GlobalSettings, PreferencesSettings } from './settings/index.ts';

// Providers
export { useOpenApiSchema } from './providers/SchemaProvider.tsx';
export { createHydraDataProvider } from './providers/HydraDataProvider.ts';
export { buildI18nProvider } from './providers/i18nProvider.ts';

// Components
export { ContentList } from './components/ContentList.tsx';
export { ContentEdit } from './components/ContentEdit.tsx';
export { ContentCreate } from './components/ContentCreate.tsx';
export { ContentForm } from './components/ContentForm.tsx';
export { ContentSidebar } from './components/ContentSidebar.tsx';
export { EditSidebar } from './components/EditSidebar.tsx';
export { InputGuesser } from './components/InputGuesser.tsx';
export { FieldGroup } from './components/FieldGroup.tsx';
export { WorkflowButton } from './components/WorkflowButton.tsx';
export { ScheduleDialog } from './components/ScheduleDialog.tsx';
export { buildFormInputs } from './components/ContentFormFields.tsx';
export { MediaImageInput } from './components/MediaImageInput.tsx';
export { MediaBrowser } from './components/MediaBrowser.tsx';
export { PsychedLayout } from './components/PsychedLayout.tsx';
export { PsychedApp } from './components/PsychedApp.tsx';
