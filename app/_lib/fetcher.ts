import type { StandardResponse, ErrorResponse } from "@/app/_lib/response.d";

export async function jsonFetcher(url: string) {
  const endpoint = new URL(url);
  console.log(endpoint, "endpoint");
  return fetch(endpoint.toString())
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
