'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useInstanceContext } from '../_context/instance';
import { useFiles } from '../_hooks/files';
import { Spinner } from 'ui-web/components/spinner';
import { FileBrowser } from '../../_components/files';

export default function FilesPage() {
  const { instance, isLoading } = useInstanceContext();

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
  const [currentPath, setCurrentPath] = React.useState('/');

  // Read path from URL on mount using manual JS
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pathParam = params.get('path') || '/';
      setCurrentPath(pathParam);
    }
  }, []);

  // Listen for back/forward navigation
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pathParam = params.get('path') || '/';
      setCurrentPath(pathParam);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (path === '/') {
        params.delete('path');
      } else {
        params.set('path', path);
      }
      router.push(`${pathname}?${params.toString()}`);
    }
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
    saveFileContent,
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
