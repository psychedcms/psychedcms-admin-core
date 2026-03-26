import { forwardRef } from 'react';
import { UserMenu, Logout, useTranslate } from 'react-admin';
import { MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

const ProfileMenuItem = forwardRef<HTMLLIElement>((props, ref) => {
  const translate = useTranslate();
  const navigate = useNavigate();

  return (
    <MenuItem
      ref={ref}
      {...props}
      onClick={() => navigate('/profile')}
    >
      <ListItemIcon>
        <PersonIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        {translate('psyched.user_menu.profile', { _: 'Profile' })}
      </ListItemText>
    </MenuItem>
  );
});

ProfileMenuItem.displayName = 'ProfileMenuItem';

export function PsychedUserMenu() {
  return (
    <UserMenu>
      <ProfileMenuItem />
      <Divider />
      <Logout />
    </UserMenu>
  );
}
