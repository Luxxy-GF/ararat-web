import { ImagesResponse } from "@/types/incus/images";
import useSWR from "swr";

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args)
    .then((res) => res.json())
    .then((data) => (data as ImagesResponse).metadata);

export function useImages() {
  return useSWR("/1.0/images?recursion=1", fetcher);
}
