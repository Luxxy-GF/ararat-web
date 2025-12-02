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
import { Checkbox } from 'ui-web/components/checkbox';
import {
  MoreHorizontal,
  PlusIcon,
  TrashIcon,
  DownloadIcon,
  PencilIcon,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from 'ui-web/components/alert';
import { formatDate } from '@/app/(main)/instance/_lib/utils';
import DataTable from 'ui-web/components/data-table';
import { ColumnDef } from '@tanstack/react-table';

export interface Backup {
  name: string;
  created_at: string;
  expires_at?: string;
  container_only?: boolean;
  instance_only?: boolean;
  optimized_storage?: boolean;
}

interface BackupListProps {
  backups: Backup[];
  isLoading: boolean;
  isError: any;
  onCreate: (
    name: string,
    instanceOnly: boolean,
    optimizedStorage: boolean,
  ) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
  onRename: (oldName: string, newName: string) => Promise<void>;
  onDownload: (name: string) => void;
  canUseOptimizedStorage?: boolean;
}

export function BackupList({
  backups,
  isLoading,
  isError,
  onCreate,
  onDelete,
  onRename,
  onDownload,
  canUseOptimizedStorage = false,
}: BackupListProps) {
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Dialog states managed at the list level to work with DataTable actions
  const [renameBackup, setRenameBackup] = React.useState<Backup | null>(null);
  const [deleteBackup, setDeleteBackup] = React.useState<Backup | null>(null);

  const columns: ColumnDef<Backup>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const name = row.original.name;
        const shortName = name.split('/').pop() || '';
        return <span className="font-medium">{shortName}</span>;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      accessorKey: 'expires_at',
      header: 'Expires At',
      cell: ({ row }) =>
        row.original.expires_at ? formatDate(row.original.expires_at) : 'Never',
    },
    {
      id: 'exclude_snapshots',
      header: 'Exclude Snapshots',
      cell: ({ row }) =>
        row.original.container_only || row.original.instance_only
          ? 'Yes'
          : 'No',
    },
    {
      accessorKey: 'optimized_storage',
      header: 'Optimized Storage',
      cell: ({ row }) => (row.original.optimized_storage ? 'Yes' : 'No'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const backup = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onDownload(backup.name)}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenameBackup(backup)}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteBackup(backup)}
                className="text-destructive focus:text-destructive"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load backups.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Backups</h2>
        <CreateBackupDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreate={(name, instanceOnly, optimizedStorage) =>
            onCreate(name, instanceOnly, optimizedStorage).catch((e: any) =>
              setActionError(e.message),
            )
          }
          canUseOptimizedStorage={canUseOptimizedStorage}
        />
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertTitle>Action Failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <DataTable data={backups} cols={columns as any} />

      {renameBackup && (
        <RenameBackupDialog
          currentName={renameBackup.name.split('/').pop() || ''}
          open={!!renameBackup}
          onOpenChange={(open) => !open && setRenameBackup(null)}
          onRename={(newName) =>
            onRename(renameBackup.name, newName)
              .then(() => setRenameBackup(null))
              .catch((e: any) => setActionError(e.message))
          }
        />
      )}

      {deleteBackup && (
        <DeleteBackupDialog
          name={deleteBackup.name.split('/').pop() || ''}
          open={!!deleteBackup}
          onOpenChange={(open) => !open && setDeleteBackup(null)}
          onConfirm={() =>
            onDelete(deleteBackup.name)
              .then(() => setDeleteBackup(null))
              .catch((e: any) => setActionError(e.message))
          }
        />
      )}
    </div>
  );
}

function CreateBackupDialog({
  open,
  onOpenChange,
  onCreate,
  canUseOptimizedStorage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    name: string,
    instanceOnly: boolean,
    optimizedStorage: boolean,
  ) => Promise<void>;
  canUseOptimizedStorage: boolean;
}) {
  const [name, setName] = React.useState('');
  const [instanceOnly, setInstanceOnly] = React.useState(false);
  const [optimizedStorage, setOptimizedStorage] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onCreate(name, instanceOnly, optimizedStorage);
      onOpenChange(false);
      setName('');
      setInstanceOnly(false);
      setOptimizedStorage(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Backup
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Backup</DialogTitle>
          <DialogDescription>Create a new backup.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              placeholder="backup-name"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="instanceOnly"
              checked={instanceOnly}
              onCheckedChange={(c: any) => setInstanceOnly(!!c)}
            />
            <Label htmlFor="instanceOnly">Exclude Snapshots</Label>
          </div>
          {canUseOptimizedStorage && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="optimizedStorage"
                checked={optimizedStorage}
                onCheckedChange={(c: any) => setOptimizedStorage(!!c)}
              />
              <Label htmlFor="optimizedStorage">Optimized Storage</Label>
            </div>
          )}
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

function RenameBackupDialog({
  currentName,
  open,
  onOpenChange,
  onRename,
}: {
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (newName: string) => Promise<void>;
}) {
  const [newName, setNewName] = React.useState(currentName);
  const [isLoading, setIsLoading] = React.useState(false);

  // Update newName when currentName changes (e.g. when dialog opens with new backup)
  React.useEffect(() => {
    setNewName(currentName);
  }, [currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onRename(newName);
      // onOpenChange(false); // Handled by parent promise chain usually, but good to have
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Backup</DialogTitle>
          <DialogDescription>
            Enter a new name for the backup <strong>{currentName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newName">New Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewName(e.target.value)
              }
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteBackupDialog({
  name,
  open,
  onOpenChange,
  onConfirm,
}: {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      // onOpenChange(false); // Handled by parent promise chain
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Backup</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the backup <strong>{name}</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
