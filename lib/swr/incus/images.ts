import { ImagesResponse } from "@/lib/incus/types/images";
import useSWR from "swr";

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args)
    .then((res) => res.json())
    .then((data) => (data as ImagesResponse).metadata);

const buildImagesPath = (project?: string | null) => {
  const params = new URLSearchParams({ recursion: "1" });
  if (project === "all") {
    params.set("all-projects", "true");
  } else if (project) {
    params.set("project", project);
  }
  return `/1.0/images?${params.toString()}`;
};

export function useImages(project?: string | null) {
  return useSWR(buildImagesPath(project), fetcher);
}
