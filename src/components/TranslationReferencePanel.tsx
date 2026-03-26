import { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { useTranslationReference } from '../hooks/useTranslationReference.ts';
import { useLocaleSettings } from '../hooks/useLocaleSettings.ts';

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
 */
export function TranslationReferencePanel({ source }: TranslationReferencePanelProps) {
  const { getReferenceValue, isNonDefaultLocale } = useTranslationReference();
  const { defaultLocale } = useLocaleSettings();
  const [expanded, setExpanded] = useState(false);

  if (!isNonDefaultLocale) return null;

  const referenceContent = getReferenceValue(source);
  if (!referenceContent) return null;

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
        <IconButton size="small">
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
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
