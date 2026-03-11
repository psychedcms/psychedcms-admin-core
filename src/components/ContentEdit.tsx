import {
    Edit,
    useResourceContext,
} from 'react-admin';
import { Box } from '@mui/material';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';
import { runBeforeSaveHooks, runAfterSaveHooks } from '../slots/usePluginSaveHooks.ts';
import { useCallback } from 'react';
import { ContentForm } from './ContentForm.tsx';

/**
 * Keys stripped from PATCH payloads.
 * Read-only or Hydra metadata fields that the API rejects.
 */
const STRIP_KEYS = new Set([
  '@context', '@id', '@type', 'id', 'originId',
  'createdAt', 'updatedAt',
]);

/**
 * Normalize form data before sending to the API.
 * - Strips read-only and Hydra metadata fields
 * - Converts nested objects with @id back to IRI strings
 */
function normalizeForPatch(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (STRIP_KEYS.has(key)) continue;

    if (value && typeof value === 'object' && !Array.isArray(value) && '@id' in value) {
      normalized[key] = (value as { '@id': string })['@id'];
    } else if (Array.isArray(value)) {
      normalized[key] = value.map((item) =>
        item && typeof item === 'object' && '@id' in item ? item['@id'] : item,
      );
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Schema-driven edit view with two-column layout.
 * Left: tabbed form fields. Right: sidebar with save, workflow, publication options.
 * Runs plugin save hooks and normalizes data for Hydra PATCH.
 */
export function ContentEdit() {
    const resource = useResourceContext();
    const schema = usePsychedSchema(resource ?? '');

    const transform = useCallback(
        async (data: Record<string, unknown>) => {
            const normalized = normalizeForPatch(data);
            return runBeforeSaveHooks(normalized, resource ?? '');
        },
        [resource],
    );

    if (!schema) return null;

    return (
        <Edit
            actions={false}
            component={Box}
            sx={{ bgcolor: 'transparent' }}
            transform={transform}
            mutationMode="pessimistic"
            mutationOptions={{
                onSuccess: (data: any) => {
                    runAfterSaveHooks(data as Record<string, unknown>, resource ?? '');
                },
            }}
        >
            <ContentForm />
        </Edit>
    );
}
