import { type ComponentType, useMemo } from 'react';
import {
    Admin,
    Resource,
    CustomRoutes,
    type AuthProvider,
    type I18nProvider,
    type DataProvider,
} from 'react-admin';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box, CircularProgress, Typography } from '@mui/material';

import { useOpenApiSchema } from '../providers/SchemaProvider.tsx';
import { PsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import { createHydraDataProvider } from '../providers/HydraDataProvider.ts';
import { AppWrapperSlot } from '../slots/AppWrapperSlot.tsx';
import { renderAdminRoutes } from '../slots/AdminRoutes.tsx';
import { renderSettingsRoutes } from '../slots/SettingsRoutes.tsx';
import { ContentList } from './ContentList.tsx';
import { ContentEdit } from './ContentEdit.tsx';
import { ContentCreate } from './ContentCreate.tsx';
import { PsychedLayout } from './PsychedLayout.tsx';
import { useSettings } from '../hooks/useSettings.ts';

interface PsychedAppProps {
    apiUrl: string;
    authProvider: AuthProvider;
    i18nProvider?: I18nProvider;
    dataProvider?: DataProvider;
    layout?: ComponentType<any>;
    appName?: string;
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
}: PsychedAppProps) {
    const { schema, loading, error } = useOpenApiSchema(apiUrl);

    const schemaContextValue = useMemo(
        () => ({ schema, loading, error, entrypoint: apiUrl }),
        [schema, loading, error, apiUrl],
    );

    const resolvedDataProvider = useMemo(
        () => dataProvider ?? createHydraDataProvider(apiUrl),
        [dataProvider, apiUrl],
    );

    const { app_name: apiAppName } = useSettings();

    // API value takes precedence over prop, then core default
    const resolvedAppName = apiAppName || appName || 'PsychedCMS';

    const resolvedLayout = useMemo(() => {
        if (!resolvedAppName) return LayoutComponent;
        return (props: any) => <LayoutComponent {...props} appName={resolvedAppName} />;
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

    const adminRoutes = renderAdminRoutes();
    const settingsRoutes = renderSettingsRoutes();

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <PsychedSchemaContext.Provider value={schemaContextValue}>
                <AppWrapperSlot>
                    <Admin
                        dataProvider={resolvedDataProvider}
                        authProvider={authProvider}
                        i18nProvider={i18nProvider}
                        layout={resolvedLayout}
                        requireAuth
                    >
                        {schema && Array.from(schema.resources.entries()).map(([slug, res]) => {
                            if (!res.contentType) return null;
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
                        <CustomRoutes>
                            {adminRoutes}
                            {settingsRoutes}
                        </CustomRoutes>
                    </Admin>
                </AppWrapperSlot>
            </PsychedSchemaContext.Provider>
        </LocalizationProvider>
    );
}
