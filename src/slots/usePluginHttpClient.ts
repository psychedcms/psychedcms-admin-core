import { getHttpMiddleware } from '../registry.ts';

type FetchFn = (url: URL, options?: RequestInit) => Promise<Response>;

export function buildHttpClient(baseFetch: FetchFn): FetchFn {
  const middleware = getHttpMiddleware();

  let composed = baseFetch;
  for (const mw of middleware) {
    composed = mw(composed);
  }

  return composed;
}
