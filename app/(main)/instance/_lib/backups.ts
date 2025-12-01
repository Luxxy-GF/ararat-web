export async function createBackup(
    instanceName: string,
    name?: string,
    containerOnly?: boolean,
    optimizedStorage?: boolean
) {
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
}

export async function deleteBackup(instanceName: string, backupName: string) {
    const shortName = backupName.split("/").pop() || "";

    const res = await fetch(`/1.0/instances/${instanceName}/backups/${shortName}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
    }
}

export async function renameBackup(instanceName: string, oldName: string, newName: string) {
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
}

export function downloadBackup(instanceName: string, backupName: string) {
    const shortName = backupName.split("/").pop() || "";
    const url = `/1.0/instances/${instanceName}/backups/${shortName}/export`;
    const link = document.createElement("a");
    link.href = url;
    link.download = shortName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
