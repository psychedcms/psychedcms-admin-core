import { Layout, AppBar, Menu, MenuItemLink, useSidebarState } from 'react-admin';
import { Box, List, ListItem, ListItemText, ListItemIcon, Collapse, Divider, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useState, createElement, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslate } from 'react-admin';
import { AppBarSlot } from '../slots/AppBarSlot.tsx';
import { getAdminPages, getSettingsPages } from '../registry.ts';

interface LayoutConfig {
    appName?: string;
    appBaseline?: string;
}

const LayoutConfigContext = createContext<LayoutConfig>({});

const PsychedAppBar = () => {
    const { appName, appBaseline } = useContext(LayoutConfigContext);
    return (
        <AppBar>
            {appName && (
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mr: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {appName}
                    </Typography>
                    {appBaseline && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                            {appBaseline}
                        </Typography>
                    )}
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

function PsychedMenu() {
    const adminPages = getAdminPages();
    const settingsPages = getSettingsPages();
    const hasAdmin = adminPages.length > 0 || settingsPages.length > 0;

    return (
        <>
            {/* Content section: resources */}
            <SectionHeader label="Content" />
            <Menu />

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
    appBaseline?: string;
    [key: string]: unknown;
}

export const PsychedLayout = ({ appName, appBaseline, ...props }: PsychedLayoutProps) => (
    <LayoutConfigContext.Provider value={{ appName, appBaseline }}>
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
