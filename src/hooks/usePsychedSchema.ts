import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import type { ResourceSchema } from '../types/psychedcms.ts';

/**
 * Hook to access the full ResourceSchema for a specific resource.
 * Returns null if the resource is not found or schema is not loaded.
 */
export function usePsychedSchema(resourceName: string): ResourceSchema | null {
  const { schema } = usePsychedSchemaContext();

  if (!schema) {
    return null;
  }

  return schema.resources.get(resourceName) ?? null;
}
