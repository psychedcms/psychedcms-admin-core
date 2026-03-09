import type { ComponentType, ReactNode } from 'react';

export interface SidebarWidget {
  component: ComponentType<{ resource?: string }>;
  resource?: string;
  position?: number;
}

export interface SettingsPage {
  path: string;
  component: ComponentType;
  menuLabel: string;
  menuIcon?: ComponentType;
  menuSection?: string;
}

export interface MenuSection {
  label: string;
  items: Array<{
    to: string;
    label: string;
    icon?: ComponentType;
  }>;
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

export interface PluginRegistration {
  sidebarWidgets?: SidebarWidget[];
  settingsPages?: SettingsPage[];
  menuSections?: MenuSection[];
  appBarItems?: AppBarItem[];
  formHooks?: FormHook[];
  appWrappers?: AppWrapper[];
  httpMiddleware?: HttpMiddleware[];
  saveHooks?: SaveHook[];
  i18nMessages?: Record<string, Record<string, string>>;
}
