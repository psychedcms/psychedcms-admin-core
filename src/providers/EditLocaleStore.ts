/**
 * Module-level store for the current content editing locale.
 *
 * Set by the translatable package's EditLocaleProvider.
 * Read by TranslationReferencePanel to know the target locale for translation.
 */
type Listener = () => void;

let currentEditLocale = 'en';
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function setEditLocale(locale: string): void {
  if (locale !== currentEditLocale) {
    currentEditLocale = locale;
    emit();
  }
}

export function getEditLocale(): string {
  return currentEditLocale;
}

export function subscribeEditLocale(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
