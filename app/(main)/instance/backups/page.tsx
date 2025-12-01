"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useInstance } from "../_hooks/instance";
import { useBackups } from "../_hooks/backups";
import { useStoragePools } from "../../_hooks/storagePools";
import { getRootDiskPool } from "../_lib/utils";
import { Spinner } from "@/app/_components/ui/spinner";
import { BackupList } from "../../_components/backups";

export default function BackupsPage() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name");
    const { instance, isLoading: isInstanceLoading } = useInstance(name);
    const { data: storagePools, isLoading: isStorageLoading } = useStoragePools();

    const isLoading = isInstanceLoading || isStorageLoading;

    if (isLoading) {
        return <Spinner />;
    }

    if (!instance) {
        return null;
    }

    return <Backups instance={instance} storagePools={storagePools || []} />;
}

function Backups({ instance, storagePools }: { instance: any, storagePools: any[] }) {
    const rootDiskPoolName = getRootDiskPool(instance);
    const rootDiskPool = storagePools.find((p) => p.name === rootDiskPoolName);
    const canUseOptimizedStorage =
        rootDiskPool?.driver === "zfs" || rootDiskPool?.driver === "btrfs";

    const { backups, isLoading, isError, createBackup, deleteBackup, renameBackup, downloadBackup } =
        useBackups(instance.name);

    return (
        <BackupList
            backups={backups}
            isLoading={isLoading}
            isError={isError}
            onCreate={createBackup}
            onDelete={deleteBackup}
            onRename={renameBackup}
            onDownload={downloadBackup}
            canUseOptimizedStorage={canUseOptimizedStorage}
        />
    );
}
