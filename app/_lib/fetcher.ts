import type { StandardResponse, ErrorResponse } from '@/app/_lib/response.d';

type JsonFetcherOptions = {
  params?: Record<string, string | number | boolean | undefined | null>;
  init?: RequestInit;
};

export async function jsonFetcher(url: string, options?: JsonFetcherOptions) {
  const endpoint = new URL(window.location.origin + url);

  // Append optional params first
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value === undefined || value === null) continue;
      endpoint.searchParams.set(key, String(value));
    }
  }

  return fetch(endpoint.toString(), options?.init)
    .then(
      (res) =>
        res.json() as Promise<
          StandardResponse<unknown> | ErrorResponse<unknown>
        >,
    )
    .then((data) => {
      if (data.type == 'error') {
        throw {
          ...data,
        } as ErrorResponse<unknown>;
      }
      return data as StandardResponse<unknown>;
    });
}
