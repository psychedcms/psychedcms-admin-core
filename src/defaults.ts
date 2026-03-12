import { registerPlugin } from './registry.ts';
import { GlobalSettings } from './settings/GlobalSettings.tsx';
import { PreferencesSettings } from './settings/PreferencesSettings.tsx';
import PublicIcon from '@mui/icons-material/Public';
import TuneIcon from '@mui/icons-material/Tune';
import { frMessages } from './i18n/fr.ts';
import { enMessages } from './i18n/en.ts';

// Register core defaults: settings pages + i18n messages
registerPlugin({
  i18nMessages: { fr: frMessages, en: enMessages },
  settingsPages: [
    {
      path: 'global',
      component: GlobalSettings,
      menuLabel: 'Global',
      menuIcon: PublicIcon,
      menuSection: 'global',
    },
    {
      path: 'preferences',
      component: PreferencesSettings,
      menuLabel: 'Preferences',
      menuIcon: TuneIcon,
      menuSection: 'global',
    },
  ],
});
