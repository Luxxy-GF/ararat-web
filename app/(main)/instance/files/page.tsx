"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useInstance } from "../_hooks/useInstance";
import { useFiles } from "../_hooks/useFiles";
import { Spinner } from "@/app/_components/ui/spinner";
import { FileBrowser } from "../../_components/files";

export default function FilesPage() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name");
    const { instance, isLoading } = useInstance(name);

    if (isLoading) {
        return <Spinner />;
    }

    if (!instance) {
        return null;
    }

    return <Files instance={instance} />;
}

function Files({ instance }: { instance: any }) {
    const [currentPath, setCurrentPath] = React.useState("/");
    const {
        files,
        isLoading,
        isError,
        uploadFile,
        createDirectory,
        deleteFile,
        downloadFile,
        fetchFileContent,
        saveFileContent
    } = useFiles(instance.name, currentPath);

    return (
        <FileBrowser
            files={files}
            isLoading={isLoading}
            isError={isError}
            currentPath={currentPath}
            onNavigate={setCurrentPath}
            onUpload={(file) => uploadFile(currentPath, file)}
            onCreateDirectory={(name) => createDirectory(currentPath, name)}
            onDelete={deleteFile}
            onDownload={downloadFile}
            onFetchContent={fetchFileContent}
            onSaveContent={saveFileContent}
        />
    );
}
