import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import type { FieldMetadata } from '../types/psychedcms.ts';

/**
 * Hook to access FieldMetadata for a specific field on a resource.
 * Returns undefined if the resource or field is not found.
 */
export function useFieldMetadata(
  resourceName: string,
  fieldName: string
): FieldMetadata | undefined {
  const { schema } = usePsychedSchemaContext();

  if (!schema) {
    return undefined;
  }

  const resource = schema.resources.get(resourceName);
  if (!resource) {
    return undefined;
  }

  return resource.fields.get(fieldName);
}
