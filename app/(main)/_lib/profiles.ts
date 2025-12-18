'use client';

import { jsonFetcher } from '@/app/_lib/fetcher';
import type { Profile } from './profiles.d';

export async function getProfiles(profiles: string[] | undefined) {
  let query = '';
  if (profiles) {
    if (profiles.length > 0) {
      query += `&filter=${profiles.map((p) => `name eq ${p}`).join(' or ')}`;
    }
  }
  return jsonFetcher<Profile[]>(`/1.0/profiles?recursion=1${query}`).then(
    (data) => data.metadata,
  );
}
