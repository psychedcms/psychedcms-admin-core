import { Layout, AppBar, MenuItemLink, useSidebarState, useResourceDefinitions, useTranslate, usePermissions } from 'react-admin';
import { Box, List, ListItem, ListItemText, Divider, Typography } from '@mui/material';
import { useMemo, createElement, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Speed';
import { AppBarSlot } from '../slots/AppBarSlot.tsx';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import { getMainPages, getAdminPages, getToolPages, getDashboard } from '../registry.ts';
import { PsychedUserMenu } from './PsychedUserMenu.tsx';
import { BreadcrumbBar, BreadcrumbProvider } from './BreadcrumbBar.tsx';
import { resolveIcon } from '../utils/resolveIcon.ts';
import type { ContentTypeMetadata } from '../types/psychedcms.ts';

const CONTENT_MAX_WIDTH = 1400;

interface LayoutConfig {
    appName?: string;
}

const LayoutConfigContext = createContext<LayoutConfig>({});

const PsychedToolbar = () => null;

const PsychedAppBar = () => {
    const { appName } = useContext(LayoutConfigContext);
    const navigate = useNavigate();
    return (
        <AppBar toolbar={<PsychedToolbar />} userMenu={<PsychedUserMenu />}>
            {appName && (
                <Box
                    sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mr: 1, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {appName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        admin
                    </Typography>
                </Box>
            )}
            <Box flex={1} />
            <AppBarSlot />
        </AppBar>
    );
};

const sectionHeaderStyle = {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'text.secondary',
    letterSpacing: '0.08em',
};

function SectionHeader({ label }: { label: string }) {
    const [open] = useSidebarState();
    const translate = useTranslate();
    if (!open) return null;
    return (
        <List dense disablePadding>
            <ListItem component="div" sx={{ py: 0.5, px: 2 }}>
                <ListItemText
                    primary={translate(`psyched.menu.${label.toLowerCase()}`, { _: label })}
                    primaryTypographyProps={sectionHeaderStyle}
                />
            </ListItem>
        </List>
    );
}

interface ResourceEntry {
    slug: string;
    label: string;
    contentType: ContentTypeMetadata;
}

function useGroupedResources(): Map<string, ResourceEntry[]> {
    const { schema } = usePsychedSchemaContext();
    const resources = useResourceDefinitions();

    return useMemo(() => {
        const groups = new Map<string, ResourceEntry[]>();
        const resourceNames = Object.keys(resources);

        for (const slug of resourceNames) {
            const res = schema?.resources.get(slug);
            if (!res?.contentType) continue;

            const group = res.contentType.group ?? 'content';
            if (!groups.has(group)) {
                groups.set(group, []);
            }
            groups.get(group)!.push({
                slug,
                label: res.contentType.name,
                contentType: res.contentType,
            });
        }

        for (const entries of groups.values()) {
            entries.sort((a, b) => a.contentType.priority - b.contentType.priority);
        }

        return groups;
    }, [schema, resources]);
}

const GROUP_ORDER = ['content', 'references'];

function useAdminResources() {
    const { schema } = usePsychedSchemaContext();
    const resources = useResourceDefinitions();
    const { permissions } = usePermissions();
    const isAdmin = Array.isArray(permissions) && permissions.includes('ROLE_ADMIN');

    return useMemo(() => {
        if (!isAdmin) return [];
        return Object.entries(resources)
            .filter(([slug]) => {
                const schemaRes = schema?.resources.get(slug);
                return !schemaRes?.contentType;
            })
            .filter(([, def]) => def.options?.adminOnly)
            .map(([slug, def]) => ({
                slug,
                label: def.options?.label ?? slug,
                icon: def.icon,
            }));
    }, [resources, schema, isAdmin]);
}

function PsychedMenu() {
    const allAdminPages = getAdminPages();
    const mainPages = getMainPages();
    const toolPages = getToolPages();
    const adminResources = useAdminResources();
    const translate = useTranslate();
    const grouped = useGroupedResources();
    const hasDashboard = !!getDashboard();

    const adminPageMap = new Map<string, typeof allAdminPages[0]>();
    for (const page of allAdminPages) {
        adminPageMap.set(page.path, page);
    }
    const adminPages = Array.from(adminPageMap.values());

    const hasAdmin = adminPages.length > 0 || adminResources.length > 0;

    const sortedGroupNames = useMemo(() => {
        const names = Array.from(grouped.keys());
        return names.sort((a, b) => {
            const ai = GROUP_ORDER.indexOf(a);
            const bi = GROUP_ORDER.indexOf(b);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [grouped]);

    return (
        <>
            {hasDashboard && (
                <List dense disablePadding>
                    <MenuItemLink
                        to="/"
                        primaryText={translate('psyched.menu.dashboard', { _: 'Dashboard' })}
                        leftIcon={<DashboardIcon />}
                    />
                    {mainPages.map((page) => (
                        <MenuItemLink
                            key={page.path}
                            to={`/main/${page.path}`}
                            primaryText={translate(page.menuLabel, { _: page.menuLabel })}
                            leftIcon={page.menuIcon ? createElement(page.menuIcon) : undefined}
                        />
                    ))}
                </List>
            )}
            {sortedGroupNames.map((groupName, idx) => {
                const entries = grouped.get(groupName)!;
                return (
                    <Box key={groupName}>
                        {idx > 0 && <Divider />}
                        <SectionHeader label={groupName} />
                        <List dense disablePadding>
                            {entries.map((entry) => (
                                <MenuItemLink
                                    key={entry.slug}
                                    to={`/${entry.slug}`}
                                    primaryText={translate(`resources.${entry.slug}.name`, { _: entry.label })}
                                    leftIcon={resolveIcon(entry.contentType.icon)}
                                />
                            ))}
                        </List>
                    </Box>
                );
            })}

            {toolPages.length > 0 && (
                <>
                    <Divider />
                    <SectionHeader label="tools" />
                    <List dense disablePadding>
                        {toolPages.map((page) => (
                            <MenuItemLink
                                key={page.path}
                                to={`/tools/${page.path}`}
                                primaryText={translate(`psyched.menu.${page.menuLabel.toLowerCase()}`, { _: page.menuLabel })}
                                leftIcon={page.menuIcon ? createElement(page.menuIcon) : undefined}
                            />
                        ))}
                    </List>
                </>
            )}

            {hasAdmin && (
                <>
                    <Divider />
                    <SectionHeader label="Admin" />
                    <List dense disablePadding>
                        {adminResources.map((res) => (
                            <MenuItemLink
                                key={res.slug}
                                to={`/${res.slug}`}
                                primaryText={translate(`resources.${res.slug}.name`, { _: res.label })}
                                leftIcon={res.icon ? createElement(res.icon) : undefined}
                            />
                        ))}
                        {adminPages.map((page) => (
                            <MenuItemLink
                                key={page.path}
                                to={`/admin/${page.path}`}
                                primaryText={translate(page.menuLabel, { _: page.menuLabel })}
                                leftIcon={page.menuIcon ? createElement(page.menuIcon) : undefined}
                            />
                        ))}
                    </List>
                </>
            )}
        </>
    );
}

export interface PsychedLayoutProps {
    appName?: string;
    [key: string]: unknown;
}

export const PsychedLayout = ({ appName, ...props }: PsychedLayoutProps) => (
    <LayoutConfigContext.Provider value={{ appName }}>
        <BreadcrumbProvider>
            <Layout
                {...props}
                appBar={PsychedAppBar}
                menu={PsychedMenu}
                sx={{
                    // Sidebar
                    '& .RaSidebar-fixed': {
                        bgcolor: 'background.paper',
                        width: (theme) => theme.sidebar?.width ?? 240,
                        borderRight: 1,
                        borderColor: 'divider',
                    },
                    '& .RaSidebar-docked .MuiDrawer-paper': {
                        bgcolor: 'transparent',
                        borderRight: 'none',
                    },
                    // Content area: no extra padding, pages own their padding
                    '& .RaLayout-content': {
                        overflow: 'hidden',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 'calc(100vh - 48px)',
                    },
                }}
            >
                <BreadcrumbBar />
                <Box sx={{
                    flex: 1,
                    overflow: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                }}>
                    <Box sx={{
                        width: '100%',
                        maxWidth: CONTENT_MAX_WIDTH,
                        px: 3,
                        pt: 3,
                        pb: 4,
                    }}>
                        {props.children}
                    </Box>
                </Box>
            </Layout>
        </BreadcrumbProvider>
    </LayoutConfigContext.Provider>
);
