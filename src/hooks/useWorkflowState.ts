import { useState, useEffect, useCallback } from 'react';
import { useNotify } from 'react-admin';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
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

export function useWorkflowState(
  resource: string | undefined,
  recordId: string | number | undefined
): UseWorkflowStateResult {
  const { entrypoint } = usePsychedSchemaContext();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);

  const fetchWorkflowState = useCallback(async () => {
    if (!resource || recordId === undefined || recordId === null || !entrypoint) {
      setWorkflowState(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resourceName = normalizeResourceName(resource);
      const normalizedId = normalizeRecordId(recordId);
      const url = `${entrypoint}/${resourceName}/${normalizedId}/workflow-state`;
      const response = await fetch(url, {
        headers: { Accept: 'application/ld+json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setWorkflowState(null);
          return;
        }
        throw new Error(`Failed to fetch workflow state: ${response.status}`);
      }

      const data: WorkflowState = await response.json();
      setWorkflowState(data);
    } catch (err) {
      setError(err as Error);
      setWorkflowState(null);
    } finally {
      setLoading(false);
    }
  }, [entrypoint, resource, recordId]);

  useEffect(() => {
    fetchWorkflowState();
  }, [fetchWorkflowState]);

  const applyTransition = useCallback(
    async (transition: string, data?: Record<string, unknown>) => {
      if (!resource || !recordId || !entrypoint) {
        throw new Error('Resource, record ID, or entrypoint not available');
      }

      const endpoint = transitionToEndpoint(transition);
      const resourceName = normalizeResourceName(resource);
      const normalizedId = normalizeRecordId(recordId);

      try {
        const response = await fetch(`${entrypoint}/${resourceName}/${normalizedId}/${endpoint}`, {
          method: 'POST',
          headers: {
            Accept: 'application/ld+json',
            'Content-Type': 'application/ld+json',
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

        await fetchWorkflowState();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        notify('psyched.workflow.transition_failed', { type: 'error', messageArgs: { message, _: `Failed to apply transition: ${message}` } });
        throw err;
      }
    },
    [entrypoint, resource, recordId, notify, fetchWorkflowState]
  );

  const sortedTransitions = workflowState
    ? sortTransitionsByPriority(workflowState.available_transitions)
    : [];

  const primaryTransition = sortedTransitions[0] ?? null;
  const secondaryTransitions = sortedTransitions.slice(1);

  return {
    loading,
    error,
    workflowState,
    primaryTransition,
    secondaryTransitions,
    applyTransition,
    refresh: fetchWorkflowState,
  };
}
