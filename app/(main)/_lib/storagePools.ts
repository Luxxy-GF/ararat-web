import { jsonFetcher } from '@/app/_lib/fetcher';
import type { StoragePool, StorageVolume } from './storagePools.d';

export async function getStoragePools() {
  return jsonFetcher('/1.0/storage-pools?recursion=1').then(
    (data) => data.metadata as StoragePool[],
  );
}

export async function getStoragePoolVolumes(poolName: string) {
  return jsonFetcher(
    `/1.0/storage-pools/${poolName}/volumes/custom?recursion=1`,
  ).then((data) => data.metadata as StorageVolume[]);
}
