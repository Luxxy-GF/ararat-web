import useSWR, { mutate } from "swr";
import {
    uploadFile as apiUploadFile,
    createDirectory as apiCreateDirectory,
    deleteFile as apiDeleteFile,
    downloadFile as apiDownloadFile,
    fetchFileContent as apiFetchFileContent,
    saveFileContent as apiSaveFileContent,
} from "../_lib/files";

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

    const uploadFile = async (currentPath: string, file: File) => {
        await apiUploadFile(instanceName, currentPath, file);
        await mutate(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(currentPath)}`);
    };

    const createDirectory = async (currentPath: string, dirName: string) => {
        await apiCreateDirectory(instanceName, currentPath, dirName);
        await mutate(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(currentPath)}`);
    };

    const deleteFile = async (filePath: string) => {
        await apiDeleteFile(instanceName, filePath);
        // Mutate the parent directory
        const parentPath = filePath.substring(0, filePath.lastIndexOf("/")) || "/";
        await mutate(`/1.0/instances/${instanceName}/files?path=${encodeURIComponent(parentPath)}`);
    };

    const downloadFile = (filePath: string) => {
        apiDownloadFile(instanceName, filePath);
    };

    const fetchFileContent = async (filePath: string) => {
        return apiFetchFileContent(instanceName, filePath);
    };

    const saveFileContent = async (filePath: string, content: string) => {
        await apiSaveFileContent(instanceName, filePath, content);
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
