import type { StandardResponse, ErrorResponse } from '@/app/_lib/response.d';

export async function jsonFetcher<T = unknown>(url: string) {
  const endpoint = new URL(window.location.origin + url);
  return fetch(endpoint.toString())
    .then(
      (res) =>
        res.json() as Promise<StandardResponse<T> | ErrorResponse<unknown>>,
    )
    .then((data) => {
      if (data.type == 'error') {
        throw {
          ...data,
        } as ErrorResponse<unknown>;
      }
      return data as StandardResponse<T>;
    });
}

export async function textFetcher(url: string) {
  const endpoint = new URL(window.location.origin + url);
  const res = await fetch(endpoint.toString());
  if (!res.ok) {
    throw new Error('Failed to fetch text content');
  }
  return res.text();
}
