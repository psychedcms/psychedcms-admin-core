import { registerPlugin } from './registry.ts';
import { GlobalSettings } from './settings/GlobalSettings.tsx';
import SettingsIcon from '@mui/icons-material/Settings';
import { frMessages } from './i18n/fr.ts';
import { enMessages } from './i18n/en.ts';

// Register core defaults: admin pages + i18n messages
registerPlugin({
  i18nMessages: { fr: frMessages, en: enMessages },
  adminPages: [
    {
      path: 'global-settings',
      component: GlobalSettings,
      menuLabel: 'psyched.menu.global_settings',
      menuIcon: SettingsIcon,
      permission: 'settings:manage',
    },
  ],
});
