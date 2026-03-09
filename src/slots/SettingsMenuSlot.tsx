import { useLocation, Link } from 'react-router-dom';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

import { getSettingsPages } from '../registry.ts';

export function SettingsMenuSlot() {
  const location = useLocation();
  const pages = getSettingsPages();

  return (
    <>
      {pages.map((page) => {
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
              primary={page.menuLabel}
              primaryTypographyProps={{ fontSize: '0.8125rem' }}
            />
          </ListItemButton>
        );
      })}
    </>
  );
}
