import { useState, useCallback, useMemo } from 'react';
import { useNotify, useRecordContext } from 'react-admin';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import { usePsychedSchema } from './usePsychedSchema.ts';
import type { WorkflowState, TransitionMeta } from '../types/psychedcms.ts';

/**
 * Transition metadata for display and ordering.
 * Priority determines which transition is shown as the primary action.
 */
const TRANSITION_META: Record<string, TransitionMeta & { priority: number }> = {
  publish: {
    name: 'publish',
    label: 'psyched.workflow.publish',
    color: 'primary',
    priority: 10,
  },
  approve: {
    name: 'approve',
    label: 'psyched.workflow.approve',
    color: 'primary',
    priority: 9,
  },
  submit_for_review: {
    name: 'submit_for_review',
    label: 'psyched.workflow.submit_for_review',
    color: 'primary',
    priority: 7,
  },
  schedule: {
    name: 'schedule',
    label: 'psyched.workflow.schedule',
    color: 'warning',
    priority: 6,
  },
  unschedule: {
    name: 'unschedule',
    label: 'psyched.workflow.unschedule',
    color: 'secondary',
    priority: 10,
  },
  request_changes: {
    name: 'request_changes',
    label: 'psyched.workflow.request_changes',
    color: 'warning',
    priority: 5,
  },
  unpublish: {
    name: 'unpublish',
    label: 'psyched.workflow.unpublish',
    color: 'primary',
    priority: 4,
  },
  archive: {
    name: 'archive',
    label: 'psyched.workflow.archive',
    color: 'error',
    priority: 3,
  },
  restore: {
    name: 'restore',
    label: 'psyched.workflow.restore',
    color: 'info',
    priority: 8,
  },
  auto_publish: {
    name: 'auto_publish',
    label: 'psyched.workflow.auto_publish',
    color: 'success',
    priority: 1,
  },
};

export function transitionToEndpoint(transition: string): string {
  return transition.replace(/_/g, '-');
}

function normalizeResourceName(resource: string): string {
  return resource.replace(/^\/api\//, '');
}

function normalizeRecordId(recordId: string | number): string {
  const idString = String(recordId);
  const match = idString.match(/\/([^/]+)$/);
  return match ? match[1] : idString;
}

export function getTransitionMeta(transition: string): TransitionMeta {
  return (
    TRANSITION_META[transition] ?? {
      name: transition,
      label: transition.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      color: 'primary',
    }
  );
}

function sortTransitionsByPriority(transitions: string[]): string[] {
  return [...transitions].sort((a, b) => {
    const priorityA = TRANSITION_META[a]?.priority ?? 0;
    const priorityB = TRANSITION_META[b]?.priority ?? 0;
    return priorityB - priorityA;
  });
}

interface UseWorkflowStateResult {
  loading: boolean;
  error: Error | null;
  workflowState: WorkflowState | null;
  primaryTransition: string | null;
  secondaryTransitions: string[];
  applyTransition: (transition: string, data?: Record<string, unknown>) => Promise<void>;
  refresh: () => void;
}

/**
 * Derives workflow state from record.status and the x-psychedcms workflow
 * transition map in the schema. No API fetch needed.
 */
export function useWorkflowState(
  resource: string | undefined,
  recordId: string | number | undefined
): UseWorkflowStateResult {
  const { entrypoint } = usePsychedSchemaContext();
  const notify = useNotify();
  const record = useRecordContext();
  const resourceSchema = usePsychedSchema(resource ?? '');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Derive workflow state from record.status + schema workflow transitions map
  const workflowState = useMemo<WorkflowState | null>(() => {
    const status = record?.status as string | undefined;
    const contentType = resourceSchema?.contentType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workflowMap = (contentType as any)?.workflow as Record<string, string[]> | undefined;

    if (!status || !workflowMap) {
      return null;
    }

    const transitions = workflowMap[status];
    if (!transitions) {
      return null;
    }

    return {
      place: status,
      available_transitions: transitions,
    };
  }, [record?.status, resourceSchema?.contentType]);

  const applyTransition = useCallback(
    async (transition: string, data?: Record<string, unknown>) => {
      if (!resource || !recordId || !entrypoint) {
        throw new Error('Resource, record ID, or entrypoint not available');
      }

      const endpoint = transitionToEndpoint(transition);
      const resourceName = normalizeResourceName(resource);
      const normalizedId = normalizeRecordId(recordId);

      setApplying(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${entrypoint}/${resourceName}/${normalizedId}/${endpoint}`, {
          method: 'POST',
          headers: {
            Accept: 'application/ld+json',
            'Content-Type': 'application/ld+json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = errorData['hydra:description'] || errorData.detail || `HTTP ${response.status}`;
          throw new Error(message);
        }

        notify('psyched.workflow.transition_success', {
          type: 'success',
          messageArgs: { _: 'Transition applied' },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(err as Error);
        notify('psyched.workflow.transition_failed', { type: 'error', messageArgs: { message, _: `Failed to apply transition: ${message}` } });
        throw err;
      } finally {
        setApplying(false);
      }
    },
    [entrypoint, resource, recordId, notify]
  );

  const sortedTransitions = workflowState
    ? sortTransitionsByPriority(workflowState.available_transitions)
    : [];

  const primaryTransition = sortedTransitions[0] ?? null;
  const secondaryTransitions = sortedTransitions.slice(1);

  return {
    loading: applying,
    error,
    workflowState,
    primaryTransition,
    secondaryTransitions,
    applyTransition,
    refresh: () => {}, // No-op: state is derived from record, refreshes automatically
  };
}
