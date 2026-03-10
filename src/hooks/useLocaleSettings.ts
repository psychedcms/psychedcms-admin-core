import { useEffect, useState, useCallback } from 'react';

export interface LocaleSettings {
  defaultLocale: string;
  supportedLocales: string[];
}

const entrypoint = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Shared module-level cache so all instances of useLocaleSettings share state.
// This avoids duplicate fetches and ensures EditLocaleProvider (in AppWrapperSlot)
// gets the same loaded state as App.tsx.
let sharedSettings: LocaleSettings = {
  defaultLocale: 'en',
  supportedLocales: ['en'],
};
let sharedLoading = true;
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): { settings: LocaleSettings; loading: boolean } {
  return { settings: sharedSettings, loading: sharedLoading };
}

function doFetch(): void {
  if (fetchPromise) return;
  fetchPromise = fetch(`${entrypoint}/locale-settings`)
    .then((res) => res.json())
    .then((data: LocaleSettings) => {
      sharedSettings = data;
      sharedLoading = false;
      fetchPromise = null;
      notifyListeners();
    })
    .catch(() => {
      sharedLoading = false;
      fetchPromise = null;
      notifyListeners();
    });
}

/**
 * Fetches global locale settings from the API.
 * Uses a shared module-level cache — multiple hook instances share the same data.
 * Returns default values while loading.
 * Provides a reload function to refresh after settings are updated.
 */
export function useLocaleSettings(): LocaleSettings & { loading: boolean; reload: () => void } {
  // Trigger initial fetch
  useEffect(() => {
    doFetch();
  }, []);

  // Subscribe to shared state changes
  const [snapshot, setSnapshot] = useState(getSnapshot);
  useEffect(() => {
    // Sync immediately in case state changed between render and effect
    setSnapshot(getSnapshot());
    return subscribe(() => setSnapshot(getSnapshot()));
  }, []);

  const reload = useCallback(() => {
    sharedLoading = true;
    fetchPromise = null;
    notifyListeners();
    doFetch();
  }, []);

  return { ...snapshot.settings, loading: snapshot.loading, reload };
}
