import { type ComponentType, type ReactNode, useMemo, useRef, useEffect } from 'react';
import {
    Admin,
    Resource,
    CustomRoutes,
    useLocaleState,
    type AuthProvider,
    type I18nProvider,
    type DataProvider,
} from 'react-admin';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale/fr';
import { enUS } from 'date-fns/locale/en-US';
import type { Locale as DateFnsLocale } from 'date-fns';
import { Box, CircularProgress, Typography } from '@mui/material';

import { useOpenApiSchema } from '../providers/SchemaProvider.tsx';
import { PsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import { createHydraDataProvider } from '../providers/HydraDataProvider.ts';
import { AppWrapperSlot } from '../slots/AppWrapperSlot.tsx';
import { getDashboard } from '../registry.ts';
import { darkTheme, lightTheme } from '../theme.ts';
import { Route } from 'react-router-dom';
import { renderAdminRoutes } from '../slots/AdminRoutes.tsx';
import { renderMainRoutes } from '../slots/MainRoutes.tsx';
import { renderSettingsRoutes } from '../slots/SettingsRoutes.tsx';
import { renderToolRoutes } from '../slots/ToolRoutes.tsx';
import { ProfilePage } from './ProfilePage.tsx';
import { ContentList } from './ContentList.tsx';
import { ContentEdit } from './ContentEdit.tsx';
import { ContentCreate } from './ContentCreate.tsx';
import { PsychedLayout } from './PsychedLayout.tsx';
import { useSettings } from '../hooks/useSettings.ts';
import { PsychedLoginPage, ForgotPasswordPage, ResetPasswordPage, SetPasswordPage } from '@psychedcms/admin-auth';

const dateFnsLocales: Record<string, DateFnsLocale> = { fr, en: enUS };

interface PsychedAppProps {
    apiUrl: string;
    authProvider: AuthProvider;
    i18nProvider?: I18nProvider;
    dataProvider?: DataProvider;
    layout?: ComponentType<any>;
    appName?: string;
    children?: ReactNode;
}

/**
 * Top-level PsychedCMS admin application component.
 * Loads the OpenAPI schema, auto-discovers resources, and renders
 * a fully configured React Admin instance with plugin wrappers.
 */
export function PsychedApp({
    apiUrl,
    authProvider,
    i18nProvider,
    dataProvider,
    layout: LayoutComponent = PsychedLayout,
    appName,
    children,
}: PsychedAppProps) {
    const { schema, loading, error } = useOpenApiSchema(apiUrl);
    const schemaRef = useRef(schema);
    useEffect(() => { schemaRef.current = schema; }, [schema]);

    const schemaContextValue = useMemo(
        () => ({ schema, loading, error, entrypoint: apiUrl }),
        [schema, loading, error, apiUrl],
    );

    const resolvedDataProvider = useMemo(
        () => dataProvider ?? createHydraDataProvider(apiUrl, () => schemaRef.current),
        [dataProvider, apiUrl],
    );

    const { app_name: apiAppName } = useSettings();

    // API value takes precedence over prop, then core default
    const resolvedAppName = apiAppName || appName || 'PsychedCMS';

    const resolvedLayout = useMemo(() => {
        const WrappedLayout = (props: any) => {
            const [locale] = useLocaleState();
            const dateFnsLocale = dateFnsLocales[locale] ?? fr;
            return (
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
                    <LayoutComponent {...props} appName={resolvedAppName} />
                </LocalizationProvider>
            );
        };
        return WrappedLayout;
    }, [LayoutComponent, resolvedAppName]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
                <CircularProgress />
                <Typography color="textSecondary">Loading schema...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
                <Typography color="error" variant="h6">Failed to load schema</Typography>
                <Typography color="textSecondary">{error.message}</Typography>
            </Box>
        );
    }

    const mainRoutes = renderMainRoutes();
    const adminRoutes = renderAdminRoutes();
    const settingsRoutes = renderSettingsRoutes();
    const toolRoutes = renderToolRoutes();
    const DashboardComponent = getDashboard() as ComponentType<any> | undefined;

    return (
        <PsychedSchemaContext.Provider value={schemaContextValue}>
            <AppWrapperSlot>
                <Admin
                    dataProvider={resolvedDataProvider}
                    authProvider={authProvider}
                    i18nProvider={i18nProvider}
                    layout={resolvedLayout}
                    dashboard={DashboardComponent}
                    darkTheme={darkTheme}
                    lightTheme={lightTheme}
                    defaultTheme="dark"
                    loginPage={<PsychedLoginPage />}
                    requireAuth
                >
                    {schema && Array.from(schema.resources.entries()).map(([slug, res]) => {
                        if (!res.contentType) return null;
                        if (res.contentType.aggregateRoot) return null;
                        return (
                            <Resource
                                key={slug}
                                name={slug}
                                list={ContentList}
                                edit={ContentEdit}
                                create={ContentCreate}
                                options={{ label: res.contentType.name }}
                            />
                        );
                    })}
                    {children}
                    <CustomRoutes noLayout>
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/set-password" element={<SetPasswordPage />} />
                    </CustomRoutes>
                    <CustomRoutes>
                        {mainRoutes}
                        {adminRoutes}
                        {settingsRoutes}
                        {toolRoutes}
                        <Route path="/profile" element={<ProfilePage />} />
                    </CustomRoutes>
                </Admin>
            </AppWrapperSlot>
        </PsychedSchemaContext.Provider>
    );
}
