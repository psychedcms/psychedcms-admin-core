import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useResourceDefinitions, useTranslate } from 'react-admin';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import { getToolPages, getAdminPages } from '../registry.ts';

export interface BreadcrumbItem {
    label: string;
    to?: string;
}

interface BreadcrumbContextValue {
    custom: BreadcrumbItem[] | null;
    setCustom: (items: BreadcrumbItem[] | null) => void;
}

const BreadcrumbCtx = createContext<BreadcrumbContextValue>({
    custom: null,
    setCustom: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [custom, setCustom] = useState<BreadcrumbItem[] | null>(null);
    const value = useMemo(() => ({ custom, setCustom }), [custom]);
    return <BreadcrumbCtx.Provider value={value}>{children}</BreadcrumbCtx.Provider>;
}

/**
 * Hook for pages to set custom breadcrumb items.
 * Call with null to reset to auto-generated breadcrumbs.
 */
export function useSetBreadcrumbs() {
    const { setCustom } = useContext(BreadcrumbCtx);
    return useCallback((items: BreadcrumbItem[] | null) => setCustom(items), [setCustom]);
}

/**
 * Auto-generates breadcrumbs from the current route.
 * /bands → [Contenu, Bands]
 * /bands/graveyard → [Contenu, Bands, graveyard]
 * /tools/media → [Outils, Médias]
 * /admin/permissions → [Administration, Permissions]
 * /profile → [Profil]
 */
function useAutoBreadcrumbs(): BreadcrumbItem[] {
    const location = useLocation();
    const resources = useResourceDefinitions();
    const { schema } = usePsychedSchemaContext();
    const translate = useTranslate();
    const toolPages = getToolPages();
    const adminPages = getAdminPages();

    return useMemo(() => {
        const path = location.pathname.replace(/^\/+|\/+$/g, '');
        if (!path) return [];

        const segments = path.split('/');

        // Profile page
        if (segments[0] === 'profile') {
            return [{ label: translate('psyched.profile.title', { _: 'Profile' }) }];
        }

        // Tool pages: /tools/media → [Outils, Médias]
        if (segments[0] === 'tools' && segments.length >= 2) {
            const sectionLabel = translate('psyched.menu.tools', { _: 'Tools' });
            const toolPage = toolPages.find((p) => p.path === segments[1]);
            const label = toolPage
                ? translate(`psyched.menu.${toolPage.menuLabel.toLowerCase()}`, { _: toolPage.menuLabel })
                : segments[1];
            return [{ label: sectionLabel }, { label }];
        }

        // Admin pages: /admin/... → [Administration, translated page label]
        if (segments[0] === 'admin') {
            const sectionLabel = translate('psyched.menu.admin', { _: 'Admin' });
            const pagePath = segments.slice(1).join('/');
            if (!pagePath) return [{ label: sectionLabel }];
            const adminPage = adminPages.find((p) => p.path === pagePath);
            const pageLabel = adminPage
                ? translate(adminPage.menuLabel, { _: adminPage.menuLabel })
                : pagePath;
            return [{ label: sectionLabel }, { label: pageLabel }];
        }

        // Settings pages
        if (segments[0] === 'settings') {
            const sectionLabel = translate('psyched.menu.admin', { _: 'Admin' });
            const settingsLabel = translate('psyched.menu.settings', { _: 'Settings' });
            return [{ label: sectionLabel }, { label: settingsLabel }];
        }

        // Resource pages: /bands or /bands/graveyard
        const resourceSlug = segments[0];
        const resDef = resources[resourceSlug];
        const schemaRes = schema?.resources.get(resourceSlug);
        const fallbackName = schemaRes?.contentType?.name ?? resDef?.options?.label ?? resourceSlug;
        const resourceLabel = translate(`resources.${resourceSlug}.name`, { _: fallbackName });

        // Determine section from content type group or adminOnly flag
        const group = schemaRes?.contentType?.group ?? (resDef?.options?.adminOnly ? 'admin' : 'content');
        const sectionLabel = translate(`psyched.menu.${group}`, { _: group });

        if (segments.length === 1) {
            return [{ label: sectionLabel }, { label: resourceLabel }];
        }

        // Edit/show page
        const recordId = segments.slice(1).join('/');
        return [
            { label: sectionLabel },
            { label: resourceLabel, to: `/${resourceSlug}` },
            { label: recordId },
        ];
    }, [location.pathname, resources, schema, translate, toolPages, adminPages]);
}

/**
 * Breadcrumb bar rendered in the layout, between appbar and content.
 * Uses custom breadcrumbs if set by a page, otherwise auto-generates from route.
 */
export function BreadcrumbBar() {
    const { custom } = useContext(BreadcrumbCtx);
    const auto = useAutoBreadcrumbs();
    const items = custom ?? auto;

    if (items.length === 0) return null;

    return (
        <Box sx={{
            px: 3, py: 0.75,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            minHeight: 32,
        }}>
            <Breadcrumbs
                separator={<NavigateNextIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
                sx={{ '& .MuiBreadcrumbs-li': { lineHeight: 1 } }}
            >
                {items.map((crumb, i) => {
                    const isLast = i === items.length - 1;
                    return crumb.to && !isLast ? (
                        <Link
                            key={i}
                            component={RouterLink}
                            to={crumb.to}
                            variant="body2"
                            color="text.secondary"
                            underline="hover"
                            sx={{ fontSize: '0.8125rem' }}
                        >
                            {crumb.label}
                        </Link>
                    ) : (
                        <Typography
                            key={i}
                            variant="body2"
                            color={isLast ? 'text.primary' : 'text.secondary'}
                            sx={{ fontSize: '0.8125rem' }}
                        >
                            {crumb.label}
                        </Typography>
                    );
                })}
            </Breadcrumbs>
        </Box>
    );
}
