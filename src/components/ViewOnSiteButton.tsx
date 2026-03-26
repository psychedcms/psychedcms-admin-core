import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button } from '@mui/material';
import {
  useRecordContext,
  useLocaleState,
  useTranslate,
} from 'react-admin';

const FRONTEND_URL = (import.meta as any).env?.VITE_FRONTEND_URL || 'http://hilo.local';

/**
 * Button that opens the current content on the public frontend site.
 * Uses the canonical_url field returned by the API (per-locale object).
 * Only renders when the record has a canonical_url.
 */
export function ViewOnSiteButton() {
  const record = useRecordContext();
  const translate = useTranslate();
  const [uiLocale] = useLocaleState();

  if (!record) return null;

  const canonicalUrl = record.canonical_url as Record<string, string> | undefined;
  if (!canonicalUrl || typeof canonicalUrl !== 'object') return null;

  const path = canonicalUrl[uiLocale] ?? Object.values(canonicalUrl)[0];
  if (!path) return null;

  const href = `${FRONTEND_URL}${path}`;

  return (
    <Button
      variant="outlined"
      size="small"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      startIcon={<OpenInNewIcon />}
    >
      {translate('psyched.sidebar.view_on_site', { _: 'View on site' })}
    </Button>
  );
}
