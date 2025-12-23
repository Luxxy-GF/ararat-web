import useSWR from 'swr';
import { jsonFetcher } from '../../../_lib/fetcher';
import { Backup } from '../../_components/backups';
import { StandardResponse } from '../../../_lib/response';
import {
  createBackup as apiCreateBackup,
  deleteBackup as apiDeleteBackup,
  renameBackup as apiRenameBackup,
  downloadBackup as apiDownloadBackup,
} from '../_lib/backups';

export function useBackups(instanceName: string) {
  const backupKey = `/1.0/instances/${instanceName}/backups?recursion=1`;

  const { data, error, isLoading, mutate } = useSWR<
    StandardResponse<Backup[]>
  >(
    backupKey,
    (url: string) => jsonFetcher<Backup[]>(url),
  );

  const revalidateBackups = async (withDelay?: number) => {
    await mutate();
    if (withDelay) {
      setTimeout(() => mutate(), withDelay);
    }
  };

  const createBackup = async (
    name?: string,
    instanceOnly?: boolean,
    optimizedStorage?: boolean,
  ) => {
    await apiCreateBackup(instanceName, name, instanceOnly, optimizedStorage);
    await revalidateBackups(1000);
  };

  const deleteBackup = async (backupName: string) => {
    const removeBackup = (current?: StandardResponse<Backup[]>) =>
      current
        ? {
            ...current,
            metadata: current.metadata.filter(
              (backup) => backup.name !== backupName,
            ),
          }
        : current;

    await mutate(
      async (current?: StandardResponse<Backup[]>) => {
        await apiDeleteBackup(instanceName, backupName);
        return removeBackup(current);
      },
      {
        optimisticData: removeBackup,
        rollbackOnError: true,
        revalidate: true,
      },
    );

    setTimeout(() => mutate(), 1000);
  };

  const renameBackup = async (oldName: string, newName: string) => {
    await apiRenameBackup(instanceName, oldName, newName);
    await revalidateBackups(1000);
  };

  const downloadBackup = (backupName: string) => {
    apiDownloadBackup(instanceName, backupName);
  };

  return {
    backups: data?.metadata || [],
    isLoading,
    isError: error,
    createBackup,
    deleteBackup,
    renameBackup,
    downloadBackup,
  };
}
