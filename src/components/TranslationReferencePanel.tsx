import { useState, useCallback, useSyncExternalStore } from 'react';
import { Box, Typography, Collapse, IconButton, CircularProgress, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TranslateIcon from '@mui/icons-material/Translate';
import { useFormContext } from 'react-hook-form';

import { useTranslationReference } from '../hooks/useTranslationReference.ts';
import { useLocaleSettings } from '../hooks/useLocaleSettings.ts';
import { getEditLocale, subscribeEditLocale } from '../providers/EditLocaleStore.ts';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://ai.hilo.local';

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

const FLAG_EMOJI: Record<string, string> = {
  fr: '\u{1F1EB}\u{1F1F7}',
  en: '\u{1F1EC}\u{1F1E7}',
  de: '\u{1F1E9}\u{1F1EA}',
  es: '\u{1F1EA}\u{1F1F8}',
  it: '\u{1F1EE}\u{1F1F9}',
  pt: '\u{1F1F5}\u{1F1F9}',
  nl: '\u{1F1F3}\u{1F1F1}',
  ja: '\u{1F1EF}\u{1F1F5}',
};

interface TranslationReferencePanelProps {
  source: string;
}

/**
 * Collapsible panel that displays the default locale's content for a field.
 * Shown above translatable input fields when editing in a non-default locale.
 * Renders nothing when editing in the default locale or when no reference
 * content is available.
 *
 * Shows a translate button that calls the AI translation endpoint
 * and fills the form field with the translated text.
 */
export function TranslationReferencePanel({ source }: TranslationReferencePanelProps) {
  const { getReferenceValue, isNonDefaultLocale } = useTranslationReference();
  const { defaultLocale } = useLocaleSettings();
  const editLocale = useSyncExternalStore(subscribeEditLocale, getEditLocale);
  const form = useFormContext();
  const [expanded, setExpanded] = useState(false);
  const [translating, setTranslating] = useState(false);

  const referenceContent = getReferenceValue(source);

  const handleTranslate = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!referenceContent || !form) return;

    setTranslating(true);
    try {
      const response = await fetch(`${AI_API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: referenceContent,
          source_locale: defaultLocale,
          target_locale: editLocale,
          context: source,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        form.setValue(source, data.translated, { shouldDirty: true });
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      setTranslating(false);
    }
  }, [referenceContent, defaultLocale, editLocale, source, form]);

  if (!isNonDefaultLocale || !referenceContent) return null;

  const displayContent = stripHtml(referenceContent);
  const truncated = displayContent.length > 500
    ? displayContent.substring(0, 500) + '...'
    : displayContent;

  const flag = FLAG_EMOJI[defaultLocale] ?? '';
  const localeLabel = `${flag} ${defaultLocale.toUpperCase()} version`;

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 0.5,
          cursor: 'pointer',
          bgcolor: 'action.hover',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {localeLabel}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Translate with AI">
            <IconButton
              size="small"
              onClick={handleTranslate}
              disabled={translating}
              color="primary"
            >
              {translating
                ? <CircularProgress size={16} />
                : <TranslateIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
      <Collapse in={expanded}>
        <Box
          sx={{
            px: 2,
            py: 1,
            fontSize: '0.8rem',
            color: 'text.secondary',
            maxHeight: 200,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {truncated}
        </Box>
      </Collapse>
    </Box>
  );
}
