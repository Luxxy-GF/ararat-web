import { mutate } from "swr";

export function useSnapshots(instanceName: string) {
    const createSnapshot = async (name?: string, stateful?: boolean) => {
        console.log("Creating snapshot...", { name, stateful });
        const res = await fetch(`/1.0/instances/${instanceName}/snapshots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name || undefined, stateful }),
        });

        console.log("Create snapshot response status:", res.status);
        const data = await res.json();
        console.log("Create snapshot response data:", data);

        if (!res.ok) {
            throw new Error(data.error || res.statusText);
        }

        // If it's an async operation, we might need to wait for it, but for now let's see what we get.
        await mutate(`/1.0/instances/${instanceName}?recursion=1`);
    };

    const deleteSnapshot = async (snapshotName: string) => {
        const shortName = snapshotName.split("/").pop() || "";
        const res = await fetch(
            `/1.0/instances/${instanceName}/snapshots/${shortName}`,
            {
                method: "DELETE",
            }
        );

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || res.statusText);
        }

        await mutate(`/1.0/instances/${instanceName}?recursion=1`);
    };

    const restoreSnapshot = async (snapshotName: string) => {
        const shortName = snapshotName.split("/").pop() || "";
        const res = await fetch(`/1.0/instances/${instanceName}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ restore: shortName }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || res.statusText);
        }

        await mutate(`/1.0/instances/${instanceName}?recursion=1`);
    };

    const renameSnapshot = async (snapshotName: string, newName: string) => {
        const shortName = snapshotName.split("/").pop() || "";
        const res = await fetch(
            `/1.0/instances/${instanceName}/snapshots/${shortName}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            }
        );

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || res.statusText);
        }

        await mutate(`/1.0/instances/${instanceName}?recursion=1`);
    };

    return {
        createSnapshot,
        deleteSnapshot,
        restoreSnapshot,
        renameSnapshot,
    };
}
