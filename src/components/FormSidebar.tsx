import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import {
  useRecordContext,
  SaveButton,
  DeleteButton,
  useResourceContext,
  useTranslate,
  useLocaleState,
} from 'react-admin';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { enUS } from 'date-fns/locale/en-US';
import type { Locale as DateFnsLocale } from 'date-fns';
import { WorkflowButton } from './WorkflowButton.tsx';
import { ViewOnSiteButton } from './ViewOnSiteButton.tsx';
import { InputGuesser } from './InputGuesser.tsx';
import { SidebarSlot } from '../slots/SidebarSlot.tsx';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  draft: 'default',
  review: 'info',
  scheduled: 'warning',
  published: 'success',
  archived: 'error',
};

const dateFnsLocales: Record<string, DateFnsLocale> = { fr, en: enUS };

function formatDateWithRelative(date: string | Date | undefined, uiLocale: string): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatted = d.toLocaleDateString(uiLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const relative = formatDistanceToNow(d, { addSuffix: true, locale: dateFnsLocales[uiLocale] });
  return `${formatted} (${relative})`;
}

interface FormSidebarProps {
  resource?: string;
}

const SIDEBAR_GROUPS = new Set(['sidebar', 'relations', 'taxonomies']);

/**
 * Sidebar for content forms (create & edit) with save button, workflow actions,
 * relations, taxonomies, and options. Edit-only elements (workflow, delete, metadata)
 * are conditionally rendered when a record exists.
 */
export function FormSidebar({ resource: resourceProp }: FormSidebarProps) {
  const record = useRecordContext();
  const resourceFromContext = useResourceContext();
  const resource = resourceProp ?? resourceFromContext;
  const translate = useTranslate();
  const [uiLocale] = useLocaleState();
  const resourceSchema = usePsychedSchema(resource ?? '');

  const sidebarFields = resourceSchema?.fields
    ? [...resourceSchema.fields.entries()].filter(
        ([, meta]) => meta.group === 'sidebar',
      )
    : [];

  const relationFields = resourceSchema?.fields
    ? [...resourceSchema.fields.entries()].filter(
        ([, meta]) => meta.group === 'relations' && meta.display !== 'table',
      )
    : [];

  const taxonomyFields = resourceSchema?.fields
    ? [...resourceSchema.fields.entries()].filter(
        ([, meta]) => meta.group === 'taxonomies',
      )
    : [];

  const status = record?.status as string | undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Primary Actions */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StarIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight="bold">
              {translate('psyched.sidebar.primary_actions', { _: 'Primary Actions' })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <SaveButton />
            {record && <ViewOnSiteButton />}
            {record && <WorkflowButton resource={resource} />}
          </Box>

          {status && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {translate('psyched.sidebar.current_status', { _: 'Current status:' })}
              </Typography>
              <Chip
                label={translate(`psyched.status.${status}`, { _: status.charAt(0).toUpperCase() + status.slice(1) })}
                color={statusColors[status] ?? 'default'}
                size="small"
              />
            </Box>
          )}

          {record?.updatedAt && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              {translate('psyched.metadata.modified', { _: 'Modified:' })} {formatDateWithRelative(record.updatedAt as string, uiLocale)}
            </Typography>
          )}

          {record && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ mt: 1 }}>
                <DeleteButton />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Plugin sidebar widgets (e.g. LocaleSwitcher) */}
      <SidebarSlot resource={resource} />

      {/* Relations */}
      {relationFields.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LinkIcon fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">
                {translate('psyched.sidebar.relations', { _: 'Relations' })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {relationFields.map(([source]) => (
                <InputGuesser key={source} source={source} resource={resource ?? ''} />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Taxonomies */}
      {taxonomyFields.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
              {translate('psyched.sidebar.taxonomies', { _: 'Taxonomies' })}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {taxonomyFields.map(([source]) => (
                <InputGuesser key={source} source={source} resource={resource ?? ''} />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Custom sidebar fields */}
      {sidebarFields.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SettingsIcon fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">
                {translate('psyched.sidebar.options', { _: 'Options' })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sidebarFields.map(([source]) => (
                <InputGuesser key={source} source={source} resource={resource ?? ''} />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Metadata (edit mode only) */}
      {record && (
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {record.createdAt && (
                <Typography variant="caption" color="text.secondary">
                  <strong>{translate('psyched.metadata.created', { _: 'Created:' })}</strong> {formatDateWithRelative(record.createdAt as string, uiLocale)}
                </Typography>
              )}
              {record.updatedAt && (
                <Typography variant="caption" color="text.secondary">
                  <strong>{translate('psyched.metadata.modified', { _: 'Modified:' })}</strong> {formatDateWithRelative(record.updatedAt as string, uiLocale)}
                </Typography>
              )}
              {record.id && (
                <Typography variant="caption" color="text.secondary">
                  <strong>{translate('psyched.metadata.id', { _: 'ID:' })}</strong> {String(record.id)}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
