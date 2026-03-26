import { useCallback, useSyncExternalStore } from 'react';

import {
  getTranslationReferenceSnapshot,
  subscribeTranslationReference,
} from '../providers/TranslationReferenceStore.ts';

/**
 * Hook to read translation reference values from the module-level store.
 *
 * Returns the default locale's field values and whether the current edit
 * locale differs from the default. Used by TranslationReferencePanel to
 * display reference content above translatable input fields.
 */
export function useTranslationReference() {
  const snapshot = useSyncExternalStore(
    subscribeTranslationReference,
    getTranslationReferenceSnapshot,
  );

  const getReferenceValue = useCallback(
    (fieldName: string): string | null => {
      const value = snapshot.referenceValues[fieldName];
      if (value === undefined || value === null || value === '') return null;
      return String(value);
    },
    [snapshot.referenceValues],
  );

  return {
    getReferenceValue,
    isNonDefaultLocale: snapshot.isNonDefaultLocale,
  };
}
