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
  const hasInitializedPath = React.useRef(false);

  // Read path from URL on mount using manual JS
  React.useEffect(() => {
    if (hasInitializedPath.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pathParam = params.get('path');

    if (pathParam) {
      setCurrentPath(pathParam);
    } else if (instance?.expanded_config?.['oci.cwd']) {
      setCurrentPath(instance.expanded_config['oci.cwd']);
      // Update URL to reflect the default path
      const newParams = new URLSearchParams(window.location.search);
      newParams.set('path', instance.expanded_config['oci.cwd']);
      router.replace(`${pathname}?${newParams.toString()}`);
    }

    hasInitializedPath.current = true;
  }, [instance?.expanded_config, pathname, router]);

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
    createFile,
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
      onUpload={(file, onProgress) => uploadFile(currentPath, file, onProgress)}
      onCreateDirectory={(name) => createDirectory(currentPath, name)}
      onCreateFile={(name) => createFile(currentPath, name)}
      onDelete={deleteFile}
      onDownload={downloadFile}
      onFetchContent={fetchFileContent}
      onSaveContent={saveFileContent}
    />
  );
}
