import { useState, useEffect, useContext } from 'react';
import useSWR, { mutate } from 'swr';
import EventEmitterContext from '../../../_context/events';
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
  const getSWRKey = (p: string) => {
    const norm = p.startsWith('/') ? p : `/${p}`;
    return `/1.0/instances/${instanceName}/files?path=${encodeURIComponent(norm)}`;
  };

  // Fetch file listing
  const { data, error, isLoading } = useSWR(
    getSWRKey(normalizedPath),
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

  const { socket } = useContext(EventEmitterContext);

  // Listen for lifecycle events directly from the WebSocket and revalidate when files change
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as {
          type?: string;
          metadata?: {
            action?: string;
            source?: string;
            context?: Record<string, any>;
          };
        };

        if (data.type !== 'lifecycle' || !data.metadata) return;

        const { action, source, context } = data.metadata;

        const fileActions = [
          'instance-file-pushed',
          'instance-file-deleted',
          'instance-file-retrieved',
        ];
        if (!action || !fileActions.includes(action)) return;

        const sourceMatch = source?.match(/\/1\.0\/instances\/([^\/]+)\/files/);
        if (!sourceMatch || sourceMatch[1] !== instanceName) return;

        mutate(getSWRKey(normalizedPath));
      } catch (e) {
        console.error('Failed to handle lifecycle message', e);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, instanceName, normalizedPath]);

  const uploadFile = async (
    currentPath: string,
    file: File,
    onProgress?: (progress: number) => void,
  ) => {
    await apiUploadFile(instanceName, currentPath, file, onProgress);
  };

  const createFile = async (currentPath: string, fileName: string) => {
    await apiCreateFile(instanceName, currentPath, fileName);
  };

  const createDirectory = async (currentPath: string, dirName: string) => {
    await apiCreateDirectory(instanceName, currentPath, dirName);
  };

  const deleteFile = async (filePath: string) => {
    await apiDeleteFile(instanceName, filePath);
  };

  const renameFile = async (
    oldName: string,
    newName: string,
    onProgress?: (progress: number) => void,
  ) => {
    const parentPath = normalizedPath === '/' ? '' : normalizedPath;
    const oldPath = `${parentPath}/${oldName}`;
    const newPath = `${parentPath}/${newName}`;

    try {
      // Signal start
      onProgress?.(0);

      // 1. Read old content
      const { content, mode } = await apiFetchFileContent(
        instanceName,
        oldPath,
      );
      onProgress?.(50);

      // 2. Upload new file with progress tracking
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const file = new File([blob], newName, {
        type: 'application/octet-stream',
      });
      await apiUploadFile(instanceName, parentPath, file, (p) => {
        if (p === undefined || p === null) return;
        // Map 0-100 upload to 50-100 overall
        const scaled = 50 + p / 2;
        onProgress?.(scaled);
      });
      // 3. Delete old file
      await apiDeleteFile(instanceName, oldPath);
      onProgress?.(100);
    } catch (e) {
      console.error('Failed to rename file:', e);
      throw e;
    }
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
    renameFile,
    downloadFile,
    fetchFileContent,
    saveFileContent,
  };
}
