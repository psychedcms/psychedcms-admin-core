import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import {
  useRecordContext,
  SelectInput,
  SaveButton,
  DeleteButton,
  useResourceContext,
  useTranslate,
  useLocaleState,
} from 'react-admin';
import { useController } from 'react-hook-form';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { parseISO, isValid, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import type { Locale as DateFnsLocale } from 'date-fns';
import { WorkflowButton } from './WorkflowButton.tsx';
import { InputGuesser } from './InputGuesser.tsx';
import { SidebarSlot } from '../slots/SidebarSlot.tsx';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';

function useStatusChoices() {
  const translate = useTranslate();
  return [
    { id: 'draft', name: translate('psyched.status.draft', { _: 'Draft' }) },
    { id: 'review', name: translate('psyched.status.review', { _: 'In Review' }) },
    { id: 'scheduled', name: translate('psyched.status.scheduled', { _: 'Scheduled' }) },
    { id: 'published', name: translate('psyched.status.published', { _: 'Published' }) },
    { id: 'archived', name: translate('psyched.status.archived', { _: 'Archived' }) },
  ];
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  draft: 'default',
  review: 'info',
  scheduled: 'warning',
  published: 'success',
  archived: 'error',
};

const dateFnsLocales: Record<string, DateFnsLocale> = { fr };

const clockRenderers = {
  hours: renderTimeViewClock,
  minutes: renderTimeViewClock,
  seconds: renderTimeViewClock,
};

function FormDateTimePicker({ source, label }: { source: string; label: string }) {
  const { field } = useController({ name: source });
  const value = field.value
    ? (typeof field.value === 'string' ? parseISO(field.value) : field.value)
    : null;

  return (
    <DateTimePicker
      label={label}
      value={isValid(value) ? value : null}
      onChange={(v) => field.onChange(v && isValid(v) ? (v as Date).toISOString() : null)}
      viewRenderers={clockRenderers}
      ampm={false}
      slotProps={{
        textField: { size: 'small', fullWidth: true, helperText: ' ' },
        field: { clearable: true, onClear: () => field.onChange(null) },
      }}
    />
  );
}

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

interface EditSidebarProps {
  resource?: string;
}

const HARDCODED_SIDEBAR_FIELDS = new Set(['status', 'publishedAt', 'depublishedAt']);

/**
 * Sidebar for edit forms with save button, workflow actions, and publication options.
 */
export function EditSidebar({ resource: resourceProp }: EditSidebarProps) {
  const record = useRecordContext();
  const resourceFromContext = useResourceContext();
  const resource = resourceProp ?? resourceFromContext;
  const translate = useTranslate();
  const [uiLocale] = useLocaleState();
  const statusChoices = useStatusChoices();
  const resourceSchema = usePsychedSchema(resource ?? '');

  const sidebarFields = resourceSchema?.fields
    ? [...resourceSchema.fields.entries()].filter(
        ([source, meta]) => meta.group === 'sidebar' && !HARDCODED_SIDEBAR_FIELDS.has(source),
      )
    : [];

  if (!record) {
    return null;
  }

  const status = record.status as string | undefined;

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
            <WorkflowButton resource={resource} />
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

          {record.updatedAt && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              {translate('psyched.metadata.modified', { _: 'Modified:' })} {formatDateWithRelative(record.updatedAt as string, uiLocale)}
            </Typography>
          )}

          <Divider sx={{ my: 1 }} />

          <Box sx={{ mt: 1 }}>
            <DeleteButton />
          </Box>
        </CardContent>
      </Card>

      {/* Plugin sidebar widgets (e.g. LocaleSwitcher) */}
      <SidebarSlot resource={resource} />

      {/* Options */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SettingsIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold">
              {translate('psyched.sidebar.options', { _: 'Options' })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <SelectInput
              source="status"
              choices={statusChoices}
              label={translate('psyched.fields.status', { _: 'Status' })}
              fullWidth
              helperText={false}
              size="small"
            />

            <FormDateTimePicker
              source="publishedAt"
              label={translate('psyched.fields.published_at', { _: 'Published at' })}
            />

            <FormDateTimePicker
              source="depublishedAt"
              label={translate('psyched.fields.depublished_at', { _: 'Depublished at' })}
            />

            {sidebarFields.map(([source]) => (
              <InputGuesser key={source} source={source} resource={resource ?? ''} />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Metadata */}
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
    </Box>
  );
}
