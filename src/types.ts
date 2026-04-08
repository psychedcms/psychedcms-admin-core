import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { Extension } from '@tiptap/core';
import type { FieldType, FieldMetadata } from './types/psychedcms.ts';

export interface InputResolverProps {
  source: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  meta: FieldMetadata;
}

export interface InputResolver {
  types: FieldType[];
  resolve: (props: InputResolverProps) => ReactElement;
}

export interface EditorToolbarButton {
  component: ComponentType;
  position?: number;
}

export interface EditorExtension {
  extension: Extension | (() => Extension);
  position?: number;
}

export interface EditorContentTransform {
  toEditor: (html: string) => string;
  toStorage: (html: string) => string;
  position?: number;
}

export interface SidebarWidget {
  component: ComponentType<{ resource?: string }>;
  resource?: string;
  position?: number;
}

export interface AdminPage {
  path: string;
  component: ComponentType;
  menuLabel: string;
  menuIcon?: ComponentType;
  permission?: string;
}

export interface SettingsPage {
  path: string;
  component: ComponentType;
  menuLabel: string;
  menuIcon?: ComponentType;
}

export interface ToolPage {
  path: string;
  component: ComponentType;
  menuLabel: string;
  menuIcon?: ComponentType;
}

export interface AppBarItem {
  component: ComponentType;
  position?: number;
}

export interface FormHook {
  component: ComponentType<{ resource?: string; saveHandleRef?: unknown }>;
  resource?: string;
}

export interface AppWrapper {
  component: ComponentType<{ children: ReactNode }>;
  order?: number;
}

export type HttpMiddleware = (
  fetchFn: (url: URL, options?: RequestInit) => Promise<Response>,
) => (url: URL, options?: RequestInit) => Promise<Response>;

export interface SaveHook {
  beforeSave?: (data: Record<string, unknown>, resource: string) => Record<string, unknown> | Promise<Record<string, unknown>>;
  afterSave?: (data: Record<string, unknown>, resource: string) => void | Promise<void>;
  resource?: string;
}

export interface ChildContentOverride {
  parentResource: string;
  childResource: string;
  component: ComponentType<{ childResource: string }>;
}

export interface ListColumnResolverProps {
  source: string;
  label: string;
  meta: FieldMetadata;
  resource: string;
}

export interface ListColumnResolver {
  types: FieldType[];
  resolve: (props: ListColumnResolverProps) => ReactElement;
  position?: number;
}

export interface ListFilter {
  component: ComponentType<{ resource?: string }>;
  resource?: string;
  position?: number;
}

export interface ListBulkAction {
  component: ComponentType<{ resource?: string; selectedIds?: unknown[] }>;
  resource?: string;
  position?: number;
}

export interface ListAction {
  component: ComponentType<{ resource?: string }>;
  resource?: string;
  position?: number;
}

export interface MainPage {
  path: string;
  component: ComponentType;
  menuLabel: string;
  menuIcon?: ComponentType;
}

export interface PluginRegistration {
  dashboard?: ComponentType;
  mainPages?: MainPage[];
  sidebarWidgets?: SidebarWidget[];
  adminPages?: AdminPage[];
  settingsPages?: SettingsPage[];
  toolPages?: ToolPage[];
  appBarItems?: AppBarItem[];
  formHooks?: FormHook[];
  appWrappers?: AppWrapper[];
  httpMiddleware?: HttpMiddleware[];
  saveHooks?: SaveHook[];
  inputResolvers?: InputResolver[];
  childContentOverrides?: ChildContentOverride[];
  editorToolbarButtons?: EditorToolbarButton[];
  editorExtensions?: EditorExtension[];
  editorContentTransforms?: EditorContentTransform[];
  listColumnResolvers?: ListColumnResolver[];
  listFilters?: ListFilter[];
  listBulkActions?: ListBulkAction[];
  listActions?: ListAction[];
  customRoutes?: { path: string; component: ComponentType; noLayout?: boolean }[];
  resources?: { name: string; list?: ComponentType; edit?: ComponentType; create?: ComponentType; show?: ComponentType; icon?: ComponentType; menuLabel?: string }[];
  i18nMessages?: Record<string, Record<string, unknown>>;
}
