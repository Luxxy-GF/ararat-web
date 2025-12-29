'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useInstanceContext } from '../_context/instance';
import { useFiles } from '../_hooks/files';
import { Spinner } from 'ui-web/components/spinner';
import { FileBrowser } from '../../_components/files';

export default function FilesPage() {
  const { instance, isLoading } = useInstanceContext();
  const hasInitializedPath = React.useRef(false);

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
  const homePath = instance?.expanded_config?.['oci.cwd'] || '/';
  const initialPath = React.useMemo(() => {
    if (typeof window === 'undefined') return homePath;
    const params = new URLSearchParams(window.location.search);
    return params.get('path') || homePath;
  }, [homePath]);

  const [currentPath, setCurrentPath] = React.useState(initialPath);
  const hasInitializedPath = React.useRef(false);

  // Read path from URL on mount using manual JS
  React.useEffect(() => {
    if (hasInitializedPath.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pathParam = params.get('path');

    if (pathParam) {
      setCurrentPath(pathParam);
    } else {
      setCurrentPath(homePath);
      // Update URL to reflect the default path
      const newParams = new URLSearchParams(window.location.search);
      if (homePath !== '/') {
        newParams.set('path', homePath);
      }
      const target = newParams.toString();
      const url = target ? `${pathname}?${target}` : pathname;
      router.replace(url);
    }

    hasInitializedPath.current = true;
  }, [homePath, pathname, router]);

  // Listen for back/forward navigation
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pathParam = params.get('path') || homePath;
      setCurrentPath(pathParam);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (path === '/' && homePath === '/') {
        params.delete('path');
      } else {
        params.set('path', path);
      }
      const target = params.toString();
      const url = target ? `${pathname}?${target}` : pathname;
      router.push(url);
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
    renameFile,
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
      instanceName={instance.name}
      homePath={homePath}
      onNavigate={handleNavigate}
      onUpload={(file, onProgress) => uploadFile(currentPath, file, onProgress)}
      onCreateDirectory={(name) => createDirectory(currentPath, name)}
      onCreateFile={(name) => createFile(currentPath, name)}
      onDelete={deleteFile}
      onRename={renameFile}
      onDownload={downloadFile}
      onFetchContent={fetchFileContent}
      onSaveContent={saveFileContent}
    />
  );
}
