import { registerPlugin } from './registry.ts';
import { GlobalSettings } from './settings/GlobalSettings.tsx';
import { PreferencesSettings } from './settings/PreferencesSettings.tsx';
import PublicIcon from '@mui/icons-material/Public';
import TuneIcon from '@mui/icons-material/Tune';

// Register core default settings pages
registerPlugin({
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
