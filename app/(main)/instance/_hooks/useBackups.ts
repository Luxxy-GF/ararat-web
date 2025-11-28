import useSWR, { mutate } from "swr";

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
        const res = await fetch(`/1.0/instances/${instanceName}/backups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name || undefined,
                container_only: containerOnly,
                optimized_storage: optimizedStorage,
            }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || res.statusText);
        }

        await mutate(`/1.0/instances/${instanceName}/backups?recursion=1`);
    };

    const deleteBackup = async (backupName: string) => {
        // backupName usually comes as "container/backup", but the API expects just the backup name for the delete endpoint relative to the instance?
        // Actually, the API docs say DELETE /1.0/instances/{name}/backups/{backup}
        // If the backup name in the list is "container/backup", we need to extract the part after the slash.
        const shortName = backupName.split("/").pop() || "";

        const res = await fetch(`/1.0/instances/${instanceName}/backups/${shortName}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || res.statusText);
        }

        await mutate(`/1.0/instances/${instanceName}/backups?recursion=1`);
    };

    const renameBackup = async (oldName: string, newName: string) => {
        const shortOldName = oldName.split("/").pop() || "";
        const res = await fetch(`/1.0/instances/${instanceName}/backups/${shortOldName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || res.statusText);
        }

        await mutate(`/1.0/instances/${instanceName}/backups?recursion=1`);
    };

    const downloadBackup = (backupName: string) => {
        const shortName = backupName.split("/").pop() || "";
        const url = `/1.0/instances/${instanceName}/backups/${shortName}/export`;
        const link = document.createElement("a");
        link.href = url;
        link.download = shortName; // Browser might handle filename from Content-Disposition
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
