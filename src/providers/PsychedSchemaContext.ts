import { createContext, useContext } from 'react';

import type { PsychedSchema } from '../types/psychedcms.ts';

export interface PsychedSchemaContextValue {
  schema: PsychedSchema | null;
  loading: boolean;
  error: Error | null;
  entrypoint: string;
}

export const PsychedSchemaContext = createContext<PsychedSchemaContextValue>({
  schema: null,
  loading: true,
  error: null,
  entrypoint: '',
});

/**
 * Hook to access the raw schema context value.
 * Most components should use the higher-level hooks instead.
 */
export function usePsychedSchemaContext(): PsychedSchemaContextValue {
  return useContext(PsychedSchemaContext);
}
