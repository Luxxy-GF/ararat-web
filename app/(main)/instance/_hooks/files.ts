import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import {
  uploadFile as apiUploadFile,
  createDirectory as apiCreateDirectory,
  deleteFile as apiDeleteFile,
  downloadFile as apiDownloadFile,
  fetchFileContent as apiFetchFileContent,
  saveFileContent as apiSaveFileContent,
  getFileMetadata as apiFetchFileMetadata,
  createFile as apiCreateFile,
} from '../_lib/files';

const directoryFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    (error as any).status = res.status;
    throw error;
  }

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (json.type === 'sync' && Array.isArray(json.metadata)) {
      return json;
    }
  } catch (e) {
    // Not JSON
  }

  throw new Error('NOT_A_DIRECTORY');
};

export function useFiles(instanceName: string, path: string) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Fetch file listing
  const { data, error, isLoading } = useSWR(
    `/1.0/instances/${instanceName}/files?path=${encodeURIComponent(normalizedPath)}`,
    directoryFetcher,
  );

  const [filesWithMetadata, setFilesWithMetadata] = useState<any[]>([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

  useEffect(() => {
    if (!data?.metadata || !Array.isArray(data.metadata)) {
      setFilesWithMetadata([]);
      return;
    }

    const fetchMetadata = async () => {
      setIsMetadataLoading(true);
      try {
        const files = data.metadata as string[];
        const metadataPromises = files.map(async (fileName) => {
          try {
            const filePath = `${normalizedPath === '/' ? '' : normalizedPath}/${fileName}`;
            const meta = await apiFetchFileMetadata(instanceName, filePath);
            return {
              name: fileName,
              type: meta.type,
              size: meta.size ? parseInt(meta.size, 10) : undefined,
              mode: meta.mode,
              uid: meta.uid,
              gid: meta.gid,
            };
          } catch (e) {
            console.error(`Failed to fetch metadata for ${fileName}`, e);
            return { name: fileName };
          }
        });

        const results = await Promise.all(metadataPromises);
        setFilesWithMetadata(results);
      } catch (e) {
        console.error('Error fetching metadata', e);
      } finally {
        setIsMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, [data, instanceName, normalizedPath]);

  const uploadFile = async (
    currentPath: string,
    file: File,
    onProgress?: (progress: number) => void,
  ) => {
    await apiUploadFile(instanceName, currentPath, file, onProgress);
    await mutate(
      `/1.0/instances/${instanceName}/files?path=${encodeURIComponent(currentPath)}`,
    );
  };

  const createFile = async (currentPath: string, fileName: string) => {
    await apiCreateFile(instanceName, currentPath, fileName);
    await mutate(
      `/1.0/instances/${instanceName}/files?path=${encodeURIComponent(currentPath)}`,
    );
  };

  const createDirectory = async (currentPath: string, dirName: string) => {
    await apiCreateDirectory(instanceName, currentPath, dirName);
    await mutate(
      `/1.0/instances/${instanceName}/files?path=${encodeURIComponent(currentPath)}`,
    );
  };

  const deleteFile = async (filePath: string) => {
    await apiDeleteFile(instanceName, filePath);
    // Mutate the parent directory
    const parentPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
    await mutate(
      `/1.0/instances/${instanceName}/files?path=${encodeURIComponent(parentPath)}`,
    );
  };

  const downloadFile = (filePath: string) => {
    apiDownloadFile(instanceName, filePath);
  };

  const fetchFileContent = async (filePath: string) => {
    return apiFetchFileContent(instanceName, filePath);
  };

  const saveFileContent = async (
    filePath: string,
    content: string,
    mode?: string,
  ) => {
    await apiSaveFileContent(instanceName, filePath, content, mode);
  };

  return {
    files: filesWithMetadata,
    isLoading: isLoading || isMetadataLoading,
    isError: error,
    uploadFile,
    createDirectory,
    createFile,
    deleteFile,
    downloadFile,
    fetchFileContent,
    saveFileContent,
  };
}
