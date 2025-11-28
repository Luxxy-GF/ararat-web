"use client";

import React from "react";
import { Instance } from "../../instances/_lib/instances.d";
import { useBackups } from "../_hooks/useBackups";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/_components/ui/table";
import { Button } from "@/app/_components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Checkbox } from "@/app/_components/ui/checkbox";
import {
    MoreHorizontal,
    PlusIcon,
    TrashIcon,
    DownloadIcon,
    PencilIcon,
    ArchiveIcon,
} from "lucide-react";
import { Spinner } from "@/app/_components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { formatBytes, formatDate } from "../_lib/utils";

export function Backups({ instance }: { instance: Instance }) {
    const { backups, isLoading, isError, createBackup, deleteBackup, renameBackup, downloadBackup } =
        useBackups(instance.name);
    const [actionError, setActionError] = React.useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Backups</h2>
                <CreateBackupDialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    onCreate={(name, containerOnly, optimizedStorage) =>
                        createBackup(name, containerOnly, optimizedStorage).catch((e: any) => setActionError(e.message))
                    }
                />
            </div>

            {actionError && (
                <Alert variant="destructive">
                    <AlertTitle>Action Failed</AlertTitle>
                    <AlertDescription>{actionError}</AlertDescription>
                </Alert>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Expires At</TableHead>
                            <TableHead>Container Only</TableHead>
                            <TableHead>Optimized Storage</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Spinner className="mx-auto h-6 w-6" />
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-destructive">
                                    Failed to load backups.
                                </TableCell>
                            </TableRow>
                        ) : backups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No backups found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            backups.map((backup: any) => (
                                <BackupRow
                                    key={backup.name}
                                    backup={backup}
                                    onDelete={() => deleteBackup(backup.name).catch((e: any) => setActionError(e.message))}
                                    onRename={(newName) => renameBackup(backup.name, newName).catch((e: any) => setActionError(e.message))}
                                    onDownload={() => downloadBackup(backup.name)}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function BackupRow({
    backup,
    onDelete,
    onRename,
    onDownload,
}: {
    backup: any;
    onDelete: () => Promise<void>;
    onRename: (newName: string) => Promise<void>;
    onDownload: () => void;
}) {
    const [isRenameOpen, setIsRenameOpen] = React.useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
    const shortName = backup.name.split("/").pop() || "";

    return (
        <TableRow>
            <TableCell className="font-medium">{shortName}</TableCell>
            <TableCell>{formatDate(backup.created_at)}</TableCell>
            <TableCell>{backup.expires_at ? formatDate(backup.expires_at) : "Never"}</TableCell>
            <TableCell>{backup.container_only ? "Yes" : "No"}</TableCell>
            <TableCell>{backup.optimized_storage ? "Yes" : "No"}</TableCell>
            <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={onDownload}>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setIsDeleteOpen(true)}
                            className="text-destructive focus:text-destructive"
                        >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <RenameBackupDialog
                    currentName={shortName}
                    open={isRenameOpen}
                    onOpenChange={setIsRenameOpen}
                    onRename={onRename}
                />

                <DeleteBackupDialog
                    name={shortName}
                    open={isDeleteOpen}
                    onOpenChange={setIsDeleteOpen}
                    onConfirm={onDelete}
                />
            </TableCell>
        </TableRow>
    );
}

function CreateBackupDialog({
    open,
    onOpenChange,
    onCreate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string, containerOnly: boolean, optimizedStorage: boolean) => Promise<void>;
}) {
    const [name, setName] = React.useState("");
    const [containerOnly, setContainerOnly] = React.useState(false);
    const [optimizedStorage, setOptimizedStorage] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onCreate(name, containerOnly, optimizedStorage);
            onOpenChange(false);
            setName("");
            setContainerOnly(false);
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
                    <DialogDescription>
                        Create a new backup of this instance.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name (Optional)</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            placeholder="backup-name"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="containerOnly"
                            checked={containerOnly}
                            onCheckedChange={(c: any) => setContainerOnly(!!c)}
                        />
                        <Label htmlFor="containerOnly">Container Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="optimizedStorage"
                            checked={optimizedStorage}
                            onCheckedChange={(c: any) => setOptimizedStorage(!!c)}
                        />
                        <Label htmlFor="optimizedStorage">Optimized Storage</Label>
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onRename(newName);
            onOpenChange(false);
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
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
            onOpenChange(false);
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
                        Are you sure you want to delete the backup <strong>{name}</strong>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
                        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
