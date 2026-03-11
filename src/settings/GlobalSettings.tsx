import { useState, useEffect } from 'react';
import { useNotify, useTranslate } from 'react-admin';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import WebIcon from '@mui/icons-material/Web';
import SaveIcon from '@mui/icons-material/Save';

import { useLocaleSettings } from '../hooks/useLocaleSettings.ts';
import { useSettings } from '../hooks/useSettings.ts';

const entrypoint = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function saveDefaultLocale(defaultLocale: string): Promise<void> {
  const response = await fetch(`${entrypoint}/locale-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ defaultLocale }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Save failed' }));
    throw new Error(error.error ?? 'Save failed');
  }
}

async function saveSettings(data: { app_name: string }): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${entrypoint}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Save failed' }));
    throw new Error(error.error ?? 'Save failed');
  }
}

/**
 * Global Settings page — manage the default locale and site identity.
 */
export function GlobalSettings() {
  const { defaultLocale, supportedLocales, reload: reloadLocale } = useLocaleSettings();
  const { app_name, reload: reloadSettings } = useSettings();
  const notify = useNotify();
  const translate = useTranslate();

  const [selectedDefault, setSelectedDefault] = useState(defaultLocale);
  const [savingLocale, setSavingLocale] = useState(false);

  const [appName, setAppName] = useState(app_name ?? '');
  const [savingSite, setSavingSite] = useState(false);

  useEffect(() => {
    setSelectedDefault(defaultLocale);
  }, [defaultLocale]);

  useEffect(() => {
    setAppName(app_name ?? '');
  }, [app_name]);

  const localeChanged = selectedDefault !== defaultLocale;
  const siteChanged = appName !== (app_name ?? '');

  const handleSaveLocale = async () => {
    setSavingLocale(true);
    try {
      await saveDefaultLocale(selectedDefault);
      reloadLocale();
      notify('psyched.settings.locale_saved', { type: 'success', messageArgs: { _: 'Default locale saved' } });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save', { type: 'error' });
    } finally {
      setSavingLocale(false);
    }
  };

  const handleSaveSite = async () => {
    setSavingSite(true);
    try {
      await saveSettings({ app_name: appName });
      reloadSettings();
      notify('psyched.settings.settings_saved', { type: 'success', messageArgs: { _: 'Settings saved' } });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save', { type: 'error' });
    } finally {
      setSavingSite(false);
    }
  };

  const defaultLanguageLabel = translate('psyched.settings.default_language', { _: 'Default Language' });

  return (
    <Box sx={{ maxWidth: 800, mt: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        {translate('psyched.settings.global_settings_title', { _: 'Global Settings' })}
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <WebIcon />
            <Typography variant="h6">
              {translate('psyched.settings.site_section', { _: 'Site Identity' })}
            </Typography>
          </Box>

          <TextField
            label={translate('psyched.settings.app_name', { _: 'Site Name' })}
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            sx={{ maxWidth: 400, mb: 3 }}
          />

          <Box>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveSite}
              disabled={!siteChanged || savingSite}
            >
              {savingSite
                ? translate('psyched.settings.saving', { _: 'Saving...' })
                : translate('psyched.settings.save', { _: 'Save' })}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <LanguageIcon />
            <Typography variant="h6">
              {translate('psyched.settings.language_section', { _: 'Language' })}
            </Typography>
          </Box>

          <FormControl sx={{ minWidth: 200, mb: 3 }}>
            <InputLabel>{defaultLanguageLabel}</InputLabel>
            <Select
              value={selectedDefault}
              label={defaultLanguageLabel}
              onChange={(e) => setSelectedDefault(e.target.value)}
            >
              {supportedLocales.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveLocale}
              disabled={!localeChanged || savingLocale}
            >
              {savingLocale
                ? translate('psyched.settings.saving', { _: 'Saving...' })
                : translate('psyched.settings.save', { _: 'Save' })}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
