import { useState, useRef } from 'react';
import {
  Button,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useRecordContext, useResourceContext, useRefresh, useTranslate } from 'react-admin';
import { useWorkflowState, getTransitionMeta } from '../hooks/useWorkflowState.ts';
import { ScheduleDialog } from './ScheduleDialog.tsx';

interface WorkflowButtonProps {
  resource?: string;
}

export function WorkflowButton({ resource: resourceProp }: WorkflowButtonProps) {
  const record = useRecordContext();
  const resourceFromContext = useResourceContext();
  const resource = resourceProp ?? resourceFromContext;
  const refresh = useRefresh();
  const translate = useTranslate();

  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<string | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const {
    loading,
    workflowState,
    primaryTransition,
    secondaryTransitions,
    applyTransition,
  } = useWorkflowState(resource, record?.id);

  if (!workflowState || !primaryTransition) {
    return null;
  }

  const primaryMeta = getTransitionMeta(primaryTransition);
  const hasSecondary = secondaryTransitions.length > 0;

  const handleTransitionClick = (transition: string) => {
    if (transition === 'schedule') {
      setPendingTransition(transition);
      setScheduleDialogOpen(true);
      setOpen(false);
    } else {
      executeTransition(transition);
    }
  };

  const executeTransition = async (transition: string, data?: Record<string, unknown>) => {
    setApplying(true);
    try {
      await applyTransition(transition, data);
      refresh();
    } finally {
      setApplying(false);
    }
  };

  const handlePrimaryClick = () => {
    handleTransitionClick(primaryTransition);
  };

  const handleSecondaryClick = (transition: string) => {
    setOpen(false);
    handleTransitionClick(transition);
  };

  const handleScheduleConfirm = async (scheduledAt: string) => {
    if (pendingTransition) {
      await executeTransition(pendingTransition, { scheduledAt });
      setScheduleDialogOpen(false);
      setPendingTransition(null);
    }
  };

  const handleScheduleDialogClose = () => {
    setScheduleDialogOpen(false);
    setPendingTransition(null);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (anchorRef.current?.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  const isDisabled = loading || applying;

  if (!hasSecondary) {
    return (
      <>
        <Button
          variant="contained"
          color={primaryMeta.color}
          onClick={handlePrimaryClick}
          disabled={isDisabled}
          startIcon={applying ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {translate(primaryMeta.label)}
        </Button>
        <ScheduleDialog
          open={scheduleDialogOpen}
          onClose={handleScheduleDialogClose}
          onConfirm={handleScheduleConfirm}
          loading={applying}
        />
      </>
    );
  }

  return (
    <>
      <ButtonGroup
        variant="contained"
        color={primaryMeta.color}
        ref={anchorRef}
        disabled={isDisabled}
      >
        <Button
          onClick={handlePrimaryClick}
          startIcon={applying ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {translate(primaryMeta.label)}
        </Button>
        <Button
          size="small"
          onClick={handleToggle}
          aria-controls={open ? 'workflow-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="menu"
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{ zIndex: 1300 }}
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
        placement="bottom-end"
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper elevation={8}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="workflow-menu" autoFocusItem>
                  {secondaryTransitions.map((transition) => {
                    const meta = getTransitionMeta(transition);
                    return (
                      <MenuItem
                        key={transition}
                        onClick={() => handleSecondaryClick(transition)}
                      >
                        <ListItemText>{translate(meta.label)}</ListItemText>
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      <ScheduleDialog
        open={scheduleDialogOpen}
        onClose={handleScheduleDialogClose}
        onConfirm={handleScheduleConfirm}
        loading={applying}
      />
    </>
  );
}
