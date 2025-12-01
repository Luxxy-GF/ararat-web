import useSWR, { mutate } from "swr";
import {
    createBackup as apiCreateBackup,
    deleteBackup as apiDeleteBackup,
    renameBackup as apiRenameBackup,
    downloadBackup as apiDownloadBackup,
} from "../_lib/backups";

const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch backups");
        return res.json();
    });

export function useBackups(instanceName: string) {
    const { data, error, isLoading } = useSWR(
        `/1.0/instances/${instanceName}/backups?recursion=1`,
        fetcher
    );

    const createBackup = async (name?: string, containerOnly?: boolean, optimizedStorage?: boolean) => {
        await apiCreateBackup(instanceName, name, containerOnly, optimizedStorage);
        await mutate(`/1.0/instances/${instanceName}/backups?recursion=1`);
    };

    const deleteBackup = async (backupName: string) => {
        await apiDeleteBackup(instanceName, backupName);
        await mutate(`/1.0/instances/${instanceName}/backups?recursion=1`);
    };

    const renameBackup = async (oldName: string, newName: string) => {
        await apiRenameBackup(instanceName, oldName, newName);
        await mutate(`/1.0/instances/${instanceName}/backups?recursion=1`);
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
