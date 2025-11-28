import useSWR, { mutate } from "swr";

const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch files");
        return res.json();
    });

export function useFiles(instanceName: string, path: string) {
    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // Fetch file listing
    const { data, error, isLoading } = useSWR(
        `/1.0/instances/${instanceName}/files?path=${encodeURIComponent(normalizedPath)}`,
        fetcher
    );

    const getApiUrl = (path: string) => {
        if (typeof window === "undefined") return path;
        return `${window.location.origin}${path}`;
    };

    const uploadFile = async (currentPath: string, file: File) => {
        const filePath = `${currentPath === "/" ? "" : currentPath}/${file.name}`;
        const res = await fetch(
            getApiUrl(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(filePath)}`),
            {
                method: "POST",
                headers: {
                    "X-Incus-uid": "0",
                    "X-Incus-gid": "0",
                    "X-Incus-mode": "0644",
                    "X-Incus-type": "file",
                    "X-Incus-write": "overwrite",
                },
                body: file,
            }
        );

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        await mutate(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(currentPath)}`);
    };

    const createDirectory = async (currentPath: string, dirName: string) => {
        const dirPath = `${currentPath === "/" ? "" : currentPath}/${dirName}`;
        const res = await fetch(
            getApiUrl(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(dirPath)}`),
            {
                method: "POST",
                headers: {
                    "X-Incus-uid": "0",
                    "X-Incus-gid": "0",
                    "X-Incus-mode": "0755",
                    "X-Incus-type": "directory",
                },
            }
        );

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        await mutate(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(currentPath)}`);
    };

    const deleteFile = async (filePath: string) => {
        const res = await fetch(
            getApiUrl(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(filePath)}`),
            {
                method: "DELETE",
            }
        );

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        // Mutate the parent directory
        const parentPath = filePath.substring(0, filePath.lastIndexOf("/")) || "/";
        await mutate(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(parentPath)}`);
    };

    const downloadFile = (filePath: string) => {
        // Create a temporary link to trigger download
        const url = getApiUrl(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(filePath)}`);
        const link = document.createElement("a");
        link.href = url;
        link.download = filePath.split("/").pop() || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchFileContent = async (filePath: string) => {
        const res = await fetch(
            getApiUrl(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(filePath)}`)
        );
        if (!res.ok) throw new Error("Failed to fetch file content");
        return res.text();
    };

    const saveFileContent = async (filePath: string, content: string) => {
        const res = await fetch(
            getApiUrl(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(filePath)}`),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "X-Incus-uid": "0",
                    "X-Incus-gid": "0",
                    "X-Incus-mode": "0644",
                    "X-Incus-type": "file",
                    "X-Incus-write": "overwrite",
                },
                body: content,
            }
        );

        if (!res.ok) {
            throw new Error(res.statusText);
        }
    };

    return {
        files: data?.metadata || [],
        isLoading,
        isError: error,
        uploadFile,
        createDirectory,
        deleteFile,
        downloadFile,
        fetchFileContent,
        saveFileContent,
    };
}
