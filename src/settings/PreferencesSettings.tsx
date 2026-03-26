import { useState } from 'react';
import { useNotify, useLocaleState, useTranslate } from 'react-admin';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import SaveIcon from '@mui/icons-material/Save';

import { useLocaleSettings } from '../hooks/useLocaleSettings.ts';
import { PageHeader } from '../components/PageHeader.tsx';

/**
 * User Preferences page — allows the user to set their preferred UI language.
 * This only affects admin interface labels, not the content editing locale.
 */
export function PreferencesSettings() {
  const [raLocale, setRaLocale] = useLocaleState();
  const { supportedLocales } = useLocaleSettings();
  const notify = useNotify();
  const translate = useTranslate();
  const [selectedLocale, setSelectedLocale] = useState(raLocale);

  const handleSave = () => {
    setRaLocale(selectedLocale);
    notify('psyched.settings.preferences_saved', { type: 'success', messageArgs: { _: 'Preferences saved' } });
  };

  const hasChanges = selectedLocale !== raLocale;

  return (
    <>
      <PageHeader title={translate('psyched.settings.preferences_title', { _: 'Preferences' })} />

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TranslateIcon />
            <Typography variant="h6">
              {translate('psyched.settings.ui_language', { _: 'Language' })}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {translate('psyched.settings.ui_language_description', {
              _: 'Choose your preferred language for the admin interface. Content editing language is managed separately in each edit form.',
            })}
          </Typography>

          <ToggleButtonGroup
            value={selectedLocale}
            exclusive
            onChange={(_, value) => {
              if (value) setSelectedLocale(value);
            }}
            size="medium"
            sx={{ mb: 3 }}
          >
            {supportedLocales.map((loc) => (
              <ToggleButton
                key={loc}
                value={loc}
                sx={{ textTransform: 'uppercase', px: 3 }}
              >
                {loc}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Box>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges}
            >
              {translate('psyched.settings.save_preferences', { _: 'Save Preferences' })}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
