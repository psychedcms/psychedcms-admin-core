import './defaults.ts';

export type {
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
  InputResolverProps,
  ChildContentOverride,
  EditorToolbarButton,
  EditorExtension,
  EditorContentTransform,
  ListColumnResolver,
  ListColumnResolverProps,
  ListFilter,
  ListBulkAction,
  ListAction,
} from './types.ts';

export {
  registerPlugin,
  getRegistry,
  freezeRegistry,
  getDashboard,
  getSidebarWidgets,
  getMainPages,
  getAdminPages,
  getSettingsPages,
  getToolPages,
  getAppBarItems,
  getFormHooks,
  getAppWrappers,
  getHttpMiddleware,
  getSaveHooks,
  getInputResolvers,
  getI18nMessages,
  getChildContentOverride,
  getEditorToolbarButtons,
  getEditorExtensions,
  getEditorContentTransforms,
  getListColumnResolvers,
  getListFilters,
  getListBulkActions,
  getListActions,
} from './registry.ts';

export { SidebarSlot } from './slots/SidebarSlot.tsx';
export { renderAdminRoutes } from './slots/AdminRoutes.tsx';
export { renderSettingsRoutes } from './slots/SettingsRoutes.tsx';
export { renderToolRoutes } from './slots/ToolRoutes.tsx';
export { SettingsMenuSlot } from './slots/SettingsMenuSlot.tsx';
export { AppBarSlot } from './slots/AppBarSlot.tsx';
export { FormHookSlot } from './slots/FormHookSlot.tsx';
export { AppWrapperSlot } from './slots/AppWrapperSlot.tsx';
export { buildHttpClient } from './slots/usePluginHttpClient.ts';
export { runBeforeSaveHooks, runAfterSaveHooks } from './slots/usePluginSaveHooks.ts';
export { mergePluginI18n } from './slots/mergePluginI18n.ts';

export { useLocaleSettings } from './hooks/useLocaleSettings.ts';
export type { LocaleSettings } from './hooks/useLocaleSettings.ts';
export { useSettings } from './hooks/useSettings.ts';
export type { Settings } from './hooks/useSettings.ts';
export { usePsychedSchema } from './hooks/usePsychedSchema.ts';
export { useFieldMetadata } from './hooks/useFieldMetadata.ts';
export { useWorkflowState, getTransitionMeta, transitionToEndpoint } from './hooks/useWorkflowState.ts';
export { useTranslationReference } from './hooks/useTranslationReference.ts';
export { PsychedSchemaContext, usePsychedSchemaContext } from './providers/PsychedSchemaContext.ts';
export type { PsychedSchemaContextValue } from './providers/PsychedSchemaContext.ts';
export { setTranslationReference } from './providers/TranslationReferenceStore.ts';
export type { ContentTypeMetadata, FieldType, FieldMetadata, ResourceSchema, PsychedSchema, OpenApiProperty, OpenApiSchema, OpenApiComponents, OpenApiDocument, WorkflowState, TransitionMeta } from './types/psychedcms.ts';
export { GlobalSettings, PreferencesSettings } from './settings/index.ts';

// Providers
export { useOpenApiSchema } from './providers/SchemaProvider.tsx';
export { createHydraDataProvider } from './providers/HydraDataProvider.ts';
export { buildI18nProvider, getAvailableLocales } from './providers/i18nProvider.ts';

// Theme
export { darkTheme, lightTheme } from './theme.ts';

// Components
export { ContentList } from './components/ContentList.tsx';
export { ContentEdit } from './components/ContentEdit.tsx';
export { ContentCreate } from './components/ContentCreate.tsx';
export { ContentForm } from './components/ContentForm.tsx';
export { ContentSidebar } from './components/ContentSidebar.tsx';
export { FormSidebar } from './components/FormSidebar.tsx';
export { InputGuesser } from './components/InputGuesser.tsx';
export { TranslationReferencePanel } from './components/TranslationReferencePanel.tsx';
export { FieldGroup } from './components/FieldGroup.tsx';
export { WorkflowButton } from './components/WorkflowButton.tsx';
export { ViewOnSiteButton } from './components/ViewOnSiteButton.tsx';
export { ScheduleDialog } from './components/ScheduleDialog.tsx';
export { buildFormInputs } from './components/ContentFormFields.tsx';
export { PageHeader } from './components/PageHeader.tsx';
export { BreadcrumbBar, BreadcrumbProvider, useSetBreadcrumbs } from './components/BreadcrumbBar.tsx';
export type { BreadcrumbItem } from './components/BreadcrumbBar.tsx';
export { PsychedLayout } from './components/PsychedLayout.tsx';
export type { PsychedLayoutProps } from './components/PsychedLayout.tsx';
export { PsychedApp } from './components/PsychedApp.tsx';
export { ProfilePage } from './components/ProfilePage.tsx';
export { PsychedUserMenu } from './components/PsychedUserMenu.tsx';
export { ChildContentSection } from './components/ChildContentSection.tsx';
export { AggregateRelationSection } from './components/AggregateRelationSection.tsx';
export { CollectionInput } from './components/CollectionInput.tsx';

// Utils
export { resolveIcon, resolveIconComponent } from './utils/resolveIcon.ts';
