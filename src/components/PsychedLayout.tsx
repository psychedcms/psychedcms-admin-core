import { Layout, AppBar, Menu } from 'react-admin';
import { Box, List, ListItem, ListItemText, ListItemButton, ListItemIcon, Collapse, Divider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslate } from 'react-admin';
import { AppBarSlot } from '../slots/AppBarSlot.tsx';
import { getSettingsPages } from '../registry.ts';

const PsychedAppBar = () => (
    <AppBar>
        <Box flex={1} />
        <AppBarSlot />
    </AppBar>
);

/**
 * Renders settings menu items, deduplicating by path.
 * Multiple plugins may register the same settings paths
 * (e.g. global, preferences) -- the last registration wins.
 */
function DeduplicatedSettingsMenu() {
    const location = useLocation();
    const translate = useTranslate();
    const allPages = getSettingsPages();

    // Deduplicate by path -- last registered wins (e.g. translatable overrides core)
    const pageMap = new Map<string, typeof allPages[0]>();
    for (const page of allPages) {
        pageMap.set(page.path, page);
    }

    return (
        <>
            {Array.from(pageMap.values()).map((page) => {
                const path = `/settings/${page.path}`;
                const active = location.pathname === path;
                const Icon = page.menuIcon;

                return (
                    <ListItemButton
                        key={page.path}
                        component={Link}
                        to={path}
                        sx={{
                            pl: 4,
                            minHeight: 36,
                            color: active ? 'primary.main' : 'text.primary',
                            bgcolor: active ? 'action.selected' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                    >
                        {Icon && (
                            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                                <Icon />
                            </ListItemIcon>
                        )}
                        <ListItemText
                            primary={translate(`psyched.settings.${page.path}`, { _: page.menuLabel })}
                            primaryTypographyProps={{ fontSize: '0.8125rem' }}
                        />
                    </ListItemButton>
                );
            })}
        </>
    );
}

function PsychedMenu() {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const location = useLocation();
    const settingsPages = getSettingsPages();
    const hasSettings = settingsPages.length > 0;
    const isOnSettings = location.pathname.startsWith('/settings');

    return (
        <>
            {/* Default React Admin menu renders all registered resources */}
            <Menu />
            {hasSettings && (
                <>
                    <Divider />
                    <List dense>
                        <ListItem
                            component="div"
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            sx={{ cursor: 'pointer' }}
                        >
                            <SettingsIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                            <ListItemText
                                primary="Settings"
                                primaryTypographyProps={{
                                    fontSize: '0.875rem',
                                    fontWeight: isOnSettings ? 600 : 400,
                                }}
                            />
                            {settingsOpen ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={settingsOpen || isOnSettings} timeout="auto" unmountOnExit>
                            <DeduplicatedSettingsMenu />
                        </Collapse>
                    </List>
                </>
            )}
        </>
    );
}

export const PsychedLayout = (props: any) => (
    <Layout {...props} appBar={PsychedAppBar} menu={PsychedMenu} />
);
