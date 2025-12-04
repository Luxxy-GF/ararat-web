'use client';

import React from 'react';
import { Spinner } from 'ui-web/components/spinner';
import { Button } from 'ui-web/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui-web/components/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ui-web/components/dialog';
import { Input } from 'ui-web/components/input';
import { Label } from 'ui-web/components/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'ui-web/components/breadcrumb';
import {
  FileIcon,
  FolderIcon,
  MoreHorizontal,
  UploadIcon,
  PlusIcon,
  TrashIcon,
  DownloadIcon,
  ArrowUpIcon,
  HomeIcon,
  SaveIcon,
  XIcon,
  PencilIcon,
  FilePlus,
  FileCode,
  FileJson,
  FileType,
  FileImage,
  FileText,
  FileArchive,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileBox,
} from 'lucide-react';
import { Progress } from 'ui-web/components/progress';
import { Alert, AlertDescription, AlertTitle } from 'ui-web/components/alert';
import Editor from '@monaco-editor/react';
import DataTable from 'ui-web/components/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface FileBrowserProps {
  files: (string | FileItem)[];
  isLoading: boolean;
  isError: any;
  currentPath: string;
  onNavigate: (path: string) => void;
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  onCreateDirectory: (name: string) => Promise<void>;
  onCreateFile: (name: string) => Promise<void>;
  onDelete: (path: string) => Promise<void>;
  onDownload: (path: string) => void;
  onFetchContent: (path: string) => Promise<{ content: string; mode?: string }>;
  onSaveContent: (
    path: string,
    content: string,
    mode?: string,
  ) => Promise<void>;
}

export interface FileItem {
  name: string;
  type?: string;
  size?: number;
  mode?: string;
  uid?: string;
  gid?: string;
}

function formatBytes(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  if (value === 0) return '0 B';
  const exponent = Math.min(
    Math.max(Math.floor(Math.log(value) / Math.log(1024)), 0),
    units.length - 1,
  );
  const num = value / Math.pow(1024, exponent);
  return `${num.toFixed(num >= 10 ? 0 : 1)} ${units[exponent]}`;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const className = "h-4 w-4 text-gray-500";

  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className={className} />;
    case 'json':
      return <FileJson className={className} />;
    case 'html':
    case 'xml':
      return <FileCode className={className} />;
    case 'css':
    case 'scss':
    case 'less':
      return <FileType className={className} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage className={className} />;
    case 'txt':
    case 'md':
      return <FileText className={className} />;
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
    case 'rar':
      return <FileArchive className={className} />;
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return <FileVideo className={className} />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <FileAudio className={className} />;
    case 'csv':
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className={className} />;
    case 'iso':
    case 'img':
      return <FileBox className={className} />;
    default:
      return <FileIcon className={className} />;
  }
}

export function FileBrowser({
  files,
  isLoading,
  isError,
  currentPath,
  onNavigate,
  onUpload,
  onCreateDirectory,
  onCreateFile,
  onDelete,
  onDownload,
  onFetchContent,
  onSaveContent,
}: FileBrowserProps) {
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isCreateDirOpen, setIsCreateDirOpen] = React.useState(false);
  const [isCreateFileOpen, setIsCreateFileOpen] = React.useState(false);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    file: FileItem;
  } | null>(null);

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Editor State
  const [editingFile, setEditingFile] = React.useState<string | null>(null);
  const [fileContent, setFileContent] = React.useState<string>('');
  const [fileMode, setFileMode] = React.useState<string | undefined>(undefined);
  const [isFetchingContent, setIsFetchingContent] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Prepare data for DataTable
  // If files already have metadata, use them. If they are just strings (legacy), map them.
  const fileData: FileItem[] = React.useMemo(() => {
    return files.map((f: any) => {
      if (typeof f === 'string') return { name: f };
      return f;
    });
  }, [files]);

  const handleUp = () => {
    if (editingFile) {
      setEditingFile(null);
      setFileMode(undefined);
      return;
    }
    if (currentPath === '/') return;
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    onNavigate(parentPath || '/');
  };

  const handleEdit = async (fileName: string) => {
    const filePath = `${currentPath === '/' ? '' : currentPath}/${fileName}`;
    setEditingFile(filePath);
    setIsFetchingContent(true);
    setActionError(null);
    try {
      const { content, mode } = await onFetchContent(filePath);
      setFileContent(content);
      setFileMode(mode);
    } catch (err: any) {
      if (err.message === 'IS_DIRECTORY') {
        setEditingFile(null);
        setFileMode(undefined);
        onNavigate(filePath);
        return;
      }
      setActionError(err.message);
      setEditingFile(null);
      setFileMode(undefined);
    } finally {
      setIsFetchingContent(false);
    }
  };

  const handleSave = async () => {
    if (!editingFile) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await onSaveContent(editingFile, fileContent, fileMode);
      // Don't close editor on save
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingFile(null);
    setFileContent('');
    setFileMode(undefined);
  };

  const breadcrumbs = React.useMemo(() => {
    const path = editingFile ? editingFile : currentPath;
    const parts = path.split('/').filter(Boolean);
    return parts.map((part, index) => {
      const crumbPath = '/' + parts.slice(0, index + 1).join('/');
      return { name: part, path: crumbPath };
    });
  }, [currentPath, editingFile]);

  const columns: ColumnDef<FileItem>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const name = row.original.name;
        const type = row.original.type;
        // Fallback to extension check if type is missing
        const isDirectory =
          type === 'directory' || (!type && !name.includes('.'));

        return (
          <div
            className="flex items-center gap-2"
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                file: row.original,
              });
            }}
          >
            {isDirectory ? (
              <FolderIcon className="h-4 w-4 text-blue-500" />
            ) : (
              getFileIcon(name)
            )}
            <span
              className="font-medium cursor-pointer hover:underline"
              onClick={() => {
                if (isDirectory) {
                  onNavigate(
                    `${currentPath === '/' ? '' : currentPath}/${name}`,
                  );
                } else {
                  handleEdit(name);
                }
              }}
            >
              {name}
            </span>
          </div>
        );
      },
    },
    {
      id: 'size',
      header: 'Size',
      cell: ({ row }) => {
        if (row.original.type === 'directory') return '—';
        return formatBytes(row.original.size);
      },
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const name = row.original.name;
        const type = row.original.type;
        if (type) return type === 'directory' ? 'Directory' : 'File';
        return !name.includes('.') ? 'Directory' : 'File';
      },
    },
    {
      id: 'actions',
      size: 50,
      cell: ({ row }) => {
        const name = row.original.name;
        const type = row.original.type;
        const isDirectory =
          type === 'directory' || (!type && !name.includes('.'));
        const fullPath = `${currentPath === '/' ? '' : currentPath}/${name}`;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {!isDirectory && (
                  <DropdownMenuItem onClick={() => handleEdit(name)}>
                    <PencilIcon className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDownload(fullPath)}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (isDirectory) {
                      onNavigate(fullPath);
                    } else {
                      handleEdit(name);
                    }
                  }}
                >
                  {isDirectory ? (
                    <FolderIcon className="mr-2 h-4 w-4" />
                  ) : (
                    <PencilIcon className="mr-2 h-4 w-4" />
                  )}
                  Open
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    onDelete(fullPath).catch((e) => setActionError(e.message))
                  }
                  className="text-red-600"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Upload each dropped file using the provided onUpload function and handle errors.

    for (const file of files) {
      try {
        await onUpload(file);
      } catch (err: any) {
        setActionError(err.message);
      }
    }
  };

  const getLanguageFromFilename = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'go':
        return 'go';
      case 'sh':
      case 'bash':
        return 'shell';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        return 'plaintext';
    }
  };

  return (
    <div
      className="space-y-4 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-primary rounded-lg">
          <div className="text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-primary" />
            <h3 className="mt-2 text-lg font-semibold">Drop files to upload</h3>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleUp}
            disabled={currentPath === '/'}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => onNavigate('/')}
                  className="cursor-pointer"
                >
                  <HomeIcon className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => onNavigate(crumb.path)}
                      className="cursor-pointer"
                    >
                      {crumb.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {editingFile ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <XIcon className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <SaveIcon className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <CreateDirectoryDialog
              currentPath={currentPath}
              open={isCreateDirOpen}
              onOpenChange={setIsCreateDirOpen}
              onCreate={(name) =>
                onCreateDirectory(name).catch((e) => setActionError(e.message))
              }
            />
            <CreateFileDialog
              currentPath={currentPath}
              open={isCreateFileOpen}
              onOpenChange={setIsCreateFileOpen}
              onCreate={(name) =>
                onCreateFile(name).catch((e) => setActionError(e.message))
              }
            />
            <UploadFileDialog
              currentPath={currentPath}
              open={isUploadOpen}
              onOpenChange={setIsUploadOpen}
              onUpload={(file) =>
                onUpload(file).catch((e) => setActionError(e.message))
              }
            />
          </div>
        )}
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertTitle>Action Failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="bg-background">
        {editingFile ? (
          <div className="h-[600px] w-full">
            {isFetchingContent ? (
              <div className="flex h-full items-center justify-center">
                <Spinner className="size-8" />
              </div>
            ) : (
              <Editor
                height="100%"
                defaultLanguage={getLanguageFromFilename(editingFile)}
                value={fileContent}
                onChange={(value) => setFileContent(value || '')}
                theme="vs-dark" // Or based on system theme
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                }}
              />
            )}
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            ) : isError ? (
              <Alert variant="destructive" className="m-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load files.</AlertDescription>
              </Alert>
            ) : (
              <DataTable
                data={fileData}
                cols={columns as any}
                disablePagination
              />
            )}
          </>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="flex flex-col">
            {(() => {
              const name = contextMenu.file.name;
              const type = contextMenu.file.type;
              const isDirectory = type === 'directory' || (!type && !name.includes('.'));
              const fullPath = `${currentPath === '/' ? '' : currentPath}/${name}`;

              return (
                <>
                  {!isDirectory && (
                    <button
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => handleEdit(name)}
                    >
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit
                    </button>
                  )}
                  <button
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onClick={() => onDownload(fullPath)}
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download
                  </button>
                  <button
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onClick={() => {
                      if (isDirectory) {
                        onNavigate(fullPath);
                      } else {
                        handleEdit(name);
                      }
                    }}
                  >
                    <FolderIcon className="mr-2 h-4 w-4" />
                    Open
                  </button>
                  <div className="h-px my-1 bg-muted" />
                  <button
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-red-600"
                    onClick={() => onDelete(fullPath).catch((e) => setActionError(e.message))}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateDirectoryDialog({
  currentPath,
  open,
  onOpenChange,
  onCreate,
}: {
  currentPath: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onCreate(name);
      onOpenChange(false);
      setName('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Directory</DialogTitle>
          <DialogDescription>
            Create a new directory in {currentPath}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Directory Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-folder"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadFileDialog({
  currentPath,
  open,
  onOpenChange,
  onUpload,
}: {
  currentPath: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);
    setProgress(0);
    try {
      await onUpload(file, (p) => setProgress(p));
      onOpenChange(false);
      setFile(null);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UploadIcon className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>Upload a file to {currentPath}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          {isLoading && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(progress)}%
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !file}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateFileDialog({
  currentPath,
  open,
  onOpenChange,
  onCreate,
}: {
  currentPath: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onCreate(name);
      onOpenChange(false);
      setName('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FilePlus className="mr-2 h-4 w-4" />
          New File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create File</DialogTitle>
          <DialogDescription>
            Create a new file in {currentPath}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">File Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-file.txt"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
