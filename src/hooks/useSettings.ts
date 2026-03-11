import { useEffect, useState, useCallback } from 'react';

export interface Settings {
  app_name: string | null;
  app_baseline: string | null;
}

const entrypoint = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

let sharedSettings: Settings = { app_name: null, app_baseline: null };
let sharedLoading = true;
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): { settings: Settings; loading: boolean } {
  return { settings: sharedSettings, loading: sharedLoading };
}

function doFetch(): void {
  if (fetchPromise) return;
  fetchPromise = fetch(`${entrypoint}/settings`)
    .then((res) => res.json())
    .then((data: Settings) => {
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
 * Fetches settings from the API.
 * Uses a shared module-level cache — multiple hook instances share the same data.
 */
export function useSettings(): Settings & { loading: boolean; reload: () => void } {
  useEffect(() => {
    doFetch();
  }, []);

  const [snapshot, setSnapshot] = useState(getSnapshot);
  useEffect(() => {
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
