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
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import SaveIcon from '@mui/icons-material/Save';

import { useLocaleSettings } from '../hooks/useLocaleSettings.ts';

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

/**
 * Global Settings page — manage the default locale.
 * Supported locales are configured via APP_LOCALES env var.
 * Default locale is stored in the database and editable via dropdown.
 */
export function GlobalSettings() {
  const { defaultLocale, supportedLocales, reload } = useLocaleSettings();
  const notify = useNotify();
  const translate = useTranslate();

  const [selectedDefault, setSelectedDefault] = useState(defaultLocale);
  const [saving, setSaving] = useState(false);

  // Sync local state when the API value loads or changes
  useEffect(() => {
    setSelectedDefault(defaultLocale);
  }, [defaultLocale]);

  const hasChanges = selectedDefault !== defaultLocale;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDefaultLocale(selectedDefault);
      reload();
      notify('Default locale saved', { type: 'success' });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save', { type: 'error' });
    } finally {
      setSaving(false);
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
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving
                ? translate('psyched.settings.saving', { _: 'Saving...' })
                : translate('psyched.settings.save', { _: 'Save' })}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
