"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useInstance } from "../_hooks/useInstance";
import { useBackups } from "../_hooks/useBackups";
import { Spinner } from "@/app/_components/ui/spinner";
import { BackupList } from "../../_components/backups";

export default function BackupsPage() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name");
    const { instance, isLoading } = useInstance(name);

    if (isLoading) {
        return <Spinner />;
    }

    if (!instance) {
        return null;
    }

    return <Backups instance={instance} />;
}

function Backups({ instance }: { instance: any }) {
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
        />
    );
}
