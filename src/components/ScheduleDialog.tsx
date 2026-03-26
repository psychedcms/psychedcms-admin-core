import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useTranslate } from 'react-admin';
import { StaticDateTimePicker } from '@mui/x-date-pickers/StaticDateTimePicker';
import { addHours, setMinutes, setSeconds, isBefore, formatISO } from 'date-fns';

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (scheduledAt: string) => void;
  loading?: boolean;
}

export function ScheduleDialog({ open, onClose, onConfirm, loading }: ScheduleDialogProps) {
  const defaultDateTime = useMemo(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    return setSeconds(setMinutes(addHours(now, 1), roundedMinutes), 0);
  }, []);

  const translate = useTranslate();
  const [scheduledAt, setScheduledAt] = useState<Date>(defaultDateTime);
  const [error, setError] = useState<string | null>(null);

  const minDateTime = useMemo(() => new Date(), []);

  const handleConfirm = () => {
    if (isBefore(scheduledAt, new Date())) {
      setError(translate('psyched.schedule_dialog.error_future', { _: 'Scheduled date must be in the future' }));
      return;
    }
    setError(null);
    onConfirm(formatISO(scheduledAt));
  };

  const handleClose = () => {
    setError(null);
    setScheduledAt(defaultDateTime);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScheduleIcon color="warning" />
        {translate('psyched.schedule_dialog.title', { _: 'Schedule Publication' })}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <StaticDateTimePicker
          value={scheduledAt}
          onChange={(newValue) => {
            if (newValue) {
              setScheduledAt(newValue);
              setError(null);
            }
          }}
          minDateTime={minDateTime}
          ampm={false}
          slotProps={{
            actionBar: { actions: [] },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {translate('psyched.schedule_dialog.cancel', { _: 'Cancel' })}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={loading || !scheduledAt}
        >
          {loading
            ? translate('psyched.schedule_dialog.scheduling', { _: 'Scheduling...' })
            : translate('psyched.schedule_dialog.confirm', { _: 'Schedule' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
