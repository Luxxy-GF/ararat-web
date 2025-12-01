import useSWR from 'swr';
import { getStoragePools, getStoragePoolVolumes } from '../_lib/storagePools';

export function useStoragePools() {
  return useSWR('/1.0/storage-pools?recursion=1', getStoragePools);
}

export function useStoragePoolVolumes(poolName: string | null | undefined) {
  return useSWR(
    poolName ? `/1.0/storage-pools/${poolName}/volumes/custom?recursion=1` : null,
    () => (poolName ? getStoragePoolVolumes(poolName) : null)
  );
}
