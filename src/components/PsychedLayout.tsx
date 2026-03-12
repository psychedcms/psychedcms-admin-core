import { Layout, AppBar, MenuItemLink, useSidebarState, useResourceDefinitions, useTranslate } from 'react-admin';
import { Box, List, ListItem, ListItemText, ListItemIcon, Collapse, Divider, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useState, useMemo, createElement, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AppBarSlot } from '../slots/AppBarSlot.tsx';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import { getAdminPages, getSettingsPages } from '../registry.ts';
import type { ContentTypeMetadata } from '../types/psychedcms.ts';

interface LayoutConfig {
    appName?: string;
}

const LayoutConfigContext = createContext<LayoutConfig>({});

const PsychedToolbar = () => null;

const PsychedAppBar = () => {
    const { appName } = useContext(LayoutConfigContext);
    return (
        <AppBar toolbar={<PsychedToolbar />}>
            {appName && (
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mr: 1 }}>
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

function SettingsSubmenu() {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [sidebarOpen] = useSidebarState();
    const location = useLocation();
    const translate = useTranslate();
    const allPages = getSettingsPages();
    const isOnSettings = location.pathname.startsWith('/settings');

    // Deduplicate by path -- last registered wins (e.g. translatable overrides core)
    const pageMap = new Map<string, typeof allPages[0]>();
    for (const page of allPages) {
        pageMap.set(page.path, page);
    }
    const pages = Array.from(pageMap.values());

    if (pages.length === 0) return null;

    return (
        <>
            <ListItem
                component="div"
                onClick={() => setSettingsOpen(!settingsOpen)}
                sx={{ cursor: 'pointer', minHeight: 36, px: 2 }}
            >
                <ListItemIcon sx={{ minWidth: sidebarOpen ? 32 : 'auto', color: 'text.secondary' }}>
                    <SettingsIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                {sidebarOpen && (
                    <>
                        <ListItemText
                            primary={translate('psyched.menu.settings', { _: 'Settings' })}
                            primaryTypographyProps={{
                                fontSize: '0.8125rem',
                                fontWeight: isOnSettings ? 600 : 400,
                            }}
                        />
                        {settingsOpen || isOnSettings ? <ExpandLess /> : <ExpandMore />}
                    </>
                )}
            </ListItem>
            {sidebarOpen && (
                <Collapse in={settingsOpen || isOnSettings} timeout="auto" unmountOnExit>
                    {pages.map((page) => (
                        <MenuItemLink
                            key={page.path}
                            to={`/settings/${page.path}`}
                            primaryText={translate(`psyched.settings.${page.path}`, { _: page.menuLabel })}
                            leftIcon={page.menuIcon ? createElement(page.menuIcon) : undefined}
                            sx={{ pl: 4 }}
                        />
                    ))}
                </Collapse>
            )}
        </>
    );
}

interface ResourceEntry {
    slug: string;
    label: string;
    contentType: ContentTypeMetadata;
}

/**
 * Group resources by their ContentType group, sorted by priority within each group.
 * Ungrouped resources (group === null) are collected under a default "content" group.
 */
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

        // Sort each group by priority
        for (const entries of groups.values()) {
            entries.sort((a, b) => a.contentType.priority - b.contentType.priority);
        }

        return groups;
    }, [schema, resources]);
}

/** Desired group display order. Groups not listed here appear at the end. */
const GROUP_ORDER = ['content', 'references'];

function PsychedMenu() {
    const adminPages = getAdminPages();
    const settingsPages = getSettingsPages();
    const hasAdmin = adminPages.length > 0 || settingsPages.length > 0;
    const translate = useTranslate();
    const grouped = useGroupedResources();

    // Sort groups: known order first, then alphabetical for the rest
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
            {/* Resource groups */}
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
                                />
                            ))}
                        </List>
                    </Box>
                );
            })}

            {/* Admin section: admin pages + settings */}
            {hasAdmin && (
                <>
                    <Divider />
                    <SectionHeader label="Admin" />
                    <List dense disablePadding>
                        {adminPages.map((page) => (
                            <MenuItemLink
                                key={page.path}
                                to={`/admin/${page.path}`}
                                primaryText={`psyched.menu.${page.menuLabel.toLowerCase()}`}
                                leftIcon={page.menuIcon ? createElement(page.menuIcon) : undefined}
                            />
                        ))}
                        <SettingsSubmenu />
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
        <Layout
            {...props}
            appBar={PsychedAppBar}
            menu={PsychedMenu}
            sx={{
                '& .RaSidebar-fixed': {
                    bgcolor: 'background.paper',
                },
            }}
        />
    </LayoutConfigContext.Provider>
);
