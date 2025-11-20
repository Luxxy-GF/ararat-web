import { getProfiles } from "../_lib/profiles";
import useSWR, { mutate } from "swr";

export function useProfiles(profiles?: string[]) {
  let query = "";
  if (profiles) {
    if (profiles.length > 0) {
      query += `&filter=${profiles.map((p) => `name eq ${p}`).join(" or ")}`;
    }
  }
  const result = useSWR(`/1.0/profiles?recursion=1${query}`, () =>
    getProfiles(profiles)
  );
  const profilesList: string[] = [];
  result.data?.forEach((profile) => {
    mutate(`/1.0/profiles/${profile.name}`, profile, { revalidate: false });
    if (profile?.name) profilesList.push(profile.name);
  });
  if (profiles?.length == 0) {
    query += `&filter${profilesList.map((p) => `name eq ${p}`).join(" or ")}`;
    mutate(`/1.0/profiles?recursion=1${query}`, result.data, {
      revalidate: false,
    });
  }

  return result;
}
