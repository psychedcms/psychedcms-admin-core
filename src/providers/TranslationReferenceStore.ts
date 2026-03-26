/**
 * Module-level store for translation reference values.
 *
 * Populated by admin-translatable's TranslatableFormManager with the default
 * locale's field values. Read by TranslationReferencePanel (in InputGuesser)
 * to show reference content when editing in a non-default locale.
 *
 * Uses a subscribe/snapshot pattern compatible with React's useSyncExternalStore.
 */
type Listener = () => void;

interface TranslationReferenceSnapshot {
  referenceValues: Record<string, unknown>;
  isNonDefaultLocale: boolean;
}

let snapshot: TranslationReferenceSnapshot = {
  referenceValues: {},
  isNonDefaultLocale: false,
};

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function setTranslationReference(
  referenceValues: Record<string, unknown>,
  isNonDefaultLocale: boolean,
): void {
  snapshot = { referenceValues, isNonDefaultLocale };
  emit();
}

export function getTranslationReferenceSnapshot(): TranslationReferenceSnapshot {
  return snapshot;
}

export function subscribeTranslationReference(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
