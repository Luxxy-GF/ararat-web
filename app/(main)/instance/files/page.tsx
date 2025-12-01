"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useInstance } from "../_hooks/instance";
import { useFiles } from "../_hooks/files";
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
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialPath = searchParams.get("path") || "/";
    const [currentPath, setCurrentPath] = React.useState(initialPath);

    // Sync state if URL changes (e.g. back button)
    React.useEffect(() => {
        const pathParam = searchParams.get("path") || "/";
        if (pathParam !== currentPath) {
            setCurrentPath(pathParam);
        }
    }, [searchParams]);

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
        const params = new URLSearchParams(searchParams.toString());
        if (path === "/") {
            params.delete("path");
        } else {
            params.set("path", path);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

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
            onNavigate={handleNavigate}
            onUpload={(file) => uploadFile(currentPath, file)}
            onCreateDirectory={(name) => createDirectory(currentPath, name)}
            onDelete={deleteFile}
            onDownload={downloadFile}
            onFetchContent={fetchFileContent}
            onSaveContent={saveFileContent}
        />
    );
}
