import { StandardResponse, ErrorResponse } from "@/lib/incus/types/response";

export async function jsonFetcher(url: string) {
  return fetch(url)
    .then(
      (res) =>
        res.json() as Promise<
          StandardResponse<unknown> | ErrorResponse<unknown>
        >
    )
    .then((data) => {
      if (data.type == "error") {
        throw {
          ...data,
        } as ErrorResponse<unknown>;
      }
      return data as StandardResponse<unknown>;
    });
}
