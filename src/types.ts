import type { ComponentType, ReactElement, ReactNode } from 'react';
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
}

export interface SettingsPage {
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

export interface PluginRegistration {
  sidebarWidgets?: SidebarWidget[];
  adminPages?: AdminPage[];
  settingsPages?: SettingsPage[];
  appBarItems?: AppBarItem[];
  formHooks?: FormHook[];
  appWrappers?: AppWrapper[];
  httpMiddleware?: HttpMiddleware[];
  saveHooks?: SaveHook[];
  inputResolvers?: InputResolver[];
  childContentOverrides?: ChildContentOverride[];
  i18nMessages?: Record<string, Record<string, unknown>>;
}
